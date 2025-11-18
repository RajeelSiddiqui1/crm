import SharedTask from "@/models/SharedTask";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Single task details
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Employee") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;

        const task = await SharedTask.findOne({
            _id: id,
            sharedEmployee: session.user.id
        })
        .populate("sharedManager", "firstName lastName email")
        .populate("sharedTeamlead", "firstName lastName email department")
        .populate("sharedEmployee", "firstName lastName email department")
        .populate("formId");

        if (!task) {
            return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, task }, { status: 200 });

    } catch (error) {
        console.error("Error fetching employee task:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error", 
            error: error.message 
        }, { status: 500 });
    }
}

// PATCH - Update task status
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Employee") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;
        const { status, feedback } = await request.json();

        if (!status) {
            return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
        }

        // Validate status
        const validStatuses = ['pending', 'signed', 'not_avaiable', 'not_intrested', 're_shedule', 'completed', 'in_progress', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
        }

        const task = await SharedTask.findOne({
            _id: id,
            sharedEmployee: session.user.id
        });

        if (!task) {
            return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
        }

        // Update task status and feedback
        task.status = status;
        
        if (feedback) {
            task.employeeFeedback = feedback;
            task.feedbackUpdatedAt = new Date();
        }

        task.updatedAt = new Date();
        await task.save();

        // Return updated task with populated data
        const updatedTask = await SharedTask.findById(id)
            .populate("sharedManager", "firstName lastName email")
            .populate("sharedTeamlead", "firstName lastName email department")
            .populate("sharedEmployee", "firstName lastName email department")
            .populate("formId");

        return NextResponse.json({ 
            success: true, 
            message: "Task status updated successfully",
            task: updatedTask 
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating employee task:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error", 
            error: error.message 
        }, { status: 500 });
    }
}