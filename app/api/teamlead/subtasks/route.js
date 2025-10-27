import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

// In your API endpoint that fetches submission details
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const submissionId = searchParams.get('submissionId');

        const submission = await FormSubmission.findById(submissionId)
            .populate('formId', 'title description')
            .populate('assignedEmployees.employeeId', 'firstName lastName email avatar') // Ensure proper population
            .lean();

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        return NextResponse.json([submission]); // Return as array to match your frontend expectation
    } catch (error) {
        console.error("Error fetching submission:", error);
        return NextResponse.json({ error: "Failed to fetch submission details" }, { status: 500 });
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
            priority
        } = body;

        // Check if FormSubmission exists and belongs to this team lead
        // Yahan pe hum check karenge ke FormSubmission exist karta hai ya nahi
        const submission = await FormSubmission.findById(submissionId);

        if (!submission) {
            return NextResponse.json({ error: "FormSubmission not found" }, { status: 404 });
        }

        // Additional check: Verify that the employees exist
        const employees = await Employee.find({
            _id: { $in: assignedEmployees.map(emp => emp.employeeId) }
        });

        if (employees.length !== assignedEmployees.length) {
            return NextResponse.json({ error: "Some employees not found" }, { status: 400 });
        }

        // Create the subtask
        const subtask = new Subtask({
            title,
            description,
            submissionId,
            teamLeadId: session.user.id,
            assignedEmployees: assignedEmployees.map(emp => ({
                employeeId: emp.employeeId,
                email: emp.email,
                status: 'pending'
            })),
            startDate,
            endDate,
            startTime,
            endTime,
            priority: priority || 'medium'
        });

        await subtask.save();

        // Populate and return the created subtask
        const populatedSubtask = await Subtask.findById(subtask._id)
            .populate('submissionId', 'title description')
            .populate('assignedEmployees.employeeId', 'firstName lastName email');

        return NextResponse.json(populatedSubtask, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
    }
}