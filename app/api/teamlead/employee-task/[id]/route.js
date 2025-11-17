import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";

// GET: Fetch employee form submissions for a specific subtask
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        // Authentication check
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Authorization check - only teamlead can access
        if (session.user.role !== "Teamlead") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await dbConnect();
        
        const { id } = params; // subtaskId
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid subtask ID" }, { status: 400 });
        }

        // Fetch all form submissions for this subtask
        const submissions = await EmployeeFormSubmission.find({ subtaskId: id })
            .populate("formId", "title description")
            .populate("employeeId", "name email department")
            .populate("subtaskId", "title description")
            .sort({ createdAt: -1 });

        return NextResponse.json(submissions, { status: 200 });

    } catch (error) {
        console.error("Error fetching employee submissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch employee submissions" },
            { status: 500 }
        );
    }
}

// PATCH: Update teamlead status for a submission
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        // Authentication check
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Authorization check - only teamlead can access
        if (session.user.role !== "Teamlead") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await dbConnect();
        
        const { id } = params; // submissionId
        const { teamleadstatus, feedback } = await request.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
        }

        // Validate status
        const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected", "late"];
        if (!validStatuses.includes(teamleadstatus)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Update the submission
        const updatedSubmission = await EmployeeFormSubmission.findByIdAndUpdate(
            id,
            { 
                teamleadstatus,
                ...(teamleadstatus === "completed" && { completedAt: new Date() })
            },
            { new: true }
        ).populate("formId", "title description")
         .populate("employeeId", "name email department")
         .populate("subtaskId", "title description");

        if (!updatedSubmission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Status updated successfully",
            submission: updatedSubmission
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating submission status:", error);
        return NextResponse.json(
            { error: "Failed to update submission status" },
            { status: 500 }
        );
    }
}