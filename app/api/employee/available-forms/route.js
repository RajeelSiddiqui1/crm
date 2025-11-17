import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeForm from "@/models/EmployeeForm";
import Employee from "@/models/Employee";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const subtaskId = searchParams.get("subtaskId");

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const isAssigned = subtask.assignedEmployees.some(
      (emp) => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return NextResponse.json({ 
        error: "You are not assigned to this subtask" 
      }, { status: 403 });
    }

    const employee = await Employee.findById(session.user.id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const allForms = await EmployeeForm.find({ 
      depId: employee.depId 
    }).lean();

    const existingSubmissions = await EmployeeFormSubmission.find({
      subtaskId: subtaskId,
      employeeId: session.user.id
    }).populate("formId");

    const submittedFormIds = existingSubmissions
      .map((sub) => sub.formId?._id?.toString())
      .filter(Boolean);

    const availableForms = allForms.filter(
      (form) => !submittedFormIds.includes(form._id.toString())
    );

    return NextResponse.json(availableForms);

  } catch (error) {
    console.error("Forms API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}