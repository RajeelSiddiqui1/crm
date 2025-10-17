import dbConnect  from "@/lib/db";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword)
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });

    await dbConnect();

    const models = [Admin, Manager, TeamLead, Employee];
    let user = null;

    for (const model of models) {
      user = await model.findOne({ email });
      if (user) break;
    }

    if (!user || user.otp !== otp || Date.now() > user.otpExpiry)
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 12);
    user.password = hash;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Password reset error", error }, { status: 500 });
  }
}
