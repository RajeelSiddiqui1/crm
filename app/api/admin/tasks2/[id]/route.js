import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskUpdatedMailTemplate } from "@/helper/emails/admin/updateTask";
import { adminTaskDeletedMailTemplate } from "@/helper/emails/admin/deleteTask";

export async function PUT(req, { params }) {
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
    task.title = formData.get("title") ?? task.title;
    task.clientName = formData.get("clientName") ?? task.clientName;
    task.priority = formData.get("priority") ?? task.priority;
    task.endDate = formData.get("endDate") ?? task.endDate;

    // Update assignments
    const teamleadIds = JSON.parse(formData.get("teamleadIds") || "[]");
    const employeeIds = JSON.parse(formData.get("employeeIds") || "[]");

    // Preserve existing statuses for existing assignees
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

    // File update
    const file = formData.get("file");
    if (file && file.size > 0) {
      if (task.filePublicId) {
        await cloudinary.uploader.destroy(task.filePublicId, { resource_type: "raw" });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await cloudinary.uploader.upload(
        `data:${file.type};base64,${buffer.toString("base64")}`,
        { folder: "admin_tasks/files", resource_type: "auto" }
      );

      task.fileAttachments = uploaded.secure_url;
      task.filePublicId = uploaded.public_id;
      task.fileName = file.name;
      task.fileType = file.type;
    }

    // Audio update
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

    await task.save();

    // Notifications
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks`;
    const teamleads = await TeamLead.find({ _id: { $in: teamleadIds } });
    const employees = await Employee.find({ _id: { $in: employeeIds } });

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
            link: taskLink,
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
              taskLink
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
            link: taskLink,
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
              taskLink
            )
          ),
        ])
      ),
    ]);

    return NextResponse.json({ success: true, message: "Task updated", task });

  } catch (err) {
    console.error("UPDATE AdminTask2 Error:", err);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
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

    // Delete files from cloudinary
    if (task.filePublicId) {
      await cloudinary.uploader.destroy(task.filePublicId, { resource_type: "raw" });
    }
    if (task.audioPublicId) {
      await cloudinary.uploader.destroy(task.audioPublicId, { resource_type: "video" });
    }

    // Get assignees for notifications
    const teamleads = await TeamLead.find({ _id: { $in: task.teamleads.map(t => t.teamleadId) } });
    const employees = await Employee.find({ _id: { $in: task.employees.map(e => e.employeeId) } });
    const taskTitle = task.title;

    // Delete task
    await task.deleteOne();

    // Send notifications
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/dashboard`;

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
            link: taskLink,
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
            link: taskLink,
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
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}