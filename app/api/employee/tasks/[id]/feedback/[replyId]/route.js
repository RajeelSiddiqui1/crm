import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";

import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";

import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id, replyId } = params;
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
      "teamLeadFeedbacks.replies._id": replyId,
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

      const replyIdx = feedback.replies.findIndex(
        (r) => r._id.toString() === replyId.toString()
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

    // =========================
    // Update the reply
    // =========================
    task.teamLeadFeedbacks[feedbackIndex].replies[replyIndex].reply =
      reply.trim();

    task.teamLeadFeedbacks[feedbackIndex].replies[replyIndex].updatedAt =
      new Date();

    await task.save();

    // =================================================
    // Send mail + notifications (NEW PART ONLY)
    // =================================================

    const populatedTask = await FormSubmission.findById(task._id)
      .populate("teamLeadFeedbacks.teamLeadId")
      .populate("submittedBy")
      .populate("formId", "title");

    const feedback = populatedTask.teamLeadFeedbacks[feedbackIndex];
    const teamLead = feedback?.teamLeadId;
    const manager = populatedTask.submittedBy;

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const taskTitle = populatedTask.formId?.title || "Task";

    const notifications = [];

    // ---------- Team lead ----------
    if (teamLead) {
      notifications.push(
        sendNotification({
          senderId: employee._id,
          senderModel: "Employee",
          senderName: employeeName,
          receiverId: teamLead._id,
          receiverModel: "TeamLead",
          type: "feedback_reply_updated",
          title: "Reply Updated",
          message: `${employeeName} updated a reply on your feedback for "${taskTitle}"`,
          link: `/teamlead/tasks/${populatedTask._id}`,
          referenceId: populatedTask._id,
          referenceModel: "FormSubmission",
        })
      );

      const emailHTML = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>Reply Updated</h2>
          <p>
            <strong>${employeeName}</strong> updated a reply on your feedback for
            <strong>${taskTitle}</strong>.
          </p>
          <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks/${populatedTask._id}">
            View task
          </a>
        </div>
      `;

      notifications.push(
        sendMail(
          teamLead.email,
          "Reply Updated on Your Feedback",
          emailHTML
        )
      );
    }

    // ---------- Manager ----------
    if (manager) {
      notifications.push(
        sendNotification({
          senderId: employee._id,
          senderModel: "Employee",
          senderName: employeeName,
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "feedback_reply_updated",
          title: "Reply Updated",
          message: `${employeeName} updated a reply on team lead feedback for "${taskTitle}"`,
          link: `/manager/submissions/detail/${populatedTask._id}`,
          referenceId: populatedTask._id,
          referenceModel: "FormSubmission",
        })
      );

      const emailHTML = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>Employee Reply Updated</h2>
          <p>
            <strong>${employeeName}</strong> updated a reply on team lead feedback for
            <strong>${taskTitle}</strong>.
          </p>
          <a href="${process.env.NEXT_PUBLIC_DOMAIN}/manager/submissions/detail/${populatedTask._id}">
            View task
          </a>
        </div>
      `;

      notifications.push(
        sendMail(
          manager.email,
          "Employee Reply Updated",
          emailHTML
        )
      );
    }

    await Promise.allSettled(notifications);

    // =========================

    return NextResponse.json(
      {
        success: true,
        message: "Reply updated successfully",
        reply:
          task.teamLeadFeedbacks[feedbackIndex].replies[replyIndex],
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
