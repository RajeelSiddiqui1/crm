import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskUpdatedMailTemplate } from "@/helper/emails/admin/updateTask";
import { adminTaskDeletedMailTemplate } from "@/helper/emails/admin/deleteTask";

/* =========================
   PATCH → UPDATE TASK
========================= */
export async function PATCH(req, context) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params; // ✅ FIXED

    // ❗ MUST be multipart/form-data
    const formData = await req.formData();

    const task = await AdminTask.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    /* -------- TEXT FIELDS -------- */
    task.title = formData.get("title") ?? task.title;
    task.clientName = formData.get("clientName") ?? task.clientName;
    task.priority = formData.get("priority") ?? task.priority;
    task.endDate = formData.get("endDate") ?? task.endDate;

    const managersRaw = formData.get("managersId");
    if (managersRaw) task.managers = JSON.parse(managersRaw);

    /* -------- FILE UPLOAD -------- */
    const file = formData.get("file");
    if (file && file.size > 0) {
      if (task.filePublicId) {
        await cloudinary.uploader.destroy(task.filePublicId, { resource_type: "raw" });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const mime = file.type;

      let resourceType = "raw";
      if (mime.startsWith("image/")) resourceType = "image";
      else if (mime.startsWith("video/") || mime.startsWith("audio/")) resourceType = "video";

      const uploaded = await cloudinary.uploader.upload(
        `data:${mime};base64,${buffer.toString("base64")}`,
        { folder: "admin_tasks/files", resource_type: resourceType }
      );

      task.fileAttachments = uploaded.secure_url;
      task.filePublicId = uploaded.public_id;
      task.fileName = file.name;
      task.fileType = mime;
    }

    if (formData.get("removeFile") === "true" && task.filePublicId) {
      await cloudinary.uploader.destroy(task.filePublicId, { resource_type: "raw" });
      task.fileAttachments = task.filePublicId = task.fileName = task.fileType = null;
    }

    /* -------- AUDIO -------- */
    const audio = formData.get("audio");
    if (audio && audio.size > 0) {
      if (task.audioPublicId) {
        await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });
      }

      const buffer = Buffer.from(await audio.arrayBuffer());
      const uploaded = await cloudinary.uploader.upload(
        `data:${audio.type};base64,${buffer.toString("base64")}`,
        { folder: "admin_tasks/audio", resource_type: "video" }
      );

      task.audioUrl = uploaded.secure_url;
      task.audioPublicId = uploaded.public_id;
    }

    if (formData.get("removeAudio") === "true" && task.audioPublicId) {
      await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });
      task.audioUrl = task.audioPublicId = null;
    }

    await task.save();

    /* -------- NOTIFICATIONS + EMAIL -------- */
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;

    await Promise.all(
      task.managers.map(async (managerId) => {
        const manager = await Manager.findById(managerId);
        if (!manager) return;

        await sendNotification({
          senderId: session.user.id,
          senderModel: "Admin",
          senderName: session.user.name || "Admin",
          receiverId: managerId,
          receiverModel: "Manager",
          type: "admin_task_updated",
          title: "Admin Task Updated",
          message: `${task.title} has been updated`,
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

    return NextResponse.json({ success: true, message: "Task updated successfully", task });

  } catch (error) {
    console.error("PATCH ERROR:", error);
    return NextResponse.json({ success: false, message: "Update failed" }, { status: 500 });
  }
}

/* =========================
   DELETE → DELETE TASK
========================= */
export async function DELETE(req, context) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    const task = await AdminTask.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.filePublicId) {
      await cloudinary.uploader.destroy(task.filePublicId, { resource_type: "raw" });
    }

    if (task.audioPublicId) {
      await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });
    }

    await task.deleteOne();

    return NextResponse.json({ success: true, message: "Task deleted successfully" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ success: false, message: "Delete failed" }, { status: 500 });
  }
}