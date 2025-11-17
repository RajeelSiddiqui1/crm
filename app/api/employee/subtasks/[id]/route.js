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
    if (!id) return NextResponse.json({ error: "Subtask ID missing" }, { status: 400 });

    const subtask = await Subtask.findById(id)
      .populate("submissionId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email avatar")
      .lean();

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const employeeAssignment = subtask.assignedEmployees.find(
      (emp) => emp.employeeId?._id?.toString() === session.user.id
    );

    if (!employeeAssignment) {
      return NextResponse.json({ error: "You are not assigned to this subtask" }, { status: 403 });
    }

    return NextResponse.json({
      ...subtask,
      employeeStatus: employeeAssignment.status,
      assignedAt: employeeAssignment.assignedAt,
    });
  } catch (error) {
    console.error("Error fetching employee subtask:", error);
    return NextResponse.json({ error: "Failed to fetch subtask" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Subtask ID missing" }, { status: 400 });

    const { status } = await req.json();
    if (!["pending", "in_progress", "completed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const subtask = await Subtask.findOne({
      _id: id,
      "assignedEmployees.employeeId": session.user.id,
    });

    if (!subtask)
      return NextResponse.json({ error: "Subtask not found or not assigned to you" }, { status: 404 });

    const employee = subtask.assignedEmployees.find(
      (emp) => emp.employeeId.toString() === session.user.id
    );
    employee.status = status;
    if (status === "completed") subtask.completedAt = new Date();

    const allDone = subtask.assignedEmployees.every(
      (emp) => emp.status === "completed"
    );
    if (allDone) subtask.status = "completed";

    await subtask.save();

    return NextResponse.json({
      message: "Subtask updated successfully",
      subtask: {
        _id: subtask._id.toString(),
        ...subtask.toObject(),
        employeeStatus: employee.status,
      },
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
  }
}