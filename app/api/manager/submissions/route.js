import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form";

// ✅ GET - Manager ke department ki submissions fetch karega
export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    
    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID required" },
        { status: 400 }
      );
    }

    const submissions = await FormSubmission.find()
      .populate('formId')
      .sort({ createdAt: -1 });

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

    const submission = await FormSubmission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
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