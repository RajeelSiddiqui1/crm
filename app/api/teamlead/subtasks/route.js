  import { NextResponse } from "next/server";
  import { getServerSession } from "next-auth";
  import Subtask from "@/models/Subtask";
  import FormSubmission from "@/models/FormSubmission";
  import Employee from "@/models/Employee";
  import Manager from "@/models/Manager";
  import { authOptions } from "@/lib/auth";
  import dbConnect from "@/lib/db";
  import { sendNotification } from "@/lib/sendNotification";
  import { sendMail } from "@/lib/mail";
  import { createdSubtaskMailTemplate } from "@/helper/emails/teamlead/createdSubtaskMailTemplate";
  import TeamLead from "@/models/TeamLead";
  import { Upload } from "@aws-sdk/lib-storage";
  import { GetObjectCommand } from "@aws-sdk/client-s3";
  import s3 from "@/lib/aws"
  import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

  export async function GET(req) {
    try {
      await dbConnect();
      const session = await getServerSession(authOptions);

      if (!session || session.user.role !== "TeamLead") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const subtasks = await Subtask.find({ teamLeadId: session.user.id })
        .populate("submissionId", "title description")
        .populate({
          path: "assignedEmployees.employeeId",
          select: "firstName lastName email",
        })
        .populate({
          path: "assignedManagers.managerId",
          select: "firstName lastName email",
        })
        .populate({
          path: "assignedTeamLeads.teamLeadId",
          select: "firstName lastName email",
        });

      return NextResponse.json({ subtasks }, { status: 200 });
    } catch (error) {
      console.error("GET Subtask Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch subtasks" },
        { status: 500 }
      );
    }
  }



