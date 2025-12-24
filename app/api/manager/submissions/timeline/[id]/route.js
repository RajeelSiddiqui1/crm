// app/api/manager/submissions/timeline/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id;

    // Check access
    const hasAccess = await FormSubmission.findOne({
      _id: id,
      $or: [
        { submittedBy: managerId },
        { multipleManagerShared: managerId }
      ]
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get submission for basic info
    const submission = await FormSubmission.findById(id)
      .select('createdAt updatedAt status status2 adminStatus assignedEmployees')
      .lean();

    // Get notifications related to this submission
    const notifications = await Notification.find({
      referenceId: id,
      referenceModel: 'FormSubmission'
    })
    .select('type message senderName createdAt')
    .sort({ createdAt: -1 })
    .lean();

    // Create timeline events
    const timelineEvents = [];

    // Add creation event
    if (submission.createdAt) {
      timelineEvents.push({
        id: `creation-${submission._id}`,
        type: 'creation',
        title: 'Submission Created',
        description: 'New form submission was created',
        timestamp: submission.createdAt,
        icon: 'FileText',
        color: 'blue'
      });
    }

    // Add status change events from submission updates
    if (submission.updatedAt && submission.updatedAt > submission.createdAt) {
      timelineEvents.push({
        id: `update-${submission._id}`,
        type: 'update',
        title: 'Submission Updated',
        description: 'Submission details were updated',
        timestamp: submission.updatedAt,
        icon: 'Edit',
        color: 'green'
      });
    }

    // Add employee assignment events
    if (submission.assignedEmployees && submission.assignedEmployees.length > 0) {
      submission.assignedEmployees.forEach((emp, index) => {
        if (emp.assignedAt) {
          timelineEvents.push({
            id: `assignment-${emp.employeeId}-${index}`,
            type: 'assignment',
            title: 'Employee Assigned',
            description: `Assigned to ${emp.email}`,
            timestamp: emp.assignedAt,
            icon: 'User',
            color: 'purple'
          });
        }
        if (emp.completedAt) {
          timelineEvents.push({
            id: `completion-${emp.employeeId}-${index}`,
            type: 'completion',
            title: 'Employee Completed Task',
            description: `${emp.email} marked task as completed`,
            timestamp: emp.completedAt,
            icon: 'CheckCircle',
            color: 'green'
          });
        }
      });
    }

    // Add notification events
    notifications.forEach((notif, index) => {
      timelineEvents.push({
        id: `notification-${notif._id}`,
        type: 'notification',
        title: getNotificationTitle(notif.type),
        description: notif.message,
        timestamp: notif.createdAt,
        icon: getNotificationIcon(notif.type),
        color: getNotificationColor(notif.type),
        metadata: {
          sender: notif.senderName,
          type: notif.type
        }
      });
    });

    // Sort timeline by timestamp (newest first)
    timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({ timeline: timelineEvents }, { status: 200 });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getNotificationTitle(type) {
  const titles = {
    'status_updated': 'Status Updated',
    'new_feedback': 'New Feedback',
    'task_assigned': 'Task Assigned',
    'task_completed': 'Task Completed',
    'mention': 'You Were Mentioned',
    'new_reply': 'New Reply',
    'share': 'Submission Shared'
  };
  return titles[type] || 'Notification';
}

function getNotificationIcon(type) {
  const icons = {
    'status_updated': 'RefreshCw',
    'new_feedback': 'MessageCircle',
    'task_assigned': 'UserPlus',
    'task_completed': 'CheckCircle',
    'mention': 'AtSign',
    'new_reply': 'Reply',
    'share': 'Share2'
  };
  return icons[type] || 'Bell';
}

function getNotificationColor(type) {
  const colors = {
    'status_updated': 'blue',
    'new_feedback': 'green',
    'task_assigned': 'purple',
    'task_completed': 'green',
    'mention': 'orange',
    'new_reply': 'blue',
    'share': 'indigo'
  };
  return colors[type] || 'gray';
}