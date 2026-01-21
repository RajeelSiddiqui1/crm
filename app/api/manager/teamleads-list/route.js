import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TeamLead from "@/models/TeamLead";
import Department from "@/models/Department";

export async function GET(req) {
  try {
    await dbConnect();

    const teamleads = await TeamLead.find({})
      .populate("depId", "name")
      .select("firstName lastName email depId")
      .sort({ firstName: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        teamleads,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("TeamLeads fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch teamleads",
      },
      { status: 500 }
    );
  }
}
