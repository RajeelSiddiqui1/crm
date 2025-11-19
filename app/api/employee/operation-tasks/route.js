import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SharedTask from "@/models/SharedTask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission"

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Employee") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        // Employee ke assigned tasks fetch karo
        const sharedTasks = await SharedTask.find({
            sharedOperationEmployee: session.user.id
        })
        .populate("sharedManager", "firstName lastName email")
        .populate("sharedBy", "firstName lastName email")
        .populate("sharedOperationTeamlead", "firstName lastName email")
        .populate("sharedOperationEmployee", "firstName lastName email")
        .populate("formId")
        .sort({ createdAt: -1 });

        return NextResponse.json({ 
            success: true, 
            sharedTasks 
        }, { status: 200 });

    } catch (error) {
        console.error("Employee Operation Tasks Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}