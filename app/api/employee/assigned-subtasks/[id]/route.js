import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { employeeTaskUpdatedTemplate } from "@/helper/emails/employee/employeeTaskUpdatedTemplate";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const task = await EmployeeTask.findById(params.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 🔐 Only task creator can edit
    if (task.submittedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Only task creator can edit this task" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // ✅ Update only allowed fields
    const allowedFields = ["title", "description", "startDate", "endDate", "startTime", "endTime", "status"];
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        task[field] = body[field];
      }
    });

    // Optional: update assigned arrays if passed correctly
    if (body.assignedTeamLead && Array.isArray(body.assignedTeamLead)) {
      task.assignedTeamLead = body.assignedTeamLead.map(item => ({
        teamLeadId: item.teamLeadId,
        status: item.status || "pending",
        feedback: item.feedback || ""
      }));
    }

    if (body.assignedManager && Array.isArray(body.assignedManager)) {
      task.assignedManager = body.assignedManager.map(item => ({
        managerId: item.managerId,
        status: item.status || "pending",
        feedback: item.feedback || ""
      }));
    }

    if (body.assignedEmployee && Array.isArray(body.assignedEmployee)) {
      task.assignedEmployee = body.assignedEmployee.map(item => ({
        employeeId: item.employeeId,
        status: item.status || "pending",
        feedback: item.feedback || ""
      }));
    }

    await task.save();

    // 🔔 Send notification and email (parallel)
    await Promise.all([
      sendNotification({
        senderId: session.user.id,
        senderModel: "Employee",
        senderName: session.user.name,
        receiverId: session.user.id,
        receiverModel: "Employee",
        type: "task_updated",
        title: "Task Updated",
        message: `You updated task "${task.title}"`,
        referenceId: task._id,
        referenceModel: "EmployeeTask",
      }),

      body.notifyEmail
        ? sendMail(
            body.notifyEmail,
            "Task Updated",
            employeeTaskUpdatedTemplate(session.user.name, task.title)
          )
        : Promise.resolve(),
    ]);

    return NextResponse.json(task);
  } catch (err) {
    console.error("PUT /employee/assigned-subtasks/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}


// ✅ DELETE TASK
export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    await EmployeeTask.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// ✅ PATCH → STATUS UPDATE
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();

    const task = await EmployeeTask.findById(params.id);

    task.status = body.status;
    await task.save();

    // 🔔 Notification
    await Notification.create({
      user: task.submittedBy,
      title: "Task Status Updated",
      message: `Task "${task.title}" status updated to ${body.status}`,
      type: "status",
    });

    // 📧 Email
    if (body.email) {
      await sendEmail({
        to: body.email,
        subject: "Task Status Updated",
        html: statusUpdateTemplate(task.title, body.status),
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const task = await EmployeeTask.findById(params.id)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedTeamLead.teamLeadId", "firstName lastName email")
      .populate("assignedManager.managerId", "firstName lastName email")
      .populate("assignedEmployee.employeeId", "firstName lastName email");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 🔐 Only the employee who submitted the task can view it
    if (task.submittedBy._id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}
