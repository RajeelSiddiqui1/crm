import { authOptions } from "@/lib/auth";
import Department from "@/models/Department";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    // ✅ Check if user is logged in and is a Manager
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Find manager with their assigned departments
    const manager = await Manager.findById(session.user.id)
      .populate("departments", "name description") // populate departments with selected fields
      .lean();

    if (!manager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    // ✅ Return only assigned departments
    const departments = manager.departments || [];

    return NextResponse.json(departments, { status: 200 });
  } catch (error) {
    console.error("Error fetching manager departments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
