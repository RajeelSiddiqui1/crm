import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SharedTask from "@/models/SharedTask";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        // TeamLead ke assigned tasks fetch karo
        const sharedTasks = await SharedTask.find({
            sharedOperationTeamlead: session.user.id
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
        console.error("TeamLead Operation Tasks Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}