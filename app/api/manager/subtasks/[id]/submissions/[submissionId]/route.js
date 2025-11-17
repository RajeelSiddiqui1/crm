import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - Get single submission details
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // ✅ Await params first
        const { id: subtaskId, submissionId } = await params;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(subtaskId) || !mongoose.Types.ObjectId.isValid(submissionId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Check if subtask exists
        const subtask = await Subtask.findById(subtaskId);
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Get submission with populated data
        const submission = await EmployeeFormSubmission.findOne({
            _id: submissionId,
            subtaskId: subtaskId
        })
        .populate("formId", "title description fields")
        .populate("employeeId", "firstName lastName email department avatar")
        .populate("subtaskId", "title description");

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        return NextResponse.json(submission, { status: 200 });

    } catch (error) {
        console.error("Error fetching submission:", error);
        return NextResponse.json(
            { error: "Failed to fetch submission" },
            { status: 500 }
        );
    }
}

// PATCH - Update submission status (managerStatus)
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // ✅ Await params first
        const { id: subtaskId, submissionId } = await params;
        const { managerStatus } = await request.json();

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(subtaskId) || !mongoose.Types.ObjectId.isValid(submissionId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Validate managerStatus
        const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected"];
        if (!validStatuses.includes(managerStatus)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Check if subtask exists
        const subtask = await Subtask.findById(subtaskId);
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Find and update submission
        const submission = await EmployeeFormSubmission.findOne({
            _id: submissionId,
            subtaskId: subtaskId
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Update managerStatus
        submission.managerStatus = managerStatus;
        
        // If manager approves or rejects, also update the main status
        if (managerStatus === "approved" || managerStatus === "rejected") {
            submission.status = managerStatus;
        }

        // Set completion date if status is completed or approved
        if (managerStatus === "completed" || managerStatus === "approved") {
            submission.completedAt = new Date();
        }

        await submission.save();

        // Populate the updated submission for response
        const updatedSubmission = await EmployeeFormSubmission.findById(submissionId)
            .populate("formId", "title description fields")
            .populate("employeeId", "firstName lastName email department avatar")
            .populate("subtaskId", "title description");

        return NextResponse.json(
            { 
                message: "Status updated successfully", 
                submission: updatedSubmission 
            },
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