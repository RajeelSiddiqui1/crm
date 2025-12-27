
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import Manager from "@/models/Manager";
import Department from "@/models/Department";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch the logged-in manager
    const currentManager = await Manager.findOne({ email: session.user.email });
    if (!currentManager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    // Fetch ALL subtasks from departments where current manager has access
    // BUT exclude subtasks where current manager is assigned himself
    const subtasks = await Subtask.find({
      // सिर्फ उन्ही subtasks जहाँ current manager assigned न हो
      "assignedManagers.managerId": { $ne: currentManager._id }
    })
    .populate({
      path: 'submissionId',
      select: 'title description'
    })
    .populate({
      path: 'teamLeadId',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'depId',
      select: 'name'
    })
    .populate({
      path: 'assignedEmployees.employeeId',
      select: 'firstName lastName email phone department position'
    })
    .populate({
      path: 'assignedManagers.managerId',
      select: 'firstName lastName email phone department'
    })
    .sort({ createdAt: -1 });

    return NextResponse.json({ 
      subtasks, 
      message: "Subtasks where you are NOT assigned" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching other managers' subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}