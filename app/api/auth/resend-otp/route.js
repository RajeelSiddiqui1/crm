import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Manager from "@/models/Manager";
import { sendMail } from "@/lib/mail";
import { sendVerifyOtpTemplate } from "@/helper/emails/manager/sendVerifyOtp";

export async function POST(req) {
  try {
    await dbConnect();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
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
        { success: false, message: "Account is already verified" },
        { status: 400 }
      );
    }

    // Check if OTP was sent recently (within 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (manager.otpExpiry && manager.otpExpiry > oneMinuteAgo) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Please wait before requesting new OTP",
          waitTime: Math.ceil((manager.otpExpiry.getTime() - oneMinuteAgo.getTime()) / 1000)
        },
        { status: 429 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    manager.otp = otp;
    manager.otpExpiry = otpExpiry;
    await manager.save();

    const emailHtml = sendVerifyOtpTemplate(
      `${manager.firstName} ${manager.lastName}`,
      otp
    );

    try {
      await sendMail(
        email,
        "New OTP - Verify Your Manager Account",
        emailHtml
      );
      
      return NextResponse.json({
        success: true,
        message: "New OTP sent successfully to your email"
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      
      return NextResponse.json({
        success: false,
        message: "Failed to send OTP email",
        manualOtp: otp
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error resending OTP:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for resending OTP with email parameter
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email parameter is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const manager = await Manager.findOne({ email });

    if (!manager) {
      return NextResponse.json(
        { success: false, message: "Manager not found" },
        { status: 404 }
      );
    }

    if (manager.verified) {
      return NextResponse.json(
        { success: false, message: "Account is already verified" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    manager.otp = otp;
    manager.otpExpiry = otpExpiry;
    await manager.save();

    const emailHtml = sendVerifyOtpTemplate(
      `${manager.firstName} ${manager.lastName}`,
      otp
    );

    try {
      await sendMail(
        email,
        "New OTP - Verify Your Manager Account",
        emailHtml
      );
      
      return NextResponse.json({
        success: true,
        message: "New OTP sent successfully"
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      
      return NextResponse.json({
        success: false,
        message: "Failed to send OTP email",
        manualOtp: otp
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in GET resend OTP:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}