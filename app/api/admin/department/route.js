import { NextResponse } from "next/server";
import Department from "@/models/Department";
import { dbConnect } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    await dbConnect();
    const { name, description, logoBase64 } = await req.json();

    if (!name) {
      return NextResponse.json({ message: "Department name is required" }, { status: 400 });
    }

    let logoUrl = null;
    if (logoBase64) {
      const upload = await cloudinary.uploader.upload(logoBase64, {
        folder: "departments",
      });
      logoUrl = upload.secure_url;
    }

    const newDept = await Department.create({ name, description, logoUrl });
    return NextResponse.json({ message: "Department created", data: newDept }, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const departments = await Department.find().sort({ createdAt: -1 });
    return NextResponse.json(departments, { status: 200 });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ message: "Error fetching departments" }, { status: 500 });
  }
}
