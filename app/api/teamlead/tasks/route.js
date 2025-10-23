// app/api/teamlead/tasks/route.js
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

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Access denied. TeamLead role required." }, { status: 403 });
    }

    await dbConnect();

    const assignedTo = session.user.email;

    if (!assignedTo) {
      return NextResponse.json({ error: "TeamLead email not found in session" }, { status: 400 });
    }

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

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, submittedBy, formData, assignedEmployees } = await req.json();

    if (!formId || !submittedBy || !formData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create new submission with assigned employees
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

    // Send emails to assigned employees
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
      }
    }

    return NextResponse.json(
      { message: "Task created successfully", submission },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, statusType, status, teamLeadFeedback, assignedEmployees } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID required" }, { status: 400 });
    }

    const submission = await FormSubmission.findById(submissionId)
      .populate("formId")
      .populate("assignedEmployees.employeeId");

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Update status if provided
    if (statusType && status) {
      if (statusType === "status") {
        submission.status = status;
      } else if (statusType === "status2") {
        submission.status2 = status;
      }

      if (teamLeadFeedback) submission.teamLeadFeedback = teamLeadFeedback;

      if (
        (statusType === "status" && status === "completed") ||
        (statusType === "status2" && status === "completed")
      ) {
        submission.completedAt = new Date();
      }
    }

    // Update assigned employees if provided
    if (assignedEmployees) {
      submission.assignedEmployees = assignedEmployees;
    }

    await submission.save();

    return NextResponse.json(
      { message: "Task updated successfully", submission },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}