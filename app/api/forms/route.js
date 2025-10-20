import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form"; // your Mongoose model

// ✅ GET all forms
export async function GET() {
  try {
    await dbConnect();
    const forms = await Form.find({});
    return NextResponse.json(forms, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 });
  }
}

// ✅ POST create form
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // ✅ default value agar createdBy missing ho
    const newForm = await Form.create({
      ...body,
      createdBy: body.createdBy || "Admin"  // ya "Manager" / "System"
    });

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error("Form creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create form" },
      { status: 500 }
    );
  }

}
