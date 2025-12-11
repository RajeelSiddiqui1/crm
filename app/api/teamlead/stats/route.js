import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import Subtask from "@/models/Subtask";
import FormSubmission from "@/models/FormSubmission";
import EmployeeForm from "@/models/EmployeeForm";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Department from "@/models/Department";
import SharedTask from "@/models/SharedTask";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const teamLeadId = session.user.id;

    // Get current team lead details
    const teamLead = await TeamLead.findById(teamLeadId)
      .populate("managerId", "firstName lastName email")
      .populate("depId", "name")
      .lean();

    if (!teamLead) {
      return NextResponse.json(
        { success: false, message: "Team lead not found" },
        { status: 404 }
      );
    }

    // Get current date for time-based calculations
    const currentDate = new Date();
    const startOfToday = new Date(currentDate.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // First, get all employees under this team lead (in same department with same manager)
    const teamEmployees = await Employee.find({ 
      managerId: teamLead.managerId,
      depId: teamLead.depId
    }).select("_id").lean();

    const employeeIds = teamEmployees.map(emp => emp._id);

    // Fetch all stats in parallel
    const [
      // Basic counts
      employeesCount,
      subtasksCount,
      formSubmissionsAssigned,
      employeeFormSubmissionsCount,
      sharedTasksCount,
      
      // Today's activity
      subtasksCreatedToday,
      subtasksCompletedToday,
      employeeFormSubmissionsToday,
      
      // Status breakdowns
      pendingSubtasks,
      inProgressSubtasks,
      completedSubtasks,
      rejectedSubtasks,
      overdueSubtasks,
      
      pendingEmployeeForms,
      inProgressEmployeeForms,
      completedEmployeeForms,
      approvedEmployeeForms,
      rejectedEmployeeForms,
      lateEmployeeForms,
      
      // Form submissions where team lead is assigned
      assignedFormSubmissions,
      claimedFormSubmissions,
      
      // Performance metrics
      avgSubtaskCompletionTime,
      avgEmployeeFormCompletionTime,
      teamLeadEfficiency,
      
      // Recent data
      recentSubtasks,
      recentEmployeeForms,
      recentSharedTasks,
      
      // Employee performance
      employeePerformance,
      
      // Department info
      departmentDetails,
      
    ] = await Promise.all([
      // Employees under this team lead
      Employee.countDocuments({ 
        managerId: teamLead.managerId,
        depId: teamLead.depId
      }),
      
      // Total subtasks assigned to this team lead
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId
      }),
      
      // Form submissions where team lead is assigned
      FormSubmission.countDocuments({
        $or: [
          { assignedTo: teamLeadId },
          { multipleTeamLeadAssigned: teamLeadId }
        ]
      }),
      
      // Employee form submissions under team lead's employees
      EmployeeFormSubmission.countDocuments({
        employeeId: { $in: employeeIds }
      }),
      
      // Shared tasks
      SharedTask.countDocuments({
        $or: [
          { sharedTeamlead: teamLeadId },
          { sharedOperationTeamlead: teamLeadId }
        ]
      }),
      
      // Today's activity
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId,
        createdAt: { $gte: startOfToday }
      }),
      
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId,
        status: "completed",
        completedAt: { $gte: startOfToday }
      }),
      
      EmployeeFormSubmission.countDocuments({ 
        employeeId: { $in: employeeIds },
        createdAt: { $gte: startOfToday }
      }),
      
      // Subtask status breakdown
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId,
        status: "pending"
      }),
      
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId,
        status: "in_progress"
      }),
      
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId,
        status: "completed"
      }),
      
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId,
        status: "rejected"
      }),
      
      Subtask.countDocuments({ 
        teamLeadId: teamLeadId,
        endDate: { $lt: currentDate },
        status: { $in: ["pending", "in_progress"] }
      }),
      
      // Employee form status breakdown (for team lead's employees)
      EmployeeFormSubmission.countDocuments({ 
        employeeId: { $in: employeeIds },
        teamleadstatus: "pending"
      }),
      
      EmployeeFormSubmission.countDocuments({ 
        employeeId: { $in: employeeIds },
        teamleadstatus: "in_progress"
      }),
      
      EmployeeFormSubmission.countDocuments({ 
        employeeId: { $in: employeeIds },
        teamleadstatus: "completed"
      }),
      
      EmployeeFormSubmission.countDocuments({ 
        employeeId: { $in: employeeIds },
        teamleadstatus: "approved"
      }),
      
      EmployeeFormSubmission.countDocuments({ 
        employeeId: { $in: employeeIds },
        teamleadstatus: "rejected"
      }),
      
      EmployeeFormSubmission.countDocuments({ 
        employeeId: { $in: employeeIds },
        teamleadstatus: "late"
      }),
      
      // Form submissions assigned to team lead
      FormSubmission.countDocuments({
        $or: [
          { assignedTo: teamLeadId },
          { multipleTeamLeadAssigned: teamLeadId }
        ],
        claimedAt: { $exists: false }
      }),
      
      FormSubmission.countDocuments({
        $or: [
          { assignedTo: teamLeadId },
          { multipleTeamLeadAssigned: teamLeadId }
        ],
        claimedAt: { $exists: true }
      }),
      
      // Average subtask completion time
      Subtask.aggregate([
        {
          $match: {
            teamLeadId: new mongoose.Types.ObjectId(teamLeadId),
            status: "completed",
            completedAt: { $exists: true },
            createdAt: { $exists: true }
          }
        },
        {
          $addFields: {
            completionTime: {
              $divide: [
                { $subtract: ["$completedAt", "$createdAt"] },
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
      ]),
      
      // Average employee form completion time for team's employees
      EmployeeFormSubmission.aggregate([
        {
          $match: {
            employeeId: { $in: employeeIds },
            completedAt: { $exists: true },
            createdAt: { $exists: true }
          }
        },
        {
          $addFields: {
            completionTime: {
              $divide: [
                { $subtract: ["$completedAt", "$createdAt"] },
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
      ]),
      
      // Team lead efficiency (subtask completion rate)
      Subtask.aggregate([
        {
          $match: {
            teamLeadId: new mongoose.Types.ObjectId(teamLeadId)
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent subtasks
      Subtask.find({ 
        teamLeadId: teamLeadId
      })
        .select("title description status priority startDate endDate completedAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Recent employee forms from team's employees
      EmployeeFormSubmission.find({ 
        employeeId: { $in: employeeIds }
      })
        .populate("formId", "title")
        .populate("employeeId", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Recent shared tasks
      SharedTask.find({
        $or: [
          { sharedTeamlead: teamLeadId },
          { sharedOperationTeamlead: teamLeadId }
        ]
      })
        .select("taskTitle status dueDate priority sharedBy")
        .populate("sharedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      
      // Employee performance (team members)
      Employee.aggregate([
        {
          $match: {
            _id: { $in: employeeIds }
          }
        },
        {
          $lookup: {
            from: "employeeformsubmissions",
            let: { employeeId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$employeeId", "$$employeeId"] }
                }
              },
              {
                $group: {
                  _id: "$teamleadstatus",
                  count: { $sum: 1 }
                }
              }
            ],
            as: "formStats"
          }
        },
        {
          $addFields: {
            completedCount: {
              $ifNull: [{
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$formStats",
                      cond: { $in: ["$$this._id", ["completed", "approved"]] }
                    }
                  },
                  0
                ]
              }, { count: 0 }]
            },
            totalCount: {
              $sum: "$formStats.count"
            }
          }
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $gt: ["$totalCount", 0] },
                { $multiply: [{ $divide: ["$completedCount.count", "$totalCount"] }, 100] },
                0
              ]
            }
          }
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            profilePic: 1,
            completionRate: { $round: ["$completionRate", 1] },
            totalTasks: "$totalCount",
            completedTasks: "$completedCount.count"
          }
        },
        { $sort: { completionRate: -1 } },
        { $limit: 5 }
      ]),
      
      // Department details
      Department.findById(teamLead.depId)
        .select("name description logoUrl")
        .lean(),
    ]);

    // Calculate completion rates
    const subtaskCompletionRate = subtasksCount > 0 
      ? Math.round((completedSubtasks / subtasksCount) * 100) 
      : 0;
    
    const employeeFormCompletionRate = employeeFormSubmissionsCount > 0 
      ? Math.round(((completedEmployeeForms + approvedEmployeeForms) / employeeFormSubmissionsCount) * 100) 
      : 0;
    
    // Calculate efficiency from aggregation
    let efficiency = 0;
    if (teamLeadEfficiency && teamLeadEfficiency.length > 0) {
      const completed = teamLeadEfficiency.find(s => s._id === "completed")?.count || 0;
      const total = teamLeadEfficiency.reduce((sum, s) => sum + s.count, 0);
      efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    // Calculate averages
    const avgSubtaskCompletionTimeValue = avgSubtaskCompletionTime[0]?.avgCompletionTime 
      ? Math.round(avgSubtaskCompletionTime[0].avgCompletionTime * 10) / 10 
      : 0;
    
    const avgEmployeeFormCompletionTimeValue = avgEmployeeFormCompletionTime[0]?.avgCompletionTime 
      ? Math.round(avgEmployeeFormCompletionTime[0].avgCompletionTime * 10) / 10 
      : 0;

    // Prepare the response
    const stats = {
      teamLead: {
        id: teamLead._id,
        name: `${teamLead.firstName} ${teamLead.lastName}`,
        email: teamLead.email,
        profilePic: teamLead.profilePic,
        phone: teamLead.phone,
        address: teamLead.address,
        startTime: teamLead.startTime,
        endTime: teamLead.endTime,
        manager: teamLead.managerId,
        department: teamLead.depId
      },
      totals: {
        employees: employeesCount,
        subtasks: subtasksCount,
        formSubmissionsAssigned,
        employeeFormSubmissions: employeeFormSubmissionsCount,
        sharedTasks: sharedTasksCount
      },
      today: {
        subtasksCreated: subtasksCreatedToday,
        subtasksCompleted: subtasksCompletedToday,
        employeeForms: employeeFormSubmissionsToday
      },
      breakdown: {
        subtasks: {
          total: subtasksCount,
          pending: pendingSubtasks,
          inProgress: inProgressSubtasks,
          completed: completedSubtasks,
          rejected: rejectedSubtasks,
          overdue: overdueSubtasks,
          completionRate: subtaskCompletionRate
        },
        employeeForms: {
          total: employeeFormSubmissionsCount,
          pending: pendingEmployeeForms,
          inProgress: inProgressEmployeeForms,
          completed: completedEmployeeForms,
          approved: approvedEmployeeForms,
          rejected: rejectedEmployeeForms,
          late: lateEmployeeForms,
          completionRate: employeeFormCompletionRate
        },
        formSubmissions: {
          assigned: assignedFormSubmissions,
          claimed: claimedFormSubmissions,
          total: assignedFormSubmissions + claimedFormSubmissions
        }
      },
      performance: {
        avgSubtaskCompletionTime: avgSubtaskCompletionTimeValue,
        avgEmployeeFormCompletionTime: avgEmployeeFormCompletionTimeValue,
        efficiency: efficiency,
        completionRate: subtaskCompletionRate,
        formCompletionRate: employeeFormCompletionRate
      },
      team: {
        topPerformers: employeePerformance,
        department: departmentDetails,
        manager: teamLead.managerId
      },
      recent: {
        subtasks: recentSubtasks,
        employeeForms: recentEmployeeForms,
        sharedTasks: recentSharedTasks
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Team lead dashboard stats fetched successfully",
      data: stats
    });

  } catch (error) {
    console.error("Error fetching team lead stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch team lead stats",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}