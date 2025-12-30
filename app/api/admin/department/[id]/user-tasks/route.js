import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { id: depId } = params;

    if (!depId || !mongoose.Types.ObjectId.isValid(depId)) {
      return NextResponse.json({ error: "Invalid department id" }, { status: 400 });
    }

    // --------- Managers ---------
    const managers = await Manager.find({ departments: depId }).lean();
    const managerTasks = await Promise.all(
      (managers || []).map(async (manager) => {
        const tasks = await Subtask.find({
          depId,
          "assignedManagers.managerId": manager._id,
        }).lean();

        let pending = 0,
          inProgress = 0,
          completed = 0;

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

    // --------- Team Leads ---------
    const teamLeads = await TeamLead.find({ depId }).lean();
    const teamLeadTasks = await Promise.all(
      (teamLeads || []).map(async (tl) => {
        const tasks = await Subtask.find({ depId, teamLeadId: tl._id }).lean();

        let pending = 0,
          inProgress = 0,
          completed = 0;

        tasks.forEach((task) => {
          if (task.status === "pending") pending++;
          else if (task.status === "in_progress") inProgress++;
          else if (["completed", "approved"].includes(task.status)) completed++;
        });

        return { teamLead: tl, stats: { pending, inProgress, completed } };
      })
    );

    // --------- Employees ---------
    const employees = await Employee.find({ depId }).lean();
    const employeeTasks = await Promise.all(
      (employees || []).map(async (emp) => {
        const tasks = await Subtask.find({
          depId,
          "assignedEmployees.employeeId": emp._id,
        }).lean();

        let pending = 0,
          inProgress = 0,
          completed = 0;

        tasks.forEach((task) => {
          const assigned = task.assignedEmployees?.find(
            (a) => a.employeeId.toString() === emp._id.toString()
          );
          if (!assigned) return;

          if (assigned.status === "pending") pending++;
          else if (assigned.status === "in_progress") inProgress++;
          else if (["completed", "approved"].includes(assigned.status)) completed++;
        });

        return { employee: emp, stats: { pending, inProgress, completed } };
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
    console.error("GET /user-task error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
}
