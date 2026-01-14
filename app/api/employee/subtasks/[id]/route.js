// app/api/employee/subtasks/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import TeamLead from "@/models/TeamLead";
import { subtaskStatusUpdateMailTemplate, subtaskFeedbackMailTemplate } from "@/helper/emails/employee/subtask-status-update";

// Helper function to send notifications
async function sendSubtaskUpdateNotification({ session, subtask, status, feedback }) {
    const teamLead = await TeamLead.findById(subtask.teamLeadId);
    if (!teamLead) return;

    // Send notification to team lead
    await sendNotification({
        senderId: session.user.id,
        senderModel: "Employee",
        senderName: session.user.name || "Employee",
        receiverId: teamLead._id,
        receiverModel: "TeamLead",
        type: "subtask_status_updated",
        title: status ? "Subtask Status Updated" : "New Feedback Received",
        message: status 
            ? `Employee ${session.user.name} updated status of "${subtask.title}" to "${status}".`
            : `Employee ${session.user.name} submitted feedback for "${subtask.title}".`,
        link: `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/subtasks`,
        referenceId: subtask._id,
        referenceModel: "Subtask",
    });

    // Send email to team lead
    const emailHtml = status 
        ? subtaskStatusUpdateMailTemplate(
            teamLead.firstName,
            subtask.title,
            session.user.name || "Employee",
            status,
            feedback || ""
        )
        : subtaskFeedbackMailTemplate(
            teamLead.firstName,
            subtask.title,
            session.user.name || "Employee",
            feedback
        );
    
    await sendMail(teamLead.email, status ? "Subtask Status Updated" : "New Feedback Received", emailHtml);
}

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
        
        // Validate at least one update
        if (!status && !feedback) {
            return NextResponse.json({ 
                error: "Either status or feedback is required" 
            }, { status: 400 });
        }

        const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected"];
        if (status && !validStatuses.includes(status)) {
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

        // Track changes for notification
        const hasStatusChange = status && subtask.assignedEmployees[employeeIndex].status !== status;
        const hasFeedbackChange = feedback && feedback.trim() !== "";
        const previousFeedback = subtask.assignedEmployees[employeeIndex].feedback || "";

        // Update employee-specific data
        if (status) {
            subtask.assignedEmployees[employeeIndex].status = status;
            if (status === "completed") {
                subtask.assignedEmployees[employeeIndex].completedAt = new Date();
            }
        }
        
        if (feedback !== undefined) {
            subtask.assignedEmployees[employeeIndex].feedback = feedback.trim();
        }

        // Update subtask overall status if needed
        if (status && subtask.assignedEmployees[employeeIndex].status === "completed") {
            // Check if all employees have completed
            const allEmployeesCompleted = subtask.assignedEmployees.every(
                emp => emp.status === "completed" || emp.status === "approved"
            );
            
            if (allEmployeesCompleted) {
                subtask.status = "completed";
                subtask.completedAt = new Date();
            }
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

        // Send notification to team lead
        if (hasStatusChange || hasFeedbackChange) {
            await sendSubtaskUpdateNotification({
                session,
                subtask: updatedSubtask,
                status: hasStatusChange ? status : null,
                feedback: hasFeedbackChange ? feedback : null
            });
        }

        // Prepare response data
        const responseData = {
            success: true,
            message: hasStatusChange 
                ? `Task ${hasFeedbackChange ? 'status updated and feedback submitted' : 'status updated'}, notification sent to team lead`
                : "Feedback submitted successfully, notification sent to team lead",
            subtask: {
                _id: updatedSubtask._id,
                title: updatedSubtask.title,
                description: updatedSubtask.description,
                employeeStatus: subtask.assignedEmployees[employeeIndex].status,
                employeeFeedback: subtask.assignedEmployees[employeeIndex].feedback,
                subtaskStatus: updatedSubtask.status,
                teamLeadId: updatedSubtask.teamLeadId,
                assignedEmployees: updatedSubtask.assignedEmployees,
                completedAt: subtask.assignedEmployees[employeeIndex].completedAt,
                priority: updatedSubtask.priority,
                startDate: updatedSubtask.startDate,
                endDate: updatedSubtask.endDate,
                updatedAt: updatedSubtask.updatedAt
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error updating subtask:", error);
        return NextResponse.json(
            { error: "Failed to update subtask", details: error.message },
            { status: 500 }
        );
    }
}

// New route for feedback-only updates
export async function PATCH(req, { params }) {
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

        const { feedback } = await req.json();
        
        if (!feedback || !feedback.trim()) {
            return NextResponse.json({ 
                error: "Feedback is required" 
            }, { status: 400 });
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

        // Update feedback
        const previousFeedback = subtask.assignedEmployees[employeeIndex].feedback || "";
        subtask.assignedEmployees[employeeIndex].feedback = feedback.trim();
        subtask.assignedEmployees[employeeIndex].feedbackUpdatedAt = new Date();

        await subtask.save();

        const updatedSubtask = await Subtask.findById(id)
            .populate({
                path: "teamLeadId",
                select: "firstName lastName email",
            });

        // Send notification to team lead for feedback
        await sendSubtaskUpdateNotification({
            session,
            subtask: updatedSubtask,
            status: null,
            feedback: feedback.trim()
        });

        return NextResponse.json({
            success: true,
            message: "Feedback submitted successfully, notification sent to team lead",
            subtask: {
                _id: updatedSubtask._id,
                title: updatedSubtask.title,
                employeeFeedback: subtask.assignedEmployees[employeeIndex].feedback,
                feedbackUpdatedAt: subtask.assignedEmployees[employeeIndex].feedbackUpdatedAt,
                teamLeadId: updatedSubtask.teamLeadId,
                updatedAt: updatedSubtask.updatedAt
            }
        });

    } catch (error) {
        console.error("Error submitting feedback:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback", details: error.message },
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
            .populate("teamLeadId", "firstName lastName email")
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

        const leadRequired = subtask.lead || subtask.totalLeadsRequired || 1;
        const progress = leadRequired > 0 ? (approvedCount / leadRequired) * 100 : 0;

        return NextResponse.json({
            ...subtask,
            employeeStatus: employeeAssignment.status,
            employeeFeedback: employeeAssignment.feedback || "",
            assignedAt: employeeAssignment.assignedAt,
            completedAt: employeeAssignment.completedAt,
            feedbackUpdatedAt: employeeAssignment.feedbackUpdatedAt,
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