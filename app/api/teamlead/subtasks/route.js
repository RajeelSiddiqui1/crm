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

// app/api/teamlead/subtasks/route.js - Update the POST function
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
      assignedEmployees = [],
      assignedManagers = [],
      assignedTeamLeads = [], // NEW
      startDate,
      endDate,
      startTime,
      endTime,
      priority,
      totalLeadsRequired,
      teamLeadId,
      hasLeadsTarget = false,
    } = body;

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

    const depId = teamLead.depId;

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

    // Validate team leads if assigned (NEW)
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

    const leadName = `${teamLead.firstName} ${teamLead.lastName}`;
    const leadValue = totalLeadsRequired ? totalLeadsRequired.toString() : "1";

    // Calculate leads distribution
    const totalAssignees = assignedEmployees.length + 
                          assignedManagers.length + 
                          assignedTeamLeads.length;
    const leadsPerAssignee = hasLeadsTarget && totalLeadsRequired && totalAssignees > 0 
      ? Math.ceil(totalLeadsRequired / totalAssignees)
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

    // Prepare assigned team leads data (NEW)
    const teamLeadAssignments = assignedTeamLeads.map((tl) => ({
      teamLeadId: tl.teamLeadId,
      email: tl.email,
      name: tl.name || "",
      status: "pending",
      leadsCompleted: 0,
      leadsAssigned: hasLeadsTarget ? leadsPerAssignee : 0,
    }));

    const subtask = new Subtask({
      title,
      description,
      submissionId: submission ? submission._id : null,
      teamLeadId: teamLead._id,
      depId,
      assignedEmployees: employeeAssignments,
      assignedManagers: managerAssignments,
      assignedTeamLeads: teamLeadAssignments, // NEW
      startDate,
      endDate,
      startTime,
      endTime,
      priority: priority || "medium",
      lead: leadValue,
      totalLeadsRequired: hasLeadsTarget ? totalLeadsRequired : 0,
      hasLeadsTarget,
      teamLeadName: leadName,
    });

    await subtask.save();

    const populatedSubtask = await Subtask.findById(subtask._id)
      .populate("submissionId", "title description")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .populate("assignedManagers.managerId", "firstName lastName email")
      .populate("assignedTeamLeads.teamLeadId", "firstName lastName email"); // NEW

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

    // Send notifications and emails to assigned team leads (NEW)
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