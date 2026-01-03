import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { assigneeType, assigneeId, status } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID" }, { status: 400 });
    }

    const task = await AdminTask2.findById(id);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    let updated = false;
    
    if (assigneeType === "teamlead") {
      const teamleadIndex = task.teamleads.findIndex(
        tl => tl.teamleadId && tl.teamleadId.toString() === assigneeId
      );
      
      if (teamleadIndex !== -1) {
        task.teamleads[teamleadIndex].status = status;
        if (status === "completed") {
          task.teamleads[teamleadIndex].completedAt = new Date();
        }
        updated = true;
      }
    } else if (assigneeType === "employee") {
      const employeeIndex = task.employees.findIndex(
        emp => emp.employeeId && emp.employeeId.toString() === assigneeId
      );
      
      if (employeeIndex !== -1) {
        task.employees[employeeIndex].status = status;
        if (status === "completed") {
          task.employees[employeeIndex].completedAt = new Date();
        }
        updated = true;
      }
    }

    if (!updated) {
      return NextResponse.json({ message: "Assignee not found" }, { status: 404 });
    }

    await task.save();

    return NextResponse.json({
      success: true,
      message: "Status updated",
      task
    });

  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json(
      { message: "Failed to update status" },
      { status: 500 }
    );
  }
}