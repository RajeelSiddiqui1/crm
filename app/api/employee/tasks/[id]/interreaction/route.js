// app/api/employee/tasks/[id]/interaction/route.js
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import FormSubmission from "@/models/FormSubmission";
import { sendNotification } from "@/lib/sendNotification";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id: submissionId } = params;
    const { action, data } = await request.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Action is required" }), { status: 400 });
    }

    await dbConnect();

    // Verify employee is assigned to this submission
    const submission = await FormSubmission.findById(submissionId);
    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), { status: 404 });
    }

    const isAssigned = submission.assignedEmployees.some(
      emp => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    let updateResult;
    const employeeName = session.user.name;

    switch (action) {
      case "reply_to_teamlead":
        // Reply to team lead feedback
        if (!data?.reply) {
          return new Response(JSON.stringify({ error: "Reply is required" }), { status: 400 });
        }

        // Remove old reply if exists
        await FormSubmission.updateOne(
          { _id: submissionId },
          { $pull: { teamLeadFeedbackReplies: { employeeId: session.user.id } } }
        );

        // Add new reply
        updateResult = await FormSubmission.updateOne(
          { _id: submissionId },
          {
            $push: {
              teamLeadFeedbackReplies: {
                employeeId: session.user.id,
                reply: data.reply.trim(),
                repliedAt: new Date()
              }
            }
          }
        );

        // Notify team leads
        const teamLeadIds = [
          ...(submission.assignedTo || []),
          ...(submission.multipleTeamLeadShared || [])
        ];

        await Promise.all(
          teamLeadIds.map(async (tlId) => {
            await sendNotification({
              senderId: session.user.id,
              senderModel: "Employee",
              senderName: employeeName,
              receiverId: tlId,
              receiverModel: "TeamLead",
              type: "feedback_reply",
              title: "Reply to Team Lead Feedback",
              message: `Employee ${employeeName} replied to your feedback on task "${submission.clinetName}".`,
              link: `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/submissions/${submissionId}`,
              referenceId: submissionId,
              referenceModel: "FormSubmission"
            });
          })
        );
        break;

      case "comment_on_feedback":
        // Comment on another employee's feedback
        if (!data?.comment || !data?.employeeId) {
          return new Response(JSON.stringify({ error: "Comment and employee ID are required" }), { status: 400 });
        }

        updateResult = await FormSubmission.updateOne(
          { _id: submissionId },
          {
            $push: {
              feedbackComments: {
                commentBy: session.user.id,
                commenterModel: "Employee",
                commentOnEmployeeId: data.employeeId,
                comment: data.comment.trim(),
                feedbackId: data.feedbackId,
                createdAt: new Date()
              }
            }
          }
        );

        // Notify the employee whose feedback was commented on
        if (data.employeeId !== session.user.id) {
          await sendNotification({
            senderId: session.user.id,
            senderModel: "Employee",
            senderName: employeeName,
            receiverId: data.employeeId,
            receiverModel: "Employee",
            type: "feedback_comment",
            title: "New Comment on Your Feedback",
            message: `${employeeName} commented on your feedback for task "${submission.clinetName}".`,
            link: `${process.env.NEXT_PUBLIC_DOMAIN}/employee/tasks/${submissionId}`,
            referenceId: submissionId,
            referenceModel: "FormSubmission"
          });
        }
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }

    if (updateResult?.modifiedCount === 0) {
      return new Response(JSON.stringify({ error: "Failed to update" }), { status: 400 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${action.replace(/_/g, ' ')} completed successfully` 
    }), { status: 200 });

  } catch (error) {
    console.error("Error in employee interaction:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id: submissionId } = params;
    await dbConnect();

    const submission = await FormSubmission.findById(submissionId)
      .populate("employeeFeedbacks.employeeId", "firstName lastName email department avatar")
      .populate("teamLeadFeedbackReplies.employeeId", "firstName lastName email department")
      .populate({
        path: "feedbackComments.commentBy",
        select: "firstName lastName email department role avatar",
        model: function(doc) {
          return doc.commenterModel;
        }
      })
      .populate("feedbackComments.commentOnEmployeeId", "firstName lastName email");

    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), { status: 404 });
    }

    // Check if employee is assigned
    const isAssigned = submission.assignedEmployees.some(
      emp => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    // Get employee's own feedback and reply
    const employeeFeedback = submission.employeeFeedbacks?.find(
      fb => fb.employeeId._id.toString() === session.user.id
    );

    const employeeReply = submission.teamLeadFeedbackReplies?.find(
      reply => reply.employeeId._id.toString() === session.user.id
    );

    // Get all comments relevant to this employee
    const relevantComments = submission.feedbackComments?.filter(
      comment => 
        comment.commentOnEmployeeId._id.toString() === session.user.id ||
        comment.commentBy._id.toString() === session.user.id
    );

    const responseData = {
      // Team lead feedback
      teamLeadFeedback: submission.teamLeadFeedback,
      
      // Employee's reply to team lead feedback
      employeeReply: employeeReply?.reply || "",
      employeeRepliedAt: employeeReply?.repliedAt,
      
      // All employee feedbacks
      allFeedbacks: submission.employeeFeedbacks.map(fb => ({
        id: fb._id,
        employeeId: fb.employeeId._id,
        employeeName: `${fb.employeeId.firstName} ${fb.employeeId.lastName}`,
        employeeEmail: fb.employeeId.email,
        employeeDepartment: fb.employeeId.department,
        employeeAvatar: fb.employeeId.avatar,
        feedback: fb.feedback,
        submittedAt: fb.submittedAt,
        isOwnFeedback: fb.employeeId._id.toString() === session.user.id
      })),
      
      // All comments
      comments: relevantComments?.map(comment => ({
        id: comment._id,
        commentBy: {
          id: comment.commentBy._id,
          name: `${comment.commentBy.firstName} ${comment.commentBy.lastName}`,
          email: comment.commentBy.email,
          role: comment.commenterModel,
          department: comment.commentBy.department,
          avatar: comment.commentBy.avatar
        },
        commentOnEmployee: {
          id: comment.commentOnEmployeeId._id,
          name: `${comment.commentOnEmployeeId.firstName} ${comment.commentOnEmployeeId.lastName}`
        },
        comment: comment.comment,
        createdAt: comment.createdAt,
        feedbackId: comment.feedbackId
      })),

      // Employee's own feedback
      ownFeedback: employeeFeedback?.feedback || "",
      ownFeedbackSubmittedAt: employeeFeedback?.submittedAt
    };

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (error) {
    console.error("Error fetching interaction data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), { status: 500 });
  }
}