import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Employee from "@/models/Employee";
import Subtask from "@/models/Subtask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import SharedTask from "@/models/SharedTask";
import TeamLead from "@/models/TeamLead";
import EmployeeForm from "@/models/EmployeeForm";
import Manager from "@/models/Manager";
import Department from "@/models/Department";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const employeeId = session.user.id;

    // Get current employee details
    const employee = await Employee.findById(employeeId)
      .populate("managerId", "firstName lastName email profilePic")
      .populate("depId", "name description logoUrl")
      .lean();

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // Current date calculations
    const currentDate = new Date();
    const startOfToday = new Date(currentDate.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch all stats in parallel
    const [
      // Task counts
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      
      // Form counts
      totalForms,
      completedForms,
      pendingForms,
      approvedForms,
      
      // Shared tasks
      totalSharedTasks,
      pendingSharedTasks,
      signedSharedTasks,
      
      // Today's activity
      tasksAssignedToday,
      tasksCompletedToday,
      formsSubmittedToday,
      
      // Recent data
      recentTasks,
      recentForms,
      recentSharedTasks,
      
      // Team information
      teamLeadInfo,
      teamMembersCount,
      
      // Performance metrics
      taskCompletionRate,
      formCompletionRate,
      avgTaskCompletionTime,
      
    ] = await Promise.all([
      // Total tasks assigned
      Subtask.countDocuments({ 
        "assignedEmployees.employeeId": employeeId
      }),
      
      // Completed tasks
      Subtask.countDocuments({ 
        "assignedEmployees.employeeId": employeeId,
        "assignedEmployees.status": "completed"
      }),
      
      // Pending tasks
      Subtask.countDocuments({ 
        "assignedEmployees.employeeId": employeeId,
        "assignedEmployees.status": "pending"
      }),
      
      // In progress tasks
      Subtask.countDocuments({ 
        "assignedEmployees.employeeId": employeeId,
        "assignedEmployees.status": "in_progress"
      }),
      
      // Overdue tasks
      Subtask.countDocuments({ 
        "assignedEmployees.employeeId": employeeId,
        "assignedEmployees.status": { $in: ["pending", "in_progress"] },
        endDate: { $lt: currentDate }
      }),
      
      // Total forms
      EmployeeFormSubmission.countDocuments({
        employeeId: employeeId
      }),
      
      // Completed forms
      EmployeeFormSubmission.countDocuments({
        employeeId: employeeId,
        teamleadstatus: { $in: ["completed", "approved"] }
      }),
      
      // Pending forms
      EmployeeFormSubmission.countDocuments({
        employeeId: employeeId,
        teamleadstatus: "pending"
      }),
      
      // Approved forms
      EmployeeFormSubmission.countDocuments({
        employeeId: employeeId,
        teamleadstatus: "approved"
      }),
      
      // Shared tasks
      SharedTask.countDocuments({
        $or: [
          { sharedEmployee: employeeId },
          { sharedOperationEmployee: employeeId }
        ]
      }),
      
      // Pending shared tasks
      SharedTask.countDocuments({
        $or: [
          { sharedEmployee: employeeId },
          { sharedOperationEmployee: employeeId }
        ],
        status: "pending"
      }),
      
      // Signed shared tasks
      SharedTask.countDocuments({
        $or: [
          { sharedEmployee: employeeId },
          { sharedOperationEmployee: employeeId }
        ],
        status: "signed"
      }),
      
      // Tasks assigned today
      Subtask.countDocuments({ 
        "assignedEmployees.employeeId": employeeId,
        "assignedEmployees.assignedAt": { 
          $gte: startOfToday,
          $lte: endOfToday 
        }
      }),
      
      // Tasks completed today
      Subtask.countDocuments({ 
        "assignedEmployees.employeeId": employeeId,
        "assignedEmployees.status": "completed",
        "assignedEmployees.completedAt": { 
          $gte: startOfToday,
          $lte: endOfToday 
        }
      }),
      
      // Forms submitted today
      EmployeeFormSubmission.countDocuments({ 
        employeeId: employeeId,
        createdAt: { 
          $gte: startOfToday,
          $lte: endOfToday 
        }
      }),
      
      // Recent tasks (last 5)
      Subtask.find({ 
        "assignedEmployees.employeeId": employeeId
      })
        .select("title description status priority endDate teamLeadId")
        .populate("teamLeadId", "firstName lastName")
        .sort({ "assignedEmployees.assignedAt": -1 })
        .limit(5)
        .lean(),
      
      // Recent forms (last 5)
      EmployeeFormSubmission.find({ 
        employeeId: employeeId
      })
        .populate("formId", "title")
        .populate("subtaskId", "title")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Recent shared tasks (last 3)
      SharedTask.find({
        $or: [
          { sharedEmployee: employeeId },
          { sharedOperationEmployee: employeeId }
        ]
      })
        .select("taskTitle status dueDate priority sharedBy")
        .populate("sharedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      
      // Team lead information
      TeamLead.findOne({ 
        managerId: employee.managerId,
        depId: employee.depId
      })
        .select("firstName lastName email profilePic")
        .lean(),
      
      // Team members count (excluding self)
      Employee.countDocuments({ 
        managerId: employee.managerId,
        depId: employee.depId,
        _id: { $ne: employeeId }
      }),
      
      // Calculate task completion rate
      (async () => {
        const total = await Subtask.countDocuments({ 
          "assignedEmployees.employeeId": employeeId
        });
        const completed = await Subtask.countDocuments({ 
          "assignedEmployees.employeeId": employeeId,
          "assignedEmployees.status": "completed"
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      })(),
      
      // Calculate form completion rate
      (async () => {
        const total = await EmployeeFormSubmission.countDocuments({
          employeeId: employeeId
        });
        const completed = await EmployeeFormSubmission.countDocuments({
          employeeId: employeeId,
          teamleadstatus: { $in: ["completed", "approved"] }
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      })(),
      
      // Calculate average task completion time
      (async () => {
        const tasks = await Subtask.aggregate([
          {
            $match: {
              "assignedEmployees.employeeId": new mongoose.Types.ObjectId(employeeId),
              "assignedEmployees.status": "completed",
              "assignedEmployees.completedAt": { $exists: true },
              "assignedEmployees.assignedAt": { $exists: true }
            }
          },
          {
            $unwind: "$assignedEmployees"
          },
          {
            $match: {
              "assignedEmployees.employeeId": new mongoose.Types.ObjectId(employeeId),
              "assignedEmployees.status": "completed"
            }
          },
          {
            $addFields: {
              completionTime: {
                $divide: [
                  { $subtract: ["$assignedEmployees.completedAt", "$assignedEmployees.assignedAt"] },
                  1000 * 60 * 60 // Convert to hours
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgCompletionTime: { $avg: "$completionTime" }
            }
          }
        ]);
        
        return tasks[0]?.avgCompletionTime ? 
          Math.round(tasks[0].avgCompletionTime * 10) / 10 : 0;
      })(),
    ]);

    // Calculate additional metrics
    const productivityScore = Math.round((taskCompletionRate + formCompletionRate) / 2);
    const attendanceRate = tasksAssignedToday > 0 ? 100 : 0; // Simplified attendance

    // Prepare the response
    const stats = {
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        profilePic: employee.profilePic,
        phone: employee.phone,
        address: employee.address,
        startTime: employee.startTime,
        endTime: employee.endTime,
        manager: employee.managerId,
        department: employee.depId
      },
      totals: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks
        },
        forms: {
          total: totalForms,
          completed: completedForms,
          pending: pendingForms,
          approved: approvedForms
        },
        sharedTasks: {
          total: totalSharedTasks,
          pending: pendingSharedTasks,
          signed: signedSharedTasks
        }
      },
      today: {
        tasksAssigned: tasksAssignedToday,
        tasksCompleted: tasksCompletedToday,
        formsSubmitted: formsSubmittedToday
      },
      performance: {
        taskCompletionRate,
        formCompletionRate,
        avgTaskCompletionTime,
        productivityScore,
        attendanceRate
      },
      team: {
        teamLead: teamLeadInfo,
        teamMembers: teamMembersCount,
        department: employee.depId,
        manager: employee.managerId
      },
      recent: {
        tasks: recentTasks,
        forms: recentForms,
        sharedTasks: recentSharedTasks
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Employee dashboard stats fetched successfully",
      data: stats
    });

  } catch (error) {
    console.error("Error fetching employee stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch employee stats",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}