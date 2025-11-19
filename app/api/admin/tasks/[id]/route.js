import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    const { id } = params;
    const {
      title,
      clientName,
      fileAttachments,
      audioUrl,
      priority,
      endDate,
      managersId,
    } = await req.json();

    const task = await AdminTask.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    let uploadFileUrl = task.fileAttachments;
    let uploadAudioUrl = task.audioUrl;

    if (fileAttachments) {
      if (task.filePublicId) {
        await cloudinary.uploader.destroy(task.filePublicId);
      }
      const fileRes = await cloudinary.uploader.upload(fileAttachments, {
        folder: "admin_tasks/files",
      });
      uploadFileUrl = fileRes.secure_url;
      task.filePublicId = fileRes.public_id;
    }

    if (audioUrl) {
      if (task.audioPublicId) {
        await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });
      }
      const audioRes = await cloudinary.uploader.upload(audioUrl, {
        resource_type: "video",
        folder: "admin_tasks/audio",
      });
      uploadAudioUrl = audioRes.secure_url;
      task.audioPublicId = audioRes.public_id;
    }

    task.title = title || task.title;
    task.clientName = clientName || task.clientName;
    task.fileAttachments = uploadFileUrl;
    task.audioUrl = uploadAudioUrl;
    task.priority = priority || task.priority;
    task.endDate = endDate || task.endDate;
    task.managers = managersId || task.managers;

    await task.save();

    return NextResponse.json({ success: true, message: "Admin Task updated successfully", task });
  } catch (error) {
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
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.filePublicId) {
      await cloudinary.uploader.destroy(task.filePublicId);
    }

    if (task.audioPublicId) {
      await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });
    }

    await task.deleteOne();

    return NextResponse.json({ success: true, message: "Admin Task deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Delete failed", error: error.message }, { status: 500 });
  }
}
