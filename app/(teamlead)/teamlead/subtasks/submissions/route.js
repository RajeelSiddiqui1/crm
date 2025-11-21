import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Subtask from "@/models/Subtask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Employee from "@/models/Employee";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: subtaskId } = params;

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID required" }, { status: 400 });
    }

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const submissions = await EmployeeFormSubmission.find({
      subtaskId: subtaskId
    })
      .populate("employeeId", "firstName lastName")
      .populate("formId", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching subtask submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
