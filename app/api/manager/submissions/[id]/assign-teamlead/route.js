import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { sendNotification } from "@/lib/sendNotification";
import { taskAssignedMailTemplate } from "@/helper/emails/manager/taskAssignedMail";

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { assignType, singleTeamLeadId, multipleTeamLeadIds = [] } = await req.json();

    const submission = await FormSubmission.findById(id)
      .populate("formId", "title description")
      .populate("assignedTo", "firstName lastName email")
      .populate("multipleTeamLeadAssigned", "firstName lastName email");

    if (!submission) {
      return Response.json({ error: "Submission not found" }, { status: 404 });
    }

    // Permission check
    const isOwner = submission.submittedBy.toString() === session.user.id;
    const isShared = submission.multipleManagerShared?.some(
      m => m.toString() === session.user.id
    );

    if (!isOwner && !isShared) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Clear previous assignments
    submission.assignedTo = [];
    submission.multipleTeamLeadAssigned = [];
    submission.claimedAt = null;

    if (assignType === "single") {
      // Single assignment
      if (singleTeamLeadId) {
        // Validate team lead
        const teamLead = await TeamLead.findById(singleTeamLeadId);
        if (!teamLead) {
          return Response.json({ error: "Invalid team lead" }, { status: 404 });
        }
        
        // Add to assignedTo array (single element)
        submission.assignedTo.push(teamLeadId);
        
        // Send notification and email
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name || "Manager",
          receiverId: teamLead._id,
          receiverModel: "TeamLead",
          type: "task_assigned",
          title: "New Task Assigned",
          message: `A new task "${submission.formId?.title}" has been assigned to you.`,
          link: `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks`,
          referenceId: submission._id,
          referenceModel: "FormSubmission",
        });

        await sendMail({
          to: teamLead.email,
          subject: "New Task Assigned",
          html: taskAssignedMailTemplate({
            teamLeadName: `${teamLead.firstName} ${teamLead.lastName}`,
            taskTitle: submission.formId?.title,
            taskDescription: submission.formId?.description,
          }),
        });
      }
    } else if (assignType === "multiple") {
      // Multiple assignment
      if (multipleTeamLeadIds.length > 0) {
        // Validate all team leads
        const teamLeads = await TeamLead.find({ _id: { $in: multipleTeamLeadIds } });
        if (teamLeads.length !== multipleTeamLeadIds.length) {
          return Response.json({ error: "Invalid team lead(s)" }, { status: 404 });
        }
        
        // Add to multipleTeamLeadAssigned array
        submission.multipleTeamLeadAssigned = multipleTeamLeadIds;
        
        // Send notifications and emails to all team leads
        await Promise.all(
          teamLeads.map(async (teamLead) => {
            await Promise.all([
              sendNotification({
                senderId: session.user.id,
                senderModel: "Manager",
                senderName: session.user.name || "Manager",
                receiverId: teamLead._id,
                receiverModel: "TeamLead",
                type: "task_assigned",
                title: "New Task Assigned (Multiple)",
                message: `A new task "${submission.formId?.title}" has been assigned to you and ${multipleTeamLeadIds.length - 1} other team lead(s).`,
                link: `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/tasks`,
                referenceId: submission._id,
                referenceModel: "FormSubmission",
              }),
              sendMail({
                to: teamLead.email,
                subject: "New Task Assigned (Multiple)",
                html: taskAssignedMailTemplate({
                  teamLeadName: `${teamLead.firstName} ${teamLead.lastName}`,
                  taskTitle: submission.formId?.title,
                  taskDescription: `${submission.formId?.description}\n\nNote: This task is assigned to multiple team leads.`,
                }),
              })
            ]);
          })
        );
      }
    }

    await submission.save();

    // Populate and return updated submission
    const updatedSubmission = await FormSubmission.findById(id)
      .populate("assignedTo", "firstName lastName email depId")
      .populate("multipleTeamLeadAssigned", "firstName lastName email depId");

    return Response.json({
      success: true,
      message: assignType === "single" ? "Team lead assigned successfully" : "Team leads assigned successfully",
      submission: updatedSubmission,
    }, { status: 200 });

  } catch (error) {
    console.error("Assign error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, teamLeadId } = params;
    const { searchParams } = new URL(req.url);
    const isMultiple = searchParams.get("isMultiple") === "true";

    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return Response.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check if manager has permission (owner or shared with)
    const isOwner = submission.submittedBy.toString() === session.user.id;
    const isSharedWith = submission.multipleManagerShared?.some(
      managerId => managerId.toString() === session.user.id
    );

    if (!isOwner && !isSharedWith) {
      return Response.json({ error: "You don't have permission to remove team leads" }, { status: 403 });
    }

    if (isMultiple) {
      // Remove from multipleTeamLeadAssigned
      submission.multipleTeamLeadAssigned = submission.multipleTeamLeadAssigned.filter(
        tlId => tlId.toString() !== teamLeadId
      );
    } else {
      // Remove from assignedTo
      if (submission.assignedTo && submission.assignedTo.toString() === teamLeadId) {
        submission.assignedTo = null;
        submission.claimedAt = null;
      }
    }

    await submission.save();

    return Response.json({ 
      success: true, 
      message: "Team lead removed successfully"
    }, { status: 200 });
  } catch (error) {
    console.error("Error removing team lead:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}