import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { employeeTaskCreatedTemplate } from "@/helper/emails/employee/employeeTaskTemplates";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const {
      title,
      description,
      assignedTeamLead = [],
      assignedManager = [],
      assignedEmployee = [],
      startDate,
      endDate,
      startTime,
      endTime,
    } = body;

    // Wrap IDs in objects to match schema
    const task = await EmployeeTask.create({
      title,
      description,
      submittedBy: session.user.id,
      startDate,
      endDate,
      startTime,
      endTime,
      assignedTeamLead: assignedTeamLead.map((id) => ({ teamLeadId: id })),
      assignedManager: assignedManager.map((id) => ({ managerId: id })),
      assignedEmployee: assignedEmployee.map((id) => ({ employeeId: id })),
    });

    // 🔔 Notifications + Emails in parallel
    await Promise.all([
      // Assigned Employees
      ...assignedEmployee.map(async (empObj) => {
        const emp = await Employee.findById(empObj);
        if (!emp) return;

        sendNotification({
          senderId: session.user.id,
          senderModel: "Employee",
          senderName: session.user.name,
          receiverId: emp._id,
          receiverModel: "Employee",
          type: "employee_task_created",
          title: "New Task Assigned",
          message: `You have been assigned a new task: "${title}"`,
          link: "/employee/employee-tasks",
          referenceId: task._id,
          referenceModel: "EmployeeTask",
        });

        if (emp.email) {
          const html = employeeTaskCreatedTemplate(emp.firstName, title, description);
          sendMail(emp.email, "New Task Assigned", html);
        }
      }),

      // Assigned Managers
      ...assignedManager.map(async (mgrObj) => {
        const mgr = await Manager.findById(mgrObj);
        if (!mgr) return;

        sendNotification({
          senderId: session.user.id,
          senderModel: "Employee",
          senderName: session.user.name,
          receiverId: mgr._id,
          receiverModel: "Manager",
          type: "employee_task_created",
          title: "New Task Assigned",
          message: `You have been assigned a new task: "${title}"`,
          link: "/manager/employee-tasks",
          referenceId: task._id,
          referenceModel: "EmployeeTask",
        });

        if (mgr.email) {
          const html = employeeTaskCreatedTemplate(mgr.firstName, title, description);
          sendMail(mgr.email, "New Task Assigned", html);
        }
      }),

      // Assigned Team Leads
      ...assignedTeamLead.map(async (tlObj) => {
        const tl = await TeamLead.findById(tlObj);
        if (!tl) return;

        sendNotification({
          senderId: session.user.id,
          senderModel: "Employee",
          senderName: session.user.name,
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "employee_task_created",
          title: "New Task Assigned",
          message: `You have been assigned a new task: "${title}"`,
          link: "/teamlead/employee-tasks",
          referenceId: task._id,
          referenceModel: "EmployeeTask",
        });

        if (tl.email) {
          const html = employeeTaskCreatedTemplate(tl.firstName, title, description);
          sendMail(tl.email, "New Task Assigned", html);
        }
      }),
    ]);

    // Populate assigned employees/managers/teamleads for response
    const populatedTask = await EmployeeTask.findById(task._id)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedEmployee.employeeId", "firstName lastName email")
      .populate("assignedManager.managerId", "firstName lastName email")
      .populate("assignedTeamLead.teamLeadId", "firstName lastName email");

    return NextResponse.json(populatedTask, { status: 201 });
  } catch (err) {
    console.error("EmployeeTask POST Error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "Employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const tasks = await EmployeeTask.find({
    $or: [
      { submittedBy: session.user.id },
      { "assignedEmployee.employeeId": session.user.id },
    ],
  })
    .populate("submittedBy", "firstName lastName email")
    .populate("assignedTeamLead.teamLeadId", "firstName lastName email")
    .populate("assignedManager.managerId", "firstName lastName email")
    .populate("assignedEmployee.employeeId", "firstName lastName email");

  return NextResponse.json(tasks);
}
