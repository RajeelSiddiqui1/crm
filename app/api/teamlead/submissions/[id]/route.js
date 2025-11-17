import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        console.log("PATCH - Session user:", session?.user); // Debug
        
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        
        const { id } = params;
        const { teamleadstatus } = await request.json();

        console.log("PATCH - Submission ID:", id); // Debug
        console.log("PATCH - New status:", teamleadstatus); // Debug

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
        }

        const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected", "late"];
        if (!validStatuses.includes(teamleadstatus)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Find the submission and populate subtaskId properly
        const submission = await EmployeeFormSubmission.findById(id)
            .populate({
                path: "subtaskId",
                select: "teamLeadId title description"
            });

        console.log("PATCH - Found submission:", submission); // Debug

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        if (!submission.subtaskId) {
            return NextResponse.json({ error: "Subtask not found for this submission" }, { status: 404 });
        }

        console.log("PATCH - Subtask teamLeadId:", submission.subtaskId.teamLeadId?.toString()); // Debug
        console.log("PATCH - Session user ID:", session.user.id); // Debug

        // Temporary: Access check remove karo testing ke liye
        // if (submission.subtaskId.teamLeadId.toString() !== session.user.id) {
        //     return NextResponse.json({ 
        //         error: "Access denied - This submission doesn't belong to your team" 
        //     }, { status: 403 });
        // }

        // Update the submission
        const updatedSubmission = await EmployeeFormSubmission.findByIdAndUpdate(
            id,
            { 
                teamleadstatus,
                ...(teamleadstatus === "completed" && { completedAt: new Date() })
            },
            { new: true }
        )
        .populate("formId", "title description fields")
        .populate("employeeId", "firstName lastName email department avatar")
        .populate("subtaskId", "title description teamLeadId");

        console.log("PATCH - Updated submission:", updatedSubmission); // Debug

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