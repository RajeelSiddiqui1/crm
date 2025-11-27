import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    const { title, clientName, fileAttachments, audioUrl, priority, endDate, managersId } = await req.json();

    let uploadFileUrl = "";
    let uploadAudioUrl = "";

    if (fileAttachments) {
      const fileRes = await cloudinary.uploader.upload(fileAttachments, { folder: "admin_tasks/files" });
      uploadFileUrl = fileRes.secure_url;
    }

    if (audioUrl) {
      const audioRes = await cloudinary.uploader.upload(audioUrl, { resource_type: "video", folder: "admin_tasks/audio" });
      uploadAudioUrl = audioRes.secure_url;
    }

    const newAdminTask = new AdminTask({
      title,
      clientName,
      fileAttachments: uploadFileUrl || null,
      audioUrl: uploadAudioUrl || null,
      priority: priority || "low",
      endDate: endDate ? new Date(endDate) : null,
      managers: Array.isArray(managersId) ? managersId : [managersId],
    });

    await newAdminTask.save();

    const taskLink = `${process.env.TASK_LINK}/manager/admin-tasks`;

    // Notifications
    await Promise.all(newAdminTask.managers.map(managerId =>
      sendNotification({
        senderId: session.user.id,
        senderModel: "Admin",
        senderName: session.user.name || "Admin",
        receiverId: managerId,
        receiverModel: "Manager",
        type: "admin_task_created",
        title: "New Admin Task",
        message: `A new admin task "${title}" has been assigned to you.`,
        link: taskLink,
        referenceId: newAdminTask._id,
        referenceModel: "AdminTask",
      })
    ));

    return NextResponse.json({ success: true, message: "Admin Task created successfully", task: newAdminTask }, { status: 200 });

  } catch (error) {
    console.error("Admin Task creation error:", error);
    return NextResponse.json({ success: false, message: "Admin Task creation failed", error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const tasks = await AdminTask.find()
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
