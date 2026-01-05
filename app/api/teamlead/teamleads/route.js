// app/api/teamlead/teamleads/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import TeamLead from "@/models/TeamLead";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch team leads excluding the current one
    const teamLeads = await TeamLead.find({
      _id: { $ne: session.user.id },
    }).select("_id firstName lastName email depId phone");

    return NextResponse.json({ teamLeads }, { status: 200 });
  } catch (error) {
    console.error("GET TeamLeads Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team leads" },
      { status: 500 }
    );
  }
}