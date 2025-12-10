import SharedTask from "@/models/SharedTask";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission"; // ← FIX
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        const currentManager = await Manager.findById(session.user.id);
        if (!currentManager) {
            return NextResponse.json({ success: false, message: "Manager not found" }, { status: 404 });
        }

        // Check if manager has the specific department
        const hasOperationDepartment = currentManager.departments?.includes("693989dac89f81400916f048");
        
        if (!hasOperationDepartment) {
            return NextResponse.json({ success: false, message: "Access denied. Operation department required." }, { status: 403 });
        }

        const { id } = params;
        const body = await request.json();
        const { sharedOperationTeamlead } = body;

        // Find the shared task
        const sharedTask = await SharedTask.findById(id);
        if (!sharedTask) {
            return NextResponse.json({ success: false, message: "Shared task not found" }, { status: 404 });
        }

        // Verify task is signed
        if (sharedTask.status !== "signed") {
            return NextResponse.json({ success: false, message: "Only signed tasks can be assigned to operation team" }, { status: 400 });
        }

        // Check if TeamLead exists
        const teamlead = await TeamLead.findById(sharedOperationTeamlead);
        if (!teamlead) {
            return NextResponse.json({ success: false, message: "TeamLead not found" }, { status: 404 });
        }

        // Update only sharedOperationTeamlead field
        const updatedTask = await SharedTask.findByIdAndUpdate(
            id,
            { 
                sharedOperationTeamlead: sharedOperationTeamlead,
                status: "pending" // Reset status for operation team
            },
            { new: true, runValidators: true }
        )
        .populate("sharedOperationTeamlead", "firstName lastName email")
        .populate("sharedBy", "firstName lastName email")
        .populate("sharedManager", "firstName lastName email")
        .populate("formId");

        return NextResponse.json({ 
            success: true, 
            message: "Task assigned to Operation TeamLead successfully", 
            sharedTask: updatedTask 
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        const currentManager = await Manager.findById(session.user.id);
        if (!currentManager) {
            return NextResponse.json({ success: false, message: "Manager not found" }, { status: 404 });
        }

        // Check if manager has the specific department
        const hasOperationDepartment = currentManager.departments?.includes("693989dac89f81400916f048");
        
        if (!hasOperationDepartment) {
            return NextResponse.json({ success: false, message: "Access denied. Operation department required." }, { status: 403 });
        }

        const { id } = params;

        const sharedTask = await SharedTask.findById(id)
            .populate("sharedOperationTeamlead", "firstName lastName email")
            .populate("sharedOperationEmployee", "firstName lastName email")
            .populate("sharedBy", "firstName lastName email")
            .populate("sharedManager", "firstName lastName email")
            .populate("formId");

        if (!sharedTask) {
            return NextResponse.json({ success: false, message: "Shared task not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            sharedTask 
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}