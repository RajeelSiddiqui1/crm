// app/api/teamlead/received-tasks/[id]/route.js
import mongoose from "mongoose";
import SharedTask from "@/models/SharedTask";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { sendNotification } from "@/lib/sendNotification";
import {
  sharedTaskAssignEmployeeMailTemplate,
  sharedTaskAssignEmployeeNotification,
  sharedTaskAssignManagerMailTemplate,
  sharedTaskAssignManagerNotification
} from "@/helper/emails/teamlead/shared-employee";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { sharedTo } = await request.json();
    const taskId = params.id;

    if (!sharedTo) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }

    const teamLeadId = new mongoose.Types.ObjectId(session.user.id);
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    // Find the task assigned to this Team Lead
    const existingTask = await SharedTask.findOne({
      _id: taskObjectId,
      sharedTeamlead: teamLeadId,
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Find employee
    const employee = await Employee.findById(sharedTo);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // Optional: check same department
    if (employee.depId.toString() !== session.user.depId) {
      return NextResponse.json(
        { success: false, message: "Employee not in your department" },
        { status: 403 }
      );
    }

    // Assign employee
    existingTask.sharedEmployee = new mongoose.Types.ObjectId(sharedTo);

    // Reset status if needed
    if (!["pending","signed","not_avaiable","not_intrested","re_shedule"].includes(existingTask.status)) {
      existingTask.status = "pending";
    }

    await existingTask.save();

    // Populate for response
    const populatedTask = await SharedTask.findById(taskObjectId)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email department")
      .populate("sharedEmployee", "firstName lastName email department")
      .populate({
        path: "formId",
        populate: {
          path: "employeeId",
          select: "firstName lastName email department",
        },
      });

    const taskLink = `${process.env.NEXTAUTH_URL}/employee/tasks/${populatedTask._id}`;
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const teamLeadName = `${session.user.firstName} ${session.user.lastName}`;
    const managerName = populatedTask.sharedManager
      ? `${populatedTask.sharedManager.firstName} ${populatedTask.sharedManager.lastName}`
      : "Manager";

    // Send notifications and emails in parallel
    const tasks = [
      // Employee notification & email
      sendMail(
        employee.email,
        "New Task Assigned by Team Lead",
        sharedTaskAssignEmployeeMailTemplate(
          employeeName,
          populatedTask.formId.title,
          teamLeadName,
          managerName,
          taskLink
        )
      ),
      sendNotification(
        sharedTaskAssignEmployeeNotification(
          employee._id,
          teamLeadId,
          teamLeadName,
          populatedTask.formId.title,
          taskLink,
          populatedTask._id
        )
      )
    ];

    // Shared Manager notification & email
    if (populatedTask.sharedManager?.email) {
      tasks.push(
        sendMail(
          populatedTask.sharedManager.email,
          "Team Lead Assigned Employee for Shared Task",
          sharedTaskAssignManagerMailTemplate(
            managerName,
            employeeName,
            populatedTask.formId.title,
            teamLeadName,
            taskLink
          )
        ),
        sendNotification(
          sharedTaskAssignManagerNotification(
            populatedTask.sharedManager._id,
            teamLeadId,
            teamLeadName,
            employeeName,
            populatedTask.formId.title,
            taskLink,
            populatedTask._id
          )
        )
      );
    }

    await Promise.all(tasks);

    return NextResponse.json(
      { success: true, message: "Employee assigned successfully", sharedTask: populatedTask },
      { status: 200 }
    );

  } catch (error) {
    console.error("PATCH /api/teamlead/received-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
