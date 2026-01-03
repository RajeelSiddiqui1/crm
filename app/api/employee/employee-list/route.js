import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";
import AdminTask2 from "@/models/AdminTask2";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const loggedInEmployeeId = session.user.id;

    // 🔹 Task ID query se lo (important)
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ message: "Task ID required" }, { status: 400 });
    }

    // 🔹 Fetch task
    const task = await AdminTask2.findById(taskId)
      .select("employees.employeeId shares.sharedTo");

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // 🔹 Extract IDs to exclude
    const assignedEmployeeIds = task.employees.map(e =>
      e.employeeId.toString()
    );

    const sharedEmployeeIds = task.shares.map(s =>
      s.sharedTo.toString()
    );

    const excludeIds = [
      loggedInEmployeeId,
      ...assignedEmployeeIds,
      ...sharedEmployeeIds
    ];

    // 🔹 Fetch only eligible employees
    const employees = await Employee.find({
      _id: { $nin: excludeIds }
    })
      .select("firstName lastName email profilePic depId")
      .populate({
        path: "depId",
        select: "name"
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(employees, { status: 200 });

  } catch (error) {
    console.error("Employee fetch error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
