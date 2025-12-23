// app/api/teamlead/tasks/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import Form from "@/models/Form";
import TeamLead from "@/models/TeamLead";
import { authOptions } from "@/lib/auth";

// GET all tasks for teamlead
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find teamlead
    const teamLead = await TeamLead.findOne({ email: session.user.email });
    if (!teamLead) {
      return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
    }

    // Get tasks assigned to this teamlead
    const submissions = await FormSubmission.find({
      $or: [
        { assignedTo: teamLead._id },
        { multipleTeamLeadAssigned: teamLead._id },
        { multipleTeamLeadShared: teamLead._id }
      ]
    })
      .populate("formId", "title description")
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedEmployees.employeeId", "firstName lastName")
      .populate("sharedByTeamlead", "firstName lastName email") // Add sharedBy
      .populate("multipleTeamLeadShared", "firstName lastName email") // Add shared list
      .sort({ createdAt: -1 })
      .lean();

    // Add isShared flag to each submission
    const enrichedSubmissions = submissions.map(submission => {
      const isDirectlyAssigned = submission.assignedTo?.some(
        tl => tl.toString() === teamLead._id.toString()
      );
      const isShared = submission.multipleTeamLeadShared?.some(
        tl => tl._id?.toString() === teamLead._id.toString()
      );
      
      return {
        ...submission,
        isSharedWithMe: isShared && !isDirectlyAssigned,
        sharedBy: submission.sharedByTeamlead,
        isOriginalAssigned: isDirectlyAssigned
      };
    });

    return NextResponse.json(enrichedSubmissions, { status: 200 });
  } catch (error) {
    console.error("GET TeamLead submissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}