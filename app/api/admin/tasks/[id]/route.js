// app/api/admin/tasks/[id]/route.js
import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskUpdatedMailTemplate } from "@/helper/emails/admin/updateTask";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const formData = await req.formData();
    const task = await AdminTask.findById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // TEXT FIELDS
    task.title = formData.get("title") || task.title;
    task.description = formData.get("description") || task.description;
    task.clientName = formData.get("clientName") || task.clientName;
    task.priority = formData.get("priority") || task.priority;
    if (formData.get("endDate")) {
      task.endDate = new Date(formData.get("endDate"));
    }

    // STATUS
    const status = formData.get("status");
    if (status && ["pending", "in-progress", "completed", "overdue"].includes(status)) {
      task.status = status;
      if (status === "completed") {
        task.completedAt = new Date();
      }
    }

    // MANAGERS
    const managersRaw = formData.get("managersId");
    if (managersRaw) {
      const managersId = JSON.parse(managersRaw);
      task.managers = managersId;
      
      // Update departments based on new managers
      const managers = await Manager.find({ _id: { $in: managersId } });
      const departmentSet = new Set();
      managers.forEach((manager) =>
        manager.departments.forEach((dep) => departmentSet.add(dep.toString()))
      );
      task.departments = Array.from(departmentSet);
    }

    // NEW FILES
    const newFiles = formData.getAll("files[]");
    for (const file of newFiles) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileKey = `admin_tasks/files/${Date.now()}_${file.name}`;

        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type,
          },
        });
        await upload.done();

        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        });
        const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });

        task.fileAttachments.push({
          url: fileUrl,
          name: file.name,
          type: file.type,
          size: file.size,
          publicId: fileKey,
        });
      }
    }

    // REMOVE FILES
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

    // NEW AUDIO FILES
    const newAudioFiles = formData.getAll("audioFiles[]");
    for (const audio of newAudioFiles) {
      if (audio && audio.size > 0) {
        const buffer = Buffer.from(await audio.arrayBuffer());
        const audioKey = `admin_tasks/audio/${Date.now()}_${audio.name}`;

        const uploadAudio = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: audioKey,
            Body: buffer,
            ContentType: audio.type,
          },
        });
        await uploadAudio.done();

        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: audioKey,
        });
        const audioUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });

        task.audioFiles.push({
          url: audioUrl,
          name: audio.name,
          type: audio.type,
          size: audio.size,
          publicId: audioKey,
        });
      }
    }

    // NEW RECORDED AUDIO
    const recordedAudio = formData.get("recordedAudio");
    if (recordedAudio && recordedAudio.size > 0) {
      const buffer = Buffer.from(await recordedAudio.arrayBuffer());
      const audioKey = `admin_tasks/recordings/${Date.now()}_recording.webm`;

      const uploadAudio = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: audioKey,
          Body: buffer,
          ContentType: "audio/webm",
        },
      });
      await uploadAudio.done();

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: audioKey,
      });
      const audioUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });

      task.audioFiles.push({
        url: audioUrl,
        name: "Voice Recording",
        type: "audio/webm",
        size: recordedAudio.size,
        publicId: audioKey,
      });
    }

    // REMOVE AUDIO FILES
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

    // NOTIFICATIONS & EMAILS
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;
    const managers = await Manager.find({ _id: { $in: task.managers } });

    await Promise.all(
      managers.map(async (manager) => {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Admin",
          senderName: session.user.name || "Admin",
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "admin_task_updated",
          title: "Admin Task Updated",
          message: `Task "${task.title}" has been updated.`,
          link: taskLink,
          referenceId: task._id,
          referenceModel: "AdminTask",
        });
        await sendMail(
          manager.email,
          "Admin Task Updated",
          adminTaskUpdatedMailTemplate(
            `${manager.firstName} ${manager.lastName}`,
            task.title,
            session.user.name || "Admin",
            taskLink
          )
        );
      })
    );

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("PATCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Update failed", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const task = await AdminTask.findById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Delete all files from S3
    const allMedia = [...task.fileAttachments, ...task.audioFiles];
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

    await task.deleteOne();
    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Delete failed", error: error.message },
      { status: 500 }
    );
  }
}