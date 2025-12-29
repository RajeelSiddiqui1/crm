import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";
import Department from "@/models/Department";

export async function GET() {
  try {
    await dbConnect();

    const employees = await Employee.find()
      .populate("managerId", "firstName lastName email")
      .populate("depId", "name description")
      .lean();

    return NextResponse.json(
      {
        success: true,
          employees,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Admin Fetch Employees Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}