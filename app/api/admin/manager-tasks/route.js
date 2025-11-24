// app/api/admin/manager-tasks/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import AdminTask from "@/models/AdminTask";
import Employee from "@/models/Employee";
import Form from "@/models/Form"; 
import Manager from "@/models/Manager";

export async function GET(req) {
  await dbConnect();

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    // Build search query if search term exists
    if (search) {
      query.$or = [
        { submittedBy: { $regex: search, $options: "i" } },
        { assignedTo: { $regex: search, $options: "i" } },
        { "formData.$**": { $regex: search, $options: "i" } }
      ];
    }

    const formSubmissions = await FormSubmission.find(query)
      .populate({
        path: "formId",
        select: "title description fields",
        model: Form,
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "name email role department firstName lastName",
        model: Employee,
      })
      .populate({
        path: "adminTask",
        select: "title clientName endDate priority managers",
        model: AdminTask,
      })
      .sort({ createdAt: -1 });

    // Agar submittedBy mein Manager ID hai to uska naam fetch karo
    const submissionsWithManagerNames = await Promise.all(
      formSubmissions.map(async (submission) => {
        const submissionObj = submission.toObject();
        
        try {
          // Check if submittedBy is a valid ObjectId (Manager ID)
          if (mongoose.Types.ObjectId.isValid(submission.submittedBy)) {
            const manager = await Manager.findById(submission.submittedBy)
              .select("firstName lastName email")
              .lean();
            
            if (manager) {
              return {
                ...submissionObj,
                submittedBy: `${manager.firstName} ${manager.lastName}`,
                managerEmail: manager.email,
                managerDetails: manager
              };
            }
          }
          return submissionObj;
        } catch (error) {
          console.error("Error fetching manager:", error);
          return submissionObj;
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      formSubmissions: submissionsWithManagerNames || [] 
    });
  } catch (error) {
    console.error("Error fetching manager tasks:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch manager tasks",
        formSubmissions: [] 
      },
      { status: 500 }
    );
  }
}