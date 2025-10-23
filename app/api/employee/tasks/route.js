// app/api/employee/tasks/route.js
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form"; // ✅ FIX: Register the Form model
import Employee from "@/models/Employee"; // ✅ Recommended: Register Employee model too

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await dbConnect();

    // ✅ Find submissions where this employee is assigned
    const submissions = await FormSubmission.find({
      "assignedEmployees.employeeId": session.user.id,
    })
      .populate("formId", "title description") // needs Form imported
      .populate("assignedEmployees.employeeId", "firstName lastName email") // needs Employee imported
      .sort({ createdAt: -1 });

    // ✅ Filter to include only this employee’s assignment details
    const filteredSubmissions = submissions.map((submission) => {
      const employeeAssignment = submission.assignedEmployees.find(
        (emp) => emp.employeeId._id.toString() === session.user.id
      );

      return {
        _id: submission._id,
        formId: submission.formId,
        submittedBy: submission.submittedBy,
        assignedTo: submission.assignedTo,
        formData: submission.formData,
        status: submission.status, // Manager Status (readonly)
        status2: submission.status2, // TeamLead Status (readonly)
        managerComments: submission.managerComments,
        teamLeadFeedback: submission.teamLeadFeedback,
        employeeStatus: employeeAssignment.status, // Employee's own status
        assignedAt: employeeAssignment.assignedAt,
        completedAt: employeeAssignment.completedAt,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      };
    });

    return new Response(JSON.stringify(filteredSubmissions), { status: 200 });
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
      status: 500,
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { submissionId, status } = await request.json();

    if (!submissionId || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    await dbConnect(); // ✅ fixed function name

    // ✅ Update only the employee’s status in assignedEmployees array
    const updatedSubmission = await FormSubmission.findOneAndUpdate(
      {
        _id: submissionId,
        "assignedEmployees.employeeId": session.user.id,
      },
      {
        $set: {
          "assignedEmployees.$.status": status,
          "assignedEmployees.$.completedAt":
            status === "completed" ? new Date() : null,
        },
      },
      { new: true }
    )
      .populate("formId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email");

    if (!updatedSubmission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedSubmission), { status: 200 });
  } catch (error) {
    console.error("Error updating employee task status:", error);
    return new Response(JSON.stringify({ error: "Failed to update status" }), {
      status: 500,
    });
  }
}
