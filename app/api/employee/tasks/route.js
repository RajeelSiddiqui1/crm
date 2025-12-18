// app/api/employee/tasks/route.js
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form";
import Employee from "@/models/Employee";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await dbConnect();

    const submissions = await FormSubmission.find({
      "assignedEmployees.employeeId": session.user.id,
    })
      .populate("formId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .populate("submittedBy", "firstName lastName") // Added this
      .sort({ createdAt: -1 });

    const filteredSubmissions = submissions.map((submission) => {
      const employeeAssignment = submission.assignedEmployees.find(
        (emp) => emp.employeeId._id.toString() === session.user.id
      );

      // Find employee's feedback from feedback array
      const employeeFeedback = submission.employeeFeedbacks?.find(
        (fb) => fb.employeeId.toString() === session.user.id
      );

      return {
        _id: submission._id,
        clinetName: submission.clinetName, // ✅ Fixed: clientName included
        formId: submission.formId,
        submittedBy: submission.submittedBy,
        assignedTo: submission.assignedTo,
        formData: submission.formData,
        status: submission.status,
        status2: submission.status2,
        managerComments: submission.managerComments,
        teamLeadFeedback: submission.teamLeadFeedback,
        employeeStatus: employeeAssignment?.status || "pending",
        employeeFeedback: employeeFeedback?.feedback || "", // ✅ Added employee feedback
        assignedAt: employeeAssignment?.assignedAt,
        completedAt: employeeAssignment?.completedAt,
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

    const { submissionId, status, feedback } = await request.json();

    if (!submissionId || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    await dbConnect();

    // First update the employee status
    const updateQuery = {
      _id: submissionId,
      "assignedEmployees.employeeId": session.user.id,
    };

    const updateData = {
      $set: {
        "assignedEmployees.$.status": status,
        "assignedEmployees.$.completedAt":
          status === "completed" ? new Date() : null,
      },
    };

    // If feedback is provided, add to employeeFeedbacks array
    if (feedback && feedback.trim() !== "") {
      const feedbackObj = {
        employeeId: session.user.id,
        feedback: feedback.trim(),
        submittedAt: new Date(),
      };

      // First remove existing feedback from this employee
      await FormSubmission.updateOne(
        { _id: submissionId },
        { $pull: { employeeFeedbacks: { employeeId: session.user.id } } }
      );

      // Then add new feedback
      updateData.$push = { employeeFeedbacks: feedbackObj };
    }

    const updatedSubmission = await FormSubmission.findOneAndUpdate(
      updateQuery,
      updateData,
      { new: true }
    )
      .populate("formId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .populate("submittedBy", "firstName lastName");

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