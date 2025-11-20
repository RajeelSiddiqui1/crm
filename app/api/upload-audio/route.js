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

    let audioBase64;
    let folder = 'chat_voice_messages';

    // Handle JSON request
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json();
      audioBase64 = body.audio;
      folder = body.folder || folder;
    }

    // Handle FormData request
    else if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('audio');
      folder = formData.get('folder') || folder;

      if (file && file.arrayBuffer) {
        const buffer = await file.arrayBuffer();
        audioBase64 = Buffer.from(buffer).toString('base64');
      }
    }

    if (!audioBase64) {
      return NextResponse.json({ error: "Audio data required" }, { status: 400 });
    }

    // Clean base64 string (remove any prepended data URL)
    audioBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');

    // Upload to Cloudinary as raw to support all audio formats
    const uploadResponse = await cloudinary.uploader.upload(
      `data:audio/wav;base64,${audioBase64}`,
      {
        resource_type: "raw",
        folder: folder,
        public_id: `voice_${Date.now()}`
      }
    );

    return NextResponse.json({
      success: true,
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      duration: uploadResponse.duration || null
    });

  } catch (error) {
    console.error("Error uploading audio:", error);
    return NextResponse.json(
      { error: "Failed to upload audio" },
      { status: 500 }
    );
  }
}
