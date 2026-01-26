import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

/* =========================
   GET: Single Task (Manager)
========================= */
export async function GET(request, context) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = context;
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const updatedTask = await EmployeeTask.findById(id)
      .populate("submittedBy", "firstName lastName email avatar role")
      .populate({
        path: "assignedEmployee.employeeId",
        select: "firstName lastName email avatar",
      })
      .populate({
        path: "assignedManager.managerId",
        select: "firstName lastName email avatar",
      })
      .lean();

    const managerAssignment = updatedTask.assignedManager.find(
      (mgr) => mgr.managerId?._id?.toString() === session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        task: {
          ...updatedTask,
          managerStatus: managerAssignment.status,
          managerFeedbacks: managerAssignment.feedbacks, // ✅ ARRAY
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET Manager Task Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT: Update Task (Manager)
========================= */
export async function PUT(request, context) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = context;
    const { id } = await params;

    const { status, feedback, sendNotification } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const validStatuses = [
      "pending",
      "in_progress",
      "completed",
      "approved",
      "rejected",
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const task = await EmployeeTask.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const managerIndex = task.assignedManager.findIndex(
      (mgr) => mgr.managerId?.toString() === session.user.id
    );

    if (managerIndex === -1) {
      return NextResponse.json(
        { error: "You are not assigned to this task" },
        { status: 403 }
      );
    }

    const manager = task.assignedManager[managerIndex];
    const oldStatus = manager.status;

    /* ===== STATUS UPDATE ===== */
    if (status) {
      manager.status = status;

      if (["completed", "approved"].includes(status)) {
        manager.completedAt = new Date();
      }
    }

    /* ===== ADD FEEDBACK (ARRAY PUSH) ===== */
    if (feedback && feedback.trim()) {
      manager.feedbacks.push({
        feedback,
        sentAt: new Date(),
      });
    }

    await task.save();


    /* ===== Notification (FIXED) ===== */
    if (sendNotification && task.submittedBy) {
      await Notification.create({
        title: "Task Status Updated",
        message: `${session.user.name} (Manager) updated task "${task.title}" from ${oldStatus} to ${status}`,
        type: "task_update",

        sender: {
          id: session.user.id,
          model: "Manager",
          name: session.user.name,
        },

        receiver: {
          id: task.submittedBy,
          model: "Employee",
        },

        link: `/my-tasks/${task._id}`,
        relatedId: task._id,
        read: false,
      });
    }

    const updatedTask = await EmployeeTask.findById(id)
      .populate("submittedBy", "firstName lastName email avatar role")
      .populate({
        path: "assignedEmployee.employeeId",
        select: "firstName lastName email avatar",
      })
      .populate({
        path: "assignedManager.managerId",
        select: "firstName lastName email avatar",
      })
      .populate({
        path: "assignedTeamLead.teamLeadId",
        select: "firstName lastName email avatar",
      })
      .lean();

    const managerAssignment = updatedTask.assignedManager.find(
      (mgr) => mgr.managerId?._id?.toString() === session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        task: {
          ...updatedTask,
          managerStatus: managerAssignment.status,
          managerFeedback: managerAssignment.feedback,
          assignedAt: managerAssignment.assignedAt,
          completedAt: managerAssignment.completedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT Manager Task Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 }
    );
  }
}
