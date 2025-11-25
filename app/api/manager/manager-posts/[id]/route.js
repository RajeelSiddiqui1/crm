import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ManagerPost from "@/models/ManagerPost";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function extractPublicId(url) {
  const parts = url.split("/manager_posts/posts/")[1];
  return "admin_posts/posts/" + parts.split(".")[0];
}

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { title, description, attachmentUrl, visible } = await req.json();

    const post = await ManagerPost.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    let uploadAttachment = post.attachmentUrl;

    if (attachmentUrl && attachmentUrl !== post.attachmentUrl) {
      if (post.attachmentUrl) {
        const publicId = extractPublicId(post.attachmentUrl);
        await cloudinary.uploader.destroy(publicId);
      }

      const uploaded = await cloudinary.uploader.upload(attachmentUrl, {
        folder: "manager_posts/posts",
      });

      uploadAttachment = uploaded.secure_url;
    }

    const updatedPost = await ManagerPost.findByIdAndUpdate(
      id,
      {
        title,
        description,
        attachmentUrl: uploadAttachment,
        visible: visible !== undefined ? visible : post.visible,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Post updated successfully",
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("PATCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Post update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;

    const post = await ManagerPost.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    if (post.attachmentUrl) {
      const publicId = extractPublicId(post.attachmentUrl);
      await cloudinary.uploader.destroy(publicId);
    }

    await ManagerPost.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Post deletion failed" },
      { status: 500 }
    );
  }
}
