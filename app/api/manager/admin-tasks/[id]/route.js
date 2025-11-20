import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask from "@/models/AdminTask";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const task = await AdminTask.findById(id)
      .populate('managers', 'firstName lastName email')
      .lean();

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task }, { status: 200 });

  } catch (error) {
    console.error("Error fetching admin task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}