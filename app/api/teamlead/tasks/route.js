import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form";
import Employee from "@/models/Employee";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { sendTaskStatusUpdateMail } from "@/helper/emails/teamlead/task-status-update";
import { sendEmployeeTaskAssignmentMail } from "@/helper/emails/teamlead/employee-assignment";
import { sendNotification } from "@/lib/sendNotification";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    if (session.user.role !== "TeamLead") return NextResponse.json({ error: "Access denied. TeamLead role required." }, { status: 403 });

    await dbConnect();

    const assignedTo = session.user.email;
    if (!assignedTo) return NextResponse.json({ error: "TeamLead email not found in session" }, { status: 400 });

    const submissions = await FormSubmission.find({ assignedTo })
      .populate("formId")
      .populate("assignedEmployees.employeeId")
      .sort({ createdAt: -1 });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Fetch teamlead submissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { formId, submittedBy, formData, assignedEmployees } = await req.json();
    if (!formId || !submittedBy || !formData) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const submission = new FormSubmission({
      formId,
      submittedBy,
      assignedTo: session.user.email,
      formData,
      assignedEmployees: assignedEmployees || [],
      status: "pending",
      status2: "pending"
    });

    await submission.save();

    if (assignedEmployees && assignedEmployees.length > 0) {
      for (const emp of assignedEmployees) {
        try {
          const employee = await Employee.findById(emp.employeeId);
          if (employee && employee.email) {
            const html = sendEmployeeTaskAssignmentMail({
              name: `${employee.firstName} ${employee.lastName}`,
              formTitle: submission.formId?.title || "New Task",
              assignedBy: `${session.user.firstName} ${session.user.lastName}`,
              taskId: submission._id.toString()
            });
            await sendMail(employee.email, "New Task Assigned", html);
          }
        } catch (mailError) {
          console.warn(`Failed to send email to employee ${emp.employeeId}:`, mailError.message);
        }

        try {
          const employee = await Employee.findById(emp.employeeId);
          if (employee) {
            await sendNotification({
              senderId: session.user.id,
              senderModel: "TeamLead",
              senderName: `${session.user.firstName} ${session.user.lastName}`,
              receiverId: employee._id,
              receiverModel: "Employee",
              type: "task_assigned",
              title: "New Task Assigned",
              message: `A new task "${submission.formId?.title}" has been assigned to you.`,
              link: `${process.env.TASK_LINK}/employee/tasks`,
              referenceId: submission._id,
              referenceModel: "FormSubmission"
            });
          }
        } catch (notifyError) {
          console.error(`Notification failed for employee ${emp.employeeId}:`, notifyError.message);
        }
      }
    }

    return NextResponse.json({ message: "Task created successfully", submission }, { status: 201 });
  } catch (error) {
    console.error("POST tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId, statusType, status, teamLeadFeedback, assignedEmployees } = await req.json();
    if (!submissionId) return NextResponse.json({ error: "Submission ID required" }, { status: 400 });

    const submission = await FormSubmission.findById(submissionId)
      .populate("formId")
      .populate("assignedEmployees.employeeId");
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (statusType && status) {
      if (statusType === "status") submission.status = status;
      else if (statusType === "status2") submission.status2 = status;

      if (teamLeadFeedback) submission.teamLeadFeedback = teamLeadFeedback;
      if ((statusType === "status" || statusType === "status2") && status === "completed") submission.completedAt = new Date();
    }

    if (assignedEmployees) submission.assignedEmployees = assignedEmployees;

    await submission.save();

    if (status === "completed" && assignedEmployees && assignedEmployees.length > 0) {
      for (const emp of assignedEmployees) {
        try {
          const employee = await Employee.findById(emp.employeeId);
          if (employee && employee.email) {
            const html = sendTaskStatusUpdateMail({
              name: `${employee.firstName} ${employee.lastName}`,
              formTitle: submission.formId?.title || "Task",
              status,
              updatedBy: `${session.user.firstName} ${session.user.lastName}`
            });
            await sendMail(employee.email, "Task Status Updated", html);
          }
        } catch (mailError) {
          console.warn(`Failed to send email to employee ${emp.employeeId}:`, mailError.message);
        }

        try {
          const employee = await Employee.findById(emp.employeeId);
          if (employee) {
            await sendNotification({
              senderId: session.user.id,
              senderModel: "TeamLead",
              senderName: `${session.user.firstName} ${session.user.lastName}`,
              receiverId: employee._id,
              receiverModel: "Employee",
              type: "task_status_updated",
              title: "Task Status Updated",
              message: `Task "${submission.formId?.title}" status updated to ${status}.`,
              link: `${process.env.TASK_LINK}/employee/tasks`,
              referenceId: submission._id,
              referenceModel: "FormSubmission"
            });
          }
        } catch (notifyError) {
          console.error(`Notification failed for employee ${emp.employeeId}:`, notifyError.message);
        }
      }
    }

    return NextResponse.json({ message: "Task updated successfully", submission }, { status: 200 });
  } catch (error) {
    console.error("PUT tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
