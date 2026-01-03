// /api/employee/admin-tasks/share/[id].js - Fixed
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import Employee from "@/models/Employee";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId: targetEmployeeId } = await req.json();
    const taskId = params.id;
    const removerId = session.user.id;

    if (!targetEmployeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const task = await AdminTask2.findById(taskId)
      .populate("employees.employeeId", "email firstName lastName");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Find the specific share
    const shareIndex = task.shares.findIndex(s => 
      s.sharedTo?.toString() === targetEmployeeId && 
      s.sharedToModel === "Employee"
    );

    if (shareIndex === -1) {
      return NextResponse.json({ 
        error: "Share not found" 
      }, { status: 404 });
    }

    const share = task.shares[shareIndex];
    
    // Check permissions
    const isSharer = share.sharedBy?.toString() === removerId;
    const isSelfRemoval = targetEmployeeId === removerId;
    
    if (!isSharer && !isSelfRemoval) {
      return NextResponse.json({ 
        error: "You don't have permission to remove this share" 
      }, { status: 403 });
    }

    // Remove from shares array
    task.shares.splice(shareIndex, 1);

    // Remove from employees array if added via this sharing
    const employeeIndex = task.employees.findIndex(e => 
      e.employeeId?._id?.toString() === targetEmployeeId && 
      e.sharedBy?.toString() === removerId
    );
    
    if (employeeIndex !== -1) {
      task.employees.splice(employeeIndex, 1);
    }

    await task.save();

    // Get target employee info
    const targetEmployee = await Employee.findById(targetEmployeeId);
    
    if (targetEmployee) {
      // Send notification
      await sendNotification({
        senderId: removerId,
        senderModel: "Employee",
        senderName: session.user.name,
        receiverId: targetEmployeeId,
        receiverModel: "Employee",
        type: "task_access_removed",
        title: "Task Access Removed",
        message: isSelfRemoval 
          ? "You removed yourself from the task" 
          : `${session.user.name} removed your access to task: ${task.title}`,
        link: `/employee/admin-tasks`,
        referenceId: task._id,
        referenceModel: "AdminTask2",
      });

      // Send email
      if (!isSelfRemoval) {
        await sendMail({
          to: targetEmployee.email,
          subject: "Task Access Removed",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Task Access Removed</h2>
              <p>Hello ${targetEmployee.firstName},</p>
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

    // Get updated task with populated shares
    const updatedTask = await AdminTask2.findById(taskId);
    
    return NextResponse.json({ 
      message: "Access removed successfully",
      task: updatedTask
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}