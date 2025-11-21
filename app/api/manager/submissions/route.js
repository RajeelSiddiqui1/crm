import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ GET - Manager ke liye sirf unki department ki submissions fetch karega
export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the logged-in manager's ID
    const managerId = session.user.id;
    
    console.log("Manager ID:", managerId);
    console.log("Session user:", session.user);

    // Fetch submissions where submittedBy matches the manager's ID
    const submissions = await FormSubmission.find({ 
      submittedBy: managerId 
    })
      .populate("formId")
      .populate("assignedEmployees.employeeId")
      .sort({ createdAt: -1 });

    console.log("Found submissions:", submissions.length);

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ PUT - Manager status update karega (Approve/Reject)
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

    const managerId = session.user.id;

    // Find submission and verify it belongs to this manager
    const submission = await FormSubmission.findOne({
      _id: submissionId,
      submittedBy: managerId
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or access denied" },
        { status: 404 }
      );
    }

    submission.status = status;
    if (managerComments) {
      submission.managerComments = managerComments;
    }

    await submission.save();

    return NextResponse.json(
      { message: "Status updated successfully", submission },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}