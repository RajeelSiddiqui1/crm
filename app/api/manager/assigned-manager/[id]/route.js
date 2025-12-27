import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import { subtaskStatusUpdateMailTemplate } from "@/helper/emails/manager/subtask-status-update";

// ✅ GET: Subtask details for manager
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const subtask = await Subtask.findById(id)
      .populate("submissionId", "title description status")
      .populate("teamLeadId", "firstName lastName email avatar designation phone department")
      .populate("depId", "name departmentCode color")
      .populate("assignedEmployees.employeeId", "firstName lastName email avatar designation department")
      .populate("assignedManagers.managerId", "firstName lastName email avatar")
      .lean();

    if (!subtask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const managerAssignment = subtask.assignedManagers.find(
      mgr => mgr.managerId?._id?.toString() === session.user.id
    );
    if (!managerAssignment)
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });

    // ✅ Employee submissions stats
    const employeeSubmissions = await EmployeeFormSubmission.find({ subtaskId: id });
    const assignedEmployees = subtask.assignedEmployees || [];
    const teamPerformance = {
      total: assignedEmployees.length,
      completed: assignedEmployees.filter(emp => ['completed','approved'].includes(emp.status)).length,
      inProgress: assignedEmployees.filter(emp => emp.status === 'in_progress').length,
      pending: assignedEmployees.filter(emp => emp.status === 'pending').length,
      submissionStats: {
        total: employeeSubmissions.length,
        approved: employeeSubmissions.filter(s => s.teamleadstatus === "approved").length,
        pending: employeeSubmissions.filter(s => s.teamleadstatus === "pending").length,
        rejected: employeeSubmissions.filter(s => s.teamleadstatus === "rejected").length
      }
    };

    return NextResponse.json({
      ...subtask,
      managerInfo: {
        status: managerAssignment.status,
        assignedAt: managerAssignment.assignedAt,
        completedAt: managerAssignment.completedAt,
        feedback: managerAssignment.feedback,
        leadsCompleted: managerAssignment.leadsCompleted || 0,
        leadsAssigned: managerAssignment.leadsAssigned || 0
      },
      teamPerformance,
      timeline: {
        startDate: subtask.startDate,
        endDate: subtask.endDate,
        daysRemaining: Math.ceil((new Date(subtask.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
        isOverdue: new Date(subtask.endDate) < new Date() && !['completed','approved'].includes(subtask.status)
      }
    });

  } catch (error) {
    console.error("Error fetching manager subtask:", error);
    return NextResponse.json({ error: "Failed to fetch task details" }, { status: 500 });
  }
}

// ✅ PUT: Update manager's subtask status
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid Task ID" }, { status: 400 });

    const { status, feedback, leadsCompleted, notes } = await req.json();
    const validStatuses = ["pending", "in_progress", "completed", "rejected"];
    if (status && !validStatuses.includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const subtask = await Subtask.findById(id);
    if (!subtask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const managerIndex = subtask.assignedManagers.findIndex(mgr => mgr.managerId.toString() === session.user.id);
    if (managerIndex === -1) return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });

    // ✅ Update manager assignment
    if (status) subtask.assignedManagers[managerIndex].status = status;
    if (status === "completed") subtask.assignedManagers[managerIndex].completedAt = new Date();
    if (feedback !== undefined) subtask.assignedManagers[managerIndex].feedback = feedback;
    if (leadsCompleted !== undefined) subtask.assignedManagers[managerIndex].leadsCompleted = parseInt(leadsCompleted) || 0;
    if (notes) {
      if (!subtask.notes) subtask.notes = [];
      subtask.notes.push({ managerId: session.user.id, managerName: session.user.name, note: notes, createdAt: new Date() });
    }

    // ✅ Recalculate total leads completed
    subtask.leadsCompleted = subtask.assignedEmployees.reduce((sum, emp) => sum + (emp.leadsCompleted || 0), 0) +
                             subtask.assignedManagers.reduce((sum, mgr) => sum + (mgr.leadsCompleted || 0), 0);

    await subtask.save();
    return NextResponse.json({ success: true, message: "Task updated successfully", task: subtask });

  } catch (error) {
    console.error("Error updating manager subtask:", error);
    return NextResponse.json({ error: "Failed to update task", details: error.message }, { status: 500 });
  }
}

// ✅ DELETE: Remove manager from subtask
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });

    const subtask = await Subtask.findById(id);
    if (!subtask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const managerIndex = subtask.assignedManagers.findIndex(mgr => mgr.managerId.toString() === session.user.id);
    if (managerIndex === -1) return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });

    subtask.assignedManagers.splice(managerIndex, 1);
    await subtask.save();

    return NextResponse.json({ success: true, message: "Successfully removed from task" });

  } catch (error) {
    console.error("Error removing manager from subtask:", error);
    return NextResponse.json({ error: "Failed to remove from task" }, { status: 500 });
  }
}
