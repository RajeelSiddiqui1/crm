import EmployeeTask from "@/models/EmployeeTask";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id } = params;
        
        const employeeTask = await EmployeeTask.findById(id)
            .populate("submittedBy", "name email profilePic")
            .populate("assignedTeamLead.teamLeadId", "name email profilePic")
            .populate("assignedManager.managerId", "name email profilePic")
            .populate("assignedEmployee.employeeId", "name email profilePic")
            .select("+fileAttachments");
        
        if (!employeeTask) {
            return NextResponse.json({ error: "Employee task not found" }, { status: 404 });
        }

        return NextResponse.json(employeeTask);
    } catch (error) {
        console.error("Error fetching employee task:", error);
        return NextResponse.json({ error: "Failed to fetch employee task" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { status, feedback } = await request.json();

        // Validate status
        const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected"];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updateData = {};
        if (status) updateData.status = status;
        
        const employeeTask = await EmployeeTask.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate("submittedBy", "name email profilePic")
        .populate("assignedTeamLead.teamLeadId", "name email profilePic")
        .populate("assignedManager.managerId", "name email profilePic")
        .populate("assignedEmployee.employeeId", "name email profilePic")
        .select("+fileAttachments");

        if (!employeeTask) {
            return NextResponse.json({ error: "Employee task not found" }, { status: 404 });
        }

        // Add admin feedback to all assigned users if provided
        if (feedback && feedback.trim()) {
            const feedbackObject = {
                feedback: feedback.trim(),
                sentAt: new Date(),
                feedbackBy: "Admin",
                adminName: session.user.name
            };

            // Add to all team leads
            if (employeeTask.assignedTeamLead?.length > 0) {
                employeeTask.assignedTeamLead.forEach(tl => {
                    if (!tl.feedbacks) tl.feedbacks = [];
                    tl.feedbacks.push(feedbackObject);
                });
            }

            // Add to all managers
            if (employeeTask.assignedManager?.length > 0) {
                employeeTask.assignedManager.forEach(mgr => {
                    if (!mgr.feedbacks) mgr.feedbacks = [];
                    mgr.feedbacks.push(feedbackObject);
                });
            }

            // Add to all employees
            if (employeeTask.assignedEmployee?.length > 0) {
                employeeTask.assignedEmployee.forEach(emp => {
                    if (!emp.feedbacks) emp.feedbacks = [];
                    emp.feedbacks.push(feedbackObject);
                });
            }

            await employeeTask.save();
        }

        return NextResponse.json({
            message: "Employee task updated successfully",
            task: employeeTask
        });
    } catch (error) {
        console.error("Error updating employee task:", error);
        return NextResponse.json({ error: "Failed to update employee task" }, { status: 500 });
    }
}