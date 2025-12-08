// app/api/auth/manager-verify/route.js
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

    // Check if OTP is locked
    if (manager.otpLockedUntil && new Date() < manager.otpLockedUntil) {
      const lockTime = Math.ceil((manager.otpLockedUntil - new Date()) / 1000 / 60);
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many failed attempts. Account locked for ${lockTime} minutes`,
          isLocked: true,
          lockTime: lockTime,
          fieldsDisabled: true // New field to indicate fields should be disabled
        },
        { status: 423 }
      );
    }

    if (!manager.otp || !manager.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP expired or invalid" },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (new Date() > manager.otpExpiry) {
      // Reset attempts if OTP is expired
      manager.otpAttempts = 0;
      await manager.save();
      
      return NextResponse.json(
        { success: false, message: "OTP has expired" },
        { status: 400 }
      );
    }

    // Verify OTP
    if (manager.otp !== otp) {
      // Increment failed attempts
      manager.otpAttempts = (manager.otpAttempts || 0) + 1;
      
      // Lock account after 4 failed attempts
      if (manager.otpAttempts >= 4) {
        manager.otpLockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lock
        await manager.save();
        
        return NextResponse.json(
          { 
            success: false, 
            message: "Too many failed attempts. Account locked for 5 minutes",
            isLocked: true,
            lockTime: 5,
            attemptsLeft: 0,
            fieldsDisabled: true // Disable fields
          },
          { status: 423 }
        );
      }
      
      await manager.save();
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid OTP",
          attemptsLeft: 4 - manager.otpAttempts
        },
        { status: 400 }
      );
    }

    // Successful verification - reset everything
    manager.verified = true;
    manager.otp = null;
    manager.otpExpiry = null;
    manager.otpAttempts = 0;
    manager.otpLockedUntil = null;
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

// Update the GET endpoint similarly...

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

    // Check lock for GET requests too
    if (manager.otpLockedUntil && new Date() < manager.otpLockedUntil) {
      return NextResponse.redirect(new URL('/manager-verified?error=account-locked', req.url));
    }

    if (!manager.otp || manager.otp !== otp) {
      // Increment attempts for GET requests too
      manager.otpAttempts = (manager.otpAttempts || 0) + 1;
      
      if (manager.otpAttempts >= 4) {
        manager.otpLockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        await manager.save();
        return NextResponse.redirect(new URL('/manager-verified?error=account-locked', req.url));
      }
      
      await manager.save();
      return NextResponse.redirect(new URL('/manager-verified?error=invalid-otp', req.url));
    }

    if (new Date() > manager.otpExpiry) {
      return NextResponse.redirect(new URL('/manager-verified?error=otp-expired', req.url));
    }

    manager.verified = true;
    manager.otp = null;
    manager.otpExpiry = null;
    manager.otpAttempts = 0;
    manager.otpLockedUntil = null;
    await manager.save();

    return NextResponse.redirect(new URL('/manager-verified?success=true', req.url));
  } catch (error) {
    console.error("Error in GET verification:", error);
    return NextResponse.redirect(new URL('/manager-verified?error=server-error', req.url));
  }
}