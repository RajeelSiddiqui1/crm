// app/api/teamlead/assigned-subtasks/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FormSubmission from "@/models/FormSubmission";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    // Build query for subtasks where current team lead is assigned
    const query = {
      "assignedTeamLeads.teamLeadId": session.user.id
    };

    // Add status filter if not "all"
    if (status !== "all") {
      query.status = status;
    }

    const subtasks = await Subtask.find(query)
      .populate("teamLeadId", "firstName lastName email")
      .populate("submissionId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .populate("assignedManagers.managerId", "firstName lastName email")
      .populate("assignedTeamLeads.teamLeadId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ subtasks }, { status: 200 });
  } catch (error) {
    console.error("GET Assigned Subtasks Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned subtasks" },
      { status: 500 }
    );
  }
}