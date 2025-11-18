// app/api/teamlead/employees/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";
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

    // Debugging: Check depId from session
    console.log("TeamLead depId:", session.user.depId);

    // Ensure type-safe matching
    const employees = await Employee.find({ 
      depId: String(session.user.depId) // convert to string to match DB
    }).select("_id userId firstName lastName email position department");

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { success: true, message: "No employees found in your department", employees: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, employees }, { status: 200 });
  } catch (error) {
    console.error("Fetch employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
