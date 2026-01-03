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

    // Tasks shared TO this employee (either in sharedTo array or employees array)
    const sharedToMe = await AdminTask2.find({
      $or: [
        { "sharedTo.userId": employeeId },
        { "employees.employeeId": employeeId }
      ]
    })
      .populate({
        path: "teamleads.teamleadId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "employees.employeeId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "sharedBY",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "sharedTo.userId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "departments",
        select: "name",
      })
      .populate({
        path: "submittedBy",
        select: "firstName lastName email profilePic",
      })
      .sort({ createdAt: -1 });

    // Tasks shared BY this employee
    const sharedByMe = await AdminTask2.find({
      sharedBY: employeeId,
      sharedByModel: "Employee"
    })
      .populate({
        path: "teamleads.teamleadId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "employees.employeeId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "sharedBY",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "sharedTo.userId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "departments",
        select: "name",
      })
      .populate({
        path: "submittedBy",
        select: "firstName lastName email profilePic",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      sharedToMe,
      sharedByMe
    }, { status: 200 });
  } catch (error) {
    console.error("GET Shared Tasks Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}