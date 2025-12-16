import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import "@/models/FormSubmission";
import "@/models/Employee";
import "@/models/Department";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // ✅ Sabhi subtasks fetch karo jisme employee assigned hai
    const subtasks = await Subtask.find({
      "assignedEmployees.employeeId": session.user.id,
    })
      .populate({
        path: "submissionId",
        select: "title description status",
        model: "FormSubmission"
      })
      .populate({
        path: "teamLeadId",
        select: "firstName lastName email avatar designation",
        model: "Employee"
      })
      .populate({
        path: "depId",
        select: "name departmentCode color",
        model: "Department"
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email avatar",
        model: "Employee"
      })
      .sort({ createdAt: -1 })
      .lean(); // Better performance ke liye

    // ✅ Employee ka specific status extract karo har subtask ke liye
    const enhancedSubtasks = subtasks.map(subtask => {
      const employeeAssignment = subtask.assignedEmployees.find(
        emp => emp.employeeId?._id?.toString() === session.user.id
      );
      
      return {
        ...subtask,
        // ✅ Yeh dono fields frontend pe show honge
        employeeStatus: employeeAssignment?.status || "pending",
        employeeCompletedAt: employeeAssignment?.completedAt,
        employeeFeedback: employeeAssignment?.feedback,
        assignedAt: employeeAssignment?.assignedAt,
        
        // ✅ Overall subtask status (team lead ka set kiya hua)
        subtaskStatus: subtask.status,
        
        // ✅ Agar employee ka status "completed" hai lekin team lead ne approve nahi kiya
        needsApproval: employeeAssignment?.status === 'completed' && 
                      subtask.status !== 'approved' && 
                      subtask.status !== 'completed',
      };
    });

    return NextResponse.json({ 
      success: true, 
      subtasks: enhancedSubtasks,
      employeeId: session.user.id 
    });
    
  } catch (error) {
    console.error("❌ Employee subtasks fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}