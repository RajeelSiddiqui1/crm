// app/api/admin-task/[id]/route.js
import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskUpdatedMailTemplate } from "@/helper/emails/admin/updateTask";
import { adminTaskDeletedMailTemplate } from "@/helper/emails/admin/deleteTask";
import Manager from "@/models/Manager";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    const { id } = params;
    const { title, clientName, fileAttachments, audioUrl, priority, endDate, managersId } = await req.json();
    const task = await AdminTask.findById(id);
    if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });

    // Handle file uploads
    if (fileAttachments) {
      if (task.filePublicId) await cloudinary.uploader.destroy(task.filePublicId);
      const fileRes = await cloudinary.uploader.upload(fileAttachments, { folder: "admin_tasks/files" });
      task.fileAttachments = fileRes.secure_url;
      task.filePublicId = fileRes.public_id;
    }

    if (audioUrl) {
      if (task.audioPublicId) await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });
      const audioRes = await cloudinary.uploader.upload(audioUrl, { resource_type: "video", folder: "admin_tasks/audio" });
      task.audioUrl = audioRes.secure_url;
      task.audioPublicId = audioRes.public_id;
    }

    // Update task fields
    task.title = title || task.title;
    task.clientName = clientName || task.clientName;
    task.priority = priority || task.priority;
    task.endDate = endDate || task.endDate;
    task.managers = managersId || task.managers;

    await task.save();

    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;

    // Notify managers
    await Promise.all(task.managers.map(async (managerId) => {
      const manager = await Manager.findById(managerId);
      if (!manager) return;

      // Send in-app notification
      await sendNotification({
        senderId: session.user.id,
        senderModel: "Admin",
        senderName: session.user.name || "Admin",
        receiverId: managerId,
        receiverModel: "Manager",
        type: "admin_task_edit",
        title: "Admin Task Updated",
        message: `${task.title} Task has been updated by Admin`,
        link: taskLink,
        referenceId: task._id,
        referenceModel: "AdminTask",
      });

      // Send email
      await sendMail(
        manager.email,
        "Admin Task Updated",
        adminTaskUpdatedMailTemplate(manager.firstName + " " + manager.lastName, task.title, session.user.name, taskLink)
      );
    }));

    return NextResponse.json({ success: true, message: "Admin Task updated successfully", task });

  } catch (error) {
    console.error("PATCH AdminTask Error:", error);
    return NextResponse.json({ success: false, message: "Update failed", error: error.message }, { status: 500 });
  }
}


export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    const { id } = params;
    const task = await AdminTask.findById(id);
    if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });

    if (task.filePublicId) await cloudinary.uploader.destroy(task.filePublicId);
    if (task.audioPublicId) await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });

    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;

    // Notify managers
    await Promise.all(task.managers.map(async (managerId) => {
      const manager = await Manager.findById(managerId);
      if (!manager) return;

      // Send in-app notification
      await sendNotification({
        senderId: session.user.id,
        senderModel: "Admin",
        senderName: session.user.name || "Admin",
        receiverId: managerId,
        receiverModel: "Manager",
        type: "admin_task_deleted",
        title: "Admin Task Deleted",
        message: `${task.title} Task has been deleted by Admin`,
        link: taskLink,
        referenceId: task._id,
        referenceModel: "AdminTask",
      });

      // Send email
      await sendMail(
        manager.email,
        "Admin Task Deleted",
        adminTaskDeletedMailTemplate(manager.firstName + " " + manager.lastName, task.title, session.user.name, taskLink)
      );
    }));

    await task.deleteOne();

    return NextResponse.json({ success: true, message: "Admin Task deleted successfully" });

  } catch (error) {
    console.error("DELETE AdminTask Error:", error);
    return NextResponse.json({ success: false, message: "Delete failed", error: error.message }, { status: 500 });
  }
}
