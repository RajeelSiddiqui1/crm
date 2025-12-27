import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import FormSubmission from "@/models/FormSubmission";
import Department from "@/models/Department";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // ✅ Sabhi subtasks fetch karo jisme manager assigned hai
    const subtasks = await Subtask.find({
      "assignedManagers.managerId": session.user.id,
    })
      .populate({
        path: "submissionId",
        select: "title description status",
        model: "FormSubmission"
      })
      .populate({
        path: "teamLeadId",
        select: "firstName lastName email avatar designation",
        model: "TeamLead"
      })
      .populate({
        path: "depId",
        select: "name departmentCode color",
        model: "Department"
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email avatar designation department",
        model: "Employee"
      })
      .populate({
        path: "assignedManagers.managerId",
        select: "firstName lastName email avatar",
        model: "Manager"
      })
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Manager ka specific status extract karo har subtask ke liye
    const enhancedSubtasks = subtasks.map(subtask => {
      const managerAssignment = subtask.assignedManagers.find(
        mgr => mgr.managerId?._id?.toString() === session.user.id
      );

      // ✅ Employee status summary calculate karo
      const assignedEmployees = subtask.assignedEmployees || [];
      const completedEmployees = assignedEmployees.filter(emp => 
        emp.status === 'completed' || emp.status === 'approved'
      ).length;
      const inProgressEmployees = assignedEmployees.filter(emp => 
        emp.status === 'in_progress'
      ).length;
      const pendingEmployees = assignedEmployees.filter(emp => 
        emp.status === 'pending'
      ).length;

      // ✅ Leads progress calculate karo
      const totalLeadsRequired = parseInt(subtask.lead) || 0;
      let leadsCompleted = 0;
      
      // Employees ke leads
      assignedEmployees.forEach(emp => {
        leadsCompleted += emp.leadsCompleted || 0;
      });
      
      // Managers ke leads
      subtask.assignedManagers?.forEach(mgr => {
        leadsCompleted += mgr.leadsCompleted || 0;
      });

      return {
        ...subtask,
        // ✅ Manager-specific fields
        employeeStatus: managerAssignment?.status || "pending",
        managerCompletedAt: managerAssignment?.completedAt,
        managerFeedback: managerAssignment?.feedback,
        managerAssignedAt: managerAssignment?.assignedAt,
        managerLeadsCompleted: managerAssignment?.leadsCompleted || 0,
        managerLeadsAssigned: managerAssignment?.leadsAssigned || 0,
        
        // ✅ Overall task status
        subtaskStatus: subtask.status,
        
        // ✅ Team statistics
        teamStats: {
          totalEmployees: assignedEmployees.length,
          completed: completedEmployees,
          inProgress: inProgressEmployees,
          pending: pendingEmployees,
          completionRate: assignedEmployees.length > 0 
            ? Math.round((completedEmployees / assignedEmployees.length) * 100)
            : 0
        },
        
        // ✅ Leads statistics
        leadsStats: {
          required: totalLeadsRequired,
          completed: leadsCompleted,
          progress: totalLeadsRequired > 0 
            ? Math.round((leadsCompleted / totalLeadsRequired) * 100)
            : 0
        },
        
        // ✅ Agar manager ka status "completed" hai lekin task approve nahi hua
        needsApproval: managerAssignment?.status === 'completed' && 
                      subtask.status !== 'approved' && 
                      subtask.status !== 'completed',
        
        // ✅ Time tracking
        isOverdue: new Date(subtask.endDate) < new Date() && 
                  !["completed", "approved"].includes(subtask.status)
      };
    });

    return NextResponse.json({ 
      success: true, 
      subtasks: enhancedSubtasks,
      managerId: session.user.id,
      totalTasks: enhancedSubtasks.length
    });
    
  } catch (error) {
    console.error("❌ Manager subtasks fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch manager tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    
    // ✅ Manager ko directly task assign karne ki permission (optional)
    // Yeh sirf team leads ke liye ho sakta hai
    return NextResponse.json(
      { error: "Managers cannot directly create tasks. Contact team lead." },
      { status: 403 }
    );
    
  } catch (error) {
    console.error("❌ Manager task creation error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}