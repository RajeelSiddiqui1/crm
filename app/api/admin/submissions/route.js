import { getServerSession } from "next-auth";
import FormSubmission from "@/models/FormSubmission";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    await dbConnect();

    // Get all submissions with full details
    const submissions = await FormSubmission.find({})
      .populate("formId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return new Response(JSON.stringify(submissions), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching admin submissions:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch submissions" }), {
      status: 500,
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { submissionId, statusType, status, comments } = await request.json();

    if (!submissionId || !statusType || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    await connectToDB();

    let updateData = {};
    
    if (statusType === "status") {
      updateData = {
        status: status,
        managerComments: comments || ""
      };
    } else if (statusType === "status2") {
      updateData = {
        status2: status,
        teamLeadFeedback: comments || ""
      };
    }

    if (status === "completed" || status === "approved") {
      updateData.completedAt = new Date();
    }

    const updatedSubmission = await FormSubmission.findByIdAndUpdate(
      submissionId,
      updateData,
      { new: true }
    )
    .populate("formId", "title description")
    .populate("assignedEmployees.employeeId", "firstName lastName email");

    if (!updatedSubmission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedSubmission), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating admin submission:", error);
    return new Response(JSON.stringify({ error: "Failed to update submission" }), {
      status: 500,
    });
  }
}