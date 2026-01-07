import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";
import AdminTask2 from "@/models/AdminTask2";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const loggedInEmployeeId = session.user.id;

    
    // 🔹 Fetch only eligible employees
    const employees = await Employee.find({
      _id: { $nin: loggedInEmployeeId }
    })
      .select("firstName lastName email profilePic depId")
      .populate({
        path: "depId",
        select: "name"
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(employees, { status: 200 });

  } catch (error) {
    console.error("Employee fetch error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
