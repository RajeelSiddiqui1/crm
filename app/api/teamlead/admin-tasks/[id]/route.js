import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import s3 from "@/lib/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// GET Task Details for TeamLead
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const teamleadId = session.user.id;

    const task = await AdminTask2.findById(taskId)
      .populate({
        path: "teamleads.teamleadId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "employees.employeeId",
        select: "firstName lastName email profilePic department",
      })
      .populate({
        path: "departments",
        select: "name color",
      })
      .populate({
        path: "submittedBy",
        select: "firstName lastName email profilePic",
      });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check access
    const hasAccess =
      task.teamleads.some(t => t.teamleadId?._id?.toString() === teamleadId) ||
      task.shares.some(s => s.sharedTo?.toString() === teamleadId && s.sharedToModel === "TeamLead");

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Populate shares manually
    const populatedShares = await Promise.all(
      task.shares.map(async (share) => {
        let populatedShare = { ...share.toObject() };

        // Populate sharedTo
        if (share.sharedToModel === "Employee") {
          const employee = await Employee.findById(share.sharedTo)
            .select("firstName lastName email profilePic")
            .lean();
          populatedShare.sharedTo = employee;
        } else if (share.sharedToModel === "TeamLead") {
          const teamlead = await TeamLead.findById(share.sharedTo)
            .select("firstName lastName email profilePic")
            .lean();
          populatedShare.sharedTo = teamlead;
        }

        // Populate sharedBy
        if (share.sharedByModel === "Employee") {
          const employee = await Employee.findById(share.sharedBy)
            .select("firstName lastName email profilePic")
            .lean();
          populatedShare.sharedBy = employee;
        } else if (share.sharedByModel === "TeamLead") {
          const teamlead = await TeamLead.findById(share.sharedBy)
            .select("firstName lastName email profilePic")
            .lean();
          populatedShare.sharedBy = teamlead;
        }

        return populatedShare;
      })
    );

    // Convert to object
    const taskObj = task.toObject();

    // Regenerate signed URLs for files
    if (taskObj.fileAttachments && taskObj.fileAttachments.length > 0) {
      for (let file of taskObj.fileAttachments) {
        if (file.publicId) {
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.publicId,
            });
            file.url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
          } catch (e) {
            console.error("Error regenerating file URL:", e);
          }
        }
      }
    }

    // Regenerate signed URLs for audio
    if (taskObj.audioFiles && taskObj.audioFiles.length > 0) {
      for (let audio of taskObj.audioFiles) {
        if (audio.publicId) {
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: audio.publicId,
            });
            audio.url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
          } catch (e) {
            console.error("Error regenerating audio URL:", e);
          }
        }
      }
    }

    taskObj.shares = populatedShares;

    return NextResponse.json(taskObj, { status: 200 });
  } catch (error) {
    console.error("GET Task Details Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT Update Status (TeamLead)
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, feedback } = await req.json();
    const taskId = params.id;
    const teamleadId = session.user.id;

    const task = await AdminTask2.findById(taskId)
      .populate("employees.employeeId", "email firstName lastName")
      .populate("teamleads.teamleadId", "email firstName lastName");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update teamlead status
    const teamleadIndex = task.teamleads.findIndex(
      t => t.teamleadId?._id?.toString() === teamleadId
    );

    if (teamleadIndex === -1) {
      return NextResponse.json({ error: "Not assigned to this task" }, { status: 403 });
    }

    task.teamleads[teamleadIndex].status = status;
    if (status === "completed") {
      task.teamleads[teamleadIndex].completedAt = new Date();
    }

    await task.save();

    // Send notifications to admin
    await sendNotification({
      senderId: teamleadId,
      senderModel: "TeamLead",
      senderName: session.user.name,
      receiverId: task.submittedBy,
      receiverModel: "Admin",
      type: "task_status_updated",
      title: "Task Status Updated",
      message: `${session.user.name} (TeamLead) updated status to ${status} for task: ${task.title}`,
      link: `/admin/tasks/${taskId}`,
      referenceId: task._id,
      referenceModel: "AdminTask2",
    });

    return NextResponse.json({
      message: "Status updated successfully",
      task
    }, { status: 200 });

  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// POST Share Task (TeamLead can share with other TeamLeads)
export async function POST(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamleadId: targetTeamleadId } = await req.json();
    const taskId = params.id;
    const sharerId = session.user.id;

    if (!targetTeamleadId) {
      return NextResponse.json({ error: "TeamLead ID is required" }, { status: 400 });
    }

    // Check if sharer has access to this task
    const task = await AdminTask2.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const hasAccess = task.teamleads.some(t =>
      t.teamleadId?.toString() === sharerId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to share this task" }, { status: 403 });
    }

    // Check if target teamlead exists
    const targetTeamlead = await TeamLead.findById(targetTeamleadId);
    if (!targetTeamlead) {
      return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
    }

    // Check if already shared
    const alreadyShared = task.shares.some(s =>
      s.sharedTo?.toString() === targetTeamleadId && s.sharedToModel === "TeamLead"
    );

    if (alreadyShared) {
      return NextResponse.json({ error: "Task already shared with this teamlead" }, { status: 400 });
    }

    // Add to shares array
    task.shares.push({
      sharedTo: targetTeamleadId,
      sharedToModel: "TeamLead",
      sharedBy: sharerId,
      sharedByModel: "TeamLead",
      sharedAt: new Date()
    });

    // Also add to teamleads array if not already there
    const alreadyInTeamleads = task.teamleads.some(t =>
      t.teamleadId?.toString() === targetTeamleadId
    );

    if (!alreadyInTeamleads) {
      task.teamleads.push({
        teamleadId: targetTeamleadId,
        status: "pending",
        assignedAt: new Date(),
        sharedBy: sharerId,
        sharedByModel: "TeamLead"
      });
    }

    await task.save();

    // Send notification to target teamlead
    await sendNotification({
      senderId: sharerId,
      senderModel: "TeamLead",
      senderName: session.user.name,
      receiverId: targetTeamleadId,
      receiverModel: "TeamLead",
      type: "task_shared",
      title: "Task Shared With You",
      message: `${session.user.name} shared a task with you: ${task.title}`,
      link: `/teamlead/admin-tasks/${taskId}`,
      referenceId: task._id,
      referenceModel: "AdminTask2",
    });

    // Send email notification
    await sendMail({
      to: targetTeamlead.email,
      subject: "New Task Shared With You",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Task Shared</h2>
          <p>Hello ${targetTeamlead.firstName},</p>
          <p><strong>${session.user.name}</strong> has shared a task with you:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0; color: #333;">${task.title}</h3>
            ${task.description ? `<p style="margin: 10px 0;">${task.description}</p>` : ''}
            ${task.clientName ? `<p><strong>Client:</strong> ${task.clientName}</p>` : ''}
          </div>
          <a href="${process.env.NEXT_PUBLIC_URL}/teamlead/admin-tasks/${taskId}" 
             style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Task
          </a>
        </div>
      `
    });

    return NextResponse.json({
      message: "Task shared successfully",
      task
    }, { status: 200 });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}