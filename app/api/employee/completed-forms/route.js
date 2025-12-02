import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import EmployeeForm from "@/models/EmployeeForm";
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
    const filter = searchParams.get("filter") || "all";

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID required" }, { status: 400 });
    }

    // Verify subtask exists
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

    // Base query
    let query = {
      subtaskId: subtaskId,
      employeeId: session.user.id
    };

    // Apply filters (model ke hisab se)
    if (filter === "approved") {
      query.teamleadstatus = "approved";
    } else if (filter === "pending") {
      query.teamleadstatus = "pending";
    } else if (filter === "rejected") {
      query.teamleadstatus = "rejected";
    } else if (filter === "late") {
      query.teamleadstatus = "late";
    } else if (filter === "in_progress") {
      query.teamleadstatus = "in_progress";
    } else if (filter === "completed") {
      query.teamleadstatus = "completed";
    }

    // Fetch submissions
    const submissions = await EmployeeFormSubmission.find(query)
      .populate("formId", "title description fields")
      .populate("employeeId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    // Process submissions
    const completedForms = await Promise.all(submissions.map(async (submission) => {
      let formData = {};
      
      if (!submission.formId) {
        // Try to fetch form separately
        const form = await EmployeeForm.findById(submission.formId);
        if (form) {
          formData = {
            _id: form._id,
            title: form.title,
            description: form.description,
            fields: form.fields
          };
        } else {
          formData = {
            _id: submission._id,
            title: "Form Not Available",
            description: "This form has been removed",
            fields: []
          };
        }
      } else {
        formData = submission.formId;
      }

      return {
        _id: formData._id,
        title: formData.title,
        description: formData.description,
        fields: formData.fields,
        submissionId: submission._id,
        submittedAt: submission.createdAt,
        submittedBy: submission.submittedBy,
        assignedTo: submission.assignedTo,
        formData: submission.formData || {},
        teamleadstatus: submission.teamleadstatus,
        managerStatus: submission.managerStatus, // ✅ Model ke hisab se capital S
        completedAt: submission.completedAt,
        status: submission.teamleadstatus // Main status teamleadstatus se le rahe hain
      };
    }));

    return NextResponse.json(completedForms);

  } catch (error) {
    console.error("Completed Forms API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed forms" },
      { status: 500 }
    );
  }
}