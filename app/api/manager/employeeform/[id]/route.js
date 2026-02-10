import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EmployeeForm from "@/models/EmployeeForm";
import Department from "@/models/Department";

// ✅ GET
export async function GET(request, context) {
  try {
    await dbConnect();

    // ✅ Next.js dynamic params MUST be awaited
    const { id } = await context.params;

    const employeeForm = await EmployeeForm.findById(id);

    if (!employeeForm) {
      return NextResponse.json(
        { error: "EmployeeForm not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(employeeForm, { status: 200 });
  } catch (error) {
    console.error("Fetch single EmployeeForm error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch EmployeeForm" },
      { status: 500 }
    );
  }
}

// ✅ PUT
export async function PUT(request, context) {
  try {
    await dbConnect();

    const { id } = await context.params;
    const body = await request.json();

    const { title, depId, description, fields } = body;

    const existingEmployeeForm = await EmployeeForm.findById(id);

    if (!existingEmployeeForm) {
      return NextResponse.json(
        { error: "EmployeeForm not found" },
        { status: 404 }
      );
    }

    // ✅ validate department only when changed
    if (
      depId &&
      existingEmployeeForm.depId &&
      depId !== existingEmployeeForm.depId.toString()
    ) {
      const department = await Department.findById(depId);

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }
    }

    const updatedEmployeeForm = await EmployeeForm.findByIdAndUpdate(
      id,
      {
        ...(title !== undefined && { title }),
        ...(depId !== undefined && { depId }),
        ...(description !== undefined && { description }),
        ...(fields !== undefined && { fields }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedEmployeeForm, { status: 200 });
  } catch (error) {
    console.error("EmployeeForm update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update EmployeeForm" },
      { status: 500 }
    );
  }
}

// ✅ DELETE
export async function DELETE(request, context) {
  try {
    await dbConnect();

    const { id } = await context.params;

    const existingEmployeeForm = await EmployeeForm.findById(id);

    if (!existingEmployeeForm) {
      return NextResponse.json(
        { error: "EmployeeForm not found" },
        { status: 404 }
      );
    }

    await EmployeeForm.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "EmployeeForm deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("EmployeeForm deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete EmployeeForm" },
      { status: 500 }
    );
  }
}
