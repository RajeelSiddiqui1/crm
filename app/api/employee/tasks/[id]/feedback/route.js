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

// POST: Add employee feedback
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
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

    const employee = await Employee.findOne({ email: session.user.email });
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const task = await FormSubmission.findById(id)
      .populate("submittedBy")
      .populate("assignedTo")
      .populate("formId", "title");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if employee is assigned to this task
    const isAssigned = task.assignedEmployees?.some(
      assignment => assignment.employeeId.toString() === employee._id.toString()
    );

    if (!isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Remove old feedback (if exists)
    await FormSubmission.updateOne(
      { _id: id },
      { $pull: { employeeFeedbacks: { employeeId: employee._id } } }
    );

    // Add new feedback
    const updateResult = await FormSubmission.updateOne(
      { _id: id },
      {
        $push: {
          employeeFeedbacks: {
            employeeId: employee._id,
            feedback: feedback.trim(),
            submittedAt: new Date()
          }
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to add feedback" },
        { status: 400 }
      );
    }

    // Send notifications
    const notifications = [];

    // Notify Team Lead
    if (task.assignedTo?.length > 0) {
      await Promise.allSettled(
        task.assignedTo.map(async (teamLead) => {
          notifications.push(
            sendNotification({
              senderId: employee._id,
              senderModel: "Employee",
              senderName: `${employee.firstName} ${employee.lastName}`,
              receiverId: teamLead._id,
              receiverModel: "TeamLead",
              type: "employee_feedback",
              title: "New Employee Feedback",
              message: `${employee.firstName} ${employee.lastName} submitted feedback on task "${task.formId?.title}"`,
              link: `/teamlead/tasks/${task._id}`,
              referenceId: task._id,
              referenceModel: "FormSubmission",
            })
          );

          // Email notification
          const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #333;">New Employee Feedback</h2>
              <p>Employee <strong>${employee.firstName} ${employee.lastName}</strong> has submitted feedback on task:</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin: 0;">${task.formId?.title || "Task"}</h3>
                <p style="margin: 10px 0 0;"><strong>Feedback:</strong> ${feedback.trim()}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks/${task._id}" 
                 style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                View Task Details
              </a>
            </div>
          `;
          await sendMail(teamLead.email, "New Employee Feedback", emailHTML);
        })
      );
    }

    // Notify Manager
    if (task.submittedBy) {
      notifications.push(
        sendNotification({
          senderId: employee._id,
          senderModel: "Employee",
          senderName: `${employee.firstName} ${employee.lastName}`,
          receiverId: task.submittedBy._id,
          receiverModel: "Manager",
          type: "employee_feedback",
          title: "New Employee Feedback",
          message: `${employee.firstName} ${employee.lastName} submitted feedback on task "${task.formId?.title}"`,
          link: `/manager/submissions/detail/${task._id}`,
          referenceId: task._id,
          referenceModel: "FormSubmission",
        })
      );

      // Email notification
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333;">New Employee Feedback</h2>
          <p>Employee <strong>${employee.firstName} ${employee.lastName}</strong> has submitted feedback on task:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0;">${task.formId?.title || "Task"}</h3>
            <p style="margin: 10px 0 0;"><strong>Feedback:</strong> ${feedback.trim()}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_DOMAIN}/manager/submissions/detail/${task._id}" 
             style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Task Details
          </a>
        </div>
      `;
      await sendMail(task.submittedBy.email, "New Employee Feedback", emailHTML);
    }

    await Promise.allSettled(notifications);

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Add feedback error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT: Reply to team lead feedback
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

    // Check only employee can reply
    if (session.user.role !== "Employee") {
      return NextResponse.json(
        { error: "Only employees can reply to feedback" },
        { status: 403 }
      );
    }

    const employee = await Employee.findOne({ email: session.user.email });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const task = await FormSubmission.findById(id)
      .populate("teamLeadFeedbacks.teamLeadId")
      .populate("formId", "title")
      .populate("submittedBy")
      .populate("assignedTo");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if employee is assigned to this task
    const isAssigned = task.assignedEmployees?.some(
      assignment => assignment.employeeId.toString() === employee._id.toString()
    );

    if (!isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find feedback
    const feedback = task.teamLeadFeedbacks.id(feedbackId);
    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Add reply
    const newReply = {
      repliedBy: employee._id,
      repliedByModel: "Employee",
      reply: reply.trim(),
      repliedAt: new Date()
    };

    feedback.replies.push(newReply);
    await task.save();

    // Send notifications
    const notifications = [];

    // Notify original feedback giver
    if (feedback.teamLeadId._id.toString() !== employee._id.toString()) {
      const originalTeamLead = feedback.teamLeadId;
      if (originalTeamLead) {
        notifications.push(
          sendNotification({
            senderId: employee._id,
            senderModel: "Employee",
            senderName: `${employee.firstName} ${employee.lastName}`,
            receiverId: originalTeamLead._id,
            receiverModel: "TeamLead",
            type: "feedback_reply",
            title: "New Reply to Your Feedback",
            message: `${employee.firstName} ${employee.lastName} replied to your feedback on task "${task.formId?.title}"`,
            link: `/teamlead/tasks/${task._id}`,
            referenceId: task._id,
            referenceModel: "FormSubmission",
          })
        );

        // Email notification
        const emailHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333;">New Reply to Your Feedback</h2>
            <p>Employee <strong>${employee.firstName} ${employee.lastName}</strong> has replied to your feedback on task:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin: 0;">${task.formId?.title || "Task"}</h3>
              <div style="margin: 10px 0;">
                <p><strong>Your Original Feedback:</strong></p>
                <p style="padding: 10px; background: #fff; border-left: 4px solid #0070f3;">${feedback.feedback}</p>
              </div>
              <div style="margin: 10px 0;">
                <p><strong>Employee's Reply:</strong></p>
                <p style="padding: 10px; background: #fff; border-left: 4px solid #10b981;">${reply.trim()}</p>
              </div>
            </div>
            <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks/${task._id}" 
               style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              View Task Details
            </a>
          </div>
        `;
        await sendMail(originalTeamLead.email, "New Reply to Your Feedback", emailHTML);
      }
    }

    // Notify other team leads
    if (task.assignedTo?.length > 0) {
      await Promise.allSettled(
        task.assignedTo.map(async (teamLead) => {
          if (teamLead._id.toString() !== feedback.teamLeadId._id.toString()) {
            notifications.push(
              sendNotification({
                senderId: employee._id,
                senderModel: "Employee",
                senderName: `${employee.firstName} ${employee.lastName}`,
                receiverId: teamLead._id,
                receiverModel: "TeamLead",
                type: "feedback_reply",
                title: "New Reply to Feedback",
                message: `${employee.firstName} ${employee.lastName} replied to feedback on task "${task.formId?.title}"`,
                link: `/teamlead/tasks/${task._id}`,
                referenceId: task._id,
                referenceModel: "FormSubmission",
              })
            );
          }
        })
      );
    }

    // Notify Manager
    if (task.submittedBy) {
      notifications.push(
        sendNotification({
          senderId: employee._id,
          senderModel: "Employee",
          senderName: `${employee.firstName} ${employee.lastName}`,
          receiverId: task.submittedBy._id,
          receiverModel: "Manager",
          type: "feedback_reply",
          title: "New Reply to Feedback",
          message: `${employee.firstName} ${employee.lastName} replied to team lead feedback on task "${task.formId?.title}"`,
          link: `/manager/submissions/detail/${task._id}`,
          referenceId: task._id,
          referenceModel: "FormSubmission",
        })
      );

      // Email notification
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333;">Employee Replied to Feedback</h2>
          <p>Employee <strong>${employee.firstName} ${employee.lastName}</strong> has replied to team lead feedback on task:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0;">${task.formId?.title || "Task"}</h3>
            <div style="margin: 10px 0;">
              <p><strong>Team Lead Feedback:</strong></p>
              <p style="padding: 10px; background: #fff; border-left: 4px solid #0070f3;">${feedback.feedback}</p>
            </div>
            <div style="margin: 10px 0;">
              <p><strong>Employee's Reply:</strong></p>
              <p style="padding: 10px; background: #fff; border-left: 4px solid #10b981;">${reply.trim()}</p>
            </div>
          </div>
          <a href="${process.env.NEXT_PUBLIC_DOMAIN}/manager/submissions/detail/${task._id}" 
             style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Task Details
          </a>
        </div>
      `;
      await sendMail(task.submittedBy.email, "Employee Replied to Feedback", emailHTML);
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



// GET: Get team lead feedbacks and replies
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const employee = await Employee.findOne({ email: session.user.email });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const task = await FormSubmission.findById(id)
      .populate("teamLeadFeedbacks.teamLeadId", "firstName lastName email department profileImage")
      .populate("teamLeadFeedbacks.replies.repliedBy", "firstName lastName email profileImage")
      .select("teamLeadFeedbacks assignedEmployees");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if employee is assigned to this task
    const isAssigned = task.assignedEmployees?.some(
      assignment => assignment.employeeId.toString() === employee._id.toString()
    );

    if (!isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      feedbacks: task.teamLeadFeedbacks,
      employeeId: employee._id
    }, { status: 200 });

  } catch (error) {
    console.error("Get feedbacks error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}