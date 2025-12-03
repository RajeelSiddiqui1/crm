import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id; // ObjectId
    console.log("Fetching submissions for manager:", managerId);

    const submissions = await FormSubmission.find({
      submittedBy: managerId,
    })
      .populate({
        path: "formId",
        select: "title description fields depId",
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email department",
      })
      .populate({
        path: "assignedTo",
        model: TeamLead,
        select: "firstName lastName email",
      })
      .populate({
        path: "multipleTeamLeadAssigned", // Correct spelling
        model: TeamLead,
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { submissionId, status, managerComments } = body;

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "Submission ID and status are required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id; // ObjectId

    // ✔ Correct: filter by ObjectId
    const submission = await FormSubmission.findOne({
      _id: submissionId,
      submittedBy: managerId,
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or access denied" },
        { status: 404 }
      );
    }

    submission.status = status;
    if (managerComments) submission.managerComments = managerComments;

    await submission.save();

    const updatedSubmission = await FormSubmission.findById(submissionId)
      .populate({
        path: "formId",
        select: "title description fields department",
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email department",
      })
      .populate({
        path: "assignedTo",
        model: TeamLead,
        select: "firstName lastName email",
      })
      .populate({
        path: "multipleTeamLeadAssigned",
        model: TeamLead,
        select: "firstName lastName email",
      })
      .lean();

    return NextResponse.json(
      { message: "Status updated successfully", submission: updatedSubmission },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
