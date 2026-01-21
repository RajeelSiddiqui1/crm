import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import mongoose from "mongoose";

// GET: Fetch single employee task details
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await EmployeeTask.findById(id)
      .populate("submittedBy", "firstName lastName email avatar")
      .populate({
        path: "assignedEmployee.employeeId",
        select: "firstName lastName email avatar"
      })
      .populate({
        path: "assignedManager.managerId",
        select: "firstName lastName email avatar"
      })
      .populate({
        path: "assignedTeamLead.teamLeadId",
        select: "firstName lastName email avatar"
      })
      .lean();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if this team lead is assigned to this task
    const isAssigned = task.assignedTeamLead?.some(
      tl => tl.teamLeadId?._id?.toString() === session.user.id
    );

    if (!isAssigned) {
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("GET Employee Task Error:", error);
    return NextResponse.json({
      error: "Failed to fetch task details"
    }, { status: 500 });
  }
}

// PUT: Update team lead's status and feedback for the task
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status, feedback } = await request.json();

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

    // Find the team lead's assignment in the array
    const teamLeadIndex = task.assignedTeamLead.findIndex(
      tl => tl.teamLeadId?.toString() === session.user.id
    );

    if (teamLeadIndex === -1) {
      return NextResponse.json({
        error: "You are not assigned to this task"
      }, { status: 403 });
    }

    // Update the team lead's status and feedback
    if (status) {
      task.assignedTeamLead[teamLeadIndex].status = status;
    }
    if (feedback !== undefined) {
      task.assignedTeamLead[teamLeadIndex].feedback = feedback;
    }

    await task.save();

    // Populate the task before returning
    const updatedTask = await EmployeeTask.findById(id)
      .populate("submittedBy", "firstName lastName email avatar")
      .populate({
        path: "assignedEmployee.employeeId",
        select: "firstName lastName email avatar"
      })
      .populate({
        path: "assignedManager.managerId",
        select: "firstName lastName email avatar"
      })
      .populate({
        path: "assignedTeamLead.teamLeadId",
        select: "firstName lastName email avatar"
      })
      .lean();

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("PUT Employee Task Error:", error);
    return NextResponse.json({
      error: "Failed to update task"
    }, { status: 500 });
  }
}
