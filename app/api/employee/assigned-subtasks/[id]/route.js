import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import { authOptions } from "@/lib/auth";
import Department from "@/models/Department";
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
function mergeAssignments(existing = [], incoming = [], idKey) {
  const map = new Map();

  // Preserve existing data
  existing.forEach(item => {
    map.set(item[idKey].toString(), item);
  });

  // Add new ones
  incoming.forEach(id => {
    if (!map.has(id)) {
      map.set(id, {
        [idKey]: id,
        status: "pending",
        feedback: "",
        assignedAt: new Date(),
      });
    }
  });

  // Keep only selected IDs
  return Array.from(map.values()).filter(item =>
    incoming.includes(item[idKey].toString())
  );
}

/* ---------------- PUT ROUTE ---------------- */
export async function PUT(req, { params }) {
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

    const formData = await req.formData();

    /* ---------------- BASIC FIELDS ---------------- */
    task.title = formData.get("title") ?? task.title;
    task.description = formData.get("description") ?? task.description;
    task.startDate = formData.get("startDate") ?? task.startDate;
    task.endDate = formData.get("endDate") ?? task.endDate;
    task.startTime = formData.get("startTime") ?? task.startTime;
    task.endTime = formData.get("endTime") ?? task.endTime;
    task.status = formData.get("status") ?? task.status;

    /* ---------------- ASSIGNEES (SAFE MERGE) ---------------- */
    const assignedTeamLead = JSON.parse(formData.get("assignedTeamLead") || "[]");
    const assignedManager = JSON.parse(formData.get("assignedManager") || "[]");
    const assignedEmployee = JSON.parse(formData.get("assignedEmployee") || "[]");

    task.assignedTeamLead = mergeAssignments(
      task.assignedTeamLead,
      assignedTeamLead,
      "teamLeadId"
    );

    task.assignedManager = mergeAssignments(
      task.assignedManager,
      assignedManager,
      "managerId"
    );

    task.assignedEmployee = mergeAssignments(
      task.assignedEmployee,
      assignedEmployee,
      "employeeId"
    );

    /* ---------------- FILE DELETE ---------------- */
    const filesToDelete = JSON.parse(formData.get("filesToDelete") || "[]");

    if (filesToDelete.length) {
      task.fileAttachments = task.fileAttachments.filter(
        file => !filesToDelete.includes(file.publicId)
      );

      for (const key of filesToDelete) {
        await s3.send(new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key
        }));
      }
    }

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

      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 604800 }
      );

      task.fileAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        publicId: key,
        url: signedUrl,
      });
    }

    await task.save();

    /* ---------------- RESPONSE ---------------- */
    const populatedTask = await EmployeeTask.findById(task._id)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedEmployee.employeeId", "firstName lastName email")
      .populate("assignedManager.managerId", "firstName lastName email")
      .populate("assignedTeamLead.teamLeadId", "firstName lastName email");

    return NextResponse.json(populatedTask, { status: 200 });

  } catch (error) {
    console.error("PUT EmployeeTask Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
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
      .populate({
        path: "assignedTeamLead.teamLeadId",
        select: "firstName lastName email depId",
        populate: { path: "depId", select: "name" },
      })
      .populate({
        path: "assignedManager.managerId",
        select: "firstName lastName email departments",
        populate: { path: "departments", select: "name" },
      })
      .populate({
        path: "assignedEmployee.employeeId",
        select: "firstName lastName email depId",
        populate: { path: "depId", select: "name" },
      })
      .select("+fileAttachments");

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (task.submittedBy._id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("GET EmployeeTask Error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}
