import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import "@/models/FormSubmission"; // ✅ Add this line

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const subtasks = await Subtask.find({
      "assignedEmployees.employeeId": session.user.id,
    })
      .populate("submissionId", "title description")
      .populate("teamLeadId", "firstName lastName email")
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email",
      });

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("❌ Employee subtasks fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}
