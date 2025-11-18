import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SharedTask from "@/models/SharedTask";
import Employee from "@/models/Employee";

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();
        const { id } = params;
        const body = await request.json();
        const { sharedOperationEmployee } = body;

        // Check if task exists and is assigned to this TeamLead
        const task = await SharedTask.findOne({
            _id: id,
            sharedOperationTeamlead: session.user.id
        });

        if (!task) {
            return NextResponse.json({ success: false, message: "Task not found or access denied" }, { status: 404 });
        }

        // Check if employee exists
        if (sharedOperationEmployee) {
            const employee = await Employee.findById(sharedOperationEmployee);
            if (!employee) {
                return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
            }
        }

        // Update task
        const updatedTask = await SharedTask.findByIdAndUpdate(
            id,
            { sharedOperationEmployee },
            { new: true }
        )
        .populate("sharedOperationEmployee", "firstName lastName email")
        .populate("sharedOperationTeamlead", "firstName lastName email")
        .populate("sharedBy", "firstName lastName email")
        .populate("formId");

        return NextResponse.json({ 
            success: true, 
            message: "Task updated successfully",
            sharedTask: updatedTask 
        }, { status: 200 });

    } catch (error) {
        console.error("TeamLead Task Update Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();
        const { id } = params;

        const task = await SharedTask.findOne({
            _id: id,
            sharedOperationTeamlead: session.user.id
        })
        .populate("sharedOperationEmployee", "firstName lastName email")
        .populate("sharedOperationTeamlead", "firstName lastName email")
        .populate("sharedBy", "firstName lastName email")
        .populate("formId");

        if (!task) {
            return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            sharedTask: task 
        }, { status: 200 });

    } catch (error) {
        console.error("TeamLead Task Detail Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}