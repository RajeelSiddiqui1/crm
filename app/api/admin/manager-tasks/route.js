// app/api/admin/manager-tasks/route.js

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

import FormSubmission from "@/models/FormSubmission";
import AdminTask from "@/models/AdminTask";
import Employee from "@/models/Employee"; // IMPORTANT (populate fix)

export async function GET(req) {
  await dbConnect();

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    const query = {};

    if (status) {
      query.status = status;
    }

    const formSubmissions = await FormSubmission.find(query)
      .populate({
        path: "formId",
        select: "title description fields",
      })

      // 🔥 FIX: Correct assignedEmployees populate (NO department)
      .populate({
        path: "assignedEmployees.employeeId",
        select: "name email role", // ONLY existing fields
        model: Employee,
      })

      // 🔥 Correct AdminTask populate
      .populate({
        path: "adminTask",
        select: "title clientName endDate priority managers",
        model: AdminTask,
      });

    return NextResponse.json(formSubmissions);
  } catch (error) {
    console.error("Error fetching manager tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch manager tasks" },
      { status: 500 }
    );
  }
}
