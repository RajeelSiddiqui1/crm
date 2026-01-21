import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all";

        // Query to find tasks assigned to this manager
        let query = {
            "assignedManager.managerId": session.user.id
        };

        // Filter by status if not "all"
        if (status !== "all") {
            query["assignedManager.status"] = status;
        }

        const tasks = await EmployeeTask.find(query)
            .populate("submittedBy", "firstName lastName email avatar role")
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

        // Transform data to show manager-specific status
        const transformedTasks = tasks.map(task => {
            const managerAssignment = task.assignedManager.find(
                mgr => mgr.managerId?._id?.toString() === session.user.id
            );
            
            return {
                ...task,
                managerStatus: managerAssignment?.status || "pending",
                managerFeedback: managerAssignment?.feedback || "",
                assignedAt: managerAssignment?.assignedAt || task.createdAt
            };
        });

        return NextResponse.json({
            success: true,
            subtasks: transformedTasks,
            count: transformedTasks.length
        }, { status: 200 });
    } catch (error) {
        console.error("GET Manager Assigned Tasks Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch assigned tasks"
        }, { status: 500 });
    }
}