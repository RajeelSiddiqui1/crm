import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

/* =========================
   GET: Single Task (Employee)
========================= */
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await EmployeeTask.findById(id)
      .populate("submittedBy", "firstName lastName email avatar role")
      .populate({ path: "assignedEmployee.employeeId", select: "firstName lastName email avatar" })
      .populate({ path: "assignedManager.managerId", select: "firstName lastName email avatar" })
      .populate({ path: "assignedTeamLead.teamLeadId", select: "firstName lastName email avatar" })
      .lean();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const employeeAssignment = task.assignedEmployee?.find(
      emp => emp.employeeId?._id?.toString() === session.user.id
    );

    if (!employeeAssignment) {
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        employeeStatus: employeeAssignment.status,
        employeeFeedbacks: employeeAssignment.feedbacks || [], // ✅ Array now
        assignedAt: employeeAssignment.assignedAt,
        completedAt: employeeAssignment.completedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error("GET Employee Task Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 });
  }
}

/* =========================
   PUT: Update Task (Employee)
========================= */
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status, feedback, sendNotification } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const task = await EmployeeTask.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const employeeIndex = task.assignedEmployee.findIndex(
      emp => emp.employeeId?.toString() === session.user.id
    );
    if (employeeIndex === -1) return NextResponse.json({ error: "Not assigned" }, { status: 403 });

    const employee = task.assignedEmployee[employeeIndex];
    const oldStatus = employee.status;

    // ===== STATUS UPDATE =====
    if (status) {
      employee.status = status;
      if (["completed", "approved"].includes(status)) {
        employee.completedAt = new Date();
      }
    }

    // ===== ADD FEEDBACK (ARRAY PUSH) =====
    if (feedback && feedback.trim()) {
      employee.feedbacks.push({
        feedback,
        sentAt: new Date()
      });
    }

    await task.save();

    // ===== SEND NOTIFICATION =====
    if (sendNotification && task.submittedBy) {
      await Notification.create({
        sender: {
          id: session.user.id,
          model: "Employee",
          name: session.user.name
        },
        receiver: {
          id: task.submittedBy._id,
          model: "Employee" // adjust if creator might be TeamLead/Manager
        },
        title: "Task Status Updated",
        message: `${session.user.name} updated task "${task.title}" from ${oldStatus} to ${status}`,
        type: "task_update",
        relatedId: task._id,
        link: `/employee/my-tasks/${task._id}`,
        read: false
      });
    }

    // ===== Return updated task =====
    const updatedTask = await EmployeeTask.findById(id)
      .populate("submittedBy", "firstName lastName email avatar role")
      .populate({ path: "assignedEmployee.employeeId", select: "firstName lastName email avatar" })
      .populate({ path: "assignedManager.managerId", select: "firstName lastName email avatar" })
      .populate({ path: "assignedTeamLead.teamLeadId", select: "firstName lastName email avatar" })
      .lean();

    const updatedEmployee = updatedTask.assignedEmployee.find(
      emp => emp.employeeId?._id?.toString() === session.user.id
    );

    return NextResponse.json({
      success: true,
      task: {
        ...updatedTask,
        employeeStatus: updatedEmployee.status,
        employeeFeedbacks: updatedEmployee.feedbacks || [],
        assignedAt: updatedEmployee.assignedAt,
        completedAt: updatedEmployee.completedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error("PUT Employee Task Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}
