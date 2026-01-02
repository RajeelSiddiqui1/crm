import { NextResponse } from "next/server";
import AdminTask2 from "@/models/AdminTask2";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = session.user.id;

    // Tasks shared TO this employee
    const sharedToMe = await AdminTask2.find({
      $or: [
        { sharedTo: employeeId },
        { "employees.employeeId": employeeId }
      ]
    })
      .populate({
        path: "teamleads.teamleadId",
        select: "name email profilePic",
      })
      .populate({
        path: "employees.employeeId",
        select: "name email profilePic",
      })
      .populate({
        path: "sharedBY",
        select: "name email profilePic",
      })
      .populate({
        path: "sharedTo",
        select: "name email profilePic",
      })
      .populate({
        path: "departments",
        select: "name",
      })
      .populate({
        path: "submittedBy",
        select: "name email profilePic",
      })
      .sort({ createdAt: -1 });

    // Tasks shared BY this employee
    const sharedByMe = await AdminTask2.find({
      sharedBY: employeeId
    })
      .populate({
        path: "teamleads.teamleadId",
        select: "name email profilePic",
      })
      .populate({
        path: "employees.employeeId",
        select: "name email profilePic",
      })
      .populate({
        path: "sharedBY",
        select: "name email profilePic",
      })
      .populate({
        path: "sharedTo",
        select: "name email profilePic",
      })
      .populate({
        path: "departments",
        select: "name",
      })
      .populate({
        path: "submittedBy",
        select: "name email profilePic",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      sharedToMe,
      sharedByMe
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}