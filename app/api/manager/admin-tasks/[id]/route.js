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

// ------------------ PUT / Share task ------------------
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const taskId = params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId))
      return NextResponse.json({ success: false, error: "Invalid task ID" }, { status: 400 });

    const { managerIds } = await req.json();
    if (!Array.isArray(managerIds) || managerIds.length === 0)
      return NextResponse.json({ success: false, error: "Please select at least one manager" }, { status: 400 });

    const task = await AdminTask.findById(taskId).populate("managers", "_id firstName lastName email");
    if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

    const isCurrentManagerAssigned = task.managers.some(m => m._id.toString() === session.user.id);
    if (!isCurrentManagerAssigned) return NextResponse.json({ success: false, error: "Not authorized to share this task" }, { status: 403 });

    const selectedManagers = await Manager.find({ _id: { $in: managerIds } }).select("_id firstName lastName email");
    const currentManagerIds = task.managers.map(m => m._id.toString());
    const newManagers = selectedManagers.filter(m => !currentManagerIds.includes(m._id.toString()) && m._id.toString() !== session.user.id);

    if (newManagers.length === 0)
      return NextResponse.json({ success: false, error: "All selected managers are already assigned" }, { status: 400 });

    if (!task.sharedBYManager) task.sharedBYManager = session.user.id;
    task.managers = [...task.managers.map(m => m._id), ...newManagers.map(m => m._id)];
    await task.save();

    const updatedTask = await AdminTask.findById(taskId)
      .populate("managers", "_id firstName lastName email")
      .populate("sharedBYManager", "_id firstName lastName email")
      .lean();

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

    // Send emails & notifications asynchronously
    const notificationPromises = newManagers.map(async manager => {
      try {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: assignedByName,
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "task_shared",
          title: "New Task Assigned",
          message: `Task "${task.title}" shared with you by ${assignedByName}`,
          link: `/manager/admin-tasks`,
          referenceId: task._id,
          referenceModel: "AdminTask"
        });

        await sendMail(manager.email, `New Task Assigned: ${task.title}`,
          taskClaimedMailTemplate(`${manager.firstName} ${manager.lastName}`, task.title, [{ name: assignedByName, email: session.user.email }], { name: assignedByName, email: session.user.email })
        );
      } catch (err) {
        console.error(`Error sending mail/notification to ${manager.email}:`, err);
      }
    });
    Promise.all(notificationPromises).catch(err => console.error("Notification promise error:", err));

    return NextResponse.json({
      success: true,
      message: `Task shared successfully with ${newManagers.length} new manager${newManagers.length !== 1 ? 's' : ''}`,
      data: responseData
    });

  } catch (error) {
    console.error("PUT /manager-tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}



// ------------------ DELETE / Remove manager ------------------
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const taskId = params.id;
    const { managerId } = await req.json();
    if (!managerId) return NextResponse.json({ success: false, error: "Manager ID required" }, { status: 400 });

    const task = await AdminTask.findById(taskId);
    if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

    task.managers = task.managers.filter(m => m.toString() !== managerId);
    await task.save();

    return NextResponse.json({ success: true, message: "Manager removed successfully" });
  } catch (error) {
    console.error("DELETE /manager-tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



// app/api/manager/admin-tasks/[id]/route.js (GET route میں update)

export async function GET(req, { params }) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = session.user.id;
    const userRole = session.user.role;

    const task = await AdminTask.findById(id)
      .populate({
        path: "managers",
        select: "firstName lastName email profilePicture departments phone",
        populate: {
          path: "departments",
          select: "name",
        }
      })
      .populate({
        path: "managerResponses.managerId",
        select: "firstName lastName email profilePicture departments",
        populate: {
          path: "departments",
          select: "name",
        }
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

    // Role-based access control
    if (userRole === "Manager") {
      // Check if manager is assigned
      if (!task.managers.some(m => m._id.toString() === userId)) {
        return NextResponse.json(
          { success: false, message: "Access denied" },
          { status: 403 }
        );
      }
    } else if (userRole !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find manager's response (if manager)
    let managerResponse = null;
    if (userRole === "Manager") {
      managerResponse = task.managerResponses.find(
        response => response.managerId._id.toString() === userId
      );
    }

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