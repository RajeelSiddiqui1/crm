import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all";

        // Query to find tasks assigned to this team lead
        let query = {
            "assignedTeamLead.teamLeadId": session.user.id
        };

        // Filter by status if not "all"
        if (status !== "all") {
            query["assignedTeamLead.status"] = status;
        }

        const tasks = await EmployeeTask.find(query)
            .populate("submittedBy", "firstName lastName email avatar")
            .populate({
                path: "assignedEmployee.employeeId",
                select: "firstName lastName email avatar"
            })
            .populate({
                path: "assignedManager.managerId",
                select: "firstName lastName email avatar"
            })
            .populate({
                path: "assignedTeamLead.teamLeadId",
                select: "firstName lastName email avatar"
            })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            tasks,
            count: tasks.length
        }, { status: 200 });
    } catch (error) {
        console.error("GET Employee Tasks Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch tasks"
        }, { status: 500 });
    }
}
