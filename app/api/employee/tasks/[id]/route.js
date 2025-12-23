// app/api/employee/tasks/[id]/route.js
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import FormSubmission from "@/models/FormSubmission";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { sendNotification } from "@/lib/sendNotification";

// ایمپلائی کے لیے ٹاسک ڈیٹیلز
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = params;
    await dbConnect();

    const submission = await FormSubmission.findById(id)
      .populate("formId", "title description")
      .populate("depId", "name description")
      .populate("submittedBy", "firstName lastName email phone department")
      .populate("assignedTo", "firstName lastName email phone department")
      .populate("multipleManagerShared", "firstName lastName email phone")
      .populate("multipleTeamLeadShared", "firstName lastName email department")
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email department position phone avatar"
      })
      .populate("employeeFeedbacks.employeeId", "firstName lastName email department avatar")
      .populate("teamLeadFeedbackReplies.employeeId", "firstName lastName email department")
      .populate({
        path: "feedbackComments.commentBy",
        select: "firstName lastName email department role avatar",
        model: function(doc) {
          return doc.commenterModel;
        }
      })
      .populate("feedbackComments.commentOnEmployeeId", "firstName lastName email department");

    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), { status: 404 });
    }

    // چیک کریں کہ ایمپلائی اس سبمشن سے منسلک ہے
    const isAssigned = submission.assignedEmployees.some(
      emp => emp.employeeId._id.toString() === session.user.id
    );

    if (!isAssigned) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    // ایمپلائی کی اسائنمنٹ ڈیٹیلز
    const employeeAssignment = submission.assignedEmployees.find(
      emp => emp.employeeId._id.toString() === session.user.id
    );

    // ایمپلائی کا فیڈ بیک
    const employeeFeedback = submission.employeeFeedbacks?.find(
      fb => fb.employeeId._id.toString() === session.user.id
    );

    // ایمپلائی کا ٹیم لیڈ فیڈ بیک کا جواب
    const employeeReply = submission.teamLeadFeedbackReplies?.find(
      reply => reply.employeeId._id.toString() === session.user.id
    );

    // ایمپلائی سے متعلق کمنٹس
    const relevantComments = submission.feedbackComments?.filter(
      comment => 
        comment.commentOnEmployeeId._id.toString() === session.user.id ||
        comment.commentBy._id.toString() === session.user.id
    );

    // ریسپانس ڈیٹا
    const responseData = {
      _id: submission._id,
      clinetName: submission.clinetName,
      formId: submission.formId,
      depId: submission.depId,
      submittedBy: submission.submittedBy,
      assignedTo: submission.assignedTo,
      
      // ایمپلائی کی پرسنل انفارمیشن
      employeeStatus: employeeAssignment?.status || "pending",
      employeeFeedback: employeeFeedback?.feedback || "",
      employeeFeedbackSubmittedAt: employeeFeedback?.submittedAt,
      
      // ٹیم لیڈ کا فیڈ بیک
      teamLeadFeedback: submission.teamLeadFeedback,
      
      // ایمپلائی کا جواب
      teamLeadFeedbackReply: employeeReply?.reply || "",
      teamLeadFeedbackRepliedAt: employeeReply?.repliedAt,
      
      // دوسرے ایمپلائی کے فیڈ بیکس
      allEmployeesFeedbacks: submission.employeeFeedbacks.map(fb => ({
        employeeId: fb.employeeId._id,
        employeeName: `${fb.employeeId.firstName} ${fb.employeeId.lastName}`,
        employeeEmail: fb.employeeId.email,
        employeeDepartment: fb.employeeId.department,
        feedback: fb.feedback,
        submittedAt: fb.submittedAt,
        status: submission.assignedEmployees.find(
          emp => emp.employeeId._id.toString() === fb.employeeId._id.toString()
        )?.status || "pending"
      })),
      
      // کمنٹس
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
          name: `${comment.commentOnEmployeeId.firstName} ${comment.commentOnEmployeeId.lastName}`,
          email: comment.commentOnEmployeeId.email
        },
        comment: comment.comment,
        createdAt: comment.createdAt
      })),
      
      // جنرل انفارمیشن
      formData: submission.formData,
      status: submission.status,
      status2: submission.status2,
      adminStatus: submission.adminStatus,
      managerComments: submission.managerComments,
      assignedAt: employeeAssignment?.assignedAt,
      completedAt: employeeAssignment?.completedAt,
      claimedAt: submission.claimedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    };

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (error) {
    console.error("Error fetching task details:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch task details" }), { status: 500 });
  }
}

