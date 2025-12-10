// app/api/teamlead/employees/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TeamLead") {
      return NextResponse.json(
        { success: false, error: "Access denied. TeamLead role required." },
        { status: 403 }
      );
    }

    await dbConnect();

    const teamLead = await TeamLead.findById(session.user.id).select("managerId");

    if (!teamLead || !teamLead.managerId) {
      return NextResponse.json(
        { success: false, error: "TeamLead Manager ID not found" },
        { status: 404 }
      );
    }

    const employees = await Employee.find({
      managerId: String(teamLead.managerId)
    }).select("_id userId firstName lastName email position department managerId");

    return NextResponse.json(
      { success: true, employees },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
