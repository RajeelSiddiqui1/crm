import { NextResponse } from "next/server";
import Department from "@/models/Department";
import cloudinary from "@/lib/cloudinary";
import  dbConnect  from "@/lib/db";
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
