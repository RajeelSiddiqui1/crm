import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get assigned subtasks
    const assignedSubtasks = await Subtask.find({
      "assignedEmployees.employeeId": session.user.id,
      status: { $ne: "completed" }
    })
    .populate("projectId", "name")
    .populate("taskId", "title")
    .sort({ createdAt: -1 })
    .lean();

    // Get recent submissions
    const recentSubmissions = await EmployeeFormSubmission.find({
      employeeId: session.user.id
    })
    .populate("formId", "title")
    .populate("subtaskId", "title")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    // Get statistics
    const totalSubmissions = await EmployeeFormSubmission.countDocuments({
      employeeId: session.user.id
    });

    const approvedSubmissions = await EmployeeFormSubmission.countDocuments({
      employeeId: session.user.id,
      teamleadstatus: "approved"
    });

    const pendingSubmissions = await EmployeeFormSubmission.countDocuments({
      employeeId: session.user.id,
      teamleadstatus: "pending",
      managerstatus: "pending"
    });

    return NextResponse.json({
      stats: {
        totalTasks: assignedSubtasks.length,
        totalSubmissions,
        approvedSubmissions,
        pendingSubmissions,
        approvalRate: totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0
      },
      assignedSubtasks,
      recentSubmissions
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}