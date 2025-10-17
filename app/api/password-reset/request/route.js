import  dbConnect  from "@/lib/db";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { sendMail } from "@/lib/mail";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

    await dbConnect();

    // sab models me check karo
    const models = [Admin, Manager, TeamLead, Employee];
    let user = null;

    for (const model of models) {
      user = await model.findOne({ email });
      if (user) break;
    }

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });


    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; 
    await user.save();


    await sendMail(
      email,
      "Password Reset OTP",
      `<h3>Your OTP code is:</h3><h2>${otp}</h2><p>This OTP expires in 10 minutes.</p>`
    );

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in reset request:", error);
    return NextResponse.json({ message: "Error sending OTP", error }, { status: 500 });
  }
}
