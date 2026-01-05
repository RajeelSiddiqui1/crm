// app/api/teamlead/assigned-subtasks/[id]/leads/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import mongoose from "mongoose";

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
        const { leadsCompleted, feedback } = await req.json();

        const subtask = await Subtask.findById(id);
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Find current team lead assignment
        const teamLeadIndex = subtask.assignedTeamLeads.findIndex(
            tl => tl.teamLeadId.toString() === session.user.id
        );

        if (teamLeadIndex === -1) {
            return NextResponse.json({ error: "You are not assigned to this subtask" }, { status: 403 });
        }

        // Update leads
        if (leadsCompleted !== undefined) {
            subtask.assignedTeamLeads[teamLeadIndex].leadsCompleted = leadsCompleted;
        }
        if (feedback !== undefined) {
            subtask.assignedTeamLeads[teamLeadIndex].feedback = feedback;
        }

        // The middleware in Subtask model will automatically update the overall subtask leadsCompleted
        await subtask.save();

        const updatedSubtask = await Subtask.findById(id)
            .populate("teamLeadId", "firstName lastName email")
            .populate("assignedEmployees.employeeId", "firstName lastName email")
            .populate("assignedManagers.managerId", "firstName lastName email")
            .populate("assignedTeamLeads.teamLeadId", "firstName lastName email");

        return NextResponse.json(updatedSubtask, { status: 200 });
    } catch (error) {
        console.error("PUT Assigned Subtask Leads Error:", error);
        return NextResponse.json({ error: "Failed to update leads progress" }, { status: 500 });
    }
}
