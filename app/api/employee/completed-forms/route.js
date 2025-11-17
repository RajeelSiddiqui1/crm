import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const subtaskId = searchParams.get("subtaskId");
    const filter = searchParams.get("filter") || "all";

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID required hai" }, { status: 400 });
    }

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: "Subtask nahi mila" }, { status: 404 });
    }

    const isAssigned = subtask.assignedEmployees.some(
      (emp) => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return NextResponse.json({ 
        error: "Aap is subtask par assigned nahi hain" 
      }, { status: 403 });
    }

    let query = {
      subtaskId: subtaskId,
      employeeId: session.user.id
    };

    // Filter logic...
    if (filter !== "all") {
      if (filter === "approved") {
        query.$or = [
          { managerstatus: "approved" },
          { teamleadstatus: "approved" }
        ];
      } else if (filter === "pending") {
        query.managerstatus = "pending";
        query.teamleadstatus = "pending";
      } else if (filter === "rejected") {
        query.$or = [
          { managerstatus: "rejected" },
          { teamleadstatus: "rejected" }
        ];
      } else if (filter === "late") {
        const lateDate = new Date();
        lateDate.setDate(lateDate.getDate() - 7);
        query.createdAt = { $lt: lateDate };
        query.$or = [
          { managerstatus: "pending" },
          { teamleadstatus: "pending" }
        ];
      }
    }

    const allSubmissions = await EmployeeFormSubmission.find(query)
      .populate("formId", "title description fields")
      .sort({ createdAt: -1 });

    // ✅ YEH FIXED CODE HAI - null check add karein
    const completedForms = allSubmissions.map(submission => {
      // Agar formId null hai toh default values use karein
      if (!submission.formId) {
        return {
          _id: submission._id, // submission ID use karein
          title: "Form Delete Ho Gaya",
          description: "Yeh form system se remove kar diya gaya hai",
          fields: [],
          submissionId: submission._id,
          submittedAt: submission.createdAt,
          formData: submission.formData,
          teamleadstatus: submission.teamleadstatus,
          managerstatus: submission.managerstatus,
          status: submission.managerstatus !== "pending" ? submission.managerstatus : 
                  submission.teamleadstatus !== "pending" ? submission.teamleadstatus : "pending"
        };
      }

      // Normal case - formId available hai
      return {
        _id: submission.formId._id,
        title: submission.formId.title,
        description: submission.formId.description,
        fields: submission.formId.fields,
        submissionId: submission._id,
        submittedAt: submission.createdAt,
        formData: submission.formData,
        teamleadstatus: submission.teamleadstatus,
        managerstatus: submission.managerstatus,
        status: submission.managerstatus !== "pending" ? submission.managerstatus : 
                submission.teamleadstatus !== "pending" ? submission.teamleadstatus : "pending"
      };
    });

    return NextResponse.json(completedForms);

  } catch (error) {
    console.error("Completed Forms API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed forms" },
      { status: 500 }
    );
  }
}