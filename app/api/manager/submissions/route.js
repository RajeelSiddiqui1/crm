import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import { getServerSession } from "next-auth";
import Form from "@/models/Form";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { sendNotification } from "@/lib/sendNotification";
import { statusUpdateMailTemplate } from "@/helper/emails/manager/statusUpdateMailTemplate";

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { submissionId, status, managerComments } = body;

    if (!submissionId || !status) {
      return NextResponse.json({ error: "Submission ID and status are required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id;
    const managerName = session.user.firstName ? `${session.user.firstName} ${session.user.lastName}` : session.user.name;

    const submission = await FormSubmission.findOne({
      _id: submissionId,
      submittedBy: managerId,
    })
      .populate("formId")
      .populate("multipleTeamLeadAssigned")
      .populate("assignedEmployees.employeeId");

    if (!submission) {
      return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    const oldStatus = submission.status;

    submission.status = status;
    if (managerComments) submission.managerComments = managerComments;
    await submission.save();

    const teamLeads = submission.multipleTeamLeadAssigned || [];
    const employees = submission.assignedEmployees || [];

    await Promise.all([
      ...teamLeads.map(async (tl) => {
        const html = statusUpdateMailTemplate(tl.firstName || "Team Lead", submission.formId.title, oldStatus, status, managerName);
        await sendMail(tl.email, "Status Updated", html);
        await sendNotification({
          senderId: managerId,
          senderModel: "Manager",
          senderName: managerName,
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "status_updated",
          title: "Status Updated",
          message: `Task "${submission.formId.title}" status updated from ${oldStatus} to ${status}.`,
          referenceId: submission._id,
          referenceModel: "FormSubmission",
        });
      }),

      ...employees.map(async (emp) => {
        const html = statusUpdateMailTemplate(emp.employeeId.firstName || "Employee", submission.formId.title, oldStatus, status, managerName);
        await sendMail(emp.employeeId.email, "Status Updated", html);
        await sendNotification({
          senderId: managerId,
          senderModel: "Manager",
          senderName: managerName,
          receiverId: emp.employeeId._id,
          receiverModel: "Employee",
          type: "status_updated",
          title: "Status Updated",
          message: `Task "${submission.formId.title}" status updated from ${oldStatus} to ${status}.`,
          referenceId: submission._id,
          referenceModel: "FormSubmission",
        });
      }),
    ]);

    const updatedSubmission = await FormSubmission.findById(submissionId)
      .populate("formId")
      .populate("assignedEmployees.employeeId")
      .populate("multipleTeamLeadAssigned")
      .lean();

    return NextResponse.json({ message: "Status updated successfully", submission: updatedSubmission }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id;

    // Find submissions where this manager is in the multipleManagerShared array
   const submissions = await FormSubmission.find({
  $or: [
    { multipleManagerShared: managerId },
    { submittedBy: managerId }
  ]
})
  .populate("formId", "title description fields depId")
  .populate("submittedBy", "firstName lastName email")
  .populate("multipleManagerShared", "firstName lastName email")
  .populate("sharedBy", "firstName lastName email")
  .populate("assignedEmployees.employeeId", "firstName lastName email depId")
  .populate("assignedTo", "firstName lastName email")
  .populate("multipleTeamLeadAssigned", "firstName lastName email")
  .sort({ createdAt: -1 })
  .lean();


    return Response.json(submissions, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}