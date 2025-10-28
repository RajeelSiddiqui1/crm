import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EmployeeForm from "@/models/EmployeeForm";
import Department from "@/models/Department";

// ✅ GET (fetch EmployeeForm by ID)
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    const EmployeeForm = await EmployeeForm.findById(id);
    if (!EmployeeForm) {
      return NextResponse.json(
        { error: "EmployeeForm not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(EmployeeForm, { status: 200 });
  } catch (error) {
    console.error("Fetch single EmployeeForm error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ PUT (update EmployeeForm)
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await req.json();
    const { title, depId, description, fields } = body;

    const existingEmployeeForm = await EmployeeForm.findById(id);
    if (!existingEmployeeForm) {
      return NextResponse.json(
        { error: "EmployeeForm not found" },
        { status: 404 }
      );
    }

    // ✅ Only check department if depId is provided & different from current
    if (depId && existingEmployeeForm.depId?.toString() && depId !== existingEmployeeForm.depId.toString()) {
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
        ...(title && { title }),
        ...(depId && { depId }),
        ...(description && { description }),
        ...(fields && { fields }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedEmployeeForm, { status: 200 });
  } catch (error) {
    console.error("EmployeeForm update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// ✅ DELETE (delete EmployeeForm by ID)
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;

    const EmployeeForm = await EmployeeForm.findById(id);
    if (!EmployeeForm) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
