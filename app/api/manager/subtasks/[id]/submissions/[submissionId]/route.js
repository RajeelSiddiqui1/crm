import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import Employee from "@/models/Employee";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { managerEmployeeTaskStatusUpdateMailTemplate } from "@/helper/emails/manager/employee-task-status-update";
import { managerTeamLeadTaskStatusUpdateMailTemplate } from "@/helper/emails/manager/teamlead-task-status-update";

export const dynamic = "force-dynamic";

// GET remains unchanged
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id: subtaskId, submissionId } = await params;

        if (!mongoose.Types.ObjectId.isValid(subtaskId) || !mongoose.Types.ObjectId.isValid(submissionId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const submission = await EmployeeFormSubmission.findOne({
            _id: submissionId,
            subtaskId
        })
        .populate("formId", "title description fields")
        .populate("employeeId", "firstName lastName email department avatar")
        .populate("subtaskId", "title description teamLeadId");

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        return NextResponse.json(submission, { status: 200 });

    } catch (error) {
        console.error("Error fetching submission:", error);
        return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
    }
}

// PATCH - Update submission status + notifications/emails
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id: subtaskId, submissionId } = await params;
        const { managerStatus, feedback } = await request.json();

        if (!mongoose.Types.ObjectId.isValid(subtaskId) || !mongoose.Types.ObjectId.isValid(submissionId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected"];
        if (!validStatuses.includes(managerStatus)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const submission = await EmployeeFormSubmission.findOne({
            _id: submissionId,
            subtaskId
        })
        .populate("employeeId", "firstName lastName email")
        .populate("subtaskId", "title description teamLeadId");

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Update status and feedback
        submission.managerStatus = managerStatus;
        if (feedback) submission.managerFeedback = feedback;

        if (managerStatus === "approved" || managerStatus === "rejected") {
            submission.status = managerStatus;
        }

        if (managerStatus === "completed" || managerStatus === "approved") {
            submission.completedAt = new Date();
        }

        await submission.save();

        // -------------------------------
        // ✅ Send notifications & emails
        // -------------------------------
        const teamLead = submission.subtaskId.teamLeadId
            ? await Employee.findById(submission.subtaskId.teamLeadId)
            : null;

        const submissionLink = `${process.env.NEXTAUTH_URL}/manager/submissions/${submission._id}`;
        const employeeName = `${submission.employeeId.firstName} ${submission.employeeId.lastName}`;
        const teamLeadName = teamLead ? `${teamLead.firstName} ${teamLead.lastName}` : "Team Lead";

        const tasks = [];

        // Employee notification + email
        if (submission.employeeId.email) {
            tasks.push(sendNotification({
                senderId: session.user.id,
                senderModel: "Manager",
                senderName: session.user.name || "Manager",
                receiverId: submission.employeeId._id,
                receiverModel: "Employee",
                type: "manager_submission_status_update",
                title: "Your Submission Status Updated",
                message: `Your submission for "${submission.subtaskId.title}" is now "${managerStatus}"`,
                link: submissionLink,
                referenceId: submission._id,
                referenceModel: "EmployeeFormSubmission"
            }));

            tasks.push(sendMail(
                submission.employeeId.email,
                "Submission Status Updated by Manager",
                managerEmployeeTaskStatusUpdateMailTemplate(
                    employeeName,
                    submission.subtaskId.title,
                    session.user.name || "Manager",
                    managerStatus,
                    submissionLink,
                    feedback
                )
            ));
        }

        // Team Lead notification + email
        if (teamLead && teamLead.email) {
            tasks.push(sendNotification({
                senderId: session.user.id,
                senderModel: "Manager",
                senderName: session.user.name || "Manager",
                receiverId: teamLead._id,
                receiverModel: "Employee",
                type: "manager_submission_status_update_teamlead",
                title: "Submission Status Updated",
                message: `Submission of "${employeeName}" for "${submission.subtaskId.title}" updated to "${managerStatus}"`,
                link: submissionLink,
                referenceId: submission._id,
                referenceModel: "EmployeeFormSubmission"
            }));

            tasks.push(sendMail(
                teamLead.email,
                "Employee Submission Updated by Manager",
                managerTeamLeadTaskStatusUpdateMailTemplate(
                    teamLeadName,
                    employeeName,
                    submission.subtaskId.title,
                    session.user.name || "Manager",
                    managerStatus,
                    submissionLink,
                    feedback
                )
            ));
        }

        await Promise.all(tasks);

        // Populate updated submission for response
        const updatedSubmission = await EmployeeFormSubmission.findById(submissionId)
            .populate("formId", "title description fields")
            .populate("employeeId", "firstName lastName email department avatar")
            .populate("subtaskId", "title description teamLeadId");

        return NextResponse.json({
            message: "Status updated and notifications sent successfully",
            submission: updatedSubmission
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating submission status:", error);
        return NextResponse.json({ error: "Failed to update submission status" }, { status: 500 });
    }
}
