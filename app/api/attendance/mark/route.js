// app/api/attendance/mark/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import moment from "moment";

export async function POST(req) {
  try {
    await dbConnect();
    const { employeeId } = await req.json();
    const employee = await Employee.findById(employeeId);
    if (!employee) return NextResponse.json({ success: false, message: "Employee not found" });

    const today = moment().format("YYYY-MM-DD");
    const now = moment();

    const existing = await Attendance.findOne({ employeeId, date: today });
    if (existing)
      return NextResponse.json({ success: false, message: "Attendance already marked today." });

    // Manager — always present
    if (employee.role === "Manager") {
      await Attendance.create({
        employeeId,
        date: today,
        status: "Present",
        timeMarked: now.format("hh:mm A"),
      });
      return NextResponse.json({ success: true, message: "Manager attendance marked." });
    }

    // Convert start/end times
    const startTime = moment(employee.startTime, "hh:mm A");
    const endTime = moment(employee.endTime, "hh:mm A");
    const lateTime = moment(startTime).add(2, "hours");

    let status = "Present";

    if (now.isAfter(endTime)) {
      status = "Absent";
    } else if (now.isAfter(lateTime)) {
      status = "Late";
    }

    await Attendance.create({
      employeeId,
      date: today,
      status,
      timeMarked: now.format("hh:mm A"),
    });

    return NextResponse.json({
      success: true,
      message: `Attendance marked as ${status}`,
      status,
    });
  } catch (error) {
    console.error("Attendance Mark Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
