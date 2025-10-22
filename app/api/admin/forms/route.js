import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import Department from "@/models/Department"; // foreign key model

// ✅ POST (create new form)
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const { title, depId, description, fields, createdBy } = body;

    // ✅ Check if department exists (foreign key validation)
    const department = await Department.findById(depId);
    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // ✅ Create new form (store depId as ObjectId reference only)
    const newForm = new Form({
      title,
      depId,
      description,
      fields,
      createdBy,
    });

    await newForm.save();

    // ✅ Send raw ObjectId (no populate)
    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error("Form creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ GET (fetch all forms)
export async function GET() {
  try {
    await dbConnect();
    // ⚡ Return as-is — no populate
    const forms = await Form.find({});
    return NextResponse.json(forms, { status: 200 });
  } catch (error) {
    console.error("Fetch forms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
