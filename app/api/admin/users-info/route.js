// File: api/admin/users-info/route.js
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // ---------------- Managers ----------------
    const managers = await Manager.find()
      .populate("departments", "name") // Include department names
      .lean();

    const managerTasks = await Promise.all(
      (managers || []).map(async (manager) => {
        const tasks = await Subtask.find({
          "assignedManagers.managerId": manager._id,
        }).lean();

        let pending = 0, inProgress = 0, completed = 0;

        tasks.forEach((task) => {
          const assigned = task.assignedManagers?.find(
            (a) => a.managerId.toString() === manager._id.toString()
          );
          if (!assigned) return;

          if (assigned.status === "pending") pending++;
          else if (assigned.status === "in_progress") inProgress++;
          else if (["completed", "approved"].includes(assigned.status)) completed++;
        });

        return { manager, stats: { pending, inProgress, completed } };
      })
    );

    // ---------------- Team Leads ----------------
    const teamLeads = await TeamLead.find()
      .populate("depId", "name") // Include department name
      .lean();

    const teamLeadTasks = await Promise.all(
      (teamLeads || []).map(async (tl) => {
        const tasks = await Subtask.find({ teamLeadId: tl._id }).lean();

        let pending = 0, inProgress = 0, completed = 0;

        tasks.forEach((task) => {
          if (task.status === "pending") pending++;
          else if (task.status === "in_progress") inProgress++;
          else if (["completed", "approved"].includes(task.status)) completed++;
        });

        return { teamLead: tl, stats: { pending, inProgress, completed } };
      })
    );

    // ---------------- Employees ----------------
    const employees = await Employee.find()
      .populate("depId", "name") // Include department name
      .lean();

    const employeeTasks = await Promise.all(
      (employees || []).map(async (emp) => {
        const tasks = await Subtask.find({
          "assignedEmployees.employeeId": emp._id,
        }).lean();

        let pending = 0, inProgress = 0, completed = 0;
        const managerIds = [];

        tasks.forEach((task) => {
          const assigned = task.assignedEmployees?.find(
            (a) => a.employeeId.toString() === emp._id.toString()
          );
          if (!assigned) return;

          if (assigned.status === "pending") pending++;
          else if (assigned.status === "in_progress") inProgress++;
          else if (["completed", "approved"].includes(assigned.status)) completed++;

          // Collect manager IDs from the task
          task.assignedManagers?.forEach((m) => {
            const id = m.managerId.toString();
            if (!managerIds.includes(id)) managerIds.push(id);
          });
        });

        return { employee: emp, managerIds, stats: { pending, inProgress, completed } };
      })
    );

    return NextResponse.json(
      {
        managers: managerTasks || [],
        teamLeads: teamLeadTasks || [],
        employees: employeeTasks || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /admin/users-info error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
}
