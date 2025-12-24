// app/api/teamlead/tasks/[id]/feedback/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import Manager from "@/models/Manager";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { sendFeedbackReplyMail } from "@/helper/emails/teamlead/feedback-reply";

// POST: Add new feedback
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const { feedback } = await req.json();

    if (!feedback?.trim()) {
      return NextResponse.json(
        { error: "Feedback is required" },
        { status: 400 }
      );
    }

    const teamLead = await TeamLead.findOne({ email: session.user.email });
    if (!teamLead) {
      return NextResponse.json(
        { error: "TeamLead not found" },
        { status: 404 }
      );
    }

    const task = await FormSubmission.findById(id)
      .populate("submittedBy")
      .populate("assignedEmployees.employeeId");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check access
    const hasAccess = 
      task.assignedTo?.some(
        (assigned) => assigned.toString() === teamLead._id.toString()
      ) ||
      task.multipleTeamLeadAssigned?.some(
        (tl) => tl.toString() === teamLead._id.toString()
      ) ||
      task.multipleTeamLeadShared?.some(
        (tl) => tl.toString() === teamLead._id.toString()
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Add new feedback
    const newFeedback = {
      teamLeadId: teamLead._id,
      feedback: feedback.trim(),
      submittedAt: new Date(),
      replies: []
    };

    task.teamLeadFeedbacks.push(newFeedback);
    await task.save();

    // Send notifications
    if (task.submittedBy) {
      await sendNotification({
        senderId: teamLead._id,
        senderModel: "TeamLead",
        senderName: `${teamLead.firstName} ${teamLead.lastName}`,
        receiverId: task.submittedBy._id,
        receiverModel: "Manager",
        type: "new_feedback",
        title: "New Feedback Added",
        message: `${teamLead.firstName} ${teamLead.lastName} added feedback on task "${task.formId?.title || 'Task'}"`,
        link: `/manager/tasks/${task._id}`,
        referenceId: task._id,
        referenceModel: "FormSubmission",
      });
    }

    // Notify assigned employees
    if (task.assignedEmployees?.length > 0) {
      await Promise.allSettled(
        task.assignedEmployees.map(async (assignment) => {
          await sendNotification({
            senderId: teamLead._id,
            senderModel: "TeamLead",
            senderName: `${teamLead.firstName} ${teamLead.lastName}`,
            receiverId: assignment.employeeId._id,
            receiverModel: "Employee",
            type: "new_feedback",
            title: "New TeamLead Feedback",
            message: `${teamLead.firstName} ${teamLead.lastName} added feedback on your task`,
            link: `/employee/tasks/${task._id}`,
            referenceId: task._id,
            referenceModel: "FormSubmission",
          });
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: "Feedback added successfully",
      feedback: newFeedback
    }, { status: 201 });

  } catch (error) {
    console.error("Add feedback error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT: Add reply to feedback
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const { feedbackId, reply } = await req.json();

    if (!feedbackId || !reply?.trim()) {
      return NextResponse.json(
        { error: "Feedback ID and reply are required" },
        { status: 400 }
      );
    }

    const task = await FormSubmission.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Find the feedback
    const feedback = task.teamLeadFeedbacks.id(feedbackId);
    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Determine who is replying
    let repliedBy = null;
    let repliedByModel = "";
    let senderName = "";

    if (session.user.role === "TeamLead") {
      const teamLead = await TeamLead.findOne({ email: session.user.email });
      if (!teamLead) {
        return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
      }
      repliedBy = teamLead._id;
      repliedByModel = "TeamLead";
      senderName = `${teamLead.firstName} ${teamLead.lastName}`;
    } else if (session.user.role === "Employee") {
      const employee = await Employee.findOne({ email: session.user.email });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      repliedBy = employee._id;
      repliedByModel = "Employee";
      senderName = `${employee.firstName} ${employee.lastName}`;
    } else if (session.user.role === "Manager") {
      const manager = await Manager.findOne({ email: session.user.email });
      if (!manager) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }
      repliedBy = manager._id;
      repliedByModel = "Manager";
      senderName = `${manager.firstName} ${manager.lastName}`;
    } else {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 401 });
    }

    // Add reply
    const newReply = {
      repliedBy,
      repliedByModel,
      reply: reply.trim(),
      repliedAt: new Date()
    };

    feedback.replies.push(newReply);
    await task.save();

    // Send notifications to all relevant parties
    const notifications = [];

    // Notify the original feedback giver (if not the same person)
    if (feedback.teamLeadId.toString() !== repliedBy.toString()) {
      const originalTeamLead = await TeamLead.findById(feedback.teamLeadId);
      if (originalTeamLead) {
        notifications.push(
          sendNotification({
            senderId: repliedBy,
            senderModel: repliedByModel,
            senderName,
            receiverId: originalTeamLead._id,
            receiverModel: "TeamLead",
            type: "feedback_reply",
            title: "New Reply to Your Feedback",
            message: `${senderName} replied to your feedback`,
            link: `/teamlead/tasks/${task._id}`,
            referenceId: task._id,
            referenceModel: "FormSubmission",
          })
        );

        // Send email notification
        const emailHTML = sendFeedbackReplyMail({
          name: `${originalTeamLead.firstName} ${originalTeamLead.lastName}`,
          taskTitle: task.formId?.title || "Task",
          repliedBy: senderName,
          reply: reply.trim(),
          taskId: task._id.toString()
        });
        sendMail(originalTeamLead.email, "New Reply to Your Feedback", emailHTML);
      }
    }

    // Notify manager (if not already notified)
    if (task.submittedBy && 
        task.submittedBy.toString() !== repliedBy.toString() &&
        feedback.teamLeadId.toString() !== repliedBy.toString()) {
      notifications.push(
        sendNotification({
          senderId: repliedBy,
          senderModel: repliedByModel,
          senderName,
          receiverId: task.submittedBy,
          receiverModel: "Manager",
          type: "feedback_reply",
          title: "New Feedback Reply",
          message: `${senderName} replied to feedback on task`,
          link: `/manager/tasks/${task._id}`,
          referenceId: task._id,
          referenceModel: "FormSubmission",
        })
      );
    }

    await Promise.allSettled(notifications);

    return NextResponse.json({
      success: true,
      message: "Reply added successfully",
      reply: newReply
    }, { status: 200 });

  } catch (error) {
    console.error("Add reply error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete feedback (only by author or admin)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const feedbackId = searchParams.get("feedbackId");

    if (!feedbackId) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const teamLead = await TeamLead.findOne({ email: session.user.email });
    if (!teamLead) {
      return NextResponse.json(
        { error: "TeamLead not found" },
        { status: 404 }
      );
    }

    const task = await FormSubmission.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const feedback = task.teamLeadFeedbacks.id(feedbackId);
    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Check if the teamlead is the author
    if (feedback.teamLeadId.toString() !== teamLead._id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own feedback" },
        { status: 403 }
      );
    }

    feedback.remove();
    await task.save();

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Delete feedback error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}