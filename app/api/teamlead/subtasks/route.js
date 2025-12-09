import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { createdSubtaskMailTemplate } from "@/helper/emails/teamlead/createdSubtaskMailTemplate";

export async function GET(req) {
    try {
        await dbConnect();
        const subtasks = await Subtask.find({})
            .populate("submissionId", "title description")
            .populate({
                path: "assignedEmployees.employeeId",
                select: "firstName lastName email"
            });

        return NextResponse.json({ subtasks }, { status: 200 });
    } catch (error) {
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
            leadsRequired, // <-- lead number aa raha hai idhar se
        } = body;

        // submission optional
        let submission = null;
        if (submissionId) {
            submission = await FormSubmission.findById(submissionId);
        }

        const teamLead = await Employee.findOne({ email: session.user.email });
        if (!teamLead) {
            return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
        }

        const depId = teamLead.depId;

        const employees = await Employee.find({
            _id: { $in: assignedEmployees.map(emp => emp.employeeId) }
        });

        if (employees.length !== assignedEmployees.length) {
            return NextResponse.json({ error: "Some employees not found" }, { status: 400 });
        }

        // Lead name for emails/notifications
        const leadName = `${teamLead.firstName} ${teamLead.lastName}`;

        // FIX: lead number ko string form me save karna
        const leadValue = leadsRequired ? leadsRequired.toString() : "1";

        const subtask = new Subtask({
            title,
            description,
            submissionId: submission ? submission._id : null,
            teamLeadId: teamLead._id,
            depId,
            assignedEmployees: assignedEmployees.map(emp => ({
                employeeId: emp.employeeId,
                email: emp.email,
                status: "pending",
                leadsCompleted: 0,
                leadsAssigned: emp.leadsAssigned || 0
            })),
            startDate,
            endDate,
            startTime,
            endTime,
            priority: priority || "medium",
            lead: leadValue, // <-- FINAL FIX HERE
            teamLeadName: leadName, // keep for frontend display
        });

        await subtask.save();

        const populatedSubtask = await Subtask.findById(subtask._id)
            .populate("submissionId", "title description")
            .populate("assignedEmployees.employeeId", "firstName lastName email");

        // Notifications + Mails (parallel)
        for (const emp of employees) {
            sendNotification({
                senderId: teamLead._id,
                senderModel: "Employee",
                senderName: leadName,
                receiverId: emp._id,
                receiverModel: "Employee",
                type: "new_subtask",
                title: "New Subtask Assigned",
                message: `You have been assigned a new subtask: "${title}".`,
                link: `/employee/subtasks/${subtask._id}`,
                referenceId: subtask._id,
                referenceModel: "Subtask"
            });

            if (emp.email) {
                const html = createdSubtaskMailTemplate(
                    emp.firstName,
                    title,
                    description,
                    leadName,
                    startDate,
                    endDate
                );
                sendMail(emp.email, "New Subtask Assigned", html);
            }
        }

        return NextResponse.json(populatedSubtask, { status: 201 });

    } catch (error) {
        console.log("POST Subtask Error:", error);
        return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
    }
}
