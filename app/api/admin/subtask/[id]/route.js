import Subtask from "@/models/Subtask";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        
        // Fetch subtask with all populated data
        const subtask = await Subtask.findById(id)
            .populate("teamLeadId", "firstName lastName email profilePic department")
            .populate("depId", "name description")
            .populate("submissionId", "formTitle submittedBy submittedAt")
            .populate({
                path: "assignedEmployees.employeeId",
                select: "firstName lastName email profilePic department phone",
                populate: {
                    path: "depId",
                    select: "name"
                }
            })
            .populate({
                path: "assignedManagers.managerId",
                select: "firstName lastName email profilePic department phone",
                populate: {
                    path: "departments",
                    select: "name"
                }
            })
            .populate({
                path: "assignedTeamLeads.teamLeadId",
                select: "firstName lastName email profilePic department phone",
                populate: {
                    path: "depId",
                    select: "name"
                }
            });
        
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        return NextResponse.json(subtask);
    } catch (error) {
        console.error("Error fetching subtask details:", error);
        return NextResponse.json({ error: "Failed to fetch subtask details" }, { status: 500 });
    }
}