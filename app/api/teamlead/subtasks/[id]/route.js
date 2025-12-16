import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import Employee from "@/models/Employee";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { updatedSubtaskMailTemplate, deletedSubtaskMailTemplate } from "@/helper/emails/teamlead/subtaskMailTemplates";
import TeamLead from "@/models/TeamLead";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        const subtask = await Subtask.findById(id)
            .populate("submissionId", "title description")
            .populate("assignedEmployees.employeeId", "firstName lastName email");

        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Calculate leads from existing model fields
        let totalLeadsRequired = 0;
        let leadsCompleted = 0;
        
        if (subtask.assignedEmployees) {
            // Calculate total leads from lead field (if exists) or use default
            totalLeadsRequired = parseInt(subtask.lead || "1");
            
            // Calculate completed leads from assigned employees
            leadsCompleted = subtask.assignedEmployees.reduce((total, emp) => {
                return total + (emp.leadsCompleted || 0);
            }, 0);
        }

        // Add calculated fields to response
        const subtaskWithCalculations = {
            ...subtask.toObject(),
            totalLeadsRequired,
            leadsCompleted
        };

        return NextResponse.json({ subtask: subtaskWithCalculations }, { status: 200 });
    } catch (error) {
        console.error("Error fetching subtask:", error);
        return NextResponse.json({ error: "Failed to fetch subtask" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const {
            title,
            description,
            assignedEmployees,
            startDate,
            endDate,
            startTime,
            endTime,
            priority,
            totalLeadsRequired,
            teamLeadName,
            leadsRequired // This comes from frontend
        } = body;

        // Find existing subtask
        const existingSubtask = await Subtask.findById(id);
        if (!existingSubtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Check if user is the creator
        const teamLead = await TeamLead.findOne({ _id: session.user.id });
        if (existingSubtask.teamLeadId.toString() !== teamLead._id.toString()) {
            return NextResponse.json({ error: "You can only edit your own subtasks" }, { status: 403 });
        }

        // Prevent modification if subtask is completed
        if (existingSubtask.status === 'completed') {
            return NextResponse.json({ 
                error: "Cannot edit completed subtask" 
            }, { status: 400 });
        }

        // Get old and new employee lists
        const oldEmployeeIds = existingSubtask.assignedEmployees.map(emp => emp.employeeId.toString());
        const newEmployeeIds = assignedEmployees.map(emp => emp.employeeId);

        // Find added and removed employees
        const addedEmployees = newEmployeeIds.filter(id => !oldEmployeeIds.includes(id));
        const removedEmployees = oldEmployeeIds.filter(id => !newEmployeeIds.includes(id));

        // Prepare assigned employees data according to model
        const formattedAssignedEmployees = assignedEmployees.map(emp => {
            const existingEmp = existingSubtask.assignedEmployees.find(e => 
                e.employeeId.toString() === emp.employeeId
            );
            
            return {
                employeeId: emp.employeeId,
                email: emp.email,
                name: emp.name,
                status: existingEmp?.status || 'pending',
                leadsCompleted: existingEmp?.leadsCompleted || 0,
                leadsAssigned: emp.leadsAssigned || 0,
                assignedAt: existingEmp?.assignedAt || new Date()
            };
        });

        // Update subtask with existing model structure
        const updateData = {
            title,
            description,
            assignedEmployees: formattedAssignedEmployees,
            startDate,
            endDate,
            startTime,
            endTime,
            priority,
            teamLeadName,
            status: 'in_progress', // Update status
            lead: leadsRequired?.toString() || "1", // Store in lead field
            updatedAt: new Date()
        };

        const updatedSubtask = await Subtask.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate("assignedEmployees.employeeId", "firstName lastName email");

        // Calculate total leads for response
        const calculatedTotalLeads = parseInt(updatedSubtask.lead || "1");
        const calculatedCompletedLeads = updatedSubtask.assignedEmployees.reduce((total, emp) => {
            return total + (emp.leadsCompleted || 0);
        }, 0);

        // Send notifications and emails for added employees
        if (addedEmployees.length > 0) {
            const addedEmployeeDetails = await Employee.find({ _id: { $in: addedEmployees } });
            
            for (const emp of addedEmployeeDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "Employee",
                    senderName: teamLeadName,
                    receiverId: emp._id,
                    receiverModel: "Employee",
                    type: "new_subtask",
                    title: "New Subtask Assignment",
                    message: `You have been assigned to subtask: "${title}".`,
                    link: `/employee/subtasks/${id}`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (emp.email) {
                    const html = updatedSubtaskMailTemplate(
                        emp.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "You have been added to this subtask",
                        `${process.env.NEXTAUTH_URL}/employee/subtasks/${id}`
                    );
                    sendMail(emp.email, "New Subtask Assignment", html);
                }
            }
        }

        // Send notifications for removed employees
        if (removedEmployees.length > 0) {
            const removedEmployeeDetails = await Employee.find({ _id: { $in: removedEmployees } });
            
            for (const emp of removedEmployeeDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "Employee",
                    senderName: teamLeadName,
                    receiverId: emp._id,
                    receiverModel: "Employee",
                    type: "subtask_update",
                    title: "Removed from Subtask",
                    message: `You have been removed from subtask: "${title}".`,
                    link: `/employee/subtasks`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (emp.email) {
                    const html = updatedSubtaskMailTemplate(
                        emp.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "You have been removed from this subtask",
                        `${process.env.NEXTAUTH_URL}/employee/subtasks`
                    );
                    sendMail(emp.email, "Removed from Subtask", html);
                }
            }
        }

        // Send update notification to existing employees
        const existingEmployees = newEmployeeIds.filter(id => !addedEmployees.includes(id));
        if (existingEmployees.length > 0) {
            const existingEmployeeDetails = await Employee.find({ _id: { $in: existingEmployees } });
            
            for (const emp of existingEmployeeDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "Employee",
                    senderName: teamLeadName,
                    receiverId: emp._id,
                    receiverModel: "Employee",
                    type: "subtask_update",
                    title: "Subtask Updated",
                    message: `Subtask "${title}" has been updated.`,
                    link: `/employee/subtasks/${id}`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (emp.email) {
                    const html = updatedSubtaskMailTemplate(
                        emp.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "This subtask has been updated",
                        `${process.env.NEXTAUTH_URL}/employee/subtasks/${id}`
                    );
                    sendMail(emp.email, "Subtask Updated", html);
                }
            }
        }

        return NextResponse.json({ 
            message: "Subtask updated successfully",
            subtask: {
                ...updatedSubtask.toObject(),
                totalLeadsRequired: calculatedTotalLeads,
                leadsCompleted: calculatedCompletedLeads
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating subtask:", error);
        return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;

        // Find existing subtask
        const existingSubtask = await Subtask.findById(id);
        if (!existingSubtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Check if user is the creator
        const teamLead = await TeamLead.findOne({ _id: session.user.id });
        if (existingSubtask.teamLeadId.toString() !== teamLead._id.toString()) {
            return NextResponse.json({ error: "You can only delete your own subtasks" }, { status: 403 });
        }

        // Get all assigned employees
        const employeeIds = existingSubtask.assignedEmployees.map(emp => emp.employeeId);
        const assignedEmployees = await Employee.find({ _id: { $in: employeeIds } });

        // Send notifications and emails before deletion
        for (const emp of assignedEmployees) {
            sendNotification({
                senderId: teamLead._id,
                senderModel: "Employee",
                senderName: teamLead.firstName + " " + teamLead.lastName,
                receiverId: emp._id,
                receiverModel: "Employee",
                type: "subtask_deleted",
                title: "Subtask Deleted",
                message: `Subtask "${existingSubtask.title}" has been deleted by the team lead.`,
                link: `/employee/subtasks`,
                referenceId: id,
                referenceModel: "Subtask"
            });

            if (emp.email) {
                const html = deletedSubtaskMailTemplate(
                    emp.firstName,
                    existingSubtask.title,
                    existingSubtask.description,
                    teamLead.firstName + " " + teamLead.lastName,
                    `${process.env.NEXTAUTH_URL}/employee/subtasks`
                );
                sendMail(emp.email, "Subtask Deleted", html);
            }
        }

        // Delete the subtask
        await Subtask.findByIdAndDelete(id);

        return NextResponse.json({ 
            message: "Subtask deleted successfully" 
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting subtask:", error);
        return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 });
    }
}