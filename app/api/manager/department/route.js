import { authOptions } from "@/lib/auth";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    // Check Auth
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch manager with populated departments
    const manager = await Manager.findById(session.user.id)
      .populate("departments", "name description") // only return name + description
      .lean();

    if (!manager) {
      return NextResponse.json(
        { message: "Manager not found" },
        { status: 404 }
      );
    }

    // Return only assigned departments
    return NextResponse.json(
      { success: true, departments: manager.departments },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching manager departments:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
