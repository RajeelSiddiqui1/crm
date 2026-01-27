import EmployeeTask from "@/models/EmployeeTask";
import { NextResponse } from "next/server";
import dbConnect  from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function GET() {
    try {
        await dbConnect();
       const employeeTasks = await EmployeeTask.find({})
            .populate("submittedBy", "name email")
            .populate("assignedTeamLead", "name email")
            .populate("assignedManager", "name email")
            .populate("assignedEmployee", "name email")
            .select("+fileAttachments")
        return NextResponse.json(employeeTasks);
    } catch (error) {
        console.error("Error fetching employee tasks:", error);
        return NextResponse.json({ error: "Failed to fetch employee tasks" }, { status: 500 });
    }
}
