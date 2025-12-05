import SharedTask from "@/models/SharedTask";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendMail } from "@/lib/mail";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import { sendNotification } from "@/lib/sendNotification";
import {
  employeeTaskUpdateMailTemplate,
  employeeTaskUpdateNotification
} from "@/helper/emails/employee/received-task";

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
    const attachment = formData.get("attachment");

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
    }

    const validStatuses = [
      "pending", "signed", "not_avaiable", "not_intrested",
      "re_shedule", "completed", "in_progress", "cancelled"
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const task = await SharedTask.findOne({ _id: id, sharedEmployee: session.user.id });
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    // Handle attachment upload
    let attachmentUrl = task.attachmentUrl || null;
    let publicId = task.attachmentPublicId || null;

    if (attachment && attachment.size > 0) {
      const allowedTypes = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","image/svg+xml"];
      if (!allowedTypes.includes(attachment.type)) {
        return NextResponse.json({ success: false, message: "Only images allowed" }, { status: 400 });
      }
      if (attachment.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Max 5MB" }, { status: 400 });
      }

      const bytes = await attachment.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64String = `data:${attachment.type};base64,${buffer.toString("base64")}`;

      if (publicId) {
        try { await cloudinary.uploader.destroy(publicId); } catch(e) { console.error(e); }
      }

      const uploadResult = await cloudinary.uploader.upload(base64String, {
        folder: `shared_tasks/${task._id}/attachments`,
        resource_type: "auto",
        overwrite: true,
      });

      attachmentUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    // Update task
    task.status = status;
    if (feedback) { task.employeeFeedback = feedback; task.feedbackUpdatedAt = new Date(); }
    if (attachmentUrl) { task.attachmentUrl = attachmentUrl; task.attachmentPublicId = publicId; task.attachmentUpdatedAt = new Date(); }
    task.updatedAt = new Date();
    await task.save();

    const updatedTask = await SharedTask.findById(id)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email depId")
      .populate("sharedEmployee", "firstName lastName email depId")
      .populate("sharedBy", "firstName lastName email")
      .populate("formId");

    // Parallel notifications and emails to TeamLead, Manager, and Employee
    const taskLink = `${process.env.NEXTAUTH_URL}/employee/tasks/${updatedTask._id}`;
    const employeeName = `${updatedTask.sharedEmployee.firstName} ${updatedTask.sharedEmployee.lastName}`;
    const teamLeadName = updatedTask.sharedTeamlead ? `${updatedTask.sharedTeamlead.firstName} ${updatedTask.sharedTeamlead.lastName}` : "Team Lead";
    const managerName = updatedTask.sharedBy ? `${updatedTask.sharedBy.firstName} ${updatedTask.sharedBy.lastName}` : "Manager";

    const notifications = [];

    // Shared TeamLead
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

    // Shared Employee (self)
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

    // Shared By (Manager)
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

    return NextResponse.json({ success: true, message: "Task updated successfully", task: updatedTask }, { status: 200 });

  } catch (error) {
    console.error("Error updating employee task:", error);
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
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


export async function DELETE(request, { params }) {
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
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Delete attachment from Cloudinary if exists
    if (task.attachmentPublicId) {
      try {
        await cloudinary.uploader.destroy(task.attachmentPublicId);
      } catch (error) {
        console.error("Error deleting attachment from Cloudinary:", error);
        // Continue even if Cloudinary delete fails
      }
    }

    // Remove attachment from task
    task.attachmentUrl = null;
    task.attachmentPublicId = null;
    task.attachmentUpdatedAt = new Date();
    await task.save();

    return NextResponse.json(
      {
        success: true,
        message: "Attachment removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting attachment:", error);
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