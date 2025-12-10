import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = session.user;
    const formData = await req.formData();
    const file = formData.get("profileImage");

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: "File size too large (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let Model;
    switch (role) {
      case "Admin":
        Model = Admin;
        break;
      case "Manager":
        Model = Manager;
        break;
      case "TeamLead":
        Model = TeamLead;
        break;
      case "Employee":
        Model = Employee;
        break;
      default:
        return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const user = await Model.findById(id);
    let publicId = `profile-pictures/${role.toLowerCase()}_${id}`;
    if (user && user.profilePic) {
      const existingUrl = user.profilePic;
      const match = existingUrl.match(/\/profile-pictures\/([^\.]+)/);
      if (match && match[1]) {
        publicId = `profile-pictures/${match[1]}`;
      }
    }

    const uploadResult = await cloudinary.uploader.upload(
      `data:${file.type};base64,${buffer.toString("base64")}`,
      {
        public_id: publicId,
        folder: "profile-pictures",
        overwrite: true,
        resource_type: "image",
      }
    );

    const imageUrl = uploadResult.secure_url;
    await Model.findByIdAndUpdate(id, { $set: { profilePic: imageUrl } });

    return NextResponse.json({
      success: true,
      message: "Profile picture uploaded successfully",
      imageUrl,
    }, { status: 200 });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Failed to upload profile picture", error: error.message }, { status: 500 });
  }
}
