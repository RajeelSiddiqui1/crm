import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Manager from "@/models/Manager";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const manager = await Manager.findOne({ email });

    if (!manager) {
      return NextResponse.json(
        { success: false, message: "Manager not found" },
        { status: 404 }
      );
    }

    if (manager.verified) {
      return NextResponse.json(
        { success: false, message: "Account already verified" },
        { status: 400 }
      );
    }

    if (!manager.otp || !manager.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP expired or invalid" },
        { status: 400 }
      );
    }

    if (manager.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (new Date() > manager.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP has expired" },
        { status: 400 }
      );
    }

    // Update manager as verified and clear OTP
    manager.verified = true;
    manager.otp = null;
    manager.otpExpiry = null;
    await manager.save();

    return NextResponse.json({
      success: true,
      message: "Account verified successfully!"
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for direct verification via link
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const otp = searchParams.get('otp');

    if (!email || !otp) {
      return NextResponse.redirect(new URL('/manager-verified?error=missing-params', req.url));
    }

    await dbConnect();
    const manager = await Manager.findOne({ email });

    if (!manager) {
      return NextResponse.redirect(new URL('/manager-verified?error=not-found', req.url));
    }

    if (manager.verified) {
      return NextResponse.redirect(new URL('/manager-verified?error=already-verified', req.url));
    }

    if (!manager.otp || manager.otp !== otp) {
      return NextResponse.redirect(new URL('/manager-verified?error=invalid-otp', req.url));
    }

    if (new Date() > manager.otpExpiry) {
      return NextResponse.redirect(new URL('/manager-verified?error=otp-expired', req.url));
    }

    manager.verified = true;
    manager.otp = null;
    manager.otpExpiry = null;
    await manager.save();

    return NextResponse.redirect(new URL('/manager-verified?success=true', req.url));
  } catch (error) {
    console.error("Error in GET verification:", error);
    return NextResponse.redirect(new URL('/manager-verified?error=server-error', req.url));
  }
}