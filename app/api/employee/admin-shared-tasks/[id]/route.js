import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import Employee from "@/models/Employee";
import Admin from "@/models/Admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

import { removeEmployeeTaskTemplate } from "@/helper/emails/employee/remove-employee-admin-tasks";
import { removeEmployeeTaskForAdminTemplate } from "@/helper/emails/employee/remove-employee-admin-tasks-foradmin";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    // -------- AUTH
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user || user.role !== "Employee") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const { employeeId } = await req.json();

    // -------- FETCH TASK
    const task = await AdminTask2.findById(taskId)
      .populate("employees.employeeId", "firstName lastName email")
      .populate("submittedBy", "name email");

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // -------- PERMISSION
    const canRemove =
      user.id === employeeId || // employee khud
      user.id === task.sharedBY?.toString();

    if (!canRemove) {
      return NextResponse.json({ message: "Permission denied" }, { status: 403 });
    }

    // -------- REMOVE EMPLOYEE
    const index = task.employees.findIndex(
      e => e.employeeId?._id?.toString() === employeeId
    );

    if (index === -1) {
      return NextResponse.json(
        { message: "Employee not found in task" },
        { status: 404 }
      );
    }

    const removedEmployee = task.employees[index];
    task.employees.splice(index, 1);
    await task.save();

    // -------- FETCH USERS
    const employeeUser = await Employee.findById(employeeId);
    const adminUser = await Admin.findById(task.submittedBy);

    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/admin/admin-tasks`;

    // -------- PARALLEL MAIL + NOTIFICATIONS
    await Promise.all([
      // ---- Notification to removed employee
      sendNotification({
        senderId: user.id,
        senderModel: "Employee",
        senderName: user.name,
        receiverId: employeeId,
        receiverModel: "Employee",
        type: "task_removed",
        title: "Task Access Removed",
        message: `You were removed from task "${task.title}"`,
       
        referenceId: task._id,
        referenceModel: "AdminTask2",
      }),

      // ---- Notification to Admin (submittedBy)
      sendNotification({
        senderId: user.id,
        senderModel: "Employee",
        senderName: user.name,
        receiverId: task.submittedBy._id,
        receiverModel: "Admin",
        type: "task_employee_removed",
        title: "Employee Removed From Task",
        message: `${employeeUser.firstName} ${employeeUser.lastName} was removed from task "${task.title}"`,
        link: taskLink,
        referenceId: task._id,
        referenceModel: "AdminTask2",
      }),

      // ---- Email to removed employee
      sendMail(
        employeeUser.email,
        "Removed From Task",
        removeEmployeeTaskTemplate(
          `${employeeUser.firstName} ${employeeUser.lastName}`,
          task.title,
          user.name,
          taskLink
        )
      ),

      // ---- Email to admin
      sendMail(
        adminUser.email,
        "Employee Removed From Task",
        removeEmployeeTaskForAdminTemplate(
          adminUser.name,
          task.title,
          `${employeeUser.firstName} ${employeeUser.lastName}`,
          user.name,
          taskLink
        )
      ),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Employee removed successfully",
        task,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
