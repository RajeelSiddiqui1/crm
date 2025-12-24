// app/api/manager/submissions/analytics/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id;
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('range') || 'month'; // day, week, month, year

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get all submissions for this manager
    const submissions = await FormSubmission.find({
      $or: [
        { submittedBy: managerId },
        { multipleManagerShared: managerId }
      ],
      createdAt: { $gte: startDate }
    })
    .populate('formId', 'title')
    .populate('assignedEmployees.employeeId', 'firstName lastName')
    .lean();

    // Calculate analytics
    const analytics = {
      overview: {
        totalSubmissions: submissions.length,
        mySubmissions: submissions.filter(s => 
          s.submittedBy?.toString() === managerId.toString()
        ).length,
        sharedWithMe: submissions.filter(s => 
          s.submittedBy?.toString() !== managerId.toString()
        ).length,
        avgCompletionTime: calculateAvgCompletionTime(submissions)
      },
      statusDistribution: {
        pending: submissions.filter(s => s.status === 'pending').length,
        in_progress: submissions.filter(s => s.status === 'in_progress').length,
        completed: submissions.filter(s => s.status === 'completed').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length
      },
      sharingStats: {
        totalShared: submissions.reduce((sum, s) => sum + (s.multipleManagerShared?.length || 0), 0),
        mostSharedForm: getMostSharedForm(submissions),
        avgShareCount: submissions.reduce((sum, s) => sum + (s.multipleManagerShared?.length || 0), 0) / Math.max(submissions.length, 1)
      },
      performance: {
        completionRate: calculateCompletionRate(submissions),
        rejectionRate: submissions.filter(s => s.status === 'rejected').length / Math.max(submissions.length, 1) * 100,
        avgFeedbackCount: calculateAvgFeedbackCount(submissions)
      },
      timelineData: generateTimelineData(submissions, timeRange),
      topForms: getTopForms(submissions),
      employeePerformance: getEmployeePerformance(submissions)
    };

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateAvgCompletionTime(submissions) {
  const completedSubmissions = submissions.filter(s => 
    s.completedAt && s.createdAt
  );
  
  if (completedSubmissions.length === 0) return 0;
  
  const totalTime = completedSubmissions.reduce((sum, s) => {
    const created = new Date(s.createdAt);
    const completed = new Date(s.completedAt);
    return sum + (completed - created);
  }, 0);
  
  return Math.round(totalTime / completedSubmissions.length / (1000 * 60 * 60 * 24)); // in days
}

function getMostSharedForm(submissions) {
  const formShareCount = {};
  
  submissions.forEach(submission => {
    if (submission.formId) {
      const formId = submission.formId._id.toString();
      const shareCount = submission.multipleManagerShared?.length || 0;
      
      if (!formShareCount[formId]) {
        formShareCount[formId] = {
          form: submission.formId,
          count: 0
        };
      }
      formShareCount[formId].count += shareCount;
    }
  });
  
  const sortedForms = Object.values(formShareCount).sort((a, b) => b.count - a.count);
  return sortedForms[0] || null;
}

function calculateCompletionRate(submissions) {
  const total = submissions.length;
  if (total === 0) return 0;
  
  const completed = submissions.filter(s => 
    s.status === 'completed' || s.status === 'approved'
  ).length;
  
  return Math.round((completed / total) * 100);
}

function calculateAvgFeedbackCount(submissions) {
  const totalFeedback = submissions.reduce((sum, s) => {
    return sum + (s.employeeFeedbacks?.length || 0) + (s.teamLeadFeedbacks?.length || 0);
  }, 0);
  
  return Math.round(totalFeedback / Math.max(submissions.length, 1) * 10) / 10;
}

function generateTimelineData(submissions, timeRange) {
  const timeline = {};
  const now = new Date();
  
  submissions.forEach(submission => {
    const date = new Date(submission.createdAt);
    let key;
    
    switch (timeRange) {
      case 'day':
        key = date.toLocaleTimeString([], { hour: '2-digit' });
        break;
      case 'week':
        key = date.toLocaleDateString([], { weekday: 'short' });
        break;
      case 'month':
        key = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
        break;
      case 'year':
        key = date.toLocaleDateString([], { month: 'short' });
        break;
    }
    
    if (!timeline[key]) {
      timeline[key] = 0;
    }
    timeline[key]++;
  });
  
  return timeline;
}

function getTopForms(submissions) {
  const formCount = {};
  
  submissions.forEach(submission => {
    if (submission.formId) {
      const formId = submission.formId._id.toString();
      const title = submission.formId.title;
      
      if (!formCount[formId]) {
        formCount[formId] = {
          title: title,
          count: 0
        };
      }
      formCount[formId].count++;
    }
  });
  
  return Object.values(formCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getEmployeePerformance(submissions) {
  const employeeStats = {};
  
  submissions.forEach(submission => {
    if (submission.assignedEmployees) {
      submission.assignedEmployees.forEach(emp => {
        if (emp.employeeId) {
          const empId = emp.employeeId._id.toString();
          const empName = `${emp.employeeId.firstName} ${emp.employeeId.lastName}`;
          
          if (!employeeStats[empId]) {
            employeeStats[empId] = {
              name: empName,
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
              avgCompletionTime: 0
            };
          }
          
          employeeStats[empId].totalTasks++;
          
          if (emp.status === 'completed' || emp.status === 'approved') {
            employeeStats[empId].completedTasks++;
          } else if (emp.status === 'pending') {
            employeeStats[empId].pendingTasks++;
          }
        }
      });
    }
  });
  
  return Object.values(employeeStats)
    .map(emp => ({
      ...emp,
      completionRate: Math.round((emp.completedTasks / Math.max(emp.totalTasks, 1)) * 100)
    }))
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 10);
}