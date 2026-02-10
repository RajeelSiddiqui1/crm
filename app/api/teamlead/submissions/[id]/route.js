import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import Employee from "@/models/Employee";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sendTaskStatusUpdateMail } from "@/helper/emails/teamlead/task-status-update";
import { sendNotification } from "@/lib/sendNotification";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = params;
    const { teamleadstatus } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected", "late"];
    if (!validStatuses.includes(teamleadstatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const submission = await EmployeeFormSubmission.findById(id)
      .populate("formId", "title description fields")
      .populate("employeeId", "firstName lastName email department avatar")
      .populate({
        path: "subtaskId",
        select: "teamLeadId title description"
      })
      .select("+fileAttachments")
      ;

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (!submission.subtaskId) {
      return NextResponse.json({ error: "Subtask not found for this submission" }, { status: 404 });
    }

    // Update submission status
    submission.teamleadstatus = teamleadstatus;
    if (teamleadstatus === "completed") submission.completedAt = new Date();
    await submission.save();

    // Send email & notification to employee in parallel
    if (submission.employeeId && submission.employeeId.email) {
      const employee = submission.employeeId;
      const emailHTML = sendTaskStatusUpdateMail({
        name: `${employee.firstName} ${employee.lastName}`,
        formTitle: submission.formId?.title || "Task",
        status: teamleadstatus,
        updatedBy: `${session.user.firstName} ${session.user.lastName}`
      });

      // Fire and forget emails & notifications
      Promise.all([
        sendMail(employee.email, "Task Status Updated", emailHTML).catch(err => console.warn("Email error:", err.message)),
        sendNotification({
          senderId: session.user.id,
          senderModel: "TeamLead",
          senderName: `${session.user.firstName} ${session.user.lastName}`,
          receiverId: employee._id,
          receiverModel: "Employee",
          type: "task_status_updated",
          title: "Task Status Updated",
          message: `Task "${submission.formId?.title}" status updated to ${teamleadstatus}.`,
          link: `${process.env.TASK_LINK}/employee/tasks`,
          referenceId: submission._id,
          referenceModel: "EmployeeFormSubmission"
        }).catch(err => console.warn("Notification error:", err.message))
      ]);
    }

    return NextResponse.json({
      message: "Status updated successfully",
      submission
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating submission status:", error);
    return NextResponse.json(
      { error: "Failed to update submission status" },
      { status: 500 }
    );
  }
}
