// app/api/teamlead/received-tasks/route.js
import mongoose from "mongoose";
import SharedTask from "@/models/SharedTask";
import Employee from "@/models/Employee";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    await dbConnect();

    const receivedTasks = await SharedTask.find({
      sharedTeamlead: new mongoose.Types.ObjectId(session.user.id),
    })
    .populate("sharedManager", "firstName lastName email")
    .populate("sharedTeamlead", "firstName lastName email department")
    .populate("sharedEmployee", "firstName lastName email department")
    .populate("formId")
    .select("+fileAttachments")
    .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, receivedTasks }, { status: 200 });
  } catch (error) {
    console.error("GET /api/teamlead/received-tasks error:", error);
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    await dbConnect();

    const { sharedTo } = await request.json();
    const url = new URL(request.url);
    const taskId = url.pathname.split("/").pop();

    if (!sharedTo) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 });
    }

    const teamLeadId = mongoose.Types.ObjectId(session.user.id);
    const taskObjectId = mongoose.Types.ObjectId(taskId);

    const existingTask = await SharedTask.findOne({
      _id: taskObjectId,
      sharedTeamlead: teamLeadId,
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, message: "Task not found or you don't have permission" }, { status: 404 });
    }

    const employee = await Employee.findById(sharedTo);
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    // Optional: check same department
    if (employee.depId.toString() !== session.user.depId) {
      return NextResponse.json({ success: false, message: "Employee not in your department" }, { status: 403 });
    }

    existingTask.sharedEmployee = mongoose.Types.ObjectId(sharedTo);

    if (!["pending","signed","not_avaiable","not_intrested","re_shedule"].includes(existingTask.status)) {
      existingTask.status = "pending";
    }

    await existingTask.save();

    const populatedTask = await SharedTask.findById(taskObjectId)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email department")
      .populate("sharedEmployee", "firstName lastName email department")
      .populate("formId");

    return NextResponse.json({ success: true, message: "Employee assigned successfully", sharedTask: populatedTask }, { status: 200 });

  } catch (error) {
    console.error("PATCH /api/teamlead/received-tasks/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}
