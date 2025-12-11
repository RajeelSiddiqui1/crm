import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskCreatedMailTemplate } from "@/helper/emails/admin/createTask";

export async function POST(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { title, clientName, fileAttachments, audioUrl, priority, endDate, managersId } = await req.json();

    if (!title || !managersId || managersId.length === 0) {
      return NextResponse.json(
        { success: false, message: "Task title and assigned managers are required" },
        { status: 400 }
      );
    }

    let uploadFileUrl = "";
    let uploadAudioUrl = "";

    if (fileAttachments) {
      const fileRes = await cloudinary.uploader.upload(fileAttachments, {
        resource_type: "raw",
        folder: "admin_tasks/files",
      });
      uploadFileUrl = fileRes.secure_url;
    }

    if (audioUrl) {
      const audioRes = await cloudinary.uploader.upload(audioUrl, {
        resource_type: "video",
        folder: "admin_tasks/audio",
      });
      uploadAudioUrl = audioRes.secure_url;
    }

    const newAdminTask = new AdminTask({
      title,
      clientName: clientName || "",
      fileAttachments: uploadFileUrl || null,
      audioUrl: uploadAudioUrl || null,
      priority: priority || "low",
      endDate: endDate ? new Date(endDate) : null,
      managers: Array.isArray(managersId) ? managersId : [managersId],
      submittedBy: session.user.id,
    });

    await newAdminTask.save();

    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;
    const managers = await Manager.find({ _id: { $in: newAdminTask.managers } });

    await Promise.all(
      managers.map(async (manager) => {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Admin",
          senderName: session.user.name || "Admin",
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "admin_task_created",
          title: "New Admin Task",
          message: `A new admin task "${title}" has been assigned to you.`,
          link: taskLink,
          referenceId: newAdminTask._id,
          referenceModel: "AdminTask",
        });

        const emailHtml = adminTaskCreatedMailTemplate(
          manager.firstName + " " + manager.lastName,
          title,
          session.user.name || "Admin",
          priority,
          endDate,
          taskLink
        );

        await sendMail(manager.email, "New Admin Task Assigned", emailHtml);
      })
    );

    return NextResponse.json(
      { success: true, message: "Admin Task created and notifications sent successfully", task: newAdminTask },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Task creation error:", error);
    return NextResponse.json(
      { success: false, message: "Admin Task creation failed", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    const tasks = await AdminTask.find({ submittedBy: session.user.id })
      .populate({
        path: "managers",
        select: "firstName lastName email departments",
        populate: {
          path: "departments",
          select: "name description",
        },
      })
      .lean();

    return NextResponse.json(
      { success: true, tasks, message: "Tasks fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin tasks:", error);
    return NextResponse.json(
      { success: false, message: "Tasks fetch error", error: error.message },
      { status: 500 }
    );
  }
}
