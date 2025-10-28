import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import "@/models/FormSubmission"; // ensure FormSubmission model is loaded
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

// ✅ GET single subtask assigned to employee
export async function GET(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const id = context.params?.id;

    if (!id) {
      return NextResponse.json({ error: "Subtask id missing" }, { status: 400 });
    }

    const subtask = await Subtask.findById(id)
      .populate("submissionId", "title description")
      .populate("teamLeadId", "firstName lastName email avatar")
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

    const subtaskWithEmployeeStatus = {
      _id: subtask._id.toString(), // ✅ ensure _id is string
      ...subtask,
      employeeStatus: employeeAssignment.status,
      assignedAt: employeeAssignment.assignedAt,
    };

    return NextResponse.json(subtaskWithEmployeeStatus);
  } catch (error) {
    console.error("Error fetching employee subtask:", error);
    return NextResponse.json({ error: "Failed to fetch subtask" }, { status: 500 });
  }
}

// ✅ PUT update employee status
export async function PUT(req, context) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = context.params?.id;
    if (!id) {
      return NextResponse.json({ error: "Subtask id missing" }, { status: 400 });
    }

    const { status } = await req.json();

    if (!["pending", "in_progress", "completed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // ✅ find subtask assigned to this employee
    const subtask = await Subtask.findOne({
      _id: id,
      "assignedEmployees.employeeId": session.user.id,
    });

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found or not assigned to you" }, { status: 404 });
    }

    // ✅ update employee status
    const employee = subtask.assignedEmployees.find(
      (emp) => emp.employeeId.toString() === session.user.id
    );

    if (!employee) {
      return NextResponse.json({ error: "You are not assigned to this subtask" }, { status: 403 });
    }

    employee.status = status;

    if (status === "completed") {
      subtask.completedAt = new Date();
    }

    // ✅ auto-complete subtask if all employees done
    const allDone = subtask.assignedEmployees.every(
      (emp) => emp.status === "completed"
    );

    if (allDone) {
      subtask.status = "completed";
    }

    await subtask.save();

    // ✅ return updated subtask
    return NextResponse.json({
      message: "Subtask status updated successfully",
      subtask: {
        _id: subtask._id.toString(),
        ...subtask.toObject(),
        employeeStatus: employee.status,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating employee subtask:", error);
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
  }
}
