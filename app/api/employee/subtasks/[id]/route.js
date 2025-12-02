import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    const subtask = await Subtask.findById(id)
      .populate("submissionId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .lean();

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Check if employee is assigned
    const employeeAssignment = subtask.assignedEmployees.find(
      emp => emp.employeeId?._id?.toString() === session.user.id
    );

    if (!employeeAssignment) {
      return NextResponse.json(
        { error: "You are not assigned to this subtask" },
        { status: 403 }
      );
    }

    // Get submission stats
    const submissions = await EmployeeFormSubmission.find({
      subtaskId: id,
      employeeId: session.user.id
    });

    const approvedCount = submissions.filter(
      sub => sub.teamleadstatus === "approved"
    ).length;

    const leadRequired = subtask.lead || 1;
    const progress = leadRequired > 0 ? (approvedCount / leadRequired) * 100 : 0;

    return NextResponse.json({
      ...subtask,
      employeeStatus: employeeAssignment.status,
      assignedAt: employeeAssignment.assignedAt,
      completedAt: employeeAssignment.completedAt,
      stats: {
        totalSubmissions: submissions.length,
        approved: approvedCount,
        pending: submissions.filter(s => s.teamleadstatus === "pending").length,
        in_progress: submissions.filter(s => s.teamleadstatus === "in_progress").length,
        completed: submissions.filter(s => s.teamleadstatus === "completed").length,
        rejected: submissions.filter(s => s.teamleadstatus === "rejected").length,
        late: submissions.filter(s => s.teamleadstatus === "late").length,
        required: leadRequired,
        progress: progress
      }
    });

  } catch (error) {
    console.error("Error fetching subtask:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtask details" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    const { status } = await req.json();
    
    const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const subtask = await Subtask.findById(id);
    
    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Find and update employee's assignment
    const employeeIndex = subtask.assignedEmployees.findIndex(
      emp => emp.employeeId.toString() === session.user.id
    );

    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: "You are not assigned to this subtask" },
        { status: 403 }
      );
    }

    subtask.assignedEmployees[employeeIndex].status = status;
    
    if (status === "completed") {
      subtask.assignedEmployees[employeeIndex].completedAt = new Date();
    }

    await subtask.save();

    return NextResponse.json({
      message: "Subtask status updated successfully",
      subtask: {
        _id: subtask._id,
        title: subtask.title,
        status: subtask.status,
        employeeStatus: status
      }
    });

  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}