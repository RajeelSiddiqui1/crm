import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { taskClaimedMailTemplate } from "@/helper/emails/manager/taskClaimedMailTemplate";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const teamLeadId = session.user.id;

    // ✅ firstName, lastName सहित populate करें
    const task = await FormSubmission.findById(id)
      .populate("formId", "title description")
      .populate("submittedBy", "firstName lastName name email")
      .populate("multipleTeamLeadAssigned", "firstName lastName name email")
      .lean();

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // ✅ Team lead के firstName lastName check करें
    const canClaim =
      task.multipleTeamLeadAssigned &&
      task.multipleTeamLeadAssigned.some(
        (tl) => tl._id.toString() === teamLeadId
      ) &&
      !task.assignedTo;

    return NextResponse.json(
      {
        task,
        canClaim,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const teamLeadId = session.user.id;

    const task = await FormSubmission.findById(id);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    if (
      !task.multipleTeamLeadAssigned ||
      !task.multipleTeamLeadAssigned.length
    ) {
      return NextResponse.json(
        { message: "This task is not available for claiming" },
        { status: 400 }
      );
    }

    if (task.assignedTo) {
      return NextResponse.json(
        { message: "This task has already been claimed" },
        { status: 400 }
      );
    }

    if (!task.multipleTeamLeadAssigned.includes(teamLeadId)) {
      return NextResponse.json(
        { message: "You are not eligible to claim this task" },
        { status: 403 }
      );
    }

    // Update the task
    task.assignedTo = teamLeadId;
    task.multipleTeamLeadAssigned = [];
    task.status = "in_progress";
    task.claimedAt = new Date();

    await task.save();

    // Get team lead details
    const teamLead = await TeamLead.findById(teamLeadId);
    const manager = await Manager.findById(task.submittedBy);

    // Send notification to manager
    if (manager) {
      await sendNotification({
        senderId: teamLeadId,
        senderModel: "TeamLead",
        senderName: teamLead?.name || "Team Lead",
        receiverId: manager._id,
        receiverModel: "Manager",
        type: "task_claimed",
        title: "Task Claimed",
        message: `${teamLead?.name || "A team lead"} has claimed the task "${
          task.formId?.title || "Task"
        }"`,
        link: `/manager/submissions/${task._id}`,
        referenceId: task._id,
        referenceModel: "FormSubmission",
      });

      // Send email to manager
      if (manager.email) {
        const html = taskClaimedMailTemplate(
          manager.name || "Manager",
          teamLead?.name || "Team Lead",
          task.formId?.title || "Task",
          new Date().toLocaleDateString()
        );
        await sendMail(manager.email, "Task Claimed by Team Lead", html);
      }
    }

    // Send notifications to other team leads
    const otherTeamLeadIds = task.multipleTeamLeadAssigned.filter(
      (tlId) => tlId.toString() !== teamLeadId
    );

    for (const otherId of otherTeamLeadIds) {
      const otherTeamLead = await TeamLead.findById(otherId);
      if (otherTeamLead) {
        await sendNotification({
          senderId: teamLeadId,
          senderModel: "TeamLead",
          senderName: teamLead?.name || "Team Lead",
          receiverId: otherTeamLead._id,
          receiverModel: "TeamLead",
          type: "task_taken",
          title: "Task Taken",
          message: `Task "${
            task.formId?.title || "Task"
          }" has been claimed by ${teamLead?.name || "another team lead"}`,
          link: `/teamlead/task-offer`,
          referenceId: task._id,
          referenceModel: "FormSubmission",
        });
      }
    }

    return NextResponse.json(
      {
        message: "Task claimed successfully",
        task,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error claiming task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
