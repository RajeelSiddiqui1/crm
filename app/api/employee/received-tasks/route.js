import SharedTask from "@/models/SharedTask";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Employee") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        // Sirf wo tasks jo current employee ke liye hain
        const receivedTasks = await SharedTask.find({
            sharedEmployee: session.user.id
        })
        .populate("sharedManager", "firstName lastName email")
        .populate("sharedTeamlead", "firstName lastName email department")
        .populate("formId")
        .sort({ createdAt: -1 });

        return NextResponse.json({ 
            success: true, 
            receivedTasks 
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching employee received tasks:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error", 
            error: error.message 
        }, { status: 500 });
    }
}