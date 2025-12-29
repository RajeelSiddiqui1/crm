import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import Department from "@/models/Department";
import { adminTaskCreatedMailTemplate } from "@/helper/emails/admin/createTask";

export async function POST(req) {
  try {
    await dbConnect();

    // ---------------- AUTH
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title");
    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const teamleadIds = JSON.parse(formData.get("teamleadIds") || "[]");
    const employeeIds = JSON.parse(formData.get("employeeIds") || "[]");

    const teamleads = teamleadIds.map(id => ({ teamleadId: id }));
    const employees = employeeIds.map(id => ({ employeeId: id }));

    // ---------------- FILE
    let fileUrl = null, filePublicId = null, fileName = null, fileType = null;
    const file = formData.get("file");

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      fileType = file.type;

      const upload = await cloudinary.uploader.upload(
        `data:${file.type};base64,${buffer.toString("base64")}`,
        { folder: "admin_tasks/files", resource_type: "auto" }
      );

      fileUrl = upload.secure_url;
      filePublicId = upload.public_id;
    }

    // ---------------- AUDIO
    let audioUrl = null, audioPublicId = null;
    const audio = formData.get("audio");

    if (audio && audio.size > 0) {
      const buffer = Buffer.from(await audio.arrayBuffer());
      const upload = await cloudinary.uploader.upload(
        `data:${audio.type};base64,${buffer.toString("base64")}`,
        { folder: "admin_tasks/audio", resource_type: "video" }
      );

      audioUrl = upload.secure_url;
      audioPublicId = upload.public_id;
    }

    // ---------------- CREATE TASK
    const task = await AdminTask2.create({
      title,
      clientName: formData.get("clientName"),
      priority: formData.get("priority") || "low",
      endDate: formData.get("endDate") || null,
      teamleads,
      employees,
      fileAttachments: fileUrl,
      fileName,
      fileType,
      audioUrl,
      filePublicId,
      audioPublicId,
      submittedBy: session.user.id,
    });

    // ---------------- FETCH USERS
    const teamleadUsers = await TeamLead.find({ _id: { $in: teamleadIds } });
    const employeeUsers = await Employee.find({ _id: { $in: employeeIds } });

    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks`;

    // ---------------- NOTIFICATIONS + EMAILS (PARALLEL)
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
      { message: "Task creation failed" },
      { status: 500 }
    );
  }
}


export async function GET(req) {
  try {
    await dbConnect();

    // -------- AUTH
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // -------- FETCH TASKS
const tasks = await AdminTask2.find()
  .populate("teamleads.teamleadId", "firstName lastName email")
  .populate("employees.employeeId", "firstName lastName email")
  .sort({ createdAt: -1 });


    return NextResponse.json(
      { success: true, tasks },
      { status: 200 }
    );

  } catch (err) {
    console.error("AdminTask2 GET Error:", err);
    return NextResponse.json(
      { message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
