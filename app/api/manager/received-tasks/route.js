import SharedTask from "@/models/SharedTask";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        const receivedTasks = await SharedTask.find({
            sharedManager: session.user.id
        })
        .populate("sharedTeamlead", "firstName lastName email department")
        .populate("sharedEmployee", "firstName lastName email")
        .populate("formId")
        .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, receivedTasks }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();
        const { sharedTo } = await request.json();
        const url = new URL(request.url);
        const taskId = url.pathname.split('/').pop();

        if (!sharedTo) {
            return NextResponse.json({ success: false, message: "Teamlead ID is required" }, { status: 400 });
        }

        const existingTask = await SharedTask.findOne({
            _id: taskId,
            sharedManager: session.user.id
        });

        if (!existingTask) {
            return NextResponse.json({ success: false, message: "Task not found or you don't have permission" }, { status: 404 });
        }

        const teamlead = await TeamLead.findById(sharedTo);
        if (!teamlead) {
            return NextResponse.json({ success: false, message: "Teamlead not found" }, { status: 404 });
        }

        existingTask.sharedTeamlead = sharedTo;
        await existingTask.save();

        const populatedTask = await SharedTask.findById(taskId)
            .populate("sharedManager", "firstName lastName email")
            .populate("sharedTeamlead", "firstName lastName email department")
            .populate("sharedEmployee", "firstName lastName email")
            .populate("formId");

        return NextResponse.json({ 
            success: true, 
            message: "Teamlead added successfully to task", 
            sharedTask: populatedTask 
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}