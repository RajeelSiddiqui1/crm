import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Manager from "@/models/Manager";
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

    const managers = await Manager.find({
      departments: { $in: [id] }
    })
    .select("firstName lastName email profilePic departments")
    .populate({
      path: "departments",
      select: "name _id"
    })
    .lean();

    return NextResponse.json({
      success: true,
      data: managers,
      count: managers.length
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch managers" },
      { status: 500 }
    );
  }
}