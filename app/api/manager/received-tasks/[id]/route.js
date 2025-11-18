import SharedTask from "@/models/SharedTask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission"; // <-- YEH LINE ADD KARO!
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(request, context) {
  const { params } = await context; // Next.js 15 fix

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const { sharedTo } = await request.json();

    if (!sharedTo) {
      return NextResponse.json(
        { success: false, message: "Teamlead ID is required" },
        { status: 400 }
      );
    }

    const existingTask = await SharedTask.findOne({
      _id: id,
      sharedManager: session.user.id,
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    existingTask.sharedTeamlead = sharedTo;
    existingTask.status = "pending";
    await existingTask.save();

    // Yahan pe model registered hai toh populate kaam karega
    const populatedTask = await SharedTask.findById(existingTask._id)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email department depId")
      .populate({
        path: "formId",
        populate: {
          path: "employeeId",
          select: "firstName lastName email department",
        },
      })
      .lean(); // optional: performance ke liye

    return NextResponse.json(
      {
        success: true,
        message: "Teamlead added successfully",
        sharedTask: populatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/manager/received-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}