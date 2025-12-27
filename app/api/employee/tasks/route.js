// app/api/employee/tasks/route.js
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import FormSubmission from "@/models/FormSubmission";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Department from "@/models/Department";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import From from "@/models/Form"

// Temporary Email Template
export function employeeFeedbackMailTemplate(receiverName, employeeName, clientName, link) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        <h2 style="color: #333;">Hello ${receiverName},</h2>
        <p>Employee <strong>${employeeName}</strong> has submitted feedback for the form <strong>${clientName}</strong>.</p>
        <p>Click the button below to view the feedback:</p>
        <a href="${link}" style="display:inline-block; padding:10px 20px; background:#0070f3; color:white; border-radius:5px; text-decoration:none;">View Submission</a>
      </div>
    </div>
  `;
}

// PUT Route: Update Employee Task Status & Feedback
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { submissionId, status, feedback } = await request.json();

    if (!submissionId || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    await dbConnect();

    // -------------------------------
    // Update Employee Status
    // -------------------------------
    const updateQuery = {
      _id: submissionId,
      "assignedEmployees.employeeId": session.user.id,
    };

    const updateData = {
      $set: {
        "assignedEmployees.$.status": status,
        "assignedEmployees.$.completedAt": status === "completed" ? new Date() : null,
      },
    };

    // Add Feedback if Provided
    if (feedback && feedback.trim() !== "") {
      const feedbackObj = {
        employeeId: session.user.id,
        feedback: feedback.trim(),
        submittedAt: new Date(),
      };

      await FormSubmission.updateOne(
        { _id: submissionId },
        { $pull: { employeeFeedbacks: { employeeId: session.user.id } } }
      );

      updateData.$push = { employeeFeedbacks: feedbackObj };
    }

    const updatedSubmission = await FormSubmission.findOneAndUpdate(
      updateQuery,
      updateData,
      { new: true }
    )
      .populate("formId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .populate("submittedBy", "firstName lastName multipleManagerShared multipleTeamLeadShared");

    if (!updatedSubmission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), { status: 404 });
    }

    // -------------------------------
    // Notify Managers & Team Leads
    // -------------------------------
    const managersToNotifyIds = [
      updatedSubmission.submittedBy._id,
      ...(updatedSubmission.multipleManagerShared || [])
    ];

    const teamLeadsToNotifyIds = updatedSubmission.multipleTeamLeadShared || [];

    const managersToNotify = await Manager.find({ _id: { $in: managersToNotifyIds } });
    const teamLeadsToNotify = await TeamLead.find({ _id: { $in: teamLeadsToNotifyIds } });

    const submissionLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/submissions/${submissionId}`;
    const employeeName = session.user.name || "Employee";
    const clientName = updatedSubmission.clinetName || updatedSubmission.formId.title;

    await Promise.all([
      // Notify Managers
      ...managersToNotify.map(async (manager) => {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Employee",
          senderName: employeeName,
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "employee_feedback",
          title: "New Employee Feedback",
          message: `Employee ${employeeName} submitted feedback on form "${clientName}".`,
          link: submissionLink,
          referenceId: updatedSubmission._id,
          referenceModel: "FormSubmission",
        });

        const emailHtml = employeeFeedbackMailTemplate(manager.firstName, employeeName, clientName, submissionLink);
        await sendMail(manager.email, "Employee Feedback Submitted", emailHtml);
      }),

      // Notify Team Leads
      ...teamLeadsToNotify.map(async (tl) => {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Employee",
          senderName: employeeName,
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "employee_feedback",
          title: "New Employee Feedback",
          message: `Employee ${employeeName} submitted feedback on form "${clientName}".`,
          link: submissionLink,
          referenceId: updatedSubmission._id,
          referenceModel: "FormSubmission",
        });

        const emailHtml = employeeFeedbackMailTemplate(tl.firstName, employeeName, clientName, submissionLink);
        await sendMail(tl.email, "Employee Feedback Submitted", emailHtml);
      })
    ]);

    return new Response(JSON.stringify(updatedSubmission), { status: 200 });

  } catch (error) {
    console.error("Error updating employee task status:", error);
    return new Response(JSON.stringify({ error: "Failed to update status", message: error.message }), { status: 500 });
  }
}





export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    await dbConnect();

    const submissions = await FormSubmission.find({
      "assignedEmployees.employeeId": session.user.id,
    })
      .populate("formId", "title description")
      .populate("depId", "name description")
      .populate("submittedBy", "firstName lastName email phone department")
      .populate("assignedTo", "firstName lastName email phone department")
      .populate("multipleManagerShared", "firstName lastName email phone")
      .populate("multipleTeamLeadShared", "firstName lastName email department")
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email department position phone",
      })
      .populate("employeeFeedbacks.employeeId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    const userId = session.user.id.toString();

    const filteredSubmissions = submissions.map((submission) => {
      const employeeAssignment = submission.assignedEmployees.find(
        (emp) =>
          emp.employeeId?._id?.toString() === userId ||
          emp.employeeId?.toString() === userId
      );

      const employeeFeedback = submission.employeeFeedbacks?.find(
        (fb) =>
          fb.employeeId?._id?.toString() === userId ||
          fb.employeeId?.toString() === userId
      );

      return {
        _id: submission._id,
        clinetName: submission.clinetName || "Unnamed Client",
        formId: submission.formId || { title: "Untitled Form", description: "" },
        depId: submission.depId || { name: "No Department" },
        submittedBy: submission.submittedBy || { firstName: "Unknown", lastName: "Manager" },
        assignedTo: submission.assignedTo || [],
        multipleManagerShared: submission.multipleManagerShared || [],
        multipleTeamLeadShared: submission.multipleTeamLeadShared || [],
        formData: submission.formData || {},
        status: submission.status,
        status2: submission.status2,
        adminStatus: submission.adminStatus,
        managerComments: submission.managerComments,
        teamLeadFeedback: submission.teamLeadFeedback || [],
        employeeStatus: employeeAssignment?.status || "pending",
        employeeFeedback: employeeFeedback?.feedback || "",
        assignedAt: employeeAssignment?.assignedAt,
        completedAt: employeeAssignment?.completedAt,
        claimedAt: submission.claimedAt,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      };
    });

    return new Response(JSON.stringify(filteredSubmissions), { status: 200 });
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch tasks", message: error.message }),
      { status: 500 }
    );
  }
}
