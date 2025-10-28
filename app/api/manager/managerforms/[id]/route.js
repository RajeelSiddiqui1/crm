import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import Department from "@/models/Department";

// ✅ GET (fetch form by ID)
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(form, { status: 200 });
  } catch (error) {
    console.error("Fetch single form error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ PUT (update form)
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await req.json();
    const { title, depId, description, fields } = body;

    const existingForm = await Form.findById(id);
    if (!existingForm) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // ✅ Only check department if depId is provided & different from current
    if (depId && existingForm.depId?.toString() && depId !== existingForm.depId.toString()) {
      const department = await Department.findById(depId);
      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }
    }

    const updatedForm = await Form.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(depId && { depId }),
        ...(description && { description }),
        ...(fields && { fields }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedForm, { status: 200 });
  } catch (error) {
    console.error("Form update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// ✅ DELETE (delete form by ID)
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    await Form.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Form deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Form deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
