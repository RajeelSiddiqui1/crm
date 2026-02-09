import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        const task = await EmployeeTask.findById(id)
            .populate("submittedBy", "firstName lastName email avatar phone department")
            .populate({
                path: "assignedEmployee.employeeId",
                select: "firstName lastName email avatar position"
            })
            .populate({
                path: "assignedManager.managerId",
                select: "firstName lastName email avatar department"
            })
            .populate({
                path: "assignedTeamLead.teamLeadId",
                select: "firstName lastName email avatar team"
            })
            .lean();

        if (!task) {
            return NextResponse.json({
                success: false,
                error: "Task not found"
            }, { status: 404 });
        }

        // Check if team lead is assigned to this task
        const isAssigned = task.assignedTeamLead.some(
            tl => tl.teamLeadId._id.toString() === session.user.id
        );

        if (!isAssigned) {
            return NextResponse.json({
                success: false,
                error: "Not authorized to view this task"
            }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            task
        }, { status: 200 });
    } catch (error) {
        console.error("GET Task Detail Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch task details"
        }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { status, feedback, leadsCompleted } = body;

        const task = await EmployeeTask.findById(id);

        if (!task) {
            return NextResponse.json({
                success: false,
                error: "Task not found"
            }, { status: 404 });
        }

        // Find the team lead's assignment
        const teamLeadIndex = task.assignedTeamLead.findIndex(
            tl => tl.teamLeadId.toString() === session.user.id
        );

        if (teamLeadIndex === -1) {
            return NextResponse.json({
                success: false,
                error: "You are not assigned to this task"
            }, { status: 403 });
        }

        // Update team lead's status
        if (status) {
            task.assignedTeamLead[teamLeadIndex].status = status;
        }

        if (feedback !== undefined) {
            task.assignedTeamLead[teamLeadIndex].feedback = feedback;
        }

        if (leadsCompleted !== undefined) {
            task.assignedTeamLead[teamLeadIndex].leadsCompleted = leadsCompleted;
        }

        // Update overall task status based on team lead assignments
        const allTeamLeadsCompleted = task.assignedTeamLead.every(
            tl => ["completed", "approved"].includes(tl.status)
        );

        const anyTeamLeadInProgress = task.assignedTeamLead.some(
            tl => tl.status === "in_progress"
        );

        if (allTeamLeadsCompleted) {
            task.status = "completed";
        } else if (anyTeamLeadInProgress) {
            task.status = "in_progress";
        }

        await task.save();

        const updatedTask = await EmployeeTask.findById(id)
            .populate("submittedBy", "firstName lastName email")
            .populate("assignedTeamLead.teamLeadId", "firstName lastName email");

        return NextResponse.json({
            success: true,
            task: updatedTask,
            message: "Task updated successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("PUT Task Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to update task"
        }, { status: 500 });
    }
}