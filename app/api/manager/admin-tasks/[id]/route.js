import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { taskClaimedMailTemplate } from "@/helper/emails/manager/sharedAdminTask";
import { sendNotification } from "@/lib/sendNotification";
import mongoose from "mongoose";

// PUT method - Update task with new managers
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const taskId = params.id;
    
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid task ID format" 
      }, { status: 400 });
    }

    // Parse request body
    const { managerIds } = await req.json();
    
    console.log("PUT Request received:", {
      taskId,
      managerIds,
      sessionUser: session.user.id
    });

    if (!Array.isArray(managerIds)) {
      return NextResponse.json({ 
        success: false, 
        error: "managerIds must be an array" 
      }, { status: 400 });
    }

    if (managerIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Please select at least one manager" 
      }, { status: 400 });
    }

    // Find the task with populated managers
    const task = await AdminTask.findById(taskId)
      .populate({
        path: 'managers',
        select: '_id firstName lastName email',
        model: 'Manager'
      });

    if (!task) {
      return NextResponse.json({ 
        success: false, 
        error: "Task not found" 
      }, { status: 404 });
    }

    // Check if current manager is assigned to this task
    const isCurrentManagerAssigned = task.managers.some(
      manager => manager._id.toString() === session.user.id
    );
    
    if (!isCurrentManagerAssigned) {
      return NextResponse.json({ 
        success: false, 
        error: "You are not authorized to share this task" 
      }, { status: 403 });
    }

    // Find selected managers
    const selectedManagers = await Manager.find({
      _id: { $in: managerIds }
    }).select("_id firstName lastName email");

    if (selectedManagers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No valid managers found" 
      }, { status: 404 });
    }

    // Filter out already assigned managers and current user
    const currentManagerIds = task.managers.map(m => m._id.toString());
    const newManagerIds = managerIds.filter(
      id => !currentManagerIds.includes(id) && id !== session.user.id
    );

    // If all selected managers are already assigned
    if (newManagerIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "All selected managers are already assigned to this task" 
      }, { status: 400 });
    }

    // Find new managers from the filtered IDs
    const newManagers = selectedManagers.filter(
      manager => newManagerIds.includes(manager._id.toString())
    );

    // Update task with new managers
    const updatedManagers = [
      ...task.managers.map(m => m._id),
      ...newManagers.map(m => m._id)
    ];

    // Set sharedBYManager if not already set
    if (!task.sharedBYManager) {
      task.sharedBYManager = session.user.id;
    }

    task.managers = updatedManagers;
    await task.save();

    // Populate the updated task for response
    const updatedTask = await AdminTask.findById(taskId)
      .populate({
        path: 'managers',
        select: '_id firstName lastName email',
        model: 'Manager'
      })
      .populate({
        path: 'sharedBYManager',
        select: '_id firstName lastName email',
        model: 'Manager'
      })
      .lean();

    // Prepare response data
    const assignedByName = `${session.user.firstName} ${session.user.lastName}`.trim() || session.user.email;
    
    const responseData = {
      taskId: updatedTask._id.toString(),
      title: updatedTask.title,
      assignedManagers: updatedTask.managers.map(manager => ({
        id: manager._id.toString(),
        name: `${manager.firstName} ${manager.lastName}`.trim() || manager.email,
        email: manager.email,
        initials: `${manager.firstName?.charAt(0) || ''}${manager.lastName?.charAt(0) || ''}` || 'M'
      })),
      newManagers: newManagers.map(manager => ({
        id: manager._id.toString(),
        name: `${manager.firstName} ${manager.lastName}`.trim() || manager.email,
        email: manager.email
      })),
      sharedBy: {
        id: session.user.id,
        name: assignedByName,
        email: session.user.email
      },
      updatedAt: updatedTask.updatedAt
    };

    // Send notifications & emails to newly added managers
    const notificationPromises = newManagers.map(async (manager) => {
      try {
        // Send in-app notification
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: assignedByName,
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "task_shared",
          title: "New Task Assigned",
          message: `Task "${task.title}" has been shared with you by ${assignedByName}`,
          link: `/manager/admin-tasks`,
          referenceId: task._id,
          referenceModel: "AdminTask"
        });
      } catch (notifError) {
        console.error("Notification error for", manager.email, ":", notifError);
      }

      try {
        // Send email
        const emailHtml = taskClaimedMailTemplate(
          `${manager.firstName} ${manager.lastName}`.trim() || manager.email,
          task.title,
          [{ name: assignedByName, email: session.user.email }],
          { name: assignedByName, email: session.user.email }
        );

        await sendMail(
          manager.email,
          `New Task Assigned: ${task.title}`,
          emailHtml
        );
      } catch (emailError) {
        console.error("Email error for", manager.email, ":", emailError);
      }
    });

    // Run notifications in parallel but don't block response
    Promise.all(notificationPromises).catch(err => {
      console.error("Some notifications failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: `Task shared successfully with ${newManagers.length} new manager${newManagers.length !== 1 ? 's' : ''}`,
      data: responseData
    }, { status: 200 });

  } catch (error) {
    console.error("Error in PUT /api/manager/manager-tasks/[id]:", error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid ID format" 
      }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed",
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal server error"
    }, { status: 500 });
  }
}

// GET method - Get task details
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid task ID" 
      }, { status: 400 });
    }

    const task = await AdminTask.findById(id)
      .populate({
        path: 'managers',
        select: '_id firstName lastName email',
        model: 'Manager'
      })
      .populate({
        path: 'sharedBYManager',
        select: '_id firstName lastName email',
        model: 'Manager'
      })
      .lean();

    if (!task) {
      return NextResponse.json({ 
        success: false,
        message: "Task not found" 
      }, { status: 404 });
    }

    // Convert MongoDB document to plain object
    const taskData = {
      ...task,
      _id: task._id.toString(),
      managers: task.managers.map(manager => ({
        ...manager,
        _id: manager._id.toString()
      })),
      sharedBYManager: task.sharedBYManager ? {
        ...task.sharedBYManager,
        _id: task.sharedBYManager._id.toString()
      } : null
    };

    return NextResponse.json({ 
      success: true,
      task: taskData 
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE method - Remove manager from task (optional)
export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const taskId = params.id;
    const { managerId } = await req.json();

    if (!managerId) {
      return NextResponse.json({ 
        success: false, 
        error: "Manager ID is required" 
      }, { status: 400 });
    }

    const task = await AdminTask.findById(taskId);
    if (!task) {
      return NextResponse.json({ 
        success: false, 
        error: "Task not found" 
      }, { status: 404 });
    }

    // Remove manager from task
    task.managers = task.managers.filter(
      mId => mId.toString() !== managerId
    );
    
    await task.save();

    return NextResponse.json({
      success: true,
      message: "Manager removed from task successfully"
    });

  } catch (error) {
    console.error("Error removing manager from task:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}