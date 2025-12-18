import { NextResponse } from "next/server";
import Department from "@/models/Department";
import dbConnect from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

function getPublicIdFromUrl(url) {
  if (!url) return null;
  try {
    const regex = /upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// GET department by ID
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "Department ID is required" },
        { status: 400 }
      );
    }

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json(
        { message: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        data: department 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Error fetching department", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// UPDATE department
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const { name, description, logoBase64 } = await req.json();

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json(
        { 
          success: false,
          message: "Department not found" 
        }, 
        { status: 404 }
      );
    }

    if (logoBase64) {
      const publicId = getPublicIdFromUrl(department.logoUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
      const upload = await cloudinary.uploader.upload(logoBase64, {
        folder: "departments",
      });
      department.logoUrl = upload.secure_url;
    }

    department.name = name || department.name;
    department.description = description || department.description;
    await department.save();

    return NextResponse.json(
      { 
        success: true,
        message: "Department updated successfully", 
        data: department 
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: "Error updating department", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE department
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json(
        { 
          success: false,
          message: "Department not found" 
        }, 
        { status: 404 }
      );
    }

    const publicId = getPublicIdFromUrl(department.logoUrl);
    if (publicId) await cloudinary.uploader.destroy(publicId);

    await Department.findByIdAndDelete(id);

    return NextResponse.json(
      { 
        success: true,
        message: "Department deleted successfully" 
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: "Error deleting department", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}