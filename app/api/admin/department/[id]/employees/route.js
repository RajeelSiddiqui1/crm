import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";
import mongoose from "mongoose";

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

    const employees = await Employee.find({
      depId: id
    })
    .select("firstName lastName email profilePic depId managerId")
    .populate({
      path: "depId",
      select: "name _id"
    })
    .populate({
      path: "managerId",
      select: "firstName lastName email"
    })
    .lean();

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}