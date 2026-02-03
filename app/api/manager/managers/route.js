import Manager from "@/models/Manager";
import "@/models/Department";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    const managers = await Manager.find({ }) 
      .populate("departments", "name logoUrl")
      .select("firstName lastName email departments profilePic status")
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
