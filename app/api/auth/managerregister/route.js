import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sendVerifyOtpTemplate } from "@/helper/emails/manager/sendVerifyOtp";

export async function POST(req) {
  try {
    await dbConnect();

    const { firstName, lastName, email, password, depIds } = await req.json();

    if (!firstName || !lastName || !email || !password || !depIds || depIds.length === 0) {
      return NextResponse.json(
        { message: "All fields are required, including departments" },
        { status: 400 }
      );
    }

    const emailAlreadyExists = await Manager.findOne({ email });
    if (emailAlreadyExists) {
      return NextResponse.json(
        { message: "Manager already exists" },
        { status: 409 }
      );
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const idx = Math.floor(Math.random() * 100) + 1;
    const avatarUrl = `https://avatar.iran.liara.run/public/${idx}.png`;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const newManager = new Manager({
      firstName,
      lastName,
      email,
      password: hashPassword,
      profilePic: avatarUrl,
      departments: depIds,
      otp,
      otpExpiry
    });

    await newManager.save();

    const emailHtml = sendVerifyOtpTemplate(`${firstName} ${lastName}`, otp);
    
    try {
      await sendMail(
        email,
        "Verify Your Manager Account - OTP Required",
        emailHtml
      );
      
      return NextResponse.json(
        { 
          success: true,
          message: "Manager registered successfully. Please check your email for OTP verification.",
          data: {
            email: newManager.email,
            name: `${newManager.firstName} ${newManager.lastName}`,
            id: newManager._id
          }
        },
        { status: 201 }
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      
      return NextResponse.json(
        { 
          success: false,
          message: "Manager registered but verification email failed. Please contact support.",
          data: {
            email: newManager.email,
            otp: otp
          }
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error registering manager:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Manager registration failed",
        error: error.message 
      },
      { status: 500 }
    );
  }
}