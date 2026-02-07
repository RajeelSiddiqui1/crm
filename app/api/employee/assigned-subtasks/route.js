import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { employeeTaskCreatedTemplate } from "@/helper/emails/employee/employeeTaskTemplates";

import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_BUCKET_NAME;

/* ======================================================
   POST  (CREATE EMPLOYEE TASK + FILES)
====================================================== */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const formData = await req.formData();

    /* ---------------- BASIC FIELDS ---------------- */
    const title = formData.get("title");
    const description = formData.get("description");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    /* ---------------- ASSIGNEES ---------------- */
    const assignedTeamLead = JSON.parse(formData.get("assignedTeamLead") || "[]");
    const assignedManager = JSON.parse(formData.get("assignedManager") || "[]");
    const assignedEmployee = JSON.parse(formData.get("assignedEmployee") || "[]");

    if (
      assignedTeamLead.length === 0 &&
      assignedManager.length === 0 &&
      assignedEmployee.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one assignee is required" },
        { status: 400 }
      );
    }

    /* ---------------- FILE UPLOADS ---------------- */
    const files = formData.getAll("files");
    const uploadedFiles = [];

    for (const file of files) {
      if (!file || !file.size) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const key = `employee_tasks/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            uploadedBy: session.user.id,
            uploadedAt: Date.now().toString(),
          },
        },
      });

      await upload.done();

      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 604800 } // 7 days
      );

      uploadedFiles.push({
        url: signedUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        publicId: key,
      });
    }

    /* ---------------- CREATE TASK ---------------- */
    const task = await EmployeeTask.create({
      title,
      description,
      submittedBy: session.user.id,
      startDate,
      endDate,
      startTime,
      endTime,
      fileAttachments: uploadedFiles,

      assignedTeamLead: assignedTeamLead.map(id => ({ teamLeadId: id })),
      assignedManager: assignedManager.map(id => ({ managerId: id })),
      assignedEmployee: assignedEmployee.map(id => ({ employeeId: id })),
    });

    /* ---------------- NOTIFICATIONS + EMAILS ---------------- */

    // Employees
    for (const empId of assignedEmployee) {
      const emp = await Employee.findById(empId);
      if (!emp) continue;

      sendNotification({
        senderId: session.user.id,
        senderModel: "Employee",
        senderName: session.user.name,
        receiverId: emp._id,
        receiverModel: "Employee",
        type: "employee_task_created",
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${title}"`,
        link: "/employee/employee-tasks",
        referenceId: task._id,
        referenceModel: "EmployeeTask",
      });

      if (emp.email) {
        sendMail(
          emp.email,
          "New Task Assigned",
          employeeTaskCreatedTemplate(emp.firstName, title, description)
        );
      }
    }

    // Managers
    for (const mgrId of assignedManager) {
      const mgr = await Manager.findById(mgrId);
      if (!mgr) continue;

      sendNotification({
        senderId: session.user.id,
        senderModel: "Employee",
        senderName: session.user.name,
        receiverId: mgr._id,
        receiverModel: "Manager",
        type: "employee_task_created",
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${title}"`,
        link: "/manager/employee-tasks",
        referenceId: task._id,
        referenceModel: "EmployeeTask",
      });

      if (mgr.email) {
        sendMail(
          mgr.email,
          "New Task Assigned",
          employeeTaskCreatedTemplate(mgr.firstName, title, description)
        );
      }
    }

    // Team Leads
    for (const tlId of assignedTeamLead) {
      const tl = await TeamLead.findById(tlId);
      if (!tl) continue;

      sendNotification({
        senderId: session.user.id,
        senderModel: "Employee",
        senderName: session.user.name,
        receiverId: tl._id,
        receiverModel: "TeamLead",
        type: "employee_task_created",
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${title}"`,
        link: "/teamlead/employee-tasks",
        referenceId: task._id,
        referenceModel: "EmployeeTask",
      });

      if (tl.email) {
        sendMail(
          tl.email,
          "New Task Assigned",
          employeeTaskCreatedTemplate(tl.firstName, title, description)
        );
      }
    }

    /* ---------------- RESPONSE ---------------- */
    const populatedTask = await EmployeeTask.findById(task._id)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedEmployee.employeeId", "firstName lastName email")
      .populate("assignedManager.managerId", "firstName lastName email")
      .populate("assignedTeamLead.teamLeadId", "firstName lastName email");

    return NextResponse.json(populatedTask, { status: 201 });

  } catch (error) {
    console.error("EmployeeTask POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}

/* ======================================================
   GET  (EMPLOYEE TASK LIST)
====================================================== */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "Employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const tasks = await EmployeeTask.find({
    $or: [
      { submittedBy: session.user.id },
      { "assignedEmployee.employeeId": session.user.id },
    ],
  })
    .populate("submittedBy", "firstName lastName email")
    .populate("assignedTeamLead.teamLeadId", "firstName lastName email")
    .populate("assignedManager.managerId", "firstName lastName email")
    .populate("assignedEmployee.employeeId", "firstName lastName email");

  return NextResponse.json(tasks, { status: 200 });
}
