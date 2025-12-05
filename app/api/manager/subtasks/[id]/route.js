import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Subtask from "@/models/Subtask";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // ✅ Await params first
        const { id } = await params;
        console.log("Subtask ID:", id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid subtask ID" }, { status: 400 });
        }

        const subtask = await Subtask.findById(id)
            .populate("submissionId", "title description formData status")
            .populate("teamLeadId", "firstName lastName email")
            .populate("assignedEmployees.employeeId", "firstName lastName email department");

        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Manager can access all subtasks, no authorization check needed

        return NextResponse.json(subtask, { status: 200 });

    } catch (error) {
        console.error("Error fetching subtask:", error);
        return NextResponse.json(
            { error: "Failed to fetch subtask" },
            { status: 500 }
        );
    }
}

// PUT - Update subtask
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;
        const body = await request.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid subtask ID" }, { status: 400 });
        }

        const subtask = await Subtask.findById(id);
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Authorization check
        if (subtask.teamLeadId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Update allowed fields
        const allowedUpdates = {
            title: body.title,
            description: body.description,
            status: body.status,
            priority: body.priority,
            startDate: body.startDate,
            endDate: body.endDate,
            startTime: body.startTime,
            endTime: body.endTime,
            teamLeadFeedback: body.teamLeadFeedback,
            assignedEmployees: body.assignedEmployees
        };

        // Remove undefined fields
        Object.keys(allowedUpdates).forEach(key => {
            if (allowedUpdates[key] === undefined) {
                delete allowedUpdates[key];
            }
        });

        const updatedSubtask = await Subtask.findByIdAndUpdate(
            id,
            { $set: allowedUpdates },
            { new: true, runValidators: true }
        ).populate("submissionId", "title description formData status")
         .populate("assignedEmployees.employeeId", "firstName lastName email department avatar");

        return NextResponse.json(updatedSubtask, { status: 200 });

    } catch (error) {
        console.error("Error updating subtask:", error);
        return NextResponse.json(
            { error: "Failed to update subtask" },
            { status: 500 }
        );
    }
}

// DELETE - Delete subtask
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid subtask ID" }, { status: 400 });
        }

        const subtask = await Subtask.findById(id);
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Authorization check
        if (subtask.teamLeadId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Delete associated employee submissions
        await EmployeeFormSubmission.deleteMany({ subtaskId: id });

        // Delete subtask
        await Subtask.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Subtask deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting subtask:", error);
        return NextResponse.json(
            { error: "Failed to delete subtask" },
            { status: 500 }
        );
    }
}