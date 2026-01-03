import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import Employee from "@/models/Employee";
import Admin from "@/models/Admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user || user.role !== "Employee") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const { employeeId } = await req.json();

    // Fetch task
    const task = await AdminTask2.findById(taskId)
      .populate("employees.employeeId", "firstName lastName email")
      .populate("teamleads.teamleadId", "firstName lastName email")
      .populate("submittedBy", "firstName lastName email")
      .populate("sharedBY", "firstName lastName email");

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = task.sharedBY?.toString() === user.id;
    const isRemovingSelf = employeeId === user.id;
    
    if (!isOwner && !isRemovingSelf) {
      return NextResponse.json({ 
        message: "You don't have permission to remove this user" 
      }, { status: 403 });
    }

    let removedUser = null;
    let userModel = "Employee";

    // Remove from employees array
    const empIndex = task.employees.findIndex(
      e => e.employeeId?._id?.toString() === employeeId
    );
    
    if (empIndex !== -1) {
      removedUser = task.employees[empIndex].employeeId;
      task.employees.splice(empIndex, 1);
    }

    // Remove from teamleads array
    const tlIndex = task.teamleads.findIndex(
      t => t.teamleadId?._id?.toString() === employeeId
    );
    
    if (tlIndex !== -1) {
      removedUser = task.teamleads[tlIndex].teamleadId;
      userModel = "TeamLead";
      task.teamleads.splice(tlIndex, 1);
    }

    // Remove from sharedTo array
    const sharedIndex = task.sharedTo.findIndex(
      s => s.userId?.toString() === employeeId
    );
    
    if (sharedIndex !== -1) {
      task.sharedTo.splice(sharedIndex, 1);
    }

    // If no one is assigned anymore and sharedBY is removing self, clear sharedBY
    if (isRemovingSelf && task.sharedBY?.toString() === user.id) {
      if (task.employees.length === 0 && task.teamleads.length === 0) {
        task.sharedBY = null;
        task.sharedByModel = null;
      }
    }

    await task.save();

    // Send notifications
    if (removedUser) {
      const notificationPromises = [];

      // Notification to removed user
      notificationPromises.push(
        sendNotification({
          senderId: user.id,
          senderModel: "Employee",
          senderName: `${user.firstName} ${user.lastName}`,
          receiverId: employeeId,
          receiverModel: userModel,
          type: "task_removed",
          title: "Task Access Removed",
          message: isRemovingSelf 
            ? `You left task "${task.title}"`
            : `${user.firstName} ${user.lastName} removed you from task "${task.title}"`,
          link: `/employee/admin-tasks`,
          referenceId: task._id,
          referenceModel: "AdminTask2",
        })
      );

      // Notification to task creator (admin)
      if (task.submittedBy) {
        notificationPromises.push(
          sendNotification({
            senderId: user.id,
            senderModel: "Employee",
            senderName: `${user.firstName} ${user.lastName}`,
            receiverId: task.submittedBy._id,
            receiverModel: "Admin",
            type: "task_employee_removed",
            title: "User Removed From Task",
            message: isRemovingSelf
              ? `${user.firstName} ${user.lastName} left task "${task.title}"`
              : `${removedUser.firstName} ${removedUser.lastName} was removed from task "${task.title}"`,
            link: `/admin/admin-tasks`,
            referenceId: task._id,
            referenceModel: "AdminTask2",
          })
        );
      }

      await Promise.all(notificationPromises);
    }

    return NextResponse.json({
      success: true,
      message: isRemovingSelf 
        ? "Successfully left the task" 
        : "User removed successfully",
      task,
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}