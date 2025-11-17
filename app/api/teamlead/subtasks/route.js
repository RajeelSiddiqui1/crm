import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";

// In your API endpoint that fetches submission details
export async function GET(req) {
    try {
        await dbConnect();

        // ✅ Fetch all subtasks and populate relations
        const subtasks = await Subtask.find({})
            .populate("submissionId", "title description")
            .populate({
                path: "assignedEmployees.employeeId",
                select: "firstName lastName email"
            });

        return NextResponse.json({ subtasks }, { status: 200 });
    } catch (error) {
        console.error("❌ Error fetching subtasks:", error);
        return NextResponse.json({ error: "Failed to fetch subtasks" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const body = await request.json();
        const {
            title,
            description,
            submissionId,
            assignedEmployees,
            startDate,
            endDate,
            startTime,
            endTime,
            priority,
            lead
        } = body;

        // ✅ Check if FormSubmission exists
        const submission = await FormSubmission.findById(submissionId);
        if (!submission) {
            return NextResponse.json({ error: "FormSubmission not found" }, { status: 404 });
        }

        // ✅ Find team lead by email (more reliable)
        const teamLead = await Employee.findOne({ email: session.user.email });
        if (!teamLead) {
            return NextResponse.json({ error: "TeamLead not found in Employee collection" }, { status: 404 });
        }

        // ✅ Verify that all assigned employees exist
        const employees = await Employee.find({
            _id: { $in: assignedEmployees.map(emp => emp.employeeId) }
        });

        if (employees.length !== assignedEmployees.length) {
            return NextResponse.json({ error: "Some employees not found" }, { status: 400 });
        }

        // ✅ Set lead name — prefer provided or from logged-in lead
        const leadName = lead || `${teamLead.firstName} ${teamLead.lastName}`;

        // ✅ Create subtask
        const subtask = new Subtask({
            title,
            description,
            submissionId,
            teamLeadId: teamLead._id,
            assignedEmployees: assignedEmployees.map(emp => ({
                employeeId: emp.employeeId,
                email: emp.email,
                status: "pending"
            })),
            startDate,
            endDate,
            startTime,
            endTime,
            priority: priority || "medium",
            lead: leadName
        });

        await subtask.save();

        // ✅ Populate and return the created subtask
        const populatedSubtask = await Subtask.findById(subtask._id)
            .populate("submissionId", "title description")
            .populate("assignedEmployees.employeeId", "firstName lastName email");

        return NextResponse.json(populatedSubtask, { status: 201 });

    } catch (error) {
        console.error("❌ Error creating subtask:", error);
        return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
    }
}
