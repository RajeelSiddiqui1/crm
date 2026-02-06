import SharedTask from "@/models/SharedTask";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";

import { Upload } from "@aws-sdk/lib-storage";
import s3 from "@/lib/aws";

import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import { sendNotification } from "@/lib/sendNotification";
import {
  employeeTaskUpdateMailTemplate,
  employeeTaskUpdateNotification
} from "@/helper/emails/employee/received-task";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const formData = await request.formData();

    const status = formData.get("status");
    const feedback = formData.get("feedback");

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "signed",
      "not_avaiable",
      "not_intrested",
      "re_shedule",
      "completed",
      "in_progress",
      "cancelled"
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const task = await SharedTask.findOne({
      _id: id,
      sharedEmployee: session.user.id
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // ==================================================
    // AWS S3 – multi files (append style like AWS flow)
    // ==================================================

    let uploadedFiles = [...(task.fileAttachments || [])];

    const files = formData.getAll("files");

    for (const file of files) {
      if (!file || typeof file === "string" || file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());

      const fileName = file.name;
      const fileType = file.type;
      const fileSize = file.size;

      const fileKey = `shared_tasks/${task._id}/files/${Date.now()}_${fileName}`;

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: fileType,
          Metadata: {
            originalName: encodeURIComponent(fileName),
            uploadedBy: session.user.id,
            uploadedAt: Date.now().toString()
          }
        }
      });

      await upload.done();

            const fileUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${fileKey}`;

      uploadedFiles.push({
        url: fileUrl,
        name: fileName,
        type: fileType,
        size: fileSize,
        publicId: fileKey,
        createdAt: new Date()
      });
    }

    // --------------------
    // update task
    // --------------------
    task.status = status;

    if (feedback) {
      task.employeeFeedback = feedback;
      task.feedbackUpdatedAt = new Date();
    }

    task.fileAttachments = uploadedFiles;
    task.updatedAt = new Date();

    await task.save();

    const updatedTask = await SharedTask.findById(id)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email depId")
      .populate("sharedEmployee", "firstName lastName email depId")
      .populate("sharedBy", "firstName lastName email")
      .populate("formId");

    // ============================
    // notifications & emails
    // ============================

    const taskLink = `${process.env.NEXTAUTH_URL}/employee/tasks/${updatedTask._id}`;

    const employeeName =
      `${updatedTask.sharedEmployee.firstName} ${updatedTask.sharedEmployee.lastName}`;

    const teamLeadName = updatedTask.sharedTeamlead
      ? `${updatedTask.sharedTeamlead.firstName} ${updatedTask.sharedTeamlead.lastName}`
      : "Team Lead";

    const managerName = updatedTask.sharedBy
      ? `${updatedTask.sharedBy.firstName} ${updatedTask.sharedBy.lastName}`
      : "Manager";

    const notifications = [];

    // TeamLead
    if (updatedTask.sharedTeamlead?.email) {
      notifications.push(
        sendMail(
          updatedTask.sharedTeamlead.email,
          "Employee Updated Task",
          employeeTaskUpdateMailTemplate(
            teamLeadName,
            employeeName,
            updatedTask.formId.title,
            status,
            taskLink
          )
        ),
        sendNotification(
          employeeTaskUpdateNotification(
            updatedTask.sharedTeamlead._id,
            "TeamLead",
            employeeName,
            updatedTask.formId.title,
            status,
            taskLink,
            updatedTask._id
          )
        )
      );
    }

    // Employee (self)
    notifications.push(
      sendMail(
        updatedTask.sharedEmployee.email,
        "Task Updated Successfully",
        employeeTaskUpdateMailTemplate(
          employeeName,
          employeeName,
          updatedTask.formId.title,
          status,
          taskLink
        )
      ),
      sendNotification(
        employeeTaskUpdateNotification(
          updatedTask.sharedEmployee._id,
          "Employee",
          employeeName,
          updatedTask.formId.title,
          status,
          taskLink,
          updatedTask._id
        )
      )
    );

    // Manager
    if (updatedTask.sharedBy?.email) {
      notifications.push(
        sendMail(
          updatedTask.sharedBy.email,
          "Employee Updated Task Status",
          employeeTaskUpdateMailTemplate(
            managerName,
            employeeName,
            updatedTask.formId.title,
            status,
            taskLink
          )
        ),
        sendNotification(
          employeeTaskUpdateNotification(
            updatedTask.sharedBy._id,
            "Manager",
            employeeName,
            updatedTask.formId.title,
            status,
            taskLink,
            updatedTask._id
          )
        )
      );
    }

    await Promise.all(notifications);

    return NextResponse.json(
      {
        success: true,
        message: "Task updated successfully",
        task: updatedTask
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating employee task:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;

    const task = await SharedTask.findOne({
      _id: id,
      sharedEmployee: session.user.id,
    })
      .populate("sharedManager", "firstName lastName email depId")
      .populate("sharedTeamlead", "firstName lastName email department depId")
      .populate("sharedEmployee", "firstName lastName email department depId")
      .populate("formId");

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task }, { status: 200 });
  } catch (error) {
    console.error("Error fetching employee task:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}




export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { params } = context;
    const { id } = params;

    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey"); // <-- publicId

    if (!fileKey) {
      return NextResponse.json(
        { success: false, message: "fileKey is required" },
        { status: 400 }
      );
    }

    const task = await SharedTask.findOne({
      _id: id,
      sharedEmployee: session.user.id,
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    const fileExists = task.fileAttachments.find(
      (f) => f.publicId === fileKey
    );

    if (!fileExists) {
      return NextResponse.json(
        { success: false, message: "File not found in task" },
        { status: 404 }
      );
    }

    // ✅ delete from S3 (correct v3 way)
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      })
    );

    // ✅ delete only that file from DB array
    task.fileAttachments = task.fileAttachments.filter(
      (f) => f.publicId !== fileKey
    );

    task.updatedAt = new Date();
    await task.save();

    return NextResponse.json(
      {
        success: true,
        message: "File deleted successfully",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
