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
            return NextResponse.json(
                { success: false, message: "Unauthorized access" },
                { status: 401 }
            );
        }

        await dbConnect();

        const currentManager = await Manager.findById(session.user.id);

        if (!currentManager) {
            return NextResponse.json(
                { success: false, message: "Manager not found" },
                { status: 404 }
            );
        }

        const hasOperationDepartment = currentManager.departments?.includes(
            "6939a9e4a191bbc83a449cd6"
        );

        if (!hasOperationDepartment) {
            return NextResponse.json(
                { success: false, message: "Access denied. Operation department required." },
                { status: 403 }
            );
        }

        const sharedTasks = await SharedTask.find({
            status: "signed",
        })
            .populate("sharedManager", "firstName lastName email")
            .populate("sharedBy", "firstName lastName email")
            .populate("sharedTeamlead", "firstName lastName email")
            .populate("sharedEmployee", "firstName lastName email")
            .populate("sharedOperationTeamlead", "firstName lastName email")
            .populate("sharedOperationEmployee", "firstName lastName email")
            .populate("formId")
            .sort({ createdAt: -1 });

        return NextResponse.json(
            {
                success: true,
                sharedTasks,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
