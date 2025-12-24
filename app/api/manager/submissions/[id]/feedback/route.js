// app/api/manager/submissions/[id]/feedback/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    // 🔐 ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    const { feedback } = await req.json();

    if (!feedback?.trim()) {
      return NextResponse.json(
        { error: "Feedback is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const managerId = session.user.id;
    const managerName =
      session.user.firstName && session.user.lastName
        ? `${session.user.firstName} ${session.user.lastName}`
        : session.user.name;

    // 🔍 Access check
    const submission = await FormSubmission.findOne({
      _id: id,
      $or: [
        { submittedBy: managerId },
        { multipleManagerShared: managerId },
      ],
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or access denied" },
        { status: 404 }
      );
    }

    // ✅ MAIN FIX: managerComments update
    submission.managerComments = feedback.trim();
    submission.managerCommentedAt = new Date(); // (optional but recommended)

    await submission.save();

    // 🔔 Notifications
    const notifications = [];

    // Notify assigned team leads
    if (submission.assignedTo?.length) {
      submission.assignedTo.forEach((teamLeadId) => {
        notifications.push(
          sendNotification({
            senderId: managerId,
            senderModel: "Manager",
            senderName: managerName,
            receiverId: teamLeadId,
            receiverModel: "TeamLead",
            type: "manager_feedback",
            title: "Manager Feedback Added",
            message: `Manager ${managerName} added feedback on a submission.`,
            referenceId: submission._id,
            referenceModel: "FormSubmission",
            link: `/teamlead/tasks/${submission._id}`,
          })
        );
      });
    }

    // Notify assigned employees
    if (submission.assignedEmployees?.length) {
      submission.assignedEmployees.forEach((assignment) => {
        notifications.push(
          sendNotification({
            senderId: managerId,
            senderModel: "Manager",
            senderName: managerName,
            receiverId: assignment.employeeId,
            receiverModel: "Employee",
            type: "manager_feedback",
            title: "Manager Feedback Added",
            message: `Manager ${managerName} added feedback on your task.`,
            referenceId: submission._id,
            referenceModel: "FormSubmission",
            link: `/employee/tasks/${submission._id}`,
          })
        );
      });
    }

    await Promise.allSettled(notifications);

    return NextResponse.json(
      {
        success: true,
        message: "Manager feedback added successfully",
        managerComments: submission.managerComments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding manager feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
