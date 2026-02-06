// app/api/teamlead/received-tasks/[id]/route.js
import mongoose from "mongoose";
import SharedTask from "@/models/SharedTask";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { sendNotification } from "@/lib/sendNotification";
import {
  sharedTaskAssignEmployeeMailTemplate,
  sharedTaskAssignEmployeeNotification,
  sharedTaskAssignManagerMailTemplate,
  sharedTaskAssignManagerNotification
} from "@/helper/emails/teamlead/shared-employee";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import s3 from "@/lib/aws";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { sharedTo } = await request.json();
    const taskId = params.id;

    if (!sharedTo) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }

    const teamLeadId = new mongoose.Types.ObjectId(session.user.id);
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    // Find the task assigned to this Team Lead
    const existingTask = await SharedTask.findOne({
      _id: taskObjectId,
      sharedTeamlead: teamLeadId,
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Find employee
    const employee = await Employee.findById(sharedTo);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // Optional: check same department
    if (employee.depId.toString() !== session.user.depId) {
      return NextResponse.json(
        { success: false, message: "Employee not in your department" },
        { status: 403 }
      );
    }

    // Assign employee
    existingTask.sharedEmployee = new mongoose.Types.ObjectId(sharedTo);

    // Reset status if needed
    if (!["pending","signed","not_avaiable","not_intrested","re_shedule"].includes(existingTask.status)) {
      existingTask.status = "pending";
    }

    await existingTask.save();

    // Populate for response
    const populatedTask = await SharedTask.findById(taskObjectId)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email department")
      .populate("sharedEmployee", "firstName lastName email department")
      .populate({
        path: "formId",
        populate: {
          path: "employeeId",
          select: "firstName lastName email department",
        },
      });

    const taskLink = `${process.env.NEXTAUTH_URL}/employee/tasks/${populatedTask._id}`;
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const teamLeadName = `${session.user.firstName} ${session.user.lastName}`;
    const managerName = populatedTask.sharedManager
      ? `${populatedTask.sharedManager.firstName} ${populatedTask.sharedManager.lastName}`
      : "Manager";

    // Send notifications and emails in parallel
    const tasks = [
      // Employee notification & email
      sendMail(
        employee.email,
        "New Task Assigned by Team Lead",
        sharedTaskAssignEmployeeMailTemplate(
          employeeName,
          populatedTask.formId.title,
          teamLeadName,
          managerName,
          taskLink
        )
      ),
      sendNotification(
        sharedTaskAssignEmployeeNotification(
          employee._id,
          teamLeadId,
          teamLeadName,
          populatedTask.formId.title,
          taskLink,
          populatedTask._id
        )
      )
    ];

    // Shared Manager notification & email
    if (populatedTask.sharedManager?.email) {
      tasks.push(
        sendMail(
          populatedTask.sharedManager.email,
          "Team Lead Assigned Employee for Shared Task",
          sharedTaskAssignManagerMailTemplate(
            managerName,
            employeeName,
            populatedTask.formId.title,
            teamLeadName,
            taskLink
          )
        ),
        sendNotification(
          sharedTaskAssignManagerNotification(
            populatedTask.sharedManager._id,
            teamLeadId,
            teamLeadName,
            employeeName,
            populatedTask.formId.title,
            taskLink,
            populatedTask._id
          )
        )
      );
    }

    await Promise.all(tasks);

    return NextResponse.json(
      { success: true, message: "Employee assigned successfully", sharedTask: populatedTask },
      { status: 200 }
    );

  } catch (error) {
    console.error("PATCH /api/teamlead/received-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}



export async function PUT(request, context) {
  const { params } = await context;

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const formData = await request.formData();

    const status = formData.get("status");
    const VendorStatus = formData.get("VendorStatus");
    const MachineStatus = formData.get("MachineStatus");
    const employeeFeedback = formData.get("employeeFeedback");
    const notes = formData.get("notes");

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "signed",
      "not_available",
      "not_interested",
      "re_schedule",
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

    // Find task where manager is sharedManager OR sharedBy
    const task = await SharedTask.findOne({
      _id: id,
      $or: [
        { sharedManager: session.user.id },
        { sharedBy: session.user.id }
      ]
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    // ==================================================
    // AWS S3 – multi files upload
    // ==================================================
    let uploadedFiles = [...(task.fileAttachments || [])];
    const files = formData.getAll("files");

    for (const file of files) {
      if (!file || typeof file === "string" || file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = file.size;

      const fileKey = `shared_tasks/${Date.now()}_${fileName}`;

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
            uploadedByRole: "Manager",
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
        uploadedBy: session.user.id,
        uploadedByRole: "Manager",
        createdAt: new Date()
      });
    }

    // --------------------
    // Update task
    // --------------------
    task.status = status;
    
    if (VendorStatus) {
      task.VendorStatus = VendorStatus;
    }
    
    if (MachineStatus) {
      task.MachineStatus = MachineStatus;
    }
    
    if (employeeFeedback) {
      task.employeeFeedback = employeeFeedback;
      task.feedbackUpdatedAt = new Date();
    }
    
    if (notes) {
      task.notes = notes;
    }
    
    task.fileAttachments = uploadedFiles;
    task.updatedAt = new Date();
    task.attachmentUpdatedAt = new Date();

    await task.save();

    const updatedTask = await SharedTask.findById(id)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email depId")
      .populate("sharedEmployee", "firstName lastName email depId")
      .populate("sharedBy", "firstName lastName email")
      .populate({
        path: "formId",
        populate: {
          path: "employeeId",
          select: "firstName lastName email"
        }
      });

    // ============================
    // Send notifications & emails
    // ============================
    const notifications = [];

    // Get all involved parties
    const managerName = updatedTask.sharedBy 
      ? `${updatedTask.sharedBy.firstName} ${updatedTask.sharedBy.lastName}`
      : "Manager";

    const employeeName = updatedTask.sharedEmployee
      ? `${updatedTask.sharedEmployee.firstName} ${updatedTask.sharedEmployee.lastName}`
      : "Employee";

    const formEmployeeName = updatedTask.formId?.employeeId
      ? `${updatedTask.formId.employeeId.firstName} ${updatedTask.formId.employeeId.lastName}`
      : "Employee";

    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/subatasks/${updatedTask._id}`;

    // 1. Notify TeamLead (if assigned)
    if (updatedTask.sharedTeamlead) {
      const teamLeadTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/recived-tasks/${updatedTask._id}`;
      const teamLeadName = `${updatedTask.sharedTeamlead.firstName} ${updatedTask.sharedTeamlead.lastName}`;

      // Email to TeamLead
      notifications.push(
        sendMail(
          updatedTask.sharedTeamlead.email,
          "Task Updated by Manager",
          managerUpdatedTaskMailTemplate(
            teamLeadName,
            managerName,
            formEmployeeName,
            updatedTask.taskTitle,
            status,
            teamLeadTaskLink
          )
        )
      );

      // Notification to TeamLead
      notifications.push(
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: managerName,
          receiverId: updatedTask.sharedTeamlead._id,
          receiverModel: "Employee",
          type: "task_updated_by_manager",
          title: "Task Updated by Manager",
          message: `Manager ${managerName} updated the task "${updatedTask.taskTitle}" for ${formEmployeeName}.`,
          link: teamLeadTaskLink,
          referenceId: updatedTask._id,
          referenceModel: "SharedTask",
        })
      );
    }

    // 2. Notify Employee (if sharedEmployee exists)
    if (updatedTask.sharedEmployee) {
      const employeeTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/employee/tasks/${updatedTask._id}`;

      // Email to Employee
      notifications.push(
        sendMail(
          updatedTask.sharedEmployee.email,
          "Your Task Updated by Manager",
          managerUpdatedTaskMailTemplate(
            employeeName,
            managerName,
            formEmployeeName,
            updatedTask.taskTitle,
            status,
            employeeTaskLink
          )
        )
      );

      // Notification to Employee
      notifications.push(
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: managerName,
          receiverId: updatedTask.sharedEmployee._id,
          receiverModel: "Employee",
          type: "task_updated_by_manager",
          title: "Task Updated by Manager",
          message: `Manager ${managerName} updated your task "${updatedTask.taskTitle}".`,
          link: employeeTaskLink,
          referenceId: updatedTask._id,
          referenceModel: "SharedTask",
        })
      );
    }

    // 3. Notify Original Form Employee (if different from sharedEmployee)
    if (updatedTask.formId?.employeeId && 
        updatedTask.formId.employeeId._id.toString() !== updatedTask.sharedEmployee?._id?.toString()) {
      
      const formEmployeeTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/employee/dashboard`;

      // Email to Form Employee
      notifications.push(
        sendMail(
          updatedTask.formId.employeeId.email,
          "Task Related to You Updated",
          managerUpdatedTaskMailTemplate(
            formEmployeeName,
            managerName,
            formEmployeeName,
            updatedTask.taskTitle,
            status,
            formEmployeeTaskLink
          )
        )
      );
    }

    // Send all notifications
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
    console.error("Error updating task:", error);
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



export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
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
      sharedManager: session.user.id,
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
