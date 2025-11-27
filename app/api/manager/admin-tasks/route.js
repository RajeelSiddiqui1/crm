import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Check if user is Manager
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json(
                { success: false, message: "Unauthorized access" }, 
                { status: 401 }
            );
        }

        await dbConnect();

        // Get manager ID from session
        const managerId = session.user.id;

        // Find tasks where this manager is in the managers array
        const tasks = await AdminTask.find({
            managers: managerId
        })
        .populate("managers", "firstName lastName email department")
        .sort({ createdAt: -1 });

        return NextResponse.json({ 
            success: true, 
            tasks: tasks || []
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching manager tasks:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Internal server error", 
                error: error.message 
            }, 
            { status: 500 }
        );
    }
}

// Optional: Mark task as completed/update status
export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json(
                { success: false, message: "Unauthorized access" }, 
                { status: 401 }
            );
        }

        await dbConnect();
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('id');
        const body = await request.json();

        if (!taskId) {
            return NextResponse.json(
                { success: false, message: "Task ID is required" }, 
                { status: 400 }
            );
        }

        // Find the task and verify the manager is assigned to it
        const task = await AdminTask.findOne({
            _id: taskId,
            managers: session.user.id
        });

        if (!task) {
            return NextResponse.json(
                { success: false, message: "Task not found or not assigned to you" }, 
                { status: 404 }
            );
        }

        // Update task (you can add more fields as needed)
        const updatedTask = await AdminTask.findByIdAndUpdate(
            taskId,
            {
                status: body.status || task.status,
                // Add other fields that managers can update
            },
            { new: true }
        ).populate("managers", "firstName lastName email department");


        

        return NextResponse.json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Internal server error", 
                error: error.message 
            }, 
            { status: 500 }
        );
    }
}