import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import Employee from "@/models/Employee";
import Manager from "@/models/Manager";
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
            .populate("assignedEmployees.employeeId", "firstName lastName email")
            .populate("assignedManagers.managerId", "firstName lastName email")
            .populate("assignedTeamLeads.teamLeadId", "firstName lastName email");

        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Calculate leads data
        let totalLeadsRequired = 0;
        let leadsCompleted = 0;

        if (subtask.hasLeadsTarget) {
            totalLeadsRequired = subtask.totalLeadsRequired || parseInt(subtask.lead || "1");

            // Calculate completed leads from all assignees
            const employeeLeads = subtask.assignedEmployees?.reduce((total, emp) =>
                total + (emp.leadsCompleted || 0), 0) || 0;

            const managerLeads = subtask.assignedManagers?.reduce((total, mgr) =>
                total + (mgr.leadsCompleted || 0), 0) || 0;

            leadsCompleted = employeeLeads + managerLeads;
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
            assignedEmployees = [],
            assignedManagers = [],
            startDate,
            endDate,
            startTime,
            endTime,
            priority,
            totalLeadsRequired,
            teamLeadId,
            teamLeadName,
            hasLeadsTarget = false,
        } = body;

        // Find existing subtask
        const existingSubtask = await Subtask.findById(id);
        if (!existingSubtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        // Check if user is the creator
        const teamLead = await TeamLead.findOne({ _id: teamLeadId || session.user.id });
        if (!teamLead) {
            return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
        }

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
        const oldEmployeeIds = existingSubtask.assignedEmployees?.map(emp =>
            emp.employeeId?.toString() || emp.employeeId) || [];

        const newEmployeeIds = assignedEmployees.map(emp => emp.employeeId);

        // Get old and new manager lists
        const oldManagerIds = existingSubtask.assignedManagers?.map(mgr =>
            mgr.managerId?.toString() || mgr.managerId) || [];

        const newManagerIds = assignedManagers.map(mgr => mgr.managerId);

        // Find added and removed users
        const addedEmployees = newEmployeeIds.filter(id => !oldEmployeeIds.includes(id));
        const removedEmployees = oldEmployeeIds.filter(id => !newEmployeeIds.includes(id));

        const addedManagers = newManagerIds.filter(id => !oldManagerIds.includes(id));
        const removedManagers = oldManagerIds.filter(id => !newManagerIds.includes(id));

        // Calculate leads per assignee
        const totalAssignees = assignedEmployees.length + assignedManagers.length;
        const leadsPerAssignee = hasLeadsTarget && totalLeadsRequired && totalAssignees > 0
            ? Math.ceil(totalLeadsRequired / totalAssignees)
            : 0;

        // Prepare assigned employees data
        const formattedAssignedEmployees = assignedEmployees.map(emp => {
            const existingEmp = existingSubtask.assignedEmployees?.find(e => {
                const existingEmpId = e.employeeId?.toString() || e.employeeId;
                return existingEmpId === emp.employeeId;
            });

            return {
                employeeId: emp.employeeId,
                email: emp.email || "",
                name: emp.name || "",
                status: existingEmp?.status || 'pending',
                leadsCompleted: existingEmp?.leadsCompleted || 0,
                leadsAssigned: hasLeadsTarget ? leadsPerAssignee : 0,
                assignedAt: existingEmp?.assignedAt || new Date(),
                completedAt: existingEmp?.completedAt
            };
        });

        // Prepare assigned managers data
        const formattedAssignedManagers = assignedManagers.map(mgr => {
            const existingMgr = existingSubtask.assignedManagers?.find(e => {
                const existingMgrId = e.managerId?.toString() || e.managerId;
                return existingMgrId === mgr.managerId;
            });

            return {
                managerId: mgr.managerId,
                email: mgr.email || "",
                name: mgr.name || "",
                status: existingMgr?.status || 'pending',
                leadsCompleted: existingMgr?.leadsCompleted || 0,
                leadsAssigned: hasLeadsTarget ? leadsPerAssignee : 0,
                assignedAt: existingMgr?.assignedAt || new Date(),
                completedAt: existingMgr?.completedAt
            };
        });

        // Update subtask
        const updateData = {
            title,
            description,
            assignedEmployees: formattedAssignedEmployees,
            assignedManagers: formattedAssignedManagers,
            startDate,
            endDate,
            startTime,
            endTime,
            priority,
            teamLeadName,
            hasLeadsTarget,
            totalLeadsRequired: hasLeadsTarget ? totalLeadsRequired : 0,
            status: existingSubtask.status === 'completed' ? 'completed' : 'in_progress',
            updatedAt: new Date()
        };

        const updatedSubtask = await Subtask.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate("assignedEmployees.employeeId", "firstName lastName email")
            .populate("assignedManagers.managerId", "firstName lastName email");

        // Send notifications and emails for added employees
        if (addedEmployees.length > 0) {
            const addedEmployeeDetails = await Employee.find({ _id: { $in: addedEmployees } });

            for (const emp of addedEmployeeDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
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

        // Send notifications and emails for added managers
        if (addedManagers.length > 0) {
            const addedManagerDetails = await Manager.find({ _id: { $in: addedManagers } });

            for (const mgr of addedManagerDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
                    senderName: teamLeadName,
                    receiverId: mgr._id,
                    receiverModel: "Manager",
                    type: "new_subtask",
                    title: "New Subtask Assignment",
                    message: `You have been assigned to subtask: "${title}".`,
                    link: `/manager/subtasks/${id}`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (mgr.email) {
                    const html = updatedSubtaskMailTemplate(
                        mgr.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "You have been added to this subtask",
                        `${process.env.NEXTAUTH_URL}/manager/subtasks/${id}`
                    );
                    sendMail(mgr.email, "New Subtask Assignment", html);
                }
            }
        }

        // Send notifications for removed employees
        if (removedEmployees.length > 0) {
            const removedEmployeeDetails = await Employee.find({ _id: { $in: removedEmployees } });

            for (const emp of removedEmployeeDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
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

        // Send notifications for removed managers
        if (removedManagers.length > 0) {
            const removedManagerDetails = await Manager.find({ _id: { $in: removedManagers } });

            for (const mgr of removedManagerDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
                    senderName: teamLeadName,
                    receiverId: mgr._id,
                    receiverModel: "Manager",
                    type: "subtask_update",
                    title: "Removed from Subtask",
                    message: `You have been removed from subtask: "${title}".`,
                    link: `/manager/subtasks`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (mgr.email) {
                    const html = updatedSubtaskMailTemplate(
                        mgr.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "You have been removed from this subtask",
                        `${process.env.NEXTAUTH_URL}/manager/subtasks`
                    );
                    sendMail(mgr.email, "Removed from Subtask", html);
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
                    senderModel: "TeamLead",
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

        // Send update notification to existing managers
        const existingManagers = newManagerIds.filter(id => !addedManagers.includes(id));
        if (existingManagers.length > 0) {
            const existingManagerDetails = await Manager.find({ _id: { $in: existingManagers } });

            for (const mgr of existingManagerDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
                    senderName: teamLeadName,
                    receiverId: mgr._id,
                    receiverModel: "Manager",
                    type: "subtask_update",
                    title: "Subtask Updated",
                    message: `Subtask "${title}" has been updated.`,
                    link: `/manager/subtasks/${id}`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (mgr.email) {
                    const html = updatedSubtaskMailTemplate(
                        mgr.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "This subtask has been updated",
                        `${process.env.NEXTAUTH_URL}/manager/subtasks/${id}`
                    );
                    sendMail(mgr.email, "Subtask Updated", html);
                }
            }
        }

        return NextResponse.json({
            message: "Subtask updated successfully",
            subtask: updatedSubtask
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating subtask:", error);
        return NextResponse.json({ error: error.message || "Failed to update subtask" }, { status: 500 });
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

        // Get all assigned users
        const employeeIds = existingSubtask.assignedEmployees?.map(emp => emp.employeeId) || [];
        const managerIds = existingSubtask.assignedManagers?.map(mgr => mgr.managerId) || [];

        const assignedEmployees = await Employee.find({ _id: { $in: employeeIds } });
        const assignedManagers = await Manager.find({ _id: { $in: managerIds } });

        // Send notifications and emails to employees before deletion
        for (const emp of assignedEmployees) {
            sendNotification({
                senderId: teamLead._id,
                senderModel: "TeamLead",
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

        // Send notifications and emails to managers before deletion
        for (const mgr of assignedManagers) {
            sendNotification({
                senderId: teamLead._id,
                senderModel: "TeamLead",
                senderName: teamLead.firstName + " " + teamLead.lastName,
                receiverId: mgr._id,
                receiverModel: "Manager",
                type: "subtask_deleted",
                title: "Subtask Deleted",
                message: `Subtask "${existingSubtask.title}" has been deleted by the team lead.`,
                link: `/manager/subtasks`,
                referenceId: id,
                referenceModel: "Subtask"
            });

            if (mgr.email) {
                const html = deletedSubtaskMailTemplate(
                    mgr.firstName,
                    existingSubtask.title,
                    existingSubtask.description,
                    teamLead.firstName + " " + teamLead.lastName,
                    `${process.env.NEXTAUTH_URL}/manager/subtasks`
                );
                sendMail(mgr.email, "Subtask Deleted", html);
            }
        }

        // Delete the subtask
        await Subtask.findByIdAndDelete(id);

        return NextResponse.json({
            message: "Subtask deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting subtask:", error);
        return NextResponse.json({ error: error.message || "Failed to delete subtask" }, { status: 500 });
    }
}