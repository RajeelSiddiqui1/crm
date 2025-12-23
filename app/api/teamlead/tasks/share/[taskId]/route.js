import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import { authOptions } from "@/lib/auth";

import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form";
import TeamLead from "@/models/TeamLead";

import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

import { sharedTeamleadEmail } from "@/helper/emails/teamlead/sharedTeamlead";
import { removeSharedTeamleadEmail } from "@/helper/emails/teamlead/removeSharedTeamlead";

/* =========================
   POST → SHARE / REMOVE
========================= */
export async function POST(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamLeadId = session.user.id;
    const { taskId } = params;
    const { teamLeadIds, removeTeamLeadId } = await req.json();

    const currentTL = await TeamLead.findById(teamLeadId).populate("depId", "name");
    if (!currentTL) {
      return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
    }

    const task = await FormSubmission.findById(taskId)
      .populate("formId", "title")
      .populate("assignedTo", "firstName lastName email")
      .populate({
        path: "multipleTeamLeadShared",
        select: "firstName lastName email depId",
        populate: { path: "depId", select: "name" },
      });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    /* =========================
       ACCESS CHECK
    ========================= */
    const isAssigned = task.assignedTo.some(
      (tl) => tl._id.toString() === teamLeadId
    );
    const isShared = task.multipleTeamLeadShared.some(
      (tl) => tl._id.toString() === teamLeadId
    );
    const isOriginalSharer = task.sharedByTeamlead?.toString() === teamLeadId;

    if (!isAssigned && !isShared) {
      return NextResponse.json(
        { error: "No access to this task" },
        { status: 403 }
      );
    }

    /* =========================
       ADD TEAM LEADS
    ========================= */
    if (teamLeadIds?.length) {
      const existingIds = task.multipleTeamLeadShared.map((t) =>
        t._id.toString()
      );

      const newIds = teamLeadIds.filter(
        (id) => !existingIds.includes(id) && id !== teamLeadId
      );

      if (!newIds.length) {
        return NextResponse.json(
          { error: "Already shared" },
          { status: 400 }
        );
      }

      task.multipleTeamLeadShared.push(...newIds);
      task.sharedTasksCount = task.multipleTeamLeadShared.length;
      if (!task.sharedByTeamlead) task.sharedByTeamlead = teamLeadId;

      await task.save();

      /* 🔔 Notify + Email (Parallel) */
      await Promise.allSettled(
        newIds.map(async (id) => {
          const tl = await TeamLead.findById(id).populate("depId", "name");
          if (!tl) return;

          const link = `/tasks/${task._id}`;

          await Promise.all([
            sendNotification({
              senderId: teamLeadId,
              senderModel: "TeamLead",
              senderName: `${currentTL.firstName} ${currentTL.lastName}`,
              receiverId: tl._id,
              receiverModel: "TeamLead",
              type: "task_shared",
              title: "Task Shared With You",
              message: `Task "${task.formId?.title}" shared with you`,
              link,
              referenceId: task._id,
              referenceModel: "FormSubmission",
            }),

            sendMail(
              tl.email,
              "📌 New Task Shared",
              sharedTeamleadEmail({
                recipientName: `${tl.firstName} ${tl.lastName}`,
                senderName: `${currentTL.firstName} ${currentTL.lastName}`,
                taskTitle: task.formId?.title || "Untitled Task",
                departmentName: tl.depId?.name,
                link,
              })
            ),
          ]);
        })
      );

      return NextResponse.json({ success: true, message: "Task shared" });
    }

    /* =========================
       REMOVE TEAM LEAD
    ========================= */
    if (removeTeamLeadId) {
      const exists = task.multipleTeamLeadShared.some(
        (tl) => tl._id.toString() === removeTeamLeadId
      );

      if (!exists) {
        return NextResponse.json(
          { error: "TeamLead not in shared list" },
          { status: 404 }
        );
      }

      if (!isOriginalSharer && !isAssigned) {
        return NextResponse.json(
          { error: "Not allowed to remove" },
          { status: 403 }
        );
      }

      task.multipleTeamLeadShared = task.multipleTeamLeadShared.filter(
        (tl) => tl._id.toString() !== removeTeamLeadId
      );

      task.sharedTasksCount = task.multipleTeamLeadShared.length;

      if (
        isOriginalSharer &&
        removeTeamLeadId === teamLeadId &&
        task.multipleTeamLeadShared.length
      ) {
        task.sharedByTeamlead = task.multipleTeamLeadShared[0];
      }

      await task.save();

      const removedTL = await TeamLead.findById(removeTeamLeadId);

      if (removedTL) {
        const link = `/tasks`;

        await Promise.all([
          sendNotification({
            senderId: teamLeadId,
            senderModel: "TeamLead",
            senderName: `${currentTL.firstName} ${currentTL.lastName}`,
            receiverId: removedTL._id,
            receiverModel: "TeamLead",
            type: "task_unshared",
            title: "Task Access Removed",
            message: `Access removed from "${task.formId?.title}"`,
            link,
            referenceId: task._id,
            referenceModel: "FormSubmission",
          }),

          sendMail(
            removedTL.email,
            "❌ Task Access Removed",
            removeSharedTeamleadEmail({
              recipientName: `${removedTL.firstName} ${removedTL.lastName}`,
              senderName: `${currentTL.firstName} ${currentTL.lastName}`,
              taskTitle: task.formId?.title || "Untitled Task",
              link,
            })
          ),
        ]);
      }

      return NextResponse.json({ success: true, message: "Access removed" });
    }

    return NextResponse.json({ error: "No action provided" }, { status: 400 });
  } catch (err) {
    console.error("Share route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================
   GET → SHARE DETAILS
========================= */
export async function GET(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamLeadId = session.user.id;
    const { taskId } = params;

    const task = await FormSubmission.findById(taskId)
      .populate({
        path: "multipleTeamLeadShared",
        select: "firstName lastName email depId profilePic",
        populate: { path: "depId", select: "name" },
      })
      .populate("sharedByTeamlead", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAssigned = task.assignedTo.some(
      (tl) => tl._id.toString() === teamLeadId
    );
    const isShared = task.multipleTeamLeadShared.some(
      (tl) => tl._id.toString() === teamLeadId
    );

    if (!isAssigned && !isShared) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allTeamLeads = await TeamLead.find({ _id: { $ne: teamLeadId } })
      .populate("depId", "name")
      .select("firstName lastName email depId");

    return NextResponse.json({
      task: {
        _id: task._id,
        sharedTeamLeads: task.multipleTeamLeadShared,
        sharedBy: task.sharedByTeamlead,
        assignedTo: task.assignedTo,
        sharedCount: task.sharedTasksCount || 0,
        isOriginalSharer: task.sharedByTeamlead?.toString() === teamLeadId,
        canRemoveOthers:
          isAssigned || task.sharedByTeamlead?.toString() === teamLeadId,
      },
      availableTeamLeads: allTeamLeads,
      currentUser: teamLeadId,
    });
  } catch (err) {
    console.error("GET share error:", err);
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}
