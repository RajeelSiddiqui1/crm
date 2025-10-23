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
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Access denied. TeamLead role required." }, { status: 403 });
    }

    await dbConnect();

    // Get employees from the same department as teamlead
    const employees = await Employee.find({ 
      depId: session.user.depId 
    }).select("_id userId firstName lastName email position department");

    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error("Fetch employees error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}