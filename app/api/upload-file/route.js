import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const { file, filename, fileType, folder } = await req.json();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${fileType};base64,${file}`,
      {
        folder: folder || 'chat_attachments',
        resource_type: 'auto',
        public_id: `${Date.now()}_${filename}`,
        overwrite: true
      }
    );

    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}