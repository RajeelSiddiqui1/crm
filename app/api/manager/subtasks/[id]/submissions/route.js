import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import EmployeeForm from "@/models/EmployeeForm";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        console.log("Session:", session);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;
        console.log("Subtask ID:", id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid subtask ID" }, { status: 400 });
        }

        const subtask = await Subtask.findById(id);
        console.log("Subtask:", subtask);
        
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Manager can access all subtasks, no need for team lead check
        const submissions = await EmployeeFormSubmission.find({ subtaskId: id })
            .populate("formId", "title description fields")
            .populate("employeeId", "firstName lastName email department avatar")
            .populate("subtaskId", "title description")
            .sort({ createdAt: -1 });

        console.log("Found submissions:", submissions.length);

        return NextResponse.json(submissions, { status: 200 });

    } catch (error) {
        console.error("Error fetching employee submissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch employee submissions" },
            { status: 500 }
        );
    }
}

// PATCH endpoint for updating submission status
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;
        const { managerstatus } = await request.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
        }

        const submission = await EmployeeFormSubmission.findById(id);
        
        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Update manager status
        submission.managerstatus = managerstatus;
        
        // If manager approves/rejects, also update the overall status
        if (managerstatus === "approved" || managerstatus === "rejected") {
            submission.status = managerstatus;
        }

        await submission.save();

        return NextResponse.json(
            { message: "Status updated successfully", submission },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error updating submission status:", error);
        return NextResponse.json(
            { error: "Failed to update submission status" },
            { status: 500 }
        );
    }
}