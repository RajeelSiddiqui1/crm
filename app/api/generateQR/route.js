import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const role = searchParams.get("role");

    if (!id || !role) {
      return NextResponse.json({ error: "Missing id or role" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const qrData = `${baseUrl}/api/attendance/scan?id=${id}&role=${role}`;

    const qrImage = await QRCode.toDataURL(qrData);

    return NextResponse.json({ qrImage }, { status: 200 });
  } catch (error) {
    console.error("QR Generation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
