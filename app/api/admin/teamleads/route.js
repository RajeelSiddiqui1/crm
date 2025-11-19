import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TeamLead from "@/models/TeamLead";

export  async function GET() {
  try {
    await dbConnect();

    const teamleads = await TeamLead.find()
      .populate("managerId", "firstName lastName email")
      .populate("depId", "name description")
      .lean();

    return NextResponse.json(
      {
        success: true,
        teamleads,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Admin Fetch Teamlead Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
