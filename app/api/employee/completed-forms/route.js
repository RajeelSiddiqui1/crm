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

    // Apply filters
    if (filter !== "all") {
      if (["approved", "pending", "rejected", "late", "in_progress", "completed"].includes(filter)) {
        query.teamleadstatus = filter;
      }
    }

    // Fetch submissions with proper population
    const submissions = await EmployeeFormSubmission.find(query)
      .populate({
        path: "formId",
        select: "title description fields"
      })
      .populate("employeeId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    console.log("Fetched submissions count:", submissions.length); // Debug log

    // Transform submissions to match frontend expectations
    const completedForms = submissions.map(submission => {
      // Handle case where formId might not be populated
      const formData = submission.formId || {};
      
      return {
        _id: formData._id || submission._id,
        title: formData.title || "Unknown Form",
        description: formData.description || "",
        fields: formData.fields || [],
        submissionId: submission._id,
        submittedAt: submission.createdAt,
        submittedBy: submission.submittedBy,
        assignedTo: submission.assignedTo,
        formData: submission.formData || {},
        teamleadstatus: submission.teamleadstatus,
        managerStatus: submission.managerStatus,
        completedAt: submission.completedAt,
        status: submission.teamleadstatus,
        // IMPORTANT: Include fileAttachments
        fileAttachments: submission.fileAttachments || []
      };
    });

    console.log("Processed completed forms:", completedForms.length); // Debug log
    
    // Return as array
    return NextResponse.json(completedForms);

  } catch (error) {
    console.error("Completed Forms API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed forms", details: error.message },
      { status: 500 }
    );
  }
}