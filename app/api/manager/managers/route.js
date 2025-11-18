// app/api/manager/managers/route.js
import Manager from "@/models/Manager";
import "@/models/Department"; // ensure Department model is registered
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // Fetch all managers
    const managers = await Manager.find()
      .populate("departments", "name logoUrl") // populate department name and logoUrl
      .select("firstName lastName email departments profilePic status") // return only needed fields
      .sort({ firstName: 1 });

    return NextResponse.json({ success: true, managers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}