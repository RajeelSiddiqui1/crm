import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// app/api/manager/admin-tasks/route.js
export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tasks = await AdminTask.find({
      managers: { $in: [session.user.id] },
    })
      .populate({
        path: "managers",
        select: "_id firstName lastName email",
        model: "Manager",
      })
      .populate({
        path: "sharedBYManager",
        select: "_id firstName lastName email",
        model: "Manager",
      }).populate({
        path: "managerResponses.managerId",
        select: "firstName lastName email profilePicture departments",
        populate: {
          path: "departments",
          select: "name",
        }
      })
      
      .select("+audioFiles")
      .select("+fileAttachments")
      
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      tasks: tasks.map((task) => ({
        ...task,
        _id: task._id.toString(),
        managers: task.managers || [],
        sharedBYManager: task.sharedBYManager || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Optional: Mark task as completed/update status
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");
    const body = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: "Task ID is required" },
        { status: 400 }
      );
    }

    // Find the task and verify the manager is assigned to it
    const task = await AdminTask.findOne({
      _id: taskId,
      managers: session.user.id,
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found or not assigned to you" },
        { status: 404 }
      );
    }

    // Update task (you can add more fields as needed)
    const updatedTask = await AdminTask.findByIdAndUpdate(
      taskId,
      {
        status: body.status || task.status,
        // Add other fields that managers can update
      },
      { new: true }
    ).populate("managers", "firstName lastName email department");

    return NextResponse.json(
      {
        success: true,
        message: "Task updated successfully",
        task: updatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
