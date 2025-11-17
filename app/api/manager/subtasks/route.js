import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subtask from "@/models/Subtask";
import Manager from "@/models/Manager";
import Department from "@/models/Department"; // Import it so Mongoose knows the schema

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch the logged-in manager and populate departments
    const manager = await Manager.findOne({ email: session.user.email }).populate("departments");
    if (!manager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    // Get the IDs of the departments assigned to this manager
    const departmentIds = manager.departments.map((dep) => dep._id);

    // Fetch subtasks belonging to those departments
    const subtasks = await Subtask.find({ depId: { $in: departmentIds } });

    return NextResponse.json(subtasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching subtasks for manager:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}
