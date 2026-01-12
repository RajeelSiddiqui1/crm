// app/api/admin/tasks2/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { getServerSession } from "next-auth";
import Department from "@/models/Department";
import { authOptions } from "@/lib/auth";
import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskCreatedMailTemplate } from "@/helper/emails/admin/createTask";

export async function POST(req) {
  try {
    await dbConnect();

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const clientName = formData.get("clientName") || "";
    const priority = formData.get("priority") || "low";
    const endDate = formData.get("endDate") || null;

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    // Get assigned users
    const teamleadIds = JSON.parse(formData.get("teamleadIds") || "[]");
    const employeeIds = JSON.parse(formData.get("employeeIds") || "[]");

    // -------------------------------
    // MULTIPLE FILE UPLOADS TO S3
    // -------------------------------
    const uploadedFiles = [];
    const files = formData.getAll("files[]");

    for (const file of files) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;
        const fileKey = `admin2_tasks/files/${Date.now()}_${fileName}`;

        // Upload to S3
        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: fileType,
            Metadata: {
              originalName: encodeURIComponent(fileName),
              uploadedBy: session.user.id,
              uploadedAt: Date.now().toString()
            }
          },
        });
        await upload.done();

        // Generate signed URL
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        });
        const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 1 year

        uploadedFiles.push({
          url: fileUrl,
          name: fileName,
          type: fileType,
          size: fileSize,
          publicId: fileKey,
        });
      }
    }

    // -------------------------------
    // MULTIPLE AUDIO UPLOADS TO S3
    // -------------------------------
    const uploadedAudio = [];
    const audioFiles = formData.getAll("audioFiles[]");

    for (const audio of audioFiles) {
      if (audio && audio.size > 0) {
        const buffer = Buffer.from(await audio.arrayBuffer());
        const audioName = audio.name || "audio_recording.webm";
        const audioType = audio.type || "audio/webm";
        const audioSize = audio.size;
        const audioKey = `admin2_tasks/audio/${Date.now()}_${audioName}`;

        // Upload to S3
        const uploadAudio = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: audioKey,
            Body: buffer,
            ContentType: audioType,
            Metadata: {
              originalName: encodeURIComponent(audioName),
              uploadedBy: session.user.id,
              uploadedAt: Date.now().toString()
            }
          },
        });
        await uploadAudio.done();

        // Generate signed URL
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: audioKey,
        });
        const audioUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });

        uploadedAudio.push({
          url: audioUrl,
          name: audioName,
          type: audioType,
          size: audioSize,
          publicId: audioKey,
        });
      }
    }

    // -------------------------------
    // RECORDED AUDIO UPLOAD TO S3
    // -------------------------------
    const recordedAudios = formData.getAll("recordedAudios[]");
    const singleRecordedAudio = formData.get("recordedAudio");

    if (singleRecordedAudio && singleRecordedAudio.size > 0) {
      recordedAudios.push(singleRecordedAudio);
    }

    for (const recordedAudio of recordedAudios) {
      if (recordedAudio && recordedAudio.size > 0) {
        try {
          const buffer = Buffer.from(await recordedAudio.arrayBuffer());
          const audioKey = `admin2_tasks/recordings/${Date.now()}_recording.webm`;

          const uploadAudio = new Upload({
            client: s3,
            params: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: audioKey,
              Body: buffer,
              ContentType: recordedAudio.type || "audio/webm",
              Metadata: {
                isRecording: "true",
                uploadedBy: session.user.id,
                uploadedAt: Date.now().toString()
              }
            },
          });
          await uploadAudio.done();

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: audioKey,
          });
          const audioUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });

          uploadedAudio.push({
            url: audioUrl,
            name: recordedAudio.name || "Voice Recording",
            type: recordedAudio.type || "audio/webm",
            size: recordedAudio.size,
            publicId: audioKey,
            isRecording: true
          });
        } catch (err) {
          console.error("S3 upload error for recorded audio:", err);
        }
      }
    }

    // -------------------------------
    // CREATE TASK
    // -------------------------------
    const task = await AdminTask2.create({
      title,
      description,
      clientName,
      priority,
      endDate: endDate ? new Date(endDate) : null,
      teamleads: teamleadIds.map(id => ({
        teamleadId: id,
        status: "pending"
      })),
      employees: employeeIds.map(id => ({
        employeeId: id,
        status: "pending"
      })),
      fileAttachments: uploadedFiles,
      audioFiles: uploadedAudio,
      submittedBy: session.user.id,
    });

    // -------------------------------
    // SEND NOTIFICATIONS & EMAILS
    // -------------------------------
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks`;
    const teamleadUsers = await TeamLead.find({ _id: { $in: teamleadIds } });
    const employeeUsers = await Employee.find({ _id: { $in: employeeIds } });

    await Promise.all([
      ...teamleadUsers.map(async (tl) => {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Admin",
          senderName: session.user.name || "Admin",
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "admin_task_created",
          title: "New Task Assigned",
          message: `You have received a new task: "${title}"`,
          link: taskLink,
          referenceId: task._id,
          referenceModel: "AdminTask2",
        });

        const emailHtml = adminTaskCreatedMailTemplate(
          `${tl.firstName} ${tl.lastName}`,
          title,
          session.user.name || "Admin",
          task.priority,
          task.endDate,
          taskLink
        );

        await sendMail(tl.email, "New Task Assigned", emailHtml);
      }),

      ...employeeUsers.map(async (emp) => {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Admin",
          senderName: session.user.name || "Admin",
          receiverId: emp._id,
          receiverModel: "Employee",
          type: "admin_task_created",
          title: "New Task Assigned",
          message: `You have received a new task: "${title}"`,
          link: taskLink,
          referenceId: task._id,
          referenceModel: "AdminTask2",
        });

        const emailHtml = adminTaskCreatedMailTemplate(
          `${emp.firstName} ${emp.lastName}`,
          title,
          session.user.name || "Admin",
          task.priority,
          task.endDate,
          taskLink
        );

        await sendMail(emp.email, "New Task Assigned", emailHtml);
      }),
    ]);

    return NextResponse.json(
      { success: true, task },
      { status: 201 }
    );

  } catch (err) {
    console.error("AdminTask2 POST Error:", err);
    return NextResponse.json(
      { message: "Task creation failed", error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tasks with full details
    const tasks = await AdminTask2.find()
      .populate("submittedBy", "name email")
      .populate({
        path: "teamleads.teamleadId",
        select: "firstName lastName email department",
        populate: {
          path: "depId",
          select: "name"
        }
      })
      .populate({
        path: "employees.employeeId",
        select: "firstName lastName email department",
        populate: {
          path: "depId",
          select: "name"
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const tasksWithStats = tasks.map(task => {
      const allAssignees = [
        ...(task.teamleads || []),
        ...(task.employees || [])
      ];

      const statusCounts = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0
      };

      allAssignees.forEach(assignee => {
        if (assignee.status && statusCounts[assignee.status] !== undefined) {
          statusCounts[assignee.status]++;
        }
      });

      return {
        ...task,
        stats: {
          totalAssignees: allAssignees.length,
          statusCounts,
          completionPercentage: allAssignees.length > 0
            ? Math.round((statusCounts.completed / allAssignees.length) * 100)
            : 0,
          totalFiles: task.fileAttachments?.length || 0,
          totalAudio: task.audioFiles?.length || 0
        }
      };
    });

    return NextResponse.json(
      { success: true, tasks: tasksWithStats },
      { status: 200 }
    );

  } catch (err) {
    console.error("AdminTask2 GET Error:", err);
    return NextResponse.json(
      { message: "Failed to fetch tasks", error: err.message },
      { status: 500 }
    );
  }
}