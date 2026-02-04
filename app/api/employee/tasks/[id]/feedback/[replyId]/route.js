import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import { authOptions } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id, replyId } = await params;
    const { reply } = await req.json();

    if (!reply?.trim()) {
      return NextResponse.json(
        { error: "Reply text is required" },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({
      email: session.user.email,
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Find the task with the specific feedback reply
    const task = await FormSubmission.findOne({
      _id: id,
      "teamLeadFeedbacks.replies._id": replyId
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task or reply not found" },
        { status: 404 }
      );
    }

    // Find the specific feedback containing the reply
    let replyToUpdate = null;
    let feedbackIndex = -1;
    let replyIndex = -1;

    for (let i = 0; i < task.teamLeadFeedbacks.length; i++) {
      const feedback = task.teamLeadFeedbacks[i];
      const replyIdx = feedback.replies.findIndex(r => 
        r._id.toString() === replyId.toString()
      );
      
      if (replyIdx !== -1) {
        feedbackIndex = i;
        replyIndex = replyIdx;
        replyToUpdate = feedback.replies[replyIdx];
        break;
      }
    }

    if (!replyToUpdate) {
      return NextResponse.json(
        { error: "Reply not found" },
        { status: 404 }
      );
    }

    // Check if employee owns this reply
    if (
      replyToUpdate.repliedBy?.toString() !== employee._id.toString() ||
      replyToUpdate.repliedByModel !== "Employee"
    ) {
      return NextResponse.json(
        { error: "You can only edit your own replies" },
        { status: 403 }
      );
    }

    // Update the reply
    task.teamLeadFeedbacks[feedbackIndex].replies[replyIndex].reply = reply.trim();
    task.teamLeadFeedbacks[feedbackIndex].replies[replyIndex].updatedAt = new Date();

    await task.save();

    return NextResponse.json(
      {
        success: true,
        message: "Reply updated successfully",
        reply: task.teamLeadFeedbacks[feedbackIndex].replies[replyIndex],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update reply error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}