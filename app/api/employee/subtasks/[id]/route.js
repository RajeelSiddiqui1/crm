import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import "@/models/FormSubmission"; // ensure FormSubmission model is loaded
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

// GET single subtask assigned to employee
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const id = params?.id;

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
