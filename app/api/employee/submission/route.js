import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import EmployeeForm from "@/models/EmployeeForm";
import Employee from "@/models/Employee";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { submissionTaskMailTemplate } from "@/helper/emails/employee/submissionTask";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { formId, subtaskId, formData } = await req.json();

    if (!formId || !subtaskId) {
      return NextResponse.json({ 
        error: "Form ID and Subtask ID are required" 
      }, { status: 400 });
    }

    let actualFormId = formId.includes('_originalId_') ? formId.split('_originalId_')[0] : formId;

    const form = await EmployeeForm.findById(actualFormId);
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

    // ✅ Check if employee is assigned to this subtask
    const isAssigned = subtask.assignedEmployees.some(
      (emp) => emp.employeeId.toString() === session.user.id
    );
    if (!isAssigned) return NextResponse.json({ error: "You are not assigned to this subtask" }, { status: 403 });

    // Check lead requirement
    const leadRequired = subtask.lead || 1;
    const approvedSubmissions = await EmployeeFormSubmission.countDocuments({
      subtaskId,
      employeeId: session.user.id,
      teamleadstatus: "approved"
    });
    if (approvedSubmissions >= leadRequired) {
      return NextResponse.json(
        { error: `You have completed all ${leadRequired} required forms.` },
        { status: 400 }
      );
    }

    const employee = await Employee.findById(session.user.id);
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // Create new submission
    const submission = new EmployeeFormSubmission({
      formId: actualFormId,
      subtaskId,
      employeeId: session.user.id,
      submittedBy: `${employee.firstName} ${employee.lastName}`,
      assignedTo: subtask.assignedTo || "Team Lead",
      formData,
      teamleadstatus: "pending",
      managerStatus: "pending",
      createdAt: new Date()
    });

    await submission.save();

    // ✅ Send notification & mail to TeamLead based on subtask.teamLeadId
    if (subtask.teamLeadId) {
      const teamLead = await Employee.findById(subtask.teamLeadId);
      if (teamLead) {
        const submissionLink = `${process.env.NEXTAUTH_URL}/teamlead/subtasks/${subtask._id}/submissions`;
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        const teamLeadName = `${teamLead.firstName} ${teamLead.lastName}`;

        await Promise.all([
          sendNotification({
            senderId: employee._id,
            senderModel: "Employee",
            senderName: employeeName,
            receiverId: teamLead._id,
            receiverModel: "Employee",
            type: "subtask_submission",
            title: "New Subtask Submission",
            message: `${employeeName} submitted a form for subtask: "${subtask.title}"`,
            link: submissionLink,
            referenceId: submission._id,
            referenceModel: "EmployeeFormSubmission"
          }),
          sendMail(
            teamLead.email,
            "New Subtask Submission",
            submissionTaskMailTemplate(
              teamLeadName,
              employeeName,
              subtask.title,
              submissionLink,
              submission.createdAt
            )
          )
        ]);
      }
    }

    return NextResponse.json(
      { 
        message: "Form submitted successfully!", 
        submissionId: submission._id,
        submission: {
          _id: submission._id,
          teamleadstatus: submission.teamleadstatus,
          managerStatus: submission.managerStatus,
          submittedAt: submission.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}
