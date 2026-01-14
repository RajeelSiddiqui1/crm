import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { managerTaskStatusUpdateMailTemplate } from "@/helper/emails/manager/taskStatusUpdate";
import Admin from "@/models/Admin";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const formData = await req.formData();
    
    const status = formData.get("status");
    const feedback = formData.get("feedback") || "";
    const managerId = session.user.id;

    // Validate status
    const validStatuses = ["pending", "in-progress", "rejected", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Valid status is required" },
        { status: 400 }
      );
    }

    // Find task
    const task = await AdminTask.findById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Check if manager is assigned to this task
    if (!task.managers.includes(managerId)) {
      return NextResponse.json(
        { success: false, message: "You are not assigned to this task" },
        { status: 403 }
      );
    }

    // Handle file uploads
    const submittedFiles = formData.getAll("submittedFiles[]");
    const uploadedFiles = [];

    for (const file of submittedFiles) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;
        const fileKey = `manager_task_submissions/${id}/${managerId}/${Date.now()}_${fileName}`;

        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: fileType,
            Metadata: {
              originalName: encodeURIComponent(fileName),
              uploadedBy: managerId,
              uploadedAt: Date.now().toString(),
            },
          },
        });
        await upload.done();

        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        });
        const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });

        uploadedFiles.push({
          url: fileUrl,
          name: fileName,
          type: fileType,
          size: fileSize,
          publicId: fileKey,
        });
      }
    }

    // Find or create manager response
    let managerResponseIndex = task.managerResponses.findIndex(
      response => response.managerId.toString() === managerId
    );

    if (managerResponseIndex === -1) {
      // Create new response
      task.managerResponses.push({
        managerId,
        status,
        feedback,
        submittedFiles: uploadedFiles,
        submittedAt: new Date(),
      });
      managerResponseIndex = task.managerResponses.length - 1;
    } else {
      // Update existing response
      task.managerResponses[managerResponseIndex].status = status;
      task.managerResponses[managerResponseIndex].feedback = feedback;
      task.managerResponses[managerResponseIndex].updatedAt = new Date();
      
      // Add new files to existing ones
      if (uploadedFiles.length > 0) {
        task.managerResponses[managerResponseIndex].submittedFiles.push(...uploadedFiles);
      }
      
      if (status === "completed" || status === "rejected") {
        task.managerResponses[managerResponseIndex].submittedAt = new Date();
      }
    }

    // Update overall task status based on all manager responses
    const allResponses = task.managerResponses;
    const allCompleted = allResponses.length === task.managers.length && 
                         allResponses.every(r => r.status === "completed");
    const anyInProgress = allResponses.some(r => r.status === "in-progress");
    const anyRejected = allResponses.some(r => r.status === "rejected");

    if (allCompleted) {
      task.status = "completed";
      task.completedAt = new Date();
    } else if (anyRejected) {
      task.status = "pending"; // Reset to pending if rejected
    } else if (anyInProgress) {
      task.status = "in-progress";
    }

    await task.save();

    // Send notification to admin
    const manager = await Manager.findById(managerId);
    const adminTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/admin/admin-tasks`;
    const managerTaskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;

    // Send notification to admin
    await sendNotification({
      senderId: managerId,
      senderModel: "Manager",
      senderName: `${manager.firstName} ${manager.lastName}`,
      receiverId: task.submittedBy,
      receiverModel: "Admin",
      type: "manager_task_update",
      title: "Task Status Updated",
      message: `Manager ${manager.firstName} ${manager.lastName} updated task "${task.title}" to ${status}`,
      link: adminTaskLink,
      referenceId: task._id,
      referenceModel: "AdminTask",
    });

    // Send email to admin
    const admin = await Admin.findById(task.submittedBy);
    if (admin) {
      const emailHtml = managerTaskStatusUpdateMailTemplate(
        admin.name,
        task.title,
        `${manager.firstName} ${manager.lastName}`,
        status,
        feedback,
        adminTaskLink
      );
      await sendMail(admin.email, "Task Status Updated by Manager", emailHtml);
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      task,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { success: false, message: "Update failed", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const managerId = session.user.id;

    const task = await AdminTask.findById(id)
      .populate({
        path: "managers",
        select: "firstName lastName email profilePicture departments",
      })
      .populate({
        path: "managerResponses.managerId",
        select: "firstName lastName email profilePicture",
      })
      .populate({
        path: "submittedBy",
        select: "name email",
      });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Check if manager is assigned
    if (!task.managers.some(m => m._id.toString() === managerId)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Find manager's response
    const managerResponse = task.managerResponses.find(
      response => response.managerId._id.toString() === managerId
    );

    return NextResponse.json({
      success: true,
      task,
      managerResponse,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { success: false, message: "Fetch failed", error: error.message },
      { status: 500 }
    );
  }
}