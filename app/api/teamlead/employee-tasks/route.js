import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmployeeTask from "@/models/EmployeeTask";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "assigned";

    let query = {};

    // Filter based on type
    if (type === "assigned") {
      query["assignedTeamLead.teamLeadId"] = session.user.id;
    } else if (type === "created") {
      query.submittedBy = session.user.id;
    }

    // Filter by status if not "all"
    if (status !== "all") {
      query.status = status;
    }

    const subtasks = await EmployeeTask.find(query)
      .populate("submittedBy", "firstName lastName email avatar")
      .populate({
        path: "assignedEmployee.employeeId",
        select: "firstName lastName email avatar"
      })
      .populate({
        path: "assignedManager.managerId",
        select: "firstName lastName email avatar"
      })
      .populate({
        path: "assignedTeamLead.teamLeadId",
        select: "firstName lastName email avatar"
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true,
      subtasks,
      count: subtasks.length 
    }, { status: 200 });
  } catch (error) {
    console.error("GET Employee Tasks Error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch tasks" 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Add creator information
    const taskData = {
      ...body,
      submittedBy: session.user.id,
      status: "pending"
    };

    const task = await EmployeeTask.create(taskData);

    return NextResponse.json({ 
      success: true,
      task 
    }, { status: 201 });
  } catch (error) {
    console.error("POST Employee Tasks Error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to create task" 
    }, { status: 500 });
  }
}