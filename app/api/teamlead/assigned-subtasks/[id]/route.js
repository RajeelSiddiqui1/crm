// app/api/teamlead/assigned-subtasks/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import TeamLead from "@/models/TeamLead";
import Subtask from "@/models/Subtask";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { updatedSubtaskMailTemplate } from "@/helper/emails/teamlead/updatedSubtaskMailTemplate";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const subtask = await Subtask.findById(id)
            .populate("teamLeadId", "firstName lastName email")
            .populate("submissionId", "title description")
            .populate("assignedEmployees.employeeId", "firstName lastName email")
            .populate("assignedManagers.managerId", "firstName lastName email")
            .populate("assignedTeamLeads.teamLeadId", "firstName lastName email");

        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Check if current team lead is assigned to this subtask
        const isAssigned = subtask.assignedTeamLeads.some(
            tl => tl.teamLeadId?._id?.toString() === session.user.id ||
                tl.teamLeadId?.toString() === session.user.id
        );

        if (!isAssigned) {
            return NextResponse.json({ error: "Not authorized to view this subtask" }, { status: 403 });
        }

        return NextResponse.json(subtask, { status: 200 });
    } catch (error) {
        console.error("GET Assigned Subtask Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch subtask" },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status, feedback, leadsCompleted, feedbackType = "general", sendNotification: shouldSendNotification } = body;

        const subtask = await Subtask.findById(id)
            .populate("teamLeadId", "firstName lastName email")
            .populate("assignedTeamLeads.teamLeadId", "firstName lastName email");

        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Find current team lead's assignment
        const teamLeadAssignmentIndex = subtask.assignedTeamLeads.findIndex(
            tl => tl.teamLeadId?._id?.toString() === session.user.id ||
                tl.teamLeadId?.toString() === session.user.id
        );

        if (teamLeadAssignmentIndex === -1) {
            return NextResponse.json({ error: "Not assigned to this subtask" }, { status: 403 });
        }

        // Update the team lead's assignment
        if (status) {
            subtask.assignedTeamLeads[teamLeadAssignmentIndex].status = status;
            if (status === "completed" || status === "approved") {
                subtask.assignedTeamLeads[teamLeadAssignmentIndex].completedAt = new Date();
            }
        }

        // ✅ Add new feedback to feedbacks array
        if (feedback && feedback.trim()) {
            const newFeedback = {
                feedback: feedback.trim(),
                sentAt: new Date(),
                status: status || subtask.assignedTeamLeads[teamLeadAssignmentIndex].status,
                feedbackType: feedbackType || "general"
            };

            // Initialize feedbacks array if it doesn't exist
            if (!subtask.assignedTeamLeads[teamLeadAssignmentIndex].feedbacks) {
                subtask.assignedTeamLeads[teamLeadAssignmentIndex].feedbacks = [];
            }

            // Add new feedback
            subtask.assignedTeamLeads[teamLeadAssignmentIndex].feedbacks.push(newFeedback);
        }

        if (leadsCompleted !== undefined) {
            subtask.assignedTeamLeads[teamLeadAssignmentIndex].leadsCompleted = leadsCompleted;
        }

        // Check if all team leads have completed the task
        const allTeamLeadsCompleted = subtask.assignedTeamLeads.length > 0 &&
            subtask.assignedTeamLeads.every(tl =>
                tl.status === "completed" || tl.status === "approved"
            );

        if (allTeamLeadsCompleted) {
            subtask.status = "completed";
        }

        // Calculate total leads completed
        if (subtask.hasLeadsTarget) {
            let totalLeadsCompleted = 0;

            subtask.assignedTeamLeads.forEach(tl => {
                totalLeadsCompleted += tl.leadsCompleted || 0;
            });

            subtask.assignedEmployees.forEach(emp => {
                totalLeadsCompleted += emp.leadsCompleted || 0;
            });

            subtask.assignedManagers.forEach(mgr => {
                totalLeadsCompleted += mgr.leadsCompleted || 0;
            });

            subtask.leadsCompleted = totalLeadsCompleted;
        }

        await subtask.save();

        // Send notification to task creator (existing code)
        if (shouldSendNotification && subtask.teamLeadId) {
            const currentTeamLead = await TeamLead.findById(session.user.id);
            const currentTeamLeadName = `${currentTeamLead.firstName} ${currentTeamLead.lastName}`;

            await sendNotification({
                senderId: session.user.id,
                senderModel: "TeamLead",
                senderName: currentTeamLeadName,
                receiverId: subtask.teamLeadId._id,
                receiverModel: "TeamLead",
                type: "subtask_updated",
                title: "New Feedback Added",
                message: `${currentTeamLeadName} added feedback on task "${subtask.title}"`,
                link: `/teamlead/subtasks/${subtask._id}`,
                referenceId: subtask._id,
                referenceModel: "Subtask",
            });

            // Send email to creator
            if (subtask.teamLeadId.email) {
                const html = updatedSubtaskMailTemplate(
                    subtask.teamLeadId.firstName,
                    subtask.title,
                    status || subtask.assignedTeamLeads[teamLeadAssignmentIndex].status,
                    feedback || "No feedback provided",
                    currentTeamLeadName
                );
                await sendMail(subtask.teamLeadId.email, "New Feedback on Task", html);
            }
        }

        const updatedSubtask = await Subtask.findById(id)
            .populate("teamLeadId", "firstName lastName email")
            .populate("assignedEmployees.employeeId", "firstName lastName email")
            .populate("assignedManagers.managerId", "firstName lastName email")
            .populate("assignedTeamLeads.teamLeadId", "firstName lastName email");

        return NextResponse.json(updatedSubtask, { status: 200 });
    } catch (error) {
        console.error("PUT Assigned Subtask Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update subtask" },
            { status: 500 }
        );
    }
}

// Separate route for updating leads
export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { leadsCompleted, feedback } = body;

        const subtask = await Subtask.findById(id);

        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Find current team lead's assignment
        const teamLeadAssignmentIndex = subtask.assignedTeamLeads.findIndex(
            tl => tl.teamLeadId?.toString() === session.user.id
        );

        if (teamLeadAssignmentIndex === -1) {
            return NextResponse.json({ error: "Not assigned to this subtask" }, { status: 403 });
        }

        // Update leads
        if (leadsCompleted !== undefined) {
            subtask.assignedTeamLeads[teamLeadAssignmentIndex].leadsCompleted = leadsCompleted;
        }

        if (feedback !== undefined) {
            subtask.assignedTeamLeads[teamLeadAssignmentIndex].feedback = feedback;
        }

        // Recalculate total leads
        if (subtask.hasLeadsTarget) {
            let totalLeadsCompleted = 0;

            subtask.assignedTeamLeads.forEach(tl => {
                totalLeadsCompleted += tl.leadsCompleted || 0;
            });

            subtask.assignedEmployees.forEach(emp => {
                totalLeadsCompleted += emp.leadsCompleted || 0;
            });

            subtask.assignedManagers.forEach(mgr => {
                totalLeadsCompleted += mgr.leadsCompleted || 0;
            });

            subtask.leadsCompleted = totalLeadsCompleted;
        }

        await subtask.save();

        return NextResponse.json(subtask, { status: 200 });
    } catch (error) {
        console.error("PATCH Assigned Subtask Leads Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update leads" },
            { status: 500 }
        );
    }
}