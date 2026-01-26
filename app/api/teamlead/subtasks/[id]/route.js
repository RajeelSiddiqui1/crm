import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Subtask from "@/models/Subtask";
import Employee from "@/models/Employee";
import Manager from "@/models/Manager";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { Upload } from "@aws-sdk/lib-storage";
  import { getSignedUrl } from "@aws-sdk/s3-request-presigner";     
import { updatedSubtaskMailTemplate, deletedSubtaskMailTemplate } from "@/helper/emails/teamlead/subtaskMailTemplates";
import TeamLead from "@/models/TeamLead";
import s3 from "@/lib/aws";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json(
                { error: "Unauthorized. Team Lead access required." },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find the subtask and populate all necessary fields
        const subtask = await Subtask.findById(id)
            .populate("submissionId", "title description")
            .populate("teamLeadId", "firstName lastName email department")
            .populate("depId", "name code")
            .populate("assignedEmployees.employeeId", "firstName lastName email department position")
            .populate("assignedManagers.managerId", "firstName lastName email department position")
            .populate("assignedTeamLeads.teamLeadId", "firstName lastName email department")
            .lean();

        if (!subtask) {
            return NextResponse.json(
                { error: "Subtask not found" },
                { status: 404 }
            );
        }

        // Check if the current team lead owns this subtask
        if (subtask.teamLeadId._id.toString() !== session.user.id) {
            return NextResponse.json(
                { error: "You are not authorized to view this subtask" },
                { status: 403 }
            );
        }

        // Calculate leads progress
        let totalLeadsRequired = 0;
        let leadsCompleted = 0;
        let leadsProgress = 0;

        if (subtask.hasLeadsTarget) {
            totalLeadsRequired = subtask.totalLeadsRequired || parseInt(subtask.lead || "1");

            // Calculate completed leads from all assignees
            const employeeLeads = subtask.assignedEmployees?.reduce((total, emp) =>
                total + (emp.leadsCompleted || 0), 0) || 0;

            const managerLeads = subtask.assignedManagers?.reduce((total, mgr) =>
                total + (mgr.leadsCompleted || 0), 0) || 0;

            const teamLeadLeads = subtask.assignedTeamLeads?.reduce((total, tl) =>
                total + (tl.leadsCompleted || 0), 0) || 0;

            leadsCompleted = employeeLeads + managerLeads + teamLeadLeads;
            
            if (totalLeadsRequired > 0) {
                leadsProgress = Math.round((leadsCompleted / totalLeadsRequired) * 100);
            }
        }

        // Calculate overall status statistics
        const allAssignees = [
            ...(subtask.assignedEmployees || []),
            ...(subtask.assignedManagers || []),
            ...(subtask.assignedTeamLeads || [])
        ];

        const statusStats = {
            completed: allAssignees.filter(a => a.status === 'completed' || a.status === 'approved').length,
            in_progress: allAssignees.filter(a => a.status === 'in_progress').length,
            pending: allAssignees.filter(a => a.status === 'pending').length,
            rejected: allAssignees.filter(a => a.status === 'rejected').length,
            total: allAssignees.length
        };

        // Format assignee data
        const formatAssignee = (assignee, type) => {
            const userObj = assignee.employeeId || assignee.managerId || assignee.teamLeadId;
            return {
                id: userObj?._id || assignee._id,
                name: userObj?.firstName && userObj?.lastName 
                    ? `${userObj.firstName} ${userObj.lastName}`
                    : userObj?.name || assignee.name || "Unknown",
                email: assignee.email,
                status: assignee.status,
                role: type,
                leadsCompleted: assignee.leadsCompleted || 0,
                leadsAssigned: assignee.leadsAssigned || 0,
                progress: assignee.leadsAssigned > 0 
                    ? Math.round((assignee.leadsCompleted / assignee.leadsAssigned) * 100)
                    : 0,
                assignedAt: assignee.assignedAt,
                completedAt: assignee.completedAt,
                feedbacks: assignee.feedbacks || [], // Changed from feedback to feedbacks
                latestFeedback: assignee.feedbacks?.length > 0 
                    ? assignee.feedbacks[assignee.feedbacks.length - 1]?.feedback 
                    : null,
                feedbackType: assignee.feedbacks?.length > 0 
                    ? assignee.feedbacks[assignee.feedbacks.length - 1]?.type || "neutral"
                    : "neutral",
                department: userObj?.department || "Unknown"
            };
        };

        // Format all assignees
        const formattedEmployees = subtask.assignedEmployees?.map(emp => 
            formatAssignee(emp, 'employee')) || [];
        
        const formattedManagers = subtask.assignedManagers?.map(mgr => 
            formatAssignee(mgr, 'manager')) || [];
        
        const formattedTeamLeads = subtask.assignedTeamLeads?.map(tl => 
            formatAssignee(tl, 'teamlead')) || [];

        // Combine all assignees
        const allAssigneesFormatted = [
            ...formattedEmployees,
            ...formattedManagers,
            ...formattedTeamLeads
        ];

        // Check if subtask is overdue
        const now = new Date();
        const endDate = new Date(subtask.endDate);
        const isOverdue = now > endDate;

        // Calculate time remaining
        const timeRemaining = isOverdue 
            ? `Overdue by ${Math.floor((now - endDate) / (1000 * 60 * 60 * 24))} days`
            : `${Math.floor((endDate - now) / (1000 * 60 * 60 * 24))} days remaining`;

        // Prepare response object
        const response = {
            subtask: {
                _id: subtask._id,
                title: subtask.title,
                description: subtask.description,
                teamLeadId: {
                    _id: subtask.teamLeadId?._id,
                    name: subtask.teamLeadId?.firstName && subtask.teamLeadId?.lastName
                        ? `${subtask.teamLeadId.firstName} ${subtask.teamLeadId.lastName}`
                        : subtask.teamLeadId?.name || "Unknown",
                    email: subtask.teamLeadId?.email,
                    department: subtask.teamLeadId?.department
                },
                department: subtask.depId ? {
                    _id: subtask.depId._id,
                    name: subtask.depId.name,
                    code: subtask.depId.code
                } : null,
                startDate: subtask.startDate,
                endDate: subtask.endDate,
                startTime: subtask.startTime,
                endTime: subtask.endTime,
                status: subtask.status,
                priority: subtask.priority,
                lead: subtask.lead,
                fileAttachmentUrl: subtask.fileAttachmentUrl,
                fileAttachments: subtask.fileAttachments || [],
                teamLeadFeedback: subtask.teamLeadFeedback,
                completedAt: subtask.completedAt,
                teamLeadApproved: subtask.teamLeadApproved,
                teamLeadApprovedAt: subtask.teamLeadApprovedAt,
                createdAt: subtask.createdAt,
                updatedAt: subtask.updatedAt,
                
                // Leads tracking
                hasLeadsTarget: subtask.hasLeadsTarget,
                totalLeadsRequired,
                leadsCompleted,
                leadsProgress,
                
                // Assignees
                assignedEmployees: formattedEmployees,
                assignedManagers: formattedManagers,
                assignedTeamLeads: formattedTeamLeads,
                allAssignees: allAssigneesFormatted,
                
                // Statistics
                statusStats,
                totalAssignees: allAssignees.length,
                
                // Timeline
                isOverdue,
                timeRemaining,
                duration: subtask.endDate && subtask.startDate
                    ? `${Math.floor((new Date(subtask.endDate) - new Date(subtask.startDate)) / (1000 * 60 * 60 * 24))} days`
                    : "Not specified",
                
                // Submission info
                submission: subtask.submissionId ? {
                    _id: subtask.submissionId._id,
                    title: subtask.submissionId.title,
                    description: subtask.submissionId.description
                } : null
            },
            metadata: {
                requestedBy: session.user.id,
                requestedAt: new Date().toISOString(),
                role: session.user.role
            }
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error("Error fetching subtask:", error);
        return NextResponse.json(
            { 
                error: "Failed to fetch subtask details",
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}


export async function PUT(request, { params }) {
    try {
        const formData = await request.formData();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;

        // Extract form fields
        const title = formData.get("title");
        const description = formData.get("description");
        const startDate = formData.get("startDate");
        const endDate = formData.get("endDate");
        const startTime = formData.get("startTime");
        const endTime = formData.get("endTime");
        const priority = formData.get("priority");
        const totalLeadsRequired = formData.get("totalLeadsRequired");
        const teamLeadId = formData.get("teamLeadId");
        const teamLeadName = formData.get("teamLeadName");
        const teamLeadDepId = formData.get("teamLeadDepId");
        const hasLeadsTarget = formData.get("hasLeadsTarget") === "true";

        // Parse JSON arrays for assignees
        const assignedEmployees = JSON.parse(formData.get("assignedEmployees") || "[]");
        const assignedManagers = JSON.parse(formData.get("assignedManagers") || "[]");
        const assignedTeamLeads = JSON.parse(formData.get("assignedTeamLeads") || "[]");

        // Files to remove
        const removeFiles = JSON.parse(formData.get("removeFiles") || "[]");

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

        // Get old and new user lists
        const oldEmployeeIds = existingSubtask.assignedEmployees?.map(emp =>
            emp.employeeId?.toString() || emp.employeeId) || [];

        const newEmployeeIds = assignedEmployees.map(emp => emp.employeeId);

        const oldManagerIds = existingSubtask.assignedManagers?.map(mgr =>
            mgr.managerId?.toString() || mgr.managerId) || [];

        const newManagerIds = assignedManagers.map(mgr => mgr.managerId);

        const oldTeamLeadIds = existingSubtask.assignedTeamLeads?.map(tl =>
            tl.teamLeadId?.toString() || tl.teamLeadId) || [];

        const newTeamLeadIds = assignedTeamLeads.map(tl => tl.teamLeadId);

        // Find added and removed users
        const addedEmployees = newEmployeeIds.filter(id => !oldEmployeeIds.includes(id));
        const removedEmployees = oldEmployeeIds.filter(id => !newEmployeeIds.includes(id));

        const addedManagers = newManagerIds.filter(id => !oldManagerIds.includes(id));
        const removedManagers = oldManagerIds.filter(id => !newManagerIds.includes(id));

        const addedTeamLeads = newTeamLeadIds.filter(id => !oldTeamLeadIds.includes(id));
        const removedTeamLeads = oldTeamLeadIds.filter(id => !newTeamLeadIds.includes(id));

        // Calculate leads per assignee
        const totalAssignees = assignedEmployees.length + assignedManagers.length + assignedTeamLeads.length;
        const leadsPerAssignee = hasLeadsTarget && totalLeadsRequired && totalAssignees > 0
            ? Math.ceil(parseInt(totalLeadsRequired) / totalAssignees)
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

        // Prepare assigned team leads data
        const formattedAssignedTeamLeads = assignedTeamLeads.map(tl => {
            const existingTl = existingSubtask.assignedTeamLeads?.find(e => {
                const existingTlId = e.teamLeadId?.toString() || e.teamLeadId;
                return existingTlId === tl.teamLeadId;
            });

            return {
                teamLeadId: tl.teamLeadId,
                email: tl.email || "",
                name: tl.name || "",
                status: existingTl?.status || 'pending',
                leadsCompleted: existingTl?.leadsCompleted || 0,
                leadsAssigned: hasLeadsTarget ? leadsPerAssignee : 0,
                assignedAt: existingTl?.assignedAt || new Date(),
                completedAt: existingTl?.completedAt
            };
        });

        // -------------------------------
        // FILE HANDLING
        // -------------------------------
        let uploadedFiles = [...existingSubtask.fileAttachments];

        // Remove specified files
        if (removeFiles.length > 0) {
            for (const fileId of removeFiles) {
                const fileIndex = uploadedFiles.findIndex(f => f._id.toString() === fileId);
                if (fileIndex > -1) {
                    const file = uploadedFiles[fileIndex];
                    if (file.publicId) {
                        try {
                            await s3.send(
                                new DeleteObjectCommand({
                                    Bucket: process.env.AWS_BUCKET_NAME,
                                    Key: file.publicId,
                                })
                            );
                        } catch (e) {
                            console.error("S3 delete error:", e);
                        }
                    }
                    uploadedFiles.splice(fileIndex, 1);
                }
            }
        }

        // Add new files
        const newFiles = formData.getAll("files");
        for (const file of newFiles) {
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const fileName = file.name;
                const fileType = file.type;
                const fileSize = file.size;
                const fileKey = `teamlead_tasks/files/${Date.now()}_${fileName}`;

                const upload = new Upload({
                    client: s3,
                    params: {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: fileKey,
                        Body: buffer,
                        ContentType: fileType,
                        Metadata: {
                            originalName: encodeURIComponent(fileName),
                            uploadedBy: session.user.id,
                            uploadedAt: Date.now().toString(),
                        },
                    },
                });
                await upload.done();

                const command = new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: fileKey,
                });
                const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 1 week

                uploadedFiles.push({
                    url: fileUrl,
                    name: fileName,
                    type: fileType,
                    size: fileSize,
                    publicId: fileKey,
                });
            }
        }

        // Update subtask
        const updateData = {
            title,
            description,
            assignedEmployees: formattedAssignedEmployees,
            assignedManagers: formattedAssignedManagers,
            assignedTeamLeads: formattedAssignedTeamLeads,
            startDate,
            endDate,
            startTime,
            endTime,
            priority,
            teamLeadName,
            hasLeadsTarget,
            totalLeadsRequired: hasLeadsTarget ? parseInt(totalLeadsRequired) : 0,
            fileAttachments: uploadedFiles,
            status: existingSubtask.status === 'completed' ? 'completed' : 'in_progress',
            updatedAt: new Date()
        };

        const updatedSubtask = await Subtask.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate("assignedEmployees.employeeId", "firstName lastName email")
            .populate("assignedManagers.managerId", "firstName lastName email")
            .populate("assignedTeamLeads.teamLeadId", "firstName lastName email");

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

        // Send notifications and emails for added team leads
        if (addedTeamLeads.length > 0) {
            const addedTeamLeadDetails = await TeamLead.find({ _id: { $in: addedTeamLeads } });

            for (const tl of addedTeamLeadDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
                    senderName: teamLeadName,
                    receiverId: tl._id,
                    receiverModel: "TeamLead",
                    type: "new_subtask",
                    title: "New Subtask Assignment",
                    message: `You have been assigned to subtask by ${teamLeadName}: "${title}".`,
                    link: `/teamlead/assigned-subtasks/${id}`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (tl.email) {
                    const html = updatedSubtaskMailTemplate(
                        tl.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "You have been added to this subtask",
                        `${process.env.NEXTAUTH_URL}/teamlead/assigned-subtasks/${id}`
                    );
                    sendMail(tl.email, "New Subtask Assignment", html);
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

        // Send notifications for removed team leads
        if (removedTeamLeads.length > 0) {
            const removedTeamLeadDetails = await TeamLead.find({ _id: { $in: removedTeamLeads } });

            for (const tl of removedTeamLeadDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
                    senderName: teamLeadName,
                    receiverId: tl._id,
                    receiverModel: "TeamLead",
                    type: "subtask_update",
                    title: "Removed from Subtask",
                    message: `You have been removed from subtask: "${title}".`,
                    link: `/teamlead/assigned-subtasks`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (tl.email) {
                    const html = updatedSubtaskMailTemplate(
                        tl.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "You have been removed from this subtask",
                        `${process.env.NEXTAUTH_URL}/teamlead/assigned-subtasks`
                    );
                    sendMail(tl.email, "Removed from Subtask", html);
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

        // Send update notification to existing team leads
        const existingTeamLeads = newTeamLeadIds.filter(id => !addedTeamLeads.includes(id));
        if (existingTeamLeads.length > 0) {
            const existingTeamLeadDetails = await TeamLead.find({ _id: { $in: existingTeamLeads } });

            for (const tl of existingTeamLeadDetails) {
                sendNotification({
                    senderId: teamLead._id,
                    senderModel: "TeamLead",
                    senderName: teamLeadName,
                    receiverId: tl._id,
                    receiverModel: "TeamLead",
                    type: "subtask_update",
                    title: "Subtask Updated",
                    message: `Subtask "${title}" has been updated.`,
                    link: `/teamlead/assigned-subtasks/${id}`,
                    referenceId: id,
                    referenceModel: "Subtask"
                });

                if (tl.email) {
                    const html = updatedSubtaskMailTemplate(
                        tl.firstName,
                        title,
                        description,
                        teamLeadName,
                        startDate,
                        endDate,
                        "This subtask has been updated",
                        `${process.env.NEXTAUTH_URL}/teamlead/assigned-subtasks/${id}`
                    );
                    sendMail(tl.email, "Subtask Updated", html);
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

         // Delete all files from S3
           const allMedia = [...existingSubtask.fileAttachments];

            for (const item of allMedia) {
              if (item.publicId) {
                try {
                  await s3.send(
                    new DeleteObjectCommand({
                      Bucket: process.env.AWS_BUCKET_NAME,
                      Key: item.publicId,
                    })
                  );
                } catch (e) {
                  console.error("S3 delete error during task deletion:", e);
                }
              }
            }

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