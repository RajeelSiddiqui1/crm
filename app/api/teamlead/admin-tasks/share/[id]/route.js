import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import TeamLead from "@/models/TeamLead";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamleadId: targetTeamleadId } = await req.json();
    const taskId = params.id;
    const removerId = session.user.id;

    if (!targetTeamleadId) {
      return NextResponse.json({ error: "TeamLead ID is required" }, { status: 400 });
    }

    const task = await AdminTask2.findById(taskId)
      .populate("teamleads.teamleadId", "email firstName lastName");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Find the specific share
    const shareIndex = task.shares.findIndex(s => 
      s.sharedTo?.toString() === targetTeamleadId && 
      s.sharedToModel === "TeamLead"
    );

    if (shareIndex === -1) {
      return NextResponse.json({ 
        error: "Share not found" 
      }, { status: 404 });
    }

    const share = task.shares[shareIndex];
    
    // Check permissions
    const isSharer = share.sharedBy?.toString() === removerId;
    const isSelfRemoval = targetTeamleadId === removerId;
    
    if (!isSharer && !isSelfRemoval) {
      return NextResponse.json({ 
        error: "You don't have permission to remove this share" 
      }, { status: 403 });
    }

    // Remove from shares array
    task.shares.splice(shareIndex, 1);

    // Remove from teamleads array if added via this sharing
    const teamleadIndex = task.teamleads.findIndex(t => 
      t.teamleadId?._id?.toString() === targetTeamleadId && 
      t.sharedBy?.toString() === removerId
    );
    
    if (teamleadIndex !== -1) {
      task.teamleads.splice(teamleadIndex, 1);
    }

    await task.save();

    // Get target teamlead info
    const targetTeamlead = await TeamLead.findById(targetTeamleadId);
    
    if (targetTeamlead) {
      // Send notification
      await sendNotification({
        senderId: removerId,
        senderModel: "TeamLead",
        senderName: session.user.name,
        receiverId: targetTeamleadId,
        receiverModel: "TeamLead",
        type: "task_access_removed",
        title: "Task Access Removed",
        message: isSelfRemoval 
          ? "You removed yourself from the task" 
          : `${session.user.name} removed your access to task: ${task.title}`,
        link: `/teamlead/admin-tasks`,
        referenceId: task._id,
        referenceModel: "AdminTask2",
      });

      // Send email
      if (!isSelfRemoval) {
        await sendMail({
          to: targetTeamlead.email,
          subject: "Task Access Removed",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Task Access Removed</h2>
              <p>Hello ${targetTeamlead.firstName},</p>
              <p><strong>${session.user.name}</strong> has removed your access to the task:</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0; color: #333;">${task.title}</h3>
              </div>
              <p>You will no longer receive updates about this task.</p>
            </div>
          `
        });
      }
    }

    return NextResponse.json({ 
      message: "Access removed successfully",
      task 
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}