// ایمپلائی فیڈ بیک اور جواب دینے کا API
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = params;
    const { action, data } = await request.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Action is required" }), { status: 400 });
    }

    await dbConnect();

    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), { status: 404 });
    }

    // چیک کریں کہ ایمپلائی اس سبمشن سے منسلک ہے
    const isAssigned = submission.assignedEmployees.some(
      emp => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    let updateResult;
    let notificationData;

    switch (action) {
      case "submit_feedback":
        // ایمپلائی فیڈ بیک جمع کروانا
        if (!data?.feedback) {
          return new Response(JSON.stringify({ error: "Feedback is required" }), { status: 400 });
        }

        // پرانا فیڈ بیک ہٹائیں (اگر موجود ہے)
        await FormSubmission.updateOne(
          { _id: id },
          { $pull: { employeeFeedbacks: { employeeId: session.user.id } } }
        );

        // نیا فیڈ بیک شامل کریں
        updateResult = await FormSubmission.updateOne(
          { _id: id },
          {
            $push: {
              employeeFeedbacks: {
                employeeId: session.user.id,
                feedback: data.feedback.trim(),
                submittedAt: new Date()
              }
            },
            $set: {
              "assignedEmployees.$.status": data.status || "completed",
              "assignedEmployees.$.completedAt": data.status === "completed" ? new Date() : null
            }
          },
          { arrayFilters: [{ "elem.employeeId": session.user.id }] }
        );

        notificationData = {
          title: "New Employee Feedback",
          message: `Employee ${session.user.name} submitted feedback on form "${submission.clinetName}".`,
          type: "employee_feedback"
        };
        break;

      case "reply_to_teamlead_feedback":
        // ٹیم لیڈ کے فیڈ بیک کا جواب دینا
        if (!data?.reply) {
          return new Response(JSON.stringify({ error: "Reply is required" }), { status: 400 });
        }

        // پرانا جواب ہٹائیں (اگر موجود ہے)
        await FormSubmission.updateOne(
          { _id: id },
          { $pull: { teamLeadFeedbackReplies: { employeeId: session.user.id } } }
        );

        // نیا جواب شامل کریں
        updateResult = await FormSubmission.updateOne(
          { _id: id },
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

        notificationData = {
          title: "Reply to Team Lead Feedback",
          message: `Employee ${session.user.name} replied to team lead feedback on form "${submission.clinetName}".`,
          type: "feedback_reply"
        };
        break;

      case "comment_on_feedback":
        // کسی دوسرے ایمپلائی کے فیڈ بیک پر کمنٹ کرنا
        if (!data?.comment || !data?.commentOnEmployeeId) {
          return new Response(JSON.stringify({ error: "Comment and employee ID are required" }), { status: 400 });
        }

        updateResult = await FormSubmission.updateOne(
          { _id: id },
          {
            $push: {
              feedbackComments: {
                commentBy: session.user.id,
                commenterModel: "Employee",
                commentOnEmployeeId: data.commentOnEmployeeId,
                comment: data.comment.trim(),
                feedbackId: data.feedbackId,
                createdAt: new Date()
              }
            }
          }
        );

        notificationData = {
          title: "New Comment on Feedback",
          message: `Employee ${session.user.name} commented on feedback for form "${submission.clinetName}".`,
          type: "feedback_comment"
        };
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }

    if (updateResult.modifiedCount === 0) {
      return new Response(JSON.stringify({ error: "Failed to update" }), { status: 400 });
    }

    // نوٹیفیکیشن بھیجیں
    if (notificationData) {
      const receivers = [
        ...(submission.multipleTeamLeadShared || []),
        ...(submission.assignedTo || []),
        submission.submittedBy
      ];

      await Promise.all(
        receivers.map(async (receiverId) => {
          await sendNotification({
            senderId: session.user.id,
            senderModel: "Employee",
            senderName: session.user.name,
            receiverId: receiverId,
            receiverModel: receiverId === submission.submittedBy ? "Manager" : "TeamLead",
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            link: `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/submissions/${id}`,
            referenceId: id,
            referenceModel: "FormSubmission"
          });
        })
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${action.replace(/_/g, ' ')} submitted successfully` 
    }), { status: 200 });

  } catch (error) {
    console.error("Error in employee action:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), { status: 500 });
  }
}