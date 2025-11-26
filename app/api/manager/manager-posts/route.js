import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ManagerPost from "@/models/ManagerPost";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);


    if (!session?.user || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { title, description, attachmentUrl } = await req.json();

    let uploadAttachment = null;

    if (attachmentUrl) {
      const uploaded = await cloudinary.uploader.upload(attachmentUrl, {
        folder: "manager_posts/posts",
      });
      uploadAttachment = uploaded.secure_url;
    }

    const newManagerPost = new ManagerPost({
      title,
      description,
      attachmentUrl: uploadAttachment,
      submmittedBy: session.user.id
    });

    await newManagerPost.save();

    return NextResponse.json(
      {
        success: true,
        message: "Post uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("POST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Post upload failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

  
    if (!session?.user || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const posts = await ManagerPost.find({submmittedBy: session.user.id}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        posts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching posts" },
      { status: 500 }
    );
  }
}
