// app/api/upload-file/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { file, filename, fileType, folder = 'chat_attachments' } = await req.json();

    if (!file) {
      return NextResponse.json({ error: "File data required" }, { status: 400 });
    }

    // Determine resource type based on file type
    let resourceType = "auto";
    if (fileType.startsWith('image/')) {
      resourceType = "image";
    } else if (fileType.startsWith('video/')) {
      resourceType = "video";
    } else if (fileType.startsWith('audio/')) {
      resourceType = "video"; // Cloudinary treats audio as video
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:${fileType};base64,${file}`,
      {
        resource_type: resourceType,
        folder: folder,
        filename_override: filename,
        use_filename: true
      }
    );

    return NextResponse.json({
      success: true,
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      format: uploadResponse.format,
      bytes: uploadResponse.bytes
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}