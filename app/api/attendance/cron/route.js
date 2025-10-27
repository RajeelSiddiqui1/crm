// app/api/attendance/cron/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import moment from "moment";
import cron from "node-cron";

await dbConnect();

cron.schedule("*/2 * * * *", async () => {
  const today = moment().format("YYYY-MM-DD");
  const employees = await Employee.find({ role: { $ne: "Manager" } });

  for (const emp of employees) {
    const existing = await Attendance.findOne({ employeeId: emp._id, date: today });
    if (!existing) {
      const now = moment();
      const endTime = moment(emp.endTime, "hh:mm A");
      const status = now.isAfter(endTime) ? "Absent" : "Pending";
      if (status === "Absent") {
        await Attendance.create({
          employeeId: emp._id,
          date: today,
          status: "Absent",
          timeMarked: now.format("hh:mm A"),
        });
      }
    }
  }
  console.log("✅ Auto Absent Checker ran successfully.");
});

export async function GET() {
  return NextResponse.json({ message: "Attendance cron running every 2 minutes" });
}
