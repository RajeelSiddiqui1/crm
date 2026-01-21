import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "Employee") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all";

        // Query to find tasks assigned to this employee
        let query = {
            "assignedEmployee.employeeId": session.user.id
        };

        // Filter by status if not "all"
        if (status !== "all") {
            query["assignedEmployee.status"] = status;
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

        // Transform data to show employee-specific status
        const transformedTasks = tasks.map(task => {
            const employeeAssignment = task.assignedEmployee.find(
                emp => emp.employeeId?._id?.toString() === session.user.id
            );
            
            return {
                ...task,
                employeeStatus: employeeAssignment?.status || "pending",
                employeeFeedback: employeeAssignment?.feedback || "",
                assignedAt: employeeAssignment?.assignedAt || task.createdAt
            };
        });

        return NextResponse.json({
            success: true,
            subtasks: transformedTasks,
            count: transformedTasks.length
        }, { status: 200 });
    } catch (error) {
        console.error("GET Employee Assigned Tasks Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch assigned tasks"
        }, { status: 500 });
    }
}