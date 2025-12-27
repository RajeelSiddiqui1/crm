import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Manager from "@/models/Manager";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Department from "@/models/Department";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const managers = await Manager.find()
      .select("_id firstName lastName email phone departments")
      .populate("departments", "name")
      .sort({ firstName: 1 });

    return NextResponse.json({ managers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { error: "Failed to fetch managers" },
      { status: 500 }
    );
  }
}