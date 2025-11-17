import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeForm from "@/models/EmployeeForm";
import Employee from "@/models/Employee";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const subtaskId = searchParams.get("subtaskId");

    console.log("🔍 Fetching forms for:", {
      employeeId: session.user.id,
      subtaskId
    });

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    // 1. Check if employee is assigned to subtask
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

    // 2. Get employee department
    const employee = await Employee.findById(session.user.id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    console.log("👤 Employee Department:", employee.depId);

    // 3. Get all forms for employee's department
    const allForms = await EmployeeForm.find({ 
      depId: employee.depId 
    }).lean();

    console.log("📋 All forms in department:", allForms.length);

    // 4. Get existing submissions for this subtask
    const existingSubmissions = await EmployeeFormSubmission.find({
      subtaskId: subtaskId,
      employeeId: session.user.id
    }).populate("formId");

    console.log("✅ Existing submissions found:", existingSubmissions.length);

    // Debug each submission
    existingSubmissions.forEach((sub, idx) => {
      console.log(`📄 Submission ${idx + 1}:`, {
        submissionId: sub._id,
        formId: sub.formId?._id?.toString(),
        formTitle: sub.formId?.title,
        employeeId: sub.employeeId.toString(),
        subtaskId: sub.subtaskId.toString()
      });
    });

    // 5. Filter out already submitted forms
    const submittedFormIds = existingSubmissions
      .map((sub) => sub.formId?._id?.toString())
      .filter(Boolean);

    console.log("🚫 Already submitted form IDs:", submittedFormIds);

    const availableForms = allForms.filter(
      (form) => !submittedFormIds.includes(form._id.toString())
    );

    console.log("🎯 Available forms after filtering:", availableForms.length);

    // Return available forms
    return NextResponse.json(availableForms);

  } catch (error) {
    console.error("❌ Forms API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}