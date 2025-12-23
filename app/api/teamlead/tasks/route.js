import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const teamLead = await TeamLead.findOne({ email: session.user.email });

    if (!teamLead) {
      return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
    }

    const submissions = await FormSubmission.find({
      $or: [
        { assignedTo: teamLead._id },
        { multipleTeamLeadAssigned: teamLead._id },
        { multipleTeamLeadShared: teamLead._id },
      ],
    })
      .populate("formId", "title description")
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedEmployees.employeeId", "firstName lastName")
      .populate("sharedByTeamlead", "firstName lastName email")
      .populate("multipleTeamLeadShared", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedSubmissions = submissions.map((submission) => {
      const assignedToArray = Array.isArray(submission.assignedTo)
        ? submission.assignedTo
        : submission.assignedTo
        ? [submission.assignedTo]
        : [];

      const isDirectlyAssigned = assignedToArray.some(
        (tl) => tl.toString() === teamLead._id.toString()
      );

      const isShared = Array.isArray(submission.multipleTeamLeadShared)
        ? submission.multipleTeamLeadShared.some(
            (tl) => tl._id?.toString() === teamLead._id.toString()
          )
        : false;

      return {
        ...submission,
        isSharedWithMe: isShared && !isDirectlyAssigned,
        sharedBy: submission.sharedByTeamlead,
        isOriginalAssigned: isDirectlyAssigned,
      };
    });

    return NextResponse.json(enrichedSubmissions, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
