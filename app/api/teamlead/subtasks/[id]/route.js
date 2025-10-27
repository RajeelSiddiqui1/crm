import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

// GET single subtask
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;

        const subtask = await Subtask.findById(id)
            .populate('submissionId', 'title description')
            .populate('assignedEmployees.employeeId', 'firstName lastName email phone avatar')
            .lean();

        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Verify the subtask belongs to this team lead
        if (subtask.teamLeadId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json(subtask);

    } catch (error) {
        console.error("Error fetching subtask:", error);
        return NextResponse.json({ error: "Failed to fetch subtask" }, { status: 500 });
    }
}

// UPDATE subtask
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;
        const body = await request.json();

        // Find subtask and verify ownership
        const subtask = await Subtask.findById(id);
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        if (subtask.teamLeadId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Update allowed fields
        const allowedUpdates = ['status', 'teamLeadFeedback', 'priority'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        });

        // If status is being updated to completed, set completedAt
        if (updates.status === 'completed' && subtask.status !== 'completed') {
            updates.completedAt = new Date();
        }

        const updatedSubtask = await Subtask.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        )
        .populate('submissionId', 'title description')
        .populate('assignedEmployees.employeeId', 'firstName lastName email phone avatar');

        return NextResponse.json(updatedSubtask);

    } catch (error) {
        console.error("Error updating subtask:", error);
        return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const subtask = await Subtask.findOneAndDelete({
      _id: params.id,
      teamLeadId: session.user.id
    });

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subtask deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 });
  }
}
