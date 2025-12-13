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
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const title = formData.get("title");
    const clientName = formData.get("clientName");
    const priority = formData.get("priority") || "low";
    const endDate = formData.get("endDate");
    const managersId = JSON.parse(formData.get("managersId") || "[]");

    const file = formData.get("file");
    const audio = formData.get("audio");

    if (!title || managersId.length === 0) {
      return NextResponse.json(
        { success: false, message: "Title and managers are required" },
        { status: 400 }
      );
    }

    let fileUrl = null;
    let filePublicId = null;
    let fileType = null;
    let fileName = null;

    // -------------------------------
    // FILE UPLOAD (Excel, PDF, Word, Image, Video)
    // -------------------------------
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const mime = file.type;
      fileName = file.name;
      fileType = mime;

      let resourceType = "raw";

      if (mime.startsWith("image/")) resourceType = "image";
      else if (mime.startsWith("video/") || mime.startsWith("audio/")) resourceType = "video";

      const uploadRes = await cloudinary.uploader.upload(
        `data:${mime};base64,${buffer.toString("base64")}`,
        {
          folder: "admin_tasks/files",
          resource_type: resourceType,
        }
      );

      fileUrl = uploadRes.secure_url;
      filePublicId = uploadRes.public_id;
    }

    // -------------------------------
    // AUDIO UPLOAD (OPTIONAL)
    // -------------------------------
    let audioUrl = null;
    let audioPublicId = null;

    if (audio && audio.size > 0) {
      const buffer = Buffer.from(await audio.arrayBuffer());

      const uploadAudio = await cloudinary.uploader.upload(
        `data:${audio.type};base64,${buffer.toString("base64")}`,
        {
          folder: "admin_tasks/audio",
          resource_type: "video",
        }
      );

      audioUrl = uploadAudio.secure_url;
      audioPublicId = uploadAudio.public_id;
    }

    // -------------------------------
    // SAVE TASK
    // -------------------------------
    const newTask = new AdminTask({
      title,
      clientName,
      fileAttachments: fileUrl,
      fileName,
      fileType,
      audioUrl,
      priority,
      endDate: endDate ? new Date(endDate) : null,
      managers: managersId,
      submittedBy: session.user.id,
      filePublicId,
      audioPublicId,
    });

    await newTask.save();

    // -------------------------------
    // NOTIFICATIONS + EMAILS
    // -------------------------------
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;
    const managers = await Manager.find({ _id: { $in: managersId } });

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
          referenceId: newTask._id,
          referenceModel: "AdminTask",
        });

        const emailHtml = adminTaskCreatedMailTemplate(
          `${manager.firstName} ${manager.lastName}`,
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
      { success: true, message: "Admin task created successfully", task: newTask },
      { status: 201 }
    );

  } catch (error) {
    console.error("Admin Task Error:", error);
    return NextResponse.json(
      { success: false, message: "Task creation failed", error: error.message },
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
      .populate({
        path: "submittedBy",
        select: "name email",
      })
      .sort({ createdAt: -1 })
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