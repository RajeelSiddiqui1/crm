import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import EmployeeForm from "@/models/EmployeeForm";
import Employee from "@/models/Employee";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { formId, subtaskId, formData } = await req.json();

    if (!formId || !subtaskId) {
      return NextResponse.json({ 
        error: "Form ID and Subtask ID are required" 
      }, { status: 400 });
    }

    // Handle duplicate form IDs (like "formId_1", "formId_2")
    let actualFormId = formId;
    if (formId.includes('_originalId_')) {
      // Extract original form ID from duplicated form
      actualFormId = formId.split('_originalId_')[0];
    }

    // Check if form exists
    const form = await EmployeeForm.findById(actualFormId);
    if (!form) {
      return NextResponse.json({ 
        error: "Form not found" 
      }, { status: 404 });
    }

    // Verify subtask exists
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ 
        error: "Subtask not found" 
      }, { status: 404 });
    }

    const isAssigned = subtask.assignedEmployees.some(
      (emp) => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return NextResponse.json({ 
        error: "You are not assigned to this subtask" 
      }, { status: 403 });
    }

    // Check lead requirement
    const leadRequired = subtask.lead || 1;
    const approvedSubmissions = await EmployeeFormSubmission.countDocuments({
      subtaskId: subtaskId,
      employeeId: session.user.id,
      teamleadstatus: "approved"
    });

    if (approvedSubmissions >= leadRequired) {
      return NextResponse.json(
        { error: `You have completed all ${leadRequired} required forms.` },
        { status: 400 }
      );
    }

    // Get employee details
    const employee = await Employee.findById(session.user.id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Create new submission (model ke hisab se fields)
    const submission = new EmployeeFormSubmission({
      formId: actualFormId,
      subtaskId: subtaskId,
      employeeId: session.user.id,
      submittedBy: `${employee.firstName} ${employee.lastName}`,
      assignedTo: subtask.assignedTo || "Team Lead",
      formData: formData,
      teamleadstatus: "pending", // ✅ Model ke hisab se
      managerStatus: "pending",  // ✅ Model ke hisab se capital S
      createdAt: new Date()
    });

    await submission.save();

    return NextResponse.json(
      { 
        message: "Form submitted successfully!", 
        submissionId: submission._id,
        submission: {
          _id: submission._id,
          teamleadstatus: submission.teamleadstatus,
          managerStatus: submission.managerStatus,
          submittedAt: submission.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Submission API Error:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}