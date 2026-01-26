import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

/* =========================
   GET: Single Task (TeamLead)
========================= */
export async function GET(request, context) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = context;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await EmployeeTask.findById(id)
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

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const teamLeadAssignment = task.assignedTeamLead.find(
      tl => tl.teamLeadId?._id?.toString() === session.user.id
    );

    if (!teamLeadAssignment) {
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });
    }

    return NextResponse.json(
      {
        success: true,
        task: {
          ...task,
          teamLeadStatus: teamLeadAssignment.status,
          teamLeadFeedbacks: teamLeadAssignment.feedbacks || [],
          assignedAt: teamLeadAssignment.assignedAt,
          completedAt: teamLeadAssignment.completedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET TeamLead Task Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 });
  }
}

/* =========================
   PUT: Update Task (TeamLead)
========================= */
export async function PUT(request, context) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = context;
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
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const teamLeadIndex = task.assignedTeamLead.findIndex(
      tl => tl.teamLeadId?.toString() === session.user.id
    );
    if (teamLeadIndex === -1) {
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });
    }

    const teamLead = task.assignedTeamLead[teamLeadIndex];
    const oldStatus = teamLead.status;

    // ===== STATUS UPDATE =====
    if (status) {
      teamLead.status = status;
      if (["completed", "approved"].includes(status)) {
        teamLead.completedAt = new Date();
      }
    }

    // ===== ADD FEEDBACK =====
    if (feedback && feedback.trim()) {
      teamLead.feedbacks.push({ feedback, sentAt: new Date() });
    }

    console.log(feedback)
    
    await task.save();

    // ===== NOTIFICATION =====
    if (sendNotification && task.submittedBy) {
      await Notification.create({
        title: "Task Status Updated",
        message: `${session.user.name} (TeamLead) updated task "${task.title}" from ${oldStatus} to ${status}`,
        type: "task_update",
        sender: {
          id: session.user.id,
          model: "TeamLead",
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

    const updatedTeamLead = updatedTask.assignedTeamLead.find(
      tl => tl.teamLeadId?._id?.toString() === session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        task: {
          ...updatedTask,
          teamLeadStatus: updatedTeamLead.status,
          teamLeadFeedbacks: updatedTeamLead.feedbacks || [],
          assignedAt: updatedTeamLead.assignedAt,
          completedAt: updatedTeamLead.completedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT TeamLead Task Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}
