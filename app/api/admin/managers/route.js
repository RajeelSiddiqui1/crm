import { NextResponse } from "next/server";
import Manager from "@/models/Manager";
import Department from "@/models/Department";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    await dbConnect();

    const managers = await Manager.find()
      .populate({
        path: 'departments',
        select: 'name description'
      })
      .lean();

    console.log("Managers with departments:", JSON.stringify(managers, null, 2));

    return NextResponse.json(
      {
        success: true,
        managers,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Admin Fetch Managers Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}