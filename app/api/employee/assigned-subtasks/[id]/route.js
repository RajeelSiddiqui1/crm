import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import { authOptions } from "@/lib/auth";

import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendNotification } from "@/lib/sendNotification";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { sendMail } from "@/lib/mail";
import { employeeTaskUpdatedTemplate } from "@/helper/emails/employee/employeeTaskUpdatedTemplate";

const BUCKET = process.env.AWS_BUCKET_NAME;


/* ======================================================
   PUT — UPDATE TASK + FILE MANAGEMENT (Individual File Delete Support)
====================================================== */
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const task = await EmployeeTask.findById(params.id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (task.submittedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    /* ---------------- BASIC FIELDS ---------------- */
    task.title = formData.get("title") || task.title;
    task.description = formData.get("description") || task.description;
    task.startDate = formData.get("startDate") || task.startDate;
    task.endDate = formData.get("endDate") || task.endDate;
    task.startTime = formData.get("startTime") || task.startTime;
    task.endTime = formData.get("endTime") || task.endTime;
    task.status = formData.get("status") || task.status;

    /* ---------------- ASSIGNEES ---------------- */
    const assignedTeamLead = JSON.parse(formData.get("assignedTeamLead") || "[]");
    const assignedManager = JSON.parse(formData.get("assignedManager") || "[]");
    const assignedEmployee = JSON.parse(formData.get("assignedEmployee") || "[]");

    task.assignedTeamLead = assignedTeamLead.map(id => ({ teamLeadId: id }));
    task.assignedManager = assignedManager.map(id => ({ managerId: id }));
    task.assignedEmployee = assignedEmployee.map(id => ({ employeeId: id }));

    /* ---------------- FILE DELETE ---------------- */
    const filesToDelete = JSON.parse(formData.get("filesToDelete") || "[]");
    if (filesToDelete.length) {
      task.fileAttachments = task.fileAttachments.filter(
        file => !filesToDelete.includes(file.publicId)
      );

      for (const key of filesToDelete) {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      }
    }

    /* ---------------- FILE UPLOAD ---------------- */
    /* ---------------- FILE UPLOAD ---------------- */
const files = formData.getAll("files");

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
      ContentType: file.type || "application/octet-stream",
    },
  });

  await upload.done();

  // ✅ Generate signed URL for the uploaded file (7 days)
  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 604800 } // 7 days
  );

  task.fileAttachments.push({
    name: file.name,
    type: file.type,
    size: file.size,
    publicId: key,
    url: signedUrl, // <- signed URL here
  });
}


    await task.save();

    /* ---------------- NOTIFICATIONS ---------------- */
    if (formData.get("notifyEmail")) {
      await sendMail(
        formData.get("notifyEmail"),
        "Task Updated",
        employeeTaskUpdatedTemplate(session.user.name, task.title)
      );
    }

    /* ---------------- RESPONSE ---------------- */
    const populatedTask = await EmployeeTask.findById(task._id)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedEmployee.employeeId", "firstName lastName email")
      .populate("assignedManager.managerId", "firstName lastName email")
      .populate("assignedTeamLead.teamLeadId", "firstName lastName email");

    return NextResponse.json(populatedTask, { status: 200 });
  } catch (error) {
    console.error("PUT EmployeeTask Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}



/* ======================================================
   DELETE — TASK + AWS FILE DELETE
====================================================== */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const task = await EmployeeTask.findById(params.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.submittedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (task.fileAttachments?.length) {
      for (const file of task.fileAttachments) {
        if (file.publicId) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: BUCKET,
              Key: file.publicId,
            })
          );
        }
      }
    }

    await task.deleteOne();

    return NextResponse.json(
      { message: "Task and files deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE EmployeeTask Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}

/* ======================================================
   PATCH — STATUS ONLY
====================================================== */
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();

    const task = await EmployeeTask.findById(params.id);
    task.status = body.status;
    await task.save();

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ======================================================
   GET — SINGLE TASK
====================================================== */



export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const task = await EmployeeTask.findById(params.id)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedTeamLead.teamLeadId", "firstName lastName email")
      .populate("assignedManager.managerId", "firstName lastName email")
      .populate("assignedEmployee.employeeId", "firstName lastName email")
      .select("+fileAttachments");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 🔐 Only the employee who submitted the task can view it
    if (task.submittedBy._id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}
