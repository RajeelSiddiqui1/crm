import { NextResponse } from "next/server";
import Department from "@/models/Department";
import dbConnect from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    await dbConnect();

    const { name, description, logoBase64 } = await req.json();

    // ✅ Validation
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { message: "Department name is required" },
        { status: 400 }
      );
    }

    if (description && description.length < 10) {
      return NextResponse.json(
        { message: "Description must be at least 10 characters long" },
        { status: 400 }
      );
    }

    // ✅ Check duplicate department
    const existing = await Department.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { message: "Department already exists" },
        { status: 409 }
      );
    }

    // ✅ Upload image (without folder)
    let logoUrl = null;
    if (logoBase64) {
      try {
        const upload = await cloudinary.uploader.upload(logoBase64, {
          transformation: [{ width: 500, height: 500, crop: "limit" }],
        });
        logoUrl = upload.secure_url;
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        return NextResponse.json(
          { message: "Image upload failed", error: err.message },
          { status: 500 }
        );
      }
    }

    // ✅ Save department
    const newDept = await Department.create({
      name,
      description: description || "",
      logoUrl,
    });

    return NextResponse.json(
      { message: "Department created successfully", data: newDept },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating department:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const departments = await Department.find().sort({ createdAt: -1 });
    return NextResponse.json({ departments }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching departments", error: error.message },
      { status: 500 }
    );
  }
}

