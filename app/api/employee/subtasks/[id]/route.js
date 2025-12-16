import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import { subtaskStatusUpdateMailTemplate } from "@/helper/emails/employee/subtask-status-update";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = params; 
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing Subtask ID" },
        { status: 400 }
      );
    }

    const { status, feedback } = await req.json();
    const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const subtask = await Subtask.findById(id);
    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Find employee assignment
    const employeeIndex = subtask.assignedEmployees.findIndex(
      emp => emp.employeeId.toString() === session.user.id
    );
    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: "You are not assigned to this subtask" },
        { status: 403 }
      );
    }

    // Update employee-specific status
    subtask.assignedEmployees[employeeIndex].status = status;
    if (status === "completed") {
      subtask.assignedEmployees[employeeIndex].completedAt = new Date();
    }
    if (feedback) {
      subtask.assignedEmployees[employeeIndex].feedback = feedback;
    }

    await subtask.save();

    const updatedSubtask = await Subtask.findById(id)
      .populate({
        path: "teamLeadId",
        select: "firstName lastName email",
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email",
      });

    // Prepare recipients safely
    const recipients = [
      updatedSubtask.teamLeadId,
      ...updatedSubtask.assignedEmployees
        .map(emp => emp.employeeId)
    ].filter(user => user && user._id && user.email && user._id.toString() !== session.user.id);

    // Send notifications & emails in parallel
    await Promise.all(
      recipients.map(async (user) => {
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Employee",
          senderName: session.user.name || "Employee",
          receiverId: user._id,
          receiverModel: "Employee",
          type: "subtask_status_updated",
          title: "Subtask Status Updated",
          message: `Employee ${session.user.name} updated the status of "${updatedSubtask.title}" to "${status}".`,
          link: `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/subtasks/${id}`,
          referenceId: updatedSubtask._id,
          referenceModel: "Subtask",
        });

        const emailHtml = subtaskStatusUpdateMailTemplate(
          `${user.firstName} ${user.lastName}`,
          updatedSubtask.title,
          session.user.name || "Employee",
          status,
          feedback || ""
        );
        await sendMail(user.email, "Subtask Status Updated", emailHtml);
      })
    );

    return NextResponse.json({
      success: true,
      message: "Task status updated successfully, notifications and emails sent",
      subtask: {
        _id: updatedSubtask._id,
        title: updatedSubtask.title,
        description: updatedSubtask.description,
        employeeStatus: status,
        subtaskStatus: updatedSubtask.status,
        teamLeadId: updatedSubtask.teamLeadId,
        assignedEmployees: updatedSubtask.assignedEmployees,
        completedAt: updatedSubtask.completedAt,
        priority: updatedSubtask.priority,
        startDate: updatedSubtask.startDate,
        endDate: updatedSubtask.endDate,
      }
    });

  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask", details: error.message },
      { status: 500 }
    );
  }
}


export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    const subtask = await Subtask.findById(id)
      .populate("submissionId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .lean();

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Check if employee is assigned
    const employeeAssignment = subtask.assignedEmployees.find(
      emp => emp.employeeId?._id?.toString() === session.user.id
    );

    if (!employeeAssignment) {
      return NextResponse.json(
        { error: "You are not assigned to this subtask" },
        { status: 403 }
      );
    }

    // Get submission stats
    const submissions = await EmployeeFormSubmission.find({
      subtaskId: id,
      employeeId: session.user.id
    });

    const approvedCount = submissions.filter(
      sub => sub.teamleadstatus === "approved"
    ).length;

    const leadRequired = subtask.lead || 1;
    const progress = leadRequired > 0 ? (approvedCount / leadRequired) * 100 : 0;

    return NextResponse.json({
      ...subtask,
      employeeStatus: employeeAssignment.status,
      assignedAt: employeeAssignment.assignedAt,
      completedAt: employeeAssignment.completedAt,
      stats: {
        totalSubmissions: submissions.length,
        approved: approvedCount,
        pending: submissions.filter(s => s.teamleadstatus === "pending").length,
        in_progress: submissions.filter(s => s.teamleadstatus === "in_progress").length,
        completed: submissions.filter(s => s.teamleadstatus === "completed").length,
        rejected: submissions.filter(s => s.teamleadstatus === "rejected").length,
        late: submissions.filter(s => s.teamleadstatus === "late").length,
        required: leadRequired,
        progress: progress
      }
    });

  } catch (error) {
    console.error("Error fetching subtask:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtask details" },
      { status: 500 }
    );
  }
}

