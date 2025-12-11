import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

// ✅ Import all referenced models
import Subtask from "@/models/Subtask";
import "@/models/FormSubmission"; 
import "@/models/EmployeeFormSubmission";
import "@/models/Employee"; // ✅ Employee model add karna
import "@/models/Department"; // ✅ Department model add karna

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // ✅ FIX: Populate sabhi required fields
    const subtasks = await Subtask.find({
      "assignedEmployees.employeeId": session.user.id,
    })
      .populate({
        path: "submissionId",
        select: "title description",
        model: "FormSubmission" // Explicit model mention
      })
      .populate({
        path: "teamLeadId",
        select: "firstName lastName email",
        model: "Employee"
      })
      .populate({
        path: "depId",
        select: "name departmentCode",
        model: "Department" // Ya "Departments" - jo bhi aapke model ka naam hai
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email",
        model: "Employee"
      })
      .sort({ createdAt: -1 }); // ✅ Latest tasks pehle

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("❌ Employee subtasks fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}