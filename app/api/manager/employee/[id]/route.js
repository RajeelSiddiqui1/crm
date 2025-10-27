import { NextResponse } from "next/server";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { firstName, lastName, phone, address, depId, startTime, endTime } = await req.json();

    // ✅ Remove depId if empty or invalid
    const updateData = { firstName, lastName, phone, address, startTime, endTime };
    if (depId && depId.trim() !== "") {
      updateData.depId = depId;
    }

    const updated = await Employee.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

    if (!updated)
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });

    return NextResponse.json(
      { message: "Employee updated successfully", employee: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Employee update error:", error);
    return NextResponse.json(
      { message: "Failed to update Employee", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const emp = await Employee.findById(id)
      .populate("depId", "name")
      .select("-password");
    if (!emp)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json(emp, { status: 200 });
  } catch (error) {
    console.error("Employee fetch error:", error);
    return NextResponse.json(
      { message: "Error fetching Employee", error: error.message },
      { status: 500 }
    );
  }
}
