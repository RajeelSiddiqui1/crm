// app/api/teamlead/tasks/shared-task-teamlead/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

// Helper to get full user info
async function getUserInfoByEmail(email) {
  const user = await TeamLead.findOne({ email }).lean();
  if (!user) return null;
  return {
    id: user._id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split('@')[0],
    email: user.email,
    department: user.department || null
  };
}

// Email template for new task
function newTaskEmailTemplate({ recipientName, sharerName, submission }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f2f5;">
      <div style="max-width: 480px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #2563eb;">New Task Assigned</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${sharerName}</strong> has assigned you a new task.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Client:</strong> ${submission.clinetName || "Untitled Task"}</p>
          <p><strong>Status:</strong> ${submission.status || "Pending"}</p>
        </div>
        <a href="/teamlead/tasks/${submission._id}" style="display: inline-block; margin-top: 20px; background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none;">View Task</a>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">This is an automated notification.</p>
      </div>
    </div>
  `;
}

// POST - Share task
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { submissionId, teamLeadEmail } = body;
    if (!submissionId || !teamLeadEmail) {
      return NextResponse.json({ error: "Submission ID and TeamLead email required" }, { status: 400 });
    }

    const currentTeamLead = await getUserInfoByEmail(session.user.email);
    const targetTeamLead = await getUserInfoByEmail(teamLeadEmail);

    if (!currentTeamLead) return NextResponse.json({ error: "Current TeamLead not found" }, { status: 404 });
    if (!targetTeamLead) return NextResponse.json({ error: "Target TeamLead not found" }, { status: 404 });
    if (currentTeamLead.id.toString() === targetTeamLead.id.toString()) {
      return NextResponse.json({ error: "Cannot assign task to yourself" }, { status: 400 });
    }

    const submission = await FormSubmission.findById(submissionId);
    if (!submission) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Check permission
    const isAssigned = submission.assignedTo?.toString() === currentTeamLead.id.toString();
    const isMultipleAssigned = submission.multipleTeamLeadAssigned?.some(id => id.toString() === currentTeamLead.id.toString());
    if (!isAssigned && !isMultipleAssigned) {
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });
    }

    // Check if already shared
    const alreadyShared = submission.multipleTeamLeadAssigned?.some(id => id.toString() === targetTeamLead.id.toString()) ||
                          submission.sharedWithTeamLeads?.some(entry => entry.teamLeadId.toString() === targetTeamLead.id.toString());

    if (alreadyShared) {
      return NextResponse.json({ error: "Task already shared with this TeamLead" }, { status: 400 });
    }

    // Update submission: assign to target TL and track sharing
    submission.assignedTo = targetTeamLead.id;
    submission.multipleTeamLeadAssigned = submission.multipleTeamLeadAssigned || [];
    submission.multipleTeamLeadAssigned.push(targetTeamLead.id);

    submission.sharedWithTeamLeads = submission.sharedWithTeamLeads || [];
    submission.sharedWithTeamLeads.push({
      teamLeadId: targetTeamLead.id,
      sharedBy: currentTeamLead.id,
      sharedAt: new Date()
    });

    await submission.save();

    // Send notification & email
    const link = `/teamlead/tasks/${submission._id}`;
    await Promise.all([
      sendNotification({
        senderId: currentTeamLead.id,
        senderModel: "TeamLead",
        senderName: currentTeamLead.name,
        receiverId: targetTeamLead.id,
        receiverModel: "TeamLead",
        type: "task_assigned",
        title: "New Task Assigned",
        message: `Task "${submission.clinetName || "Untitled"}" has been assigned by ${currentTeamLead.name}`,
        link,
        referenceId: submission._id,
        referenceModel: "FormSubmission"
      }),
      sendMail(targetTeamLead.email, `New Task Assigned by ${currentTeamLead.name}`, newTaskEmailTemplate({
        recipientName: targetTeamLead.name,
        sharerName: currentTeamLead.name,
        submission
      }))
    ]);

    return NextResponse.json({
      success: true,
      message: "Task successfully shared",
      data: { submissionId: submission._id, targetTeamLead }
    });

  } catch (error) {
    console.error("Share task error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE - Unshare task
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");
    const teamLeadId = searchParams.get("teamLeadId");

    if (!submissionId || !teamLeadId) return NextResponse.json({ error: "Submission ID and TeamLead ID required" }, { status: 400 });

    const currentTeamLead = await getUserInfoByEmail(session.user.email);
    if (!currentTeamLead) return NextResponse.json({ error: "Current TeamLead not found" }, { status: 404 });

    const submission = await FormSubmission.findById(submissionId);
    if (!submission) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Only the sharer or the assigned TL can unshare
    const isOriginalSharer = submission.sharedWithTeamLeads?.some(
      entry => entry.sharedBy.toString() === currentTeamLead.id.toString() && entry.teamLeadId.toString() === teamLeadId
    );
    const isAssignedTeamLead = submission.assignedTo?.toString() === currentTeamLead.id.toString();

    if (!isOriginalSharer && !isAssignedTeamLead) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    // Remove from multipleTeamLeadAssigned & assignedTo
    submission.multipleTeamLeadAssigned = submission.multipleTeamLeadAssigned?.filter(id => id.toString() !== teamLeadId) || [];
    if (submission.assignedTo?.toString() === teamLeadId) {
      submission.assignedTo = null; // or optionally assign to another TL if needed
    }

    submission.sharedWithTeamLeads = submission.sharedWithTeamLeads?.filter(entry => entry.teamLeadId.toString() !== teamLeadId) || [];

    await submission.save();

    const removedTeamLead = await TeamLead.findById(teamLeadId);
    if (removedTeamLead) {
      const link = `/teamlead/tasks/${submission._id}`;
      await sendNotification({
        senderId: currentTeamLead.id,
        senderModel: "TeamLead",
        senderName: currentTeamLead.name,
        receiverId: removedTeamLead._id,
        receiverModel: "TeamLead",
        type: "task_removed",
        title: "Task Assignment Removed",
        message: `You have been removed from task "${submission.clinetName || "Untitled"}"`,
        link,
        referenceId: submission._id,
        referenceModel: "FormSubmission"
      });
      await sendMail(removedTeamLead.email, `Task Removed: ${submission.clinetName || "Untitled"}`, `
        Hi ${removedTeamLead.firstName || ""},<br/>
        You have been removed from the task "${submission.clinetName || "Untitled"}".<br/>
        <a href="${link}">View Task</a>
      `);
    }

    return NextResponse.json({ success: true, message: "Task unshared successfully" });

  } catch (error) {
    console.error("Unshare task error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}


// GET - Fetch task and all team leads (no checks)
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");
    if (!submissionId) return NextResponse.json({ error: "Submission ID required" }, { status: 400 });

    const submission = await FormSubmission.findById(submissionId).lean();
    if (!submission) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const allTeamLeads = await TeamLead.find().select("firstName lastName email department").lean();

    return NextResponse.json({
      success: true,
      data: {
        submission,
        teamLeads: allTeamLeads
      }
    });

  } catch (error) {
    console.error("Fetch task/teamleads error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
