import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import SharedTask from "@/models/SharedTask";
import Manager from "@/models/Manager";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";

export async function GET(request) {
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

        // ✅ Check for Operation department by ID or string
        const hasOperationDepartment = currentManager.departments?.some(dep => 
            dep === "68f13ed5c36e254ff62a6eba" || dep.toLowerCase() === "operation"
        );

        if (!hasOperationDepartment) {
            return NextResponse.json({ success: false, message: "Access denied. Operation department required." }, { status: 403 });
        }

        console.log("Fetching signed tasks for operation manager:", session.user.id);

        const sharedTasks = await SharedTask.find({ 
            status: "signed"
        })
        .populate("sharedManager", "firstName lastName email")
        .populate("sharedBy", "firstName lastName email")
        .populate("sharedTeamlead", "firstName lastName email")
        .populate("sharedEmployee", "firstName lastName email")
        .populate("sharedOperationTeamlead", "firstName lastName email")
        .populate("sharedOperationEmployee", "firstName lastName email")
        .populate("formId")
        .sort({ createdAt: -1 });

        console.log("Found tasks:", sharedTasks.length);

        return NextResponse.json({ 
            success: true, 
            sharedTasks 
        }, { status: 200 });

    } catch (error) {
        console.error("Operation Manager Task Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}
