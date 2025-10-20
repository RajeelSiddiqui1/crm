import { NextResponse } from "next/server";
import Form from "@/models/Form";
import dbConnect from "@/lib/db";

export async function POST(req) {
  try {
    await dbConnect();

    const { title, description, fields } = await req.json();

    // ✅ Validation
    if (!title || title.trim() === "") {
      return NextResponse.json(
        { message: "Form title is required" },
        { status: 400 }
      );
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { message: "Form must have at least one field" },
        { status: 400 }
      );
    }

    // ✅ Validate each field
    for (const field of fields) {
      if (!field.type || !field.label || !field.name) {
        return NextResponse.json(
          { message: "Each field must have type, label, and name" },
          { status: 400 }
        );
      }
    }

    // ✅ Check duplicate form title (optional)
    const existingForm = await Form.findOne({ title });
    if (existingForm) {
      return NextResponse.json(
        { message: "Form with this title already exists" },
        { status: 409 }
      );
    }

    // ✅ Create form
    const newForm = await Form.create({
      title,
      description: description || "",
      fields,
      createdBy: '65d1a1b2c3d4e5f6a7b8c9d0' // Replace with actual user ID from auth
    });

    return NextResponse.json(
      { 
        message: "Form created successfully", 
        data: newForm 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating form:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const forms = await Form.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ forms }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching forms:", error);
    return NextResponse.json(
      { message: "Error fetching forms", error: error.message },
      { status: 500 }
    );
  }
}