export async function POST(request) {
  try {
    const formData = await request.formData();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Extract form fields
    const title = formData.get("title");
    const description = formData.get("description");
    const submissionId = formData.get("submissionId");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const priority = formData.get("priority");
    const totalLeadsRequired = formData.get("totalLeadsRequired");
    const teamLeadId = formData.get("teamLeadId");
    const hasLeadsTarget = formData.get("hasLeadsTarget") === "true";
    const teamLeadName = formData.get("teamLeadName");
    const teamLeadDepId = formData.get("teamLeadDepId");

    // Parse JSON arrays for assignees
    const assignedEmployees = JSON.parse(formData.get("assignedEmployees") || "[]");
    const assignedManagers = JSON.parse(formData.get("assignedManagers") || "[]");
    const assignedTeamLeads = JSON.parse(formData.get("assignedTeamLeads") || "[]");

    // Submission optional
    let submission = null;
    if (submissionId) {
      submission = await FormSubmission.findById(submissionId);
    }

    const teamLead = await TeamLead.findOne({ _id: teamLeadId });

    if (!teamLead) {
      return NextResponse.json(
        { error: "TeamLead not found" },
        { status: 404 }
      );
    }

    const depId = teamLead.depId || teamLeadDepId;

    // Validate employees if assigned
    if (assignedEmployees.length > 0) {
      const employees = await Employee.find({
        _id: { $in: assignedEmployees.map((emp) => emp.employeeId) },
      });

      if (employees.length !== assignedEmployees.length) {
        return NextResponse.json(
          { error: "Some employees not found" },
          { status: 400 }
        );
      }
    }

    // Validate managers if assigned
    if (assignedManagers.length > 0) {
      const managers = await Manager.find({
        _id: { $in: assignedManagers.map((mgr) => mgr.managerId) },
      });

      if (managers.length !== assignedManagers.length) {
        return NextResponse.json(
          { error: "Some managers not found" },
          { status: 400 }
        );
      }
    }

    // Validate team leads if assigned
    if (assignedTeamLeads.length > 0) {
      const teamLeads = await TeamLead.find({
        _id: { $in: assignedTeamLeads.map((tl) => tl.teamLeadId) },
      });

      if (teamLeads.length !== assignedTeamLeads.length) {
        return NextResponse.json(
          { error: "Some team leads not found" },
          { status: 400 }
        );
      }
    }

    // Ensure at least one assignee
    if (assignedEmployees.length === 0 && 
        assignedManagers.length === 0 && 
        assignedTeamLeads.length === 0) {
      return NextResponse.json(
        { error: "Please assign at least one employee, manager, or team lead" },
        { status: 400 }
      );
    }

    const leadName = teamLeadName || `${teamLead.firstName} ${teamLead.lastName}`;
    const leadValue = totalLeadsRequired ? totalLeadsRequired.toString() : "1";

    // Calculate leads distribution
    const totalAssignees = assignedEmployees.length + 
                          assignedManagers.length + 
                          assignedTeamLeads.length;
    const leadsPerAssignee = hasLeadsTarget && totalLeadsRequired && totalAssignees > 0 
      ? Math.ceil(parseInt(totalLeadsRequired) / totalAssignees)
      : 0;

    // Prepare assigned employees data
    const employeeAssignments = assignedEmployees.map((emp) => ({
      employeeId: emp.employeeId,
      email: emp.email,
      name: emp.name || "",
      status: "pending",
      leadsCompleted: 0,
      leadsAssigned: hasLeadsTarget ? leadsPerAssignee : 0,
    }));

    // Prepare assigned managers data
    const managerAssignments = assignedManagers.map((mgr) => ({
      managerId: mgr.managerId,
      email: mgr.email,
      name: mgr.name || "",
      status: "pending",
      leadsCompleted: 0,
      leadsAssigned: hasLeadsTarget ? leadsPerAssignee : 0,
    }));

    // Prepare assigned team leads data
    const teamLeadAssignments = assignedTeamLeads.map((tl) => ({
      teamLeadId: tl.teamLeadId,
      email: tl.email,
      name: tl.name || "",
      status: "pending",
      leadsCompleted: 0,
      leadsAssigned: hasLeadsTarget ? leadsPerAssignee : 0,
    }));

    // -------------------------------
    // MULTIPLE FILE UPLOADS
    // -------------------------------
    const files = formData.getAll("files");
    const uploadedFiles = [];

    for (const file of files) {
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
<<<<<<< HEAD
       const fileUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${fileKey}`;
 // 1 week
=======
        const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 1 week
>>>>>>> d285dcb (set submission backend)

        uploadedFiles.push({
          url: fileUrl,
          name: fileName,
          type: fileType,
          size: fileSize,
          publicId: fileKey,
        });
      }
    }

    const subtask = new Subtask({
      title,
      description,
      submissionId: submission ? submission._id : null,
      teamLeadId: teamLead._id,
      depId,
      assignedEmployees: employeeAssignments,
      assignedManagers: managerAssignments,
      assignedTeamLeads: teamLeadAssignments,
      startDate,
      endDate,
      startTime,
      endTime,
      fileAttachments: uploadedFiles,
      priority: priority || "medium",
      lead: leadValue,
      totalLeadsRequired: hasLeadsTarget ? parseInt(totalLeadsRequired) : 0,
      hasLeadsTarget,
      teamLeadName: leadName,
    });

    await subtask.save();

    const populatedSubtask = await Subtask.findById(subtask._id)
      .populate("submissionId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .populate("assignedManagers.managerId", "firstName lastName email")
      .populate("assignedTeamLeads.teamLeadId", "firstName lastName email");

    // Send notifications and emails to assigned employees
    if (assignedEmployees.length > 0) {
      const employees = await Employee.find({
        _id: { $in: assignedEmployees.map((emp) => emp.employeeId) },
      });

      for (const emp of employees) {
        sendNotification({
          senderId: teamLead._id,
          senderModel: "TeamLead",
          senderName: leadName,
          receiverId: emp._id,
          receiverModel: "Employee",
          type: "new_subtask",
          title: "New Subtask Assigned",
          message: `You have been assigned a new subtask: "${title}".`,
          link: `/employee/subtasks/`,
          referenceId: subtask._id,
          referenceModel: "Subtask",
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
    }

    // Send notifications and emails to assigned managers
    if (assignedManagers.length > 0) {
      const managers = await Manager.find({
        _id: { $in: assignedManagers.map((mgr) => mgr.managerId) },
      });

      for (const mgr of managers) {
        sendNotification({
          senderId: teamLead._id,
          senderModel: "TeamLead",
          senderName: leadName,
          receiverId: mgr._id,
          receiverModel: "Manager",
          type: "new_subtask",
          title: "New Subtask Assigned",
          message: `You have been assigned a new subtask: "${title}".`,
          link: `/manager/subtasks`,
          referenceId: subtask._id,
          referenceModel: "Subtask",
        });

        if (mgr.email) {
          const html = createdSubtaskMailTemplate(
            mgr.firstName,
            title,
            description,
            leadName,
            startDate,
            endDate
          );
          sendMail(mgr.email, "New Subtask Assigned", html);
        }
      }
    }

    // Send notifications and emails to assigned team leads
    if (assignedTeamLeads.length > 0) {
      const teamLeads = await TeamLead.find({
        _id: { $in: assignedTeamLeads.map((tl) => tl.teamLeadId) },
      });

      for (const tl of teamLeads) {
        sendNotification({
          senderId: teamLead._id,
          senderModel: "TeamLead",
          senderName: leadName,
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "new_subtask",
          title: "New Subtask Assigned",
          message: `You have been assigned a new subtask by ${leadName}: "${title}".`,
          link: `/teamlead/assigned-subtasks`,
          referenceId: subtask._id,
          referenceModel: "Subtask",
        });

        if (tl.email) {
          const html = createdSubtaskMailTemplate(
            tl.firstName,
            title,
            description,
            leadName,
            startDate,
            endDate
          );
          sendMail(tl.email, "New Subtask Assigned", html);
        }
      }
    }

    return NextResponse.json(populatedSubtask, { status: 201 });
  } catch (error) {
    console.error("POST Subtask Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create subtask" },
      { status: 500 }
    );
  }
}