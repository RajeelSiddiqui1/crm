import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import EmployeeForm from "@/models/EmployeeForm";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import Subtask from "@/models/Subtask";
import Department from "@/models/Department";
import AdminTask from "@/models/AdminTask";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const managerId = session.user.id;
    const managerEmail = session.user.email;

    // Get current manager details
    const manager = await Manager.findById(managerId)
      .populate("departments")
      .lean();

    if (!manager) {
      return NextResponse.json(
        { success: false, message: "Manager not found" },
        { status: 404 }
      );
    }

    // Get manager's department IDs
    const managerDeptIds = manager.departments.map(dept => dept._id);
    
    // Get current date for time-based calculations
    const currentDate = new Date();
    const startOfToday = new Date(currentDate.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Helper function to get team lead IDs
    async function getTeamLeadIds() {
      const teamLeads = await TeamLead.find({ 
        managerId: managerId,
        depId: { $in: managerDeptIds }
      }).select("_id");
      return teamLeads.map(tl => tl._id);
    }

    const teamLeadIds = await getTeamLeadIds();

    // Fetch all stats in parallel
    const [
      // Basic counts
      teamLeadsCount,
      employeesCount,
      formsCount,
      formSubmissionsCount,
      submissionsToday,
      submissionsThisWeek,
      submissionsThisMonth,
      
      // Status breakdowns
      submissionsCompleted,
      submissionsInProgress,
      submissionsPending,
      submissionsApproved,
      submissionsRejected,
      
      subtasksCount,
      subtasksToday,
      subtasksThisWeek,
      subtasksCompleted,
      subtasksInProgress,
      subtasksPending,
      subtasksRejected,
      
      adminTasksCount,
      adminTasksPending,
      adminTasksApproved,
      adminTasksRejected,
      
      // Detailed data
      topPerformingTeamLeads,
      recentFormSubmissions,
      pendingApprovals,
      recentSubtasks,
      departmentStats,
      
      // Efficiency metrics
      avgSubmissionTime,
      avgSubtaskCompletionTime,
      
      // Chart data
      weeklySubmissions,
      monthlySubmissions,
      quarterlySubmissions,
      submissionStatusDistribution,
      subtaskStatusDistribution,
      
      // Comparative data
      otherManagersCount,
      departmentWiseStats,
      
    ] = await Promise.all([
      // TeamLeads count
      TeamLead.countDocuments({ 
        managerId: managerId,
        depId: { $in: managerDeptIds }
      }),
      
      // Employees count
      Employee.countDocuments({ 
        managerId: managerId,
        depId: { $in: managerDeptIds }
      }),
      
      // Forms count
      EmployeeForm.countDocuments({ 
        depId: { $in: managerDeptIds },
        $or: [
          { managerId: managerId },
          { managerId: null }
        ]
      }),
      
      // Total form submissions
      FormSubmission.countDocuments({ 
        submittedBy: managerId
      }),
      
      // Today's submissions
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        createdAt: { $gte: startOfToday }
      }),
      
      // This week's submissions
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        createdAt: { $gte: startOfWeek }
      }),
      
      // This month's submissions
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        createdAt: { $gte: startOfMonth }
      }),
      
      // Submission status breakdown
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        status: "completed"
      }),
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        status: "in_progress"
      }),
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        status: "pending"
      }),
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        status: "approved"
      }),
      FormSubmission.countDocuments({ 
        submittedBy: managerId,
        status: "rejected"
      }),
      
      // Total subtasks
      Subtask.countDocuments({ 
        teamLeadId: { $in: teamLeadIds }
      }),
      
      // Today's subtasks
      Subtask.countDocuments({ 
        teamLeadId: { $in: teamLeadIds },
        createdAt: { $gte: startOfToday }
      }),
      
      // This week's subtasks
      Subtask.countDocuments({ 
        teamLeadId: { $in: teamLeadIds },
        createdAt: { $gte: startOfWeek }
      }),
      
      // Subtask status breakdown
      Subtask.countDocuments({ 
        teamLeadId: { $in: teamLeadIds },
        status: "completed"
      }),
      Subtask.countDocuments({ 
        teamLeadId: { $in: teamLeadIds },
        status: "in_progress"
      }),
      Subtask.countDocuments({ 
        teamLeadId: { $in: teamLeadIds },
        status: "pending"
      }),
      Subtask.countDocuments({ 
        teamLeadId: { $in: teamLeadIds },
        status: "rejected"
      }),
      
      // Admin tasks
      AdminTask.countDocuments({ 
        assignedTo: managerId
      }),
      AdminTask.countDocuments({ 
        assignedTo: managerId,
        status: "pending"
      }),
      AdminTask.countDocuments({ 
        assignedTo: managerId,
        status: "approved"
      }),
      AdminTask.countDocuments({ 
        assignedTo: managerId,
        status: "rejected"
      }),
      
      // Top performing team leads (by completion rate)
      TeamLead.aggregate([
        {
          $match: {
            managerId: new mongoose.Types.ObjectId(managerId),
            depId: { $in: managerDeptIds }
          }
        },
        {
          $lookup: {
            from: "formsubmissions",
            let: { teamLeadId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$assignedTo", "$$teamLeadId"] },
                      { $in: ["$$teamLeadId", "$multipleTeamLeadAssigned"] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 }
                }
              }
            ],
            as: "submissionStats"
          }
        },
        {
          $addFields: {
            completedCount: {
              $ifNull: [{
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$submissionStats",
                      cond: { $eq: ["$$this._id", "completed"] }
                    }
                  },
                  0
                ]
              }, { count: 0 }]
            },
            totalCount: {
              $sum: "$submissionStats.count"
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
            depId: 1,
            completionRate: { $round: ["$completionRate", 1] },
            totalTasks: "$totalCount",
            completedTasks: "$completedCount.count"
          }
        },
        { $sort: { completionRate: -1 } },
        { $limit: 5 }
      ]),
      
      // Recent form submissions with details
      FormSubmission.find({ 
        submittedBy: managerId
      })
        .populate("formId", "title")
        .populate("assignedTo", "firstName lastName")
        .populate("submittedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Pending approvals (submissions waiting for manager action)
      FormSubmission.find({
        submittedBy: managerId,
        status: { $in: ["completed", "in_progress"] },
        adminStatus: "pending"
      })
        .populate("formId", "title")
        .populate("assignedTo", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      
      // Recent subtasks with details
      Subtask.find({ 
        teamLeadId: { $in: teamLeadIds }
      })
        .populate("teamLeadId", "firstName lastName email")
        .populate("assignedEmployees.employeeId", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Department-wise stats
      Department.aggregate([
        {
          $match: { _id: { $in: managerDeptIds } }
        },
        {
          $lookup: {
            from: "employees",
            let: { deptId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$depId", "$$deptId"] },
                      { $eq: ["$managerId", new mongoose.Types.ObjectId(managerId)] }
                    ]
                  }
                }
              },
              { $count: "count" }
            ],
            as: "employeeCount"
          }
        },
        {
          $lookup: {
            from: "teamleads",
            let: { deptId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$depId", "$$deptId"] },
                      { $eq: ["$managerId", new mongoose.Types.ObjectId(managerId)] }
                    ]
                  }
                }
              },
              { $count: "count" }
            ],
            as: "teamLeadCount"
          }
        },
        {
          $lookup: {
            from: "employees",
            let: { deptId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$depId", "$$deptId"] },
                      { $eq: ["$managerId", new mongoose.Types.ObjectId(managerId)] }
                    ]
                  }
                }
              },
              { $count: "count" }
            ],
            as: "employeeCount"
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            employeeCount: { $ifNull: [{ $arrayElemAt: ["$employeeCount.count", 0] }, 0] },
            teamLeadCount: { $ifNull: [{ $arrayElemAt: ["$teamLeadCount.count", 0] }, 0] }
          }
        }
      ]),
      
      // Average submission completion time (in hours)
      FormSubmission.aggregate([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(managerId),
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
      
      // Average subtask completion time (in hours)
      Subtask.aggregate([
        {
          $match: {
            teamLeadId: { $in: teamLeadIds },
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
      
      // Weekly submissions for last 8 weeks
      FormSubmission.aggregate([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(managerId),
            createdAt: {
              $gte: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000) // Last 8 weeks
            }
          }
        },
        {
          $group: {
            _id: {
              week: { $week: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.week": 1 } },
        { $limit: 8 }
      ]),
      
      // Monthly submissions for current year
      FormSubmission.aggregate([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(managerId),
            createdAt: {
              $gte: startOfYear
            }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      
      // Quarterly submissions
      FormSubmission.aggregate([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(managerId),
            createdAt: {
              $gte: new Date(currentDate.getFullYear() - 1, 0, 1) // Last 4 quarters
            }
          }
        },
        {
          $addFields: {
            quarter: {
              $ceil: { $divide: [{ $month: "$createdAt" }, 3] }
            }
          }
        },
        {
          $group: {
            _id: {
              quarter: "$quarter",
              year: { $year: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.quarter": 1 } },
        { $limit: 4 }
      ]),
      
      // Submission status distribution
      FormSubmission.aggregate([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(managerId)
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Subtask status distribution
      Subtask.aggregate([
        {
          $match: {
            teamLeadId: { $in: teamLeadIds }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Other managers in same departments
      Manager.countDocuments({
        _id: { $ne: managerId },
        departments: { $in: managerDeptIds }
      }),
      
      // Department-wise submission stats
      FormSubmission.aggregate([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(managerId)
          }
        },
        {
          $lookup: {
            from: "employeeforms",
            localField: "formId",
            foreignField: "_id",
            as: "formDetails"
          }
        },
        {
          $unwind: "$formDetails"
        },
        {
          $group: {
            _id: "$formDetails.depId",
            totalSubmissions: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "department"
          }
        },
        {
          $unwind: "$department"
        },
        {
          $project: {
            departmentName: "$department.name",
            totalSubmissions: 1,
            completed: 1,
            inProgress: 1,
            pending: 1,
            completionRate: {
              $cond: [
                { $gt: ["$totalSubmissions", 0] },
                { $multiply: [{ $divide: ["$completed", "$totalSubmissions"] }, 100] },
                0
              ]
            }
          }
        },
        { $sort: { totalSubmissions: -1 } }
      ]),
    ]);

    // Calculate rates and averages
    const submissionCompletionRate = formSubmissionsCount > 0 
      ? Math.round((submissionsCompleted / formSubmissionsCount) * 100) 
      : 0;
    
    const subtaskCompletionRate = subtasksCount > 0 
      ? Math.round((subtasksCompleted / subtasksCount) * 100) 
      : 0;
    
    const avgSubmissionCompletionTime = avgSubmissionTime[0]?.avgCompletionTime 
      ? Math.round(avgSubmissionTime[0].avgCompletionTime * 10) / 10 
      : 0;
    
    const avgSubtaskCompletionTimeValue = avgSubtaskCompletionTime[0]?.avgCompletionTime 
      ? Math.round(avgSubtaskCompletionTime[0].avgCompletionTime * 10) / 10 
      : 0;

    // Format chart data
    const formatChartData = (data, type = 'monthly') => {
      if (type === 'weekly') {
        const labels = Array.from({ length: 8 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (7 - i) * 7);
          return `Week ${date.getWeek()}`;
        });
        const counts = Array(8).fill(0);
        data?.forEach(d => {
          const weekIndex = labels.findIndex(label => label === `Week ${d._id.week}`);
          if (weekIndex !== -1) counts[weekIndex] = d.count;
        });
        return { labels, counts };
      } else if (type === 'quarterly') {
        const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
        const counts = Array(4).fill(0);
        data?.forEach(d => {
          const quarterIndex = d._id.quarter - 1;
          if (quarterIndex >= 0 && quarterIndex < 4) counts[quarterIndex] = d.count;
        });
        return { labels, counts };
      } else {
        const labels = Array.from({ length: 12 }, (_, i) =>
          new Date(0, i).toLocaleString("default", { month: "short" })
        );
        const counts = Array(12).fill(0);
        data?.forEach(d => counts[d._id.month - 1] = d.count);
        return { labels, counts };
      }
    };

    // Add week number method to Date prototype
    Date.prototype.getWeek = function() {
      const date = new Date(this.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    // Prepare response
    const stats = {
      manager: {
        id: manager._id,
        name: `${manager.firstName} ${manager.lastName}`,
        email: manager.email,
        profilePic: manager.profilePic,
        phone: manager.phone,
        address: manager.address,
        departments: manager.departments,
        departmentsCount: manager.departments.length,
        verified: manager.verified,
        joinDate: manager.createdAt
      },
      totals: {
        teamLeads: teamLeadsCount,
        employees: employeesCount,
        forms: formsCount,
        formSubmissions: formSubmissionsCount,
        subtasks: subtasksCount,
        adminTasks: adminTasksCount,
        otherManagers: otherManagersCount,
        departments: manager.departments.length
      },
      today: {
        submissions: submissionsToday,
        subtasks: subtasksToday
      },
      thisWeek: {
        submissions: submissionsThisWeek,
        subtasks: subtasksThisWeek
      },
      thisMonth: {
        submissions: submissionsThisMonth
      },
      breakdown: {
        submissions: {
          total: formSubmissionsCount,
          completed: submissionsCompleted,
          inProgress: submissionsInProgress,
          pending: submissionsPending,
          approved: submissionsApproved,
          rejected: submissionsRejected,
          completionRate: submissionCompletionRate
        },
        subtasks: {
          total: subtasksCount,
          completed: subtasksCompleted,
          inProgress: subtasksInProgress,
          pending: subtasksPending,
          rejected: subtasksRejected,
          completionRate: subtaskCompletionRate
        },
        adminTasks: {
          total: adminTasksCount,
          pending: adminTasksPending,
          approved: adminTasksApproved,
          rejected: adminTasksRejected
        }
      },
      performance: {
        avgSubmissionCompletionTime: avgSubmissionCompletionTime,
        avgSubtaskCompletionTime: avgSubtaskCompletionTimeValue,
        submissionEfficiency: submissionCompletionRate,
        taskEfficiency: subtaskCompletionRate
      },
      charts: {
        weeklySubmissions: formatChartData(weeklySubmissions, 'weekly'),
        monthlySubmissions: formatChartData(monthlySubmissions, 'monthly'),
        quarterlySubmissions: formatChartData(quarterlySubmissions, 'quarterly'),
        submissionStatusDistribution,
        subtaskStatusDistribution
      },
      insights: {
        topPerformingTeamLeads,
        departmentStats,
        departmentWiseStats,
        pendingApprovals: pendingApprovals.length,
        recentActivity: {
          formSubmissions: recentFormSubmissions.length,
          subtasks: recentSubtasks.length
        }
      },
      recent: {
        formSubmissions: recentFormSubmissions,
        subtasks: recentSubtasks,
        pendingApprovals
      },
      lastUpdated: new Date().toISOString(),
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Manager dashboard stats fetched successfully",
      data: stats
    });

  } catch (error) {
    console.error("Error fetching manager stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch manager stats",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}