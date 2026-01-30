// app/api/admin/tasks2/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskUpdatedMailTemplate } from "@/helper/emails/admin/updateTask";
import { adminTaskDeletedMailTemplate } from "@/helper/emails/admin/deleteTask";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const task = await AdminTask2.findById(id);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const formData = await req.formData();

    // Update basic info
    task.title = formData.get("title") || task.title;
    task.description = formData.get("description") || task.description;
    task.clientName = formData.get("clientName") || task.clientName;
    task.priority = formData.get("priority") || task.priority;
    if (formData.get("endDate")) {
      task.endDate = new Date(formData.get("endDate"));
    }

    // Update assignments
    const teamleadIds = JSON.parse(formData.get("teamleadIds") || "[]");
    const employeeIds = JSON.parse(formData.get("employeeIds") || "[]");

    // Preserve existing statuses
    const existingTeamleads = new Map();
    task.teamleads.forEach(tl => {
      if (tl.teamleadId) {
        existingTeamleads.set(tl.teamleadId.toString(), tl.status);
      }
    });

    const existingEmployees = new Map();
    task.employees.forEach(emp => {
      if (emp.employeeId) {
        existingEmployees.set(emp.employeeId.toString(), emp.status);
      }
    });

    // Update teamleads with preserved status
    task.teamleads = teamleadIds.map(id => ({
      teamleadId: id,
      status: existingTeamleads.get(id) || "pending",
      assignedAt: Date.now()
    }));

    // Update employees with preserved status
    task.employees = employeeIds.map(id => ({
      employeeId: id,
      status: existingEmployees.get(id) || "pending",
      assignedAt: Date.now()
    }));

    // -------------------------------
    // HANDLE NEW FILES UPLOAD TO S3
    // -------------------------------
    const newFiles = formData.getAll("files[]");
    console.log("Files received for upload:", newFiles.length);
    for (const file of newFiles) {
      if (file && file.size > 0) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileKey = `admin2_tasks/files/${Date.now()}_${file.name}`;

          const upload = new Upload({
            client: s3,
            params: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: fileKey,
              Body: buffer,
              ContentType: file.type || "application/octet-stream",
              Metadata: {
                originalName: encodeURIComponent(file.name),
                uploadedBy: session.user.id,
                uploadedAt: Date.now().toString(),
              },
            },
          });
          await upload.done();

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
          });
         const fileUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${fileKey}`;

          task.fileAttachments.push({
            url: fileUrl,
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            publicId: fileKey,
          });
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
        }
      }
    }
    if (newFiles.length > 0) task.markModified("fileAttachments");

    // -------------------------------
    // REMOVE FILES FROM S3
    // -------------------------------
    const removeFiles = JSON.parse(formData.get("removeFiles") || "[]");
    if (removeFiles.length > 0) {
      for (const fileId of removeFiles) {
        const file = task.fileAttachments.id(fileId);
        if (file) {
          try {
            await s3.send(
              new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: file.publicId,
              })
            );
          } catch (e) {
            console.error("S3 delete error:", e);
          }
          task.fileAttachments.pull(fileId);
        }
      }
    }

    // -------------------------------
    // HANDLE NEW AUDIO UPLOADS TO S3
    // -------------------------------
    const newAudioFiles = formData.getAll("audioFiles[]");
    console.log("Audio files received for upload:", newAudioFiles.length);
    for (const audio of newAudioFiles) {
      if (audio && audio.size > 0) {
        try {
          const buffer = Buffer.from(await audio.arrayBuffer());
          const audioKey = `admin2_tasks/audio/${Date.now()}_${audio.name}`;

          const uploadAudio = new Upload({
            client: s3,
            params: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: audioKey,
              Body: buffer,
              ContentType: audio.type || "audio/webm",
              Metadata: {
                originalName: encodeURIComponent(audio.name),
                uploadedBy: session.user.id,
                uploadedAt: Date.now().toString(),
              },
            },
          });
          await uploadAudio.done();

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: audioKey,
          });
          const audioUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${audioKey}`;

          task.audioFiles.push({
            url: audioUrl,
            name: audio.name,
            type: audio.type || "audio/webm",
            size: audio.size,
            publicId: audioKey,
          });
        } catch (audioError) {
          console.error("Audio upload error:", audioError);
        }
      }
    }

    // -------------------------------
    // HANDLE RECORDED AUDIO UPLOAD TO S3
    // -------------------------------
    const recordedAudios = formData.getAll("recordedAudios[]");
    const singleRecordedAudio = formData.get("recordedAudio");

    if (singleRecordedAudio && singleRecordedAudio.size > 0) {
      recordedAudios.push(singleRecordedAudio);
    }
    console.log("Recorded audios received for upload:", recordedAudios.length);

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
                uploadedAt: Date.now().toString(),
              },
            },
          });
          await uploadAudio.done();

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: audioKey,
          });
          const audioUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${audioKey}`;

          task.audioFiles.push({
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
    if (newAudioFiles.length > 0 || recordedAudios.length > 0) task.markModified("audioFiles");

    // -------------------------------
    // REMOVE AUDIO FILES FROM S3
    // -------------------------------
    const removeAudio = JSON.parse(formData.get("removeAudio") || "[]");
    if (removeAudio.length > 0) {
      for (const audioId of removeAudio) {
        const audio = task.audioFiles.id(audioId);
        if (audio) {
          try {
            await s3.send(
              new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: audio.publicId,
              })
            );
          } catch (e) {
            console.error("S3 delete error:", e);
          }
          task.audioFiles.pull(audioId);
        }
      }
    }

    await task.save();

    // -------------------------------
    // SEND NOTIFICATIONS
    // -------------------------------
    const teamleadTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/admin-tasks`;
    const employeeTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/employee/admin-tasks`;
    const teamleads = await TeamLead.find({ _id: { $in: task.teamleads.map(t => t.teamleadId) } });
    const employees = await Employee.find({ _id: { $in: task.employees.map(e => e.employeeId) } });

    await Promise.all([
      ...teamleads.map(tl =>
        Promise.all([
          sendNotification({
            senderId: session.user.id,
            senderModel: "Admin",
            senderName: session.user.name || "Admin",
            receiverId: tl._id,
            receiverModel: "TeamLead",
            type: "admin_task_updated",
            title: "Task Updated",
            message: `${task.title} has been updated`,
            link: teamleadTaskLink,
            referenceId: task._id,
            referenceModel: "AdminTask2",
          }),
          sendMail(
            tl.email,
            "Task Updated",
            adminTaskUpdatedMailTemplate(
              `${tl.firstName} ${tl.lastName}`,
              task.title,
              session.user.name || "Admin",
              teamleadTaskLink
            )
          ),
        ])
      ),
      ...employees.map(emp =>
        Promise.all([
          sendNotification({
            senderId: session.user.id,
            senderModel: "Admin",
            senderName: session.user.name || "Admin",
            receiverId: emp._id,
            receiverModel: "Employee",
            type: "admin_task_updated",
            title: "Task Updated",
            message: `${task.title} has been updated`,
            link: employeeTaskLink,
            referenceId: task._id,
            referenceModel: "AdminTask2",
          }),
          sendMail(
            emp.email,
            "Task Updated",
            adminTaskUpdatedMailTemplate(
              `${emp.firstName} ${emp.lastName}`,
              task.title,
              session.user.name || "Admin",
              employeeTaskLink
            )
          ),
        ])
      ),
    ]);

    return NextResponse.json({ success: true, message: "Task updated", task });

  } catch (err) {
    console.error("UPDATE AdminTask2 Error:", err);
    return NextResponse.json({ message: "Update failed", error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const task = await AdminTask2.findById(id);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // -------------------------------
    // DELETE ALL FILES FROM S3
    // -------------------------------
    const allMedia = [...(task.fileAttachments || []), ...(task.audioFiles || [])];
    for (const item of allMedia) {
      if (item.publicId) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: item.publicId,
            })
          );
        } catch (e) {
          console.error("S3 delete error during task deletion:", e);
        }
      }
    }

    // Get assignees for notifications
    const teamleads = await TeamLead.find({ _id: { $in: task.teamleads.map(t => t.teamleadId) } });
    const employees = await Employee.find({ _id: { $in: task.employees.map(e => e.employeeId) } });
    const taskTitle = task.title;

    // Delete task
    await task.deleteOne();

    // Send notifications
    const teamleadTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/admin-tasks`;
    const employeeTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/employee/admin-tasks`;

    await Promise.all([
      ...teamleads.map(tl =>
        Promise.all([
          sendNotification({
            senderId: session.user.id,
            senderModel: "Admin",
            senderName: session.user.name || "Admin",
            receiverId: tl._id,
            receiverModel: "TeamLead",
            type: "admin_task_deleted",
            title: "Task Deleted",
            message: `${taskTitle} has been deleted`,
            link: teamleadTaskLink,
          }),
          sendMail(
            tl.email,
            "Task Deleted",
            adminTaskDeletedMailTemplate(
              `${tl.firstName} ${tl.lastName}`,
              taskTitle,
              session.user.name || "Admin"
            )
          ),
        ])
      ),
      ...employees.map(emp =>
        Promise.all([
          sendNotification({
            senderId: session.user.id,
            senderModel: "Admin",
            senderName: session.user.name || "Admin",
            receiverId: emp._id,
            receiverModel: "Employee",
            type: "admin_task_deleted",
            title: "Task Deleted",
            message: `${taskTitle} has been deleted`,
            link: employeeTaskLink,
          }),
          sendMail(
            emp.email,
            "Task Deleted",
            adminTaskDeletedMailTemplate(
              `${emp.firstName} ${emp.lastName}`,
              taskTitle,
              session.user.name || "Admin"
            )
          ),
        ])
      ),
    ]);

    return NextResponse.json({ success: true, message: "Task deleted" });

  } catch (err) {
    console.error("DELETE AdminTask2 Error:", err);
    return NextResponse.json({ message: "Delete failed", error: err.message }, { status: 500 });
  }
}