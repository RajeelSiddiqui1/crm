import EmployeeTask from "@/models/EmployeeTask";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        
        // Fetch with detailed population
        const employeeTask = await EmployeeTask.findById(id)
            .populate("submittedBy", "firstName lastName email profilePic")
            .populate({
                path: "assignedTeamLead.teamLeadId",
                select: "firstName lastName email profilePic"
            })
            .populate({
                path: "assignedManager.managerId",
                select: "firstName lastName email profilePic"
            })
            .populate({
                path: "assignedEmployee.employeeId",
                select: "firstName lastName email profilePic"
            })
            .select("+fileAttachments");
        
        if (!employeeTask) {
            return NextResponse.json({ error: "Employee task not found" }, { status: 404 });
        }

        return NextResponse.json(employeeTask);
    } catch (error) {
        console.error("Error fetching employee task details:", error);
        return NextResponse.json({ error: "Failed to fetch employee task details" }, { status: 500 });
    }
}