import { NextResponse } from "next/server";
import Department from "@/models/Department";
import cloudinary from "@/lib/cloudinary";
import { dbConnect } from "@/lib/db";

function getPublicIdFromUrl(url) {
  try {
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1];
    const [publicId] = fileWithExt.split(".");
    const folder = parts.slice(parts.indexOf("upload") + 2, -1).join("/");
    return folder ? `${folder}/${publicId}` : publicId;
  } catch {
    return null;
  }
}

export async function POST(req) {
  await dbConnect();
  const { name, description, logoUrl } = await req.json();

  if (!name) {
    return NextResponse.json({ message: "Department name is required" }, { status: 409 });
  }

  const department = new Department({ name, description, logoUrl });
  await department.save();

  return NextResponse.json({ message: "Department created successfully", department }, { status: 201 });
}

export async function GET() {
  await dbConnect();
  const departments = await Department.find();
  return NextResponse.json({ departments }, { status: 200 });
}
import { NextResponse } from "next/server";
import Department from "@/models/Department";
import { dbConnect } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

function getPublicIdFromUrl(url) {
  if (!url) return null;
  const parts = url.split("/");
  const publicIdWithExt = parts[parts.length - 1];
  const publicId = publicIdWithExt.split(".")[0];
  return `departments/${publicId}`;
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const { name, description, logoBase64 } = await req.json();

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({ message: "Department not found" }, { status: 404 });
    }

    if (logoBase64 && department.logoUrl) {
      const publicId = getPublicIdFromUrl(department.logoUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
      const upload = await cloudinary.uploader.upload(logoBase64, { folder: "departments" });
      department.logoUrl = upload.secure_url;
    }

    department.name = name || department.name;
    department.description = description || department.description;
    await department.save();

    return NextResponse.json({ message: "Department updated successfully", department }, { status: 200 });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json({ message: "Error updating department" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({ message: "Department not found" }, { status: 404 });
    }

    const publicId = getPublicIdFromUrl(department.logoUrl);
    if (publicId) await cloudinary.uploader.destroy(publicId);

    await Department.findByIdAndDelete(id);

    return NextResponse.json({ message: "Department deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ message: "Error deleting department" }, { status: 500 });
  }
}
