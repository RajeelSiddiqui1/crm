import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import Department from "@/models/Department";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import Form from "@/models/Form";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { sendTaskStatusUpdateMail } from "@/helper/emails/teamlead/task-status-update";
import { sendEmployeeTaskAssignmentMail } from "@/helper/emails/teamlead/assignedEmployee";
import { sendEmployeeRemovedFromTaskMail } from "@/helper/emails/teamlead/remove-employee-from-task";
import { sendNotification } from "@/lib/sendNotification";
import mongoose from "mongoose";

// GET specific task by ID
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Find teamlead
    const teamLead = await TeamLead.findOne({ email: session.user.email });
    if (!teamLead) {
      return NextResponse.json(
        { error: "TeamLead not found" },
        { status: 404 }
      );
    }

    // Find task with all populated details
    const task = await FormSubmission.findById(id)
      .populate("formId", "title description fields")
      .populate("depId", "name description")
      .populate("submittedBy", "firstName lastName email phone department")
      .populate("sharedBy", "firstName lastName email phone")
      .populate(
        "multipleManagerShared",
        "firstName lastName email phone department"
      )
      .populate("assignedTo", "firstName lastName email phone department")
      .populate(
        "multipleTeamLeadAssigned",
        "firstName lastName email phone department"
      )
      .populate(
        "multipleTeamLeadShared",
        "firstName lastName email phone department"
      )
      .populate("sharedByTeamlead", "firstName lastName email phone department")
      .populate({
        path: "assignedEmployees.employeeId",
        select:
          "firstName lastName email department position phone profileImage",
        populate: {
          path: "depId",
          select: "name",
        },
      })
      .populate("employeeFeedbacks.employeeId", "firstName lastName email")
      .populate({
        path: "teamLeadFeedbacks.teamLeadId",
        select: "firstName lastName email department",
      })
      .populate({
        path: "teamLeadFeedbacks.replies.repliedBy",
        select: "firstName lastName email",
      })

      .lean();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if teamlead has access to this task
    const hasAccess =
      task.assignedTo?.some(
        (assigned) => assigned._id.toString() === teamLead._id.toString()
      ) ||
      task.multipleTeamLeadAssigned?.some(
        (tl) => tl._id.toString() === teamLead._id.toString()
      ) ||
      task.multipleTeamLeadShared?.some(
        (tl) => tl._id.toString() === teamLead._id.toString()
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get manager details (submittedBy)
    let managerDetails = null;
    if (task.submittedBy) {
      const manager = await Manager.findById(task.submittedBy._id)
        .populate("departments", "name")
        .lean();
      managerDetails = manager;
    }

    // Get all teamleads who have access to this task
    const allTeamLeads = [
      ...(task.assignedTo || []),
      ...(task.multipleTeamLeadAssigned || []),
      ...(task.multipleTeamLeadShared || []),
    ];

    // Remove duplicates
    const uniqueTeamLeads = Array.from(
      new Map(allTeamLeads.map((tl) => [tl._id.toString(), tl])).values()
    );

    // Get current teamlead's details
    const currentTeamLeadDetails = await TeamLead.findById(teamLead._id)
      .populate("depId", "name")
      .lean();

    return NextResponse.json(
      {
        task,
        managerDetails,
        teamLeads: uniqueTeamLeads,
        currentTeamLead: currentTeamLeadDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET task details error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const body = await req.json();
    const { status, teamLeadFeedback, assignedEmployees, removeEmployeeId } = body;

    const teamLead = await TeamLead.findOne({ email: session.user.email });
    if (!teamLead) {
      return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
    }

    const task = await FormSubmission.findById(id)
      .populate("formId")
      .populate("submittedBy")
      .populate("assignedEmployees.employeeId")
      .populate("multipleTeamLeadAssigned");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

  const hasAccess =
      task.assignedTo?.some(
        (assigned) => assigned._id.toString() === teamLead._id.toString()
      ) ||
      task.multipleTeamLeadAssigned?.some(
        (tl) => tl._id.toString() === teamLead._id.toString()
      );


    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (removeEmployeeId) {
      const employeeToRemove = await Employee.findById(removeEmployeeId);
      if (employeeToRemove) {
        const index = task.assignedEmployees.findIndex(
          emp => emp.employeeId._id?.toString() === removeEmployeeId
        );
        if (index !== -1) {
          task.assignedEmployees.splice(index, 1);
          try {
            const emailHTML = sendEmployeeRemovedFromTaskMail({
              name: `${employeeToRemove.firstName} ${employeeToRemove.lastName}`,
              formTitle: task.formId?.title || "Task",
              removedBy: `${session.user.firstName} ${session.user.lastName}`,
              taskId: task._id.toString(),
            });
            await sendMail(employeeToRemove.email, "Task Assignment Removed", emailHTML);
            await sendNotification({
              senderId: session.user.id,
              senderModel: "TeamLead",
              senderName: `${session.user.firstName} ${session.user.lastName}`,
              receiverId: employeeToRemove._id,
              receiverModel: "Employee",
              type: "task_removed",
              title: "Task Assignment Removed",
              message: `You have been removed from task "${task.formId?.title}"`,
              link: `/employee/tasks/${task._id}`,
              referenceId: task._id,
              referenceModel: "FormSubmission",
            });
          } catch (err) {
            console.error(err);
          }
        }
      }
    }

    if (status) {
      const oldStatus = task.status2;
      task.status2 = status;
      if (teamLeadFeedback) task.teamLeadFeedback = teamLeadFeedback;
      if (["completed", "approved"].includes(status)) task.completedAt = new Date();

      if (task.submittedBy?.email) {
        try {
          const emailHTML = sendTaskStatusUpdateMail({
            name: `${task.submittedBy.firstName} ${task.submittedBy.lastName}`,
            formTitle: task.formId?.title || "Task",
            status,
            updatedBy: `${session.user.firstName} ${session.user.lastName}`,
          });
          await sendMail(task.submittedBy.email, "Task Status Updated", emailHTML);
          await sendNotification({
            senderId: session.user.id,
            senderModel: "TeamLead",
            senderName: `${session.user.firstName} ${session.user.lastName}`,
            receiverId: task.submittedBy._id,
            receiverModel: "Manager",
            type: "task_status_updated",
            title: "Task Status Updated",
            message: `Your submitted task "${task.formId?.title}" status updated from ${oldStatus} to ${status}.`,
            link: `/manager/tasks/${task._id}`,
            referenceId: task._id,
            referenceModel: "FormSubmission",
          });
        } catch (err) {
          console.error(err);
        }
      }

      if (task.assignedEmployees?.length) {
        await Promise.allSettled(
          task.assignedEmployees.map(async assignment => {
            const employee = await Employee.findById(assignment.employeeId);
            if (!employee) return;
            const emailHTML = sendTaskStatusUpdateMail({
              name: `${employee.firstName} ${employee.lastName}`,
              formTitle: task.formId?.title || "Task",
              status,
              updatedBy: `${session.user.firstName} ${session.user.lastName}`,
            });
            await sendMail(employee.email, "Task Status Updated", emailHTML);
            await sendNotification({
              senderId: session.user.id,
              senderModel: "TeamLead",
              senderName: `${session.user.firstName} ${session.user.lastName}`,
              receiverId: employee._id,
              receiverModel: "Employee",
              type: "task_status_updated",
              title: "Task Status Updated",
              message: `Task "${task.formId?.title}" status updated from ${oldStatus} to ${status}.`,
              link: `/employee/tasks/${task._id}`,
              referenceId: task._id,
              referenceModel: "FormSubmission",
            });
          })
        );
      }
    }

    if (assignedEmployees?.length) {
      const employees = await Employee.find({ _id: { $in: assignedEmployees } }).select("email firstName lastName");
      const existingIds = task.assignedEmployees.map(emp => emp.employeeId._id?.toString());
      const newAssignments = employees
        .filter(emp => !existingIds.includes(emp._id.toString()))
        .map(emp => ({
          employeeId: emp._id,
          email: emp.email,
          status: "pending",
          assignedAt: new Date(),
        }));
      task.assignedEmployees.push(...newAssignments);

      await Promise.allSettled(
        newAssignments.map(async assignment => {
          const employee = await Employee.findById(assignment.employeeId);
          if (!employee) return;
          const emailHTML = sendEmployeeTaskAssignmentMail({
            name: `${employee.firstName} ${employee.lastName}`,
            formTitle: task.formId?.title || "New Task",
            assignedBy: `${session.user.firstName} ${session.user.lastName}`,
            taskId: task._id.toString(),
          });
          await sendMail(employee.email, "New Task Assigned", emailHTML);
          await sendNotification({
            senderId: session.user.id,
            senderModel: "TeamLead",
            senderName: `${session.user.firstName} ${session.user.lastName}`,
            receiverId: employee._id,
            receiverModel: "Employee",
            type: "task_assigned",
            title: "New Task Assigned",
            message: `A new task "${task.formId?.title}" has been assigned to you.`,
            link: `/employee/tasks/${task._id}`,
            referenceId: task._id,
            referenceModel: "FormSubmission",
          });
        })
      );
    }

    await task.save();

    const updatedTask = await FormSubmission.findById(id)
      .populate("formId", "title description")
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("assignedEmployees.employeeId", "firstName lastName email department position");

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask
    }, { status: 200 });
  } catch (error) {
    console.error("PUT task update error:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message
    }, { status: 500 });
  }
}