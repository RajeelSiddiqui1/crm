import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TeamLead from "@/models/TeamLead";
import mongoose from "mongoose";
import Form from "@/models/Form";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid department ID" },
        { status: 400 }
      );
    }

    const teamLeads = await TeamLead.find({
      depId: id
    })
    .select("firstName lastName email profilePic depId")
    .populate({
      path: "depId",
      select: "name _id"
    })
    .lean();

    return NextResponse.json({
      success: true,
      data: teamLeads,
      count: teamLeads.length
    });
  } catch (error) {
    console.error("Error fetching team leads:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch team leads" },
      { status: 500 }
    );
  }
}