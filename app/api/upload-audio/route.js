import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const { audio, folder } = await req.json();

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:audio/webm;base64,${audio}`,
      {
        folder: folder || 'chat_voice_messages',
        resource_type: 'auto',
        public_id: `voice_${Date.now()}`,
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
    console.error("Error uploading audio:", error);
    return NextResponse.json(
      { error: "Failed to upload audio" },
      { status: 500 }
    );
  }
}