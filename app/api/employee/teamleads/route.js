import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Department from "@/models/Department";
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

    if (session.user.role !== "Employee") {
      return NextResponse.json(
        { success: false, error: "Access denied. Employee role required." },
        { status: 403 }
      );
    }

    await dbConnect();

    const teamLeads = await TeamLead.find({})
      .select("firstName lastName email depId")
      .populate({
        path: "depId",
        select: "name"
      })
      .sort({ firstName: 1 });

    return NextResponse.json(
      { success: true, employees: teamLeads },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch team leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}