import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import Form from "@/models/Form";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { sendTaskStatusUpdateMail } from "@/helper/emails/teamlead/task-status-update";
import { sendEmployeeTaskAssignmentMail } from "@/helper/emails/teamlead/assignedEmployee";
import { sendNotification } from "@/lib/sendNotification";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const submissions = await FormSubmission.find({
      assignedTo: session.user.id,
    })
      .populate("formId")
      .populate("assignedEmployees.employeeId")
      .sort({ createdAt: -1 });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("GET TeamLead submissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { formId, submittedBy, formData, assignedEmployees } =
      await req.json();
    if (!formId || !submittedBy || !formData)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    const submission = new FormSubmission({
      formId,
      submittedBy,
      assignedTo: session.user.email,
      formData,
      assignedEmployees: assignedEmployees || [],
      status: "pending",
      status2: "pending",
    });

    await submission.save();

    // Send notifications and emails to assigned employees in parallel
    if (assignedEmployees?.length) {
      await Promise.all(
        assignedEmployees.map(async (emp) => {
          try {
            const employee = await Employee.findById(emp.employeeId);
            if (!employee) return;

            // Email
            const emailHTML = sendEmployeeTaskAssignmentMail({
              name: `${employee.firstName} ${employee.lastName}`,
              formTitle: submission.formId?.title || "New Task",
              assignedBy: `${session.user.firstName} ${session.user.lastName}`,
              taskId: submission._id.toString(),
            });
            sendMail(employee.email, "New Task Assigned", emailHTML).catch(
              () => {}
            );

            // Notification
            sendNotification({
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
              referenceModel: "FormSubmission",
            }).catch(() => {});
          } catch (err) {
            console.warn(
              `Error processing employee ${emp.employeeId}:`,
              err.message
            );
          }
        })
      );
    }

    return NextResponse.json(
      { message: "Task created successfully", submission },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST TeamLead task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const {
      submissionId,
      statusType,
      status,
      teamLeadFeedback,
      assignedEmployees,
    } = await req.json();
    if (!submissionId)
      return NextResponse.json(
        { error: "Submission ID required" },
        { status: 400 }
      );

    const submission = await FormSubmission.findById(submissionId)
      .populate("formId")
      .populate("assignedEmployees.employeeId");

    if (!submission)
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );

    if (statusType && status) {
      if (statusType === "status") submission.status = status;
      else if (statusType === "status2") submission.status2 = status;

      if (teamLeadFeedback) submission.teamLeadFeedback = teamLeadFeedback;
      if (
        (statusType === "status" || statusType === "status2") &&
        status === "completed"
      )
        submission.completedAt = new Date();
    }

    if (assignedEmployees) submission.assignedEmployees = assignedEmployees;

    await submission.save();

    // Notify employees about status update in parallel
    if (assignedEmployees?.length && status) {
      await Promise.all(
        assignedEmployees.map(async (emp) => {
          try {
            const employee = await Employee.findById(emp.employeeId);
            if (!employee) return;

            // Email
            const emailHTML = sendTaskStatusUpdateMail({
              name: `${employee.firstName} ${employee.lastName}`,
              formTitle: submission.formId?.title || "Task",
              status,
              updatedBy: `${session.user.firstName} ${session.user.lastName}`,
            });
            sendMail(employee.email, "Task Status Updated", emailHTML).catch(
              () => {}
            );

            // Notification
            sendNotification({
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
              referenceModel: "FormSubmission",
            }).catch(() => {});
          } catch (err) {
            console.warn(
              `Error notifying employee ${emp.employeeId}:`,
              err.message
            );
          }
        })
      );
    }

    return NextResponse.json(
      { message: "Task updated successfully", submission },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT TeamLead task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
