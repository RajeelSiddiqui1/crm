import SharedTask from "@/models/SharedTask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import s3 from "@/lib/aws";
import { sendMail } from "@/lib/mail";
import { sharedTaskAssignTeamLeadMailTemplate } from "@/helper/emails/manager/sharedtask-teamlead";
import { managerUpdatedTaskMailTemplate } from "@/helper/emails/manager/manager-task-update";
import { Upload } from "@aws-sdk/lib-storage";

// PATCH - Assign teamlead
export async function PATCH(request, context) {
  const { params } = await context;

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const { sharedTo } = await request.json();

    if (!sharedTo) {
      return NextResponse.json(
        { success: false, message: "Teamlead ID is required" },
        { status: 400 }
      );
    }

    const existingTask = await SharedTask.findOne({
      _id: id,
      sharedManager: session.user.id,
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Assign Team Lead
    existingTask.sharedTeamlead = sharedTo;
    existingTask.status = "pending";
    await existingTask.save();

    // Populate for notifications and email
    const populatedTask = await SharedTask.findById(existingTask._id)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email department depId")
      .populate("sharedBy", "firstName lastName email")
      .populate({
        path: "formId",
        populate: {
          path: "employeeId",
          select: "firstName lastName email department",
        },
      })
      .lean();

    // Send notification + email to Team Lead
    const teamLead = populatedTask.sharedTeamlead;
    const employee = populatedTask.formId.employeeId;
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/shared-tasks/${populatedTask._id}`;
    const tasks = [];

    if (teamLead?.email) {
      // Notification
      tasks.push(
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: `${session.user.firstName} ${session.user.lastName}` || "Manager",
          receiverId: teamLead._id,
          receiverModel: "Employee",
          type: "shared_task_assigned",
          title: "New Task Assigned",
          message: `Manager assigned you a new shared task for employee ${employee.firstName} ${employee.lastName}.`,
          link: taskLink,
          referenceId: populatedTask._id,
          referenceModel: "SharedTask",
        })
      );

      // Email
      tasks.push(
        sendMail(
          teamLead.email,
          "New Task Assigned by Manager",
          sharedTaskAssignTeamLeadMailTemplate(
            `${teamLead.firstName} ${teamLead.lastName}`,
            `${employee.firstName} ${employee.lastName}`,
            populatedTask.taskTitle,
            `${session.user.firstName} ${session.user.lastName}` || "Manager",
            taskLink
          )
        )
      );
    }

    await Promise.all(tasks);

    return NextResponse.json(
      {
        success: true,
        message: "Teamlead assigned and notifications sent successfully",
        sharedTask: populatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/manager/received-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get task details
export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { params } = context;
    const { id } = params;

    const task = await SharedTask.findOne({
      _id: id,
      sharedManager: session.user.id,
    })
      .populate({
        path: "formId",
        select: "+fileAttachments",
        populate: {
          path: "employeeId",
          select: "firstName lastName email department phoneNumber address",
        },
      })
      .populate("sharedManager", "firstName lastName email department")
      .populate("sharedTeamlead", "firstName lastName email department depId")
      .populate("sharedEmployee", "firstName lastName email")
      .populate("sharedBy", "firstName lastName email")
      .select("+fileAttachments")
      .lean();

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task }, { status: 200 });
  } catch (error) {
    console.error("GET /api/manager/received-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update task status and files (Manager can update)
export async function PUT(request, context) {
  const { params } = await context;

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
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

      const fileKey = `shared_tasks/${task._id}/manager_uploads/${Date.now()}_${fileName}`;

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
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Await the params object first
    const { params } = await context;
    const { id } = params;

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

    // Delete files from AWS S3 if they exist
    if (task.fileAttachments && task.fileAttachments.length > 0) {
      try {
        for (const file of task.fileAttachments) {
          if (file.publicId) {
            await s3.deleteObject({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.publicId,
            });
          }
        }
      } catch (error) {
        console.error("Error deleting files from S3:", error);
        // Continue even if S3 delete fails
      }
    }

    // Remove files from task
    task.fileAttachments = [];
    task.updatedAt = new Date();
    await task.save();

    return NextResponse.json(
      {
        success: true,
        message: "Files removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting files:", error);
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