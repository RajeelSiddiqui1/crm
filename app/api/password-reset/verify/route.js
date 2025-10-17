import  dbConnect  from "@/lib/db";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ message: "Email & OTP required" }, { status: 400 });

    await dbConnect();

    const models = [Admin, Manager, TeamLead, Employee];
    let user = null;

    for (const model of models) {
      user = await model.findOne({ email });
      if (user) break;
    }

    if (!user || user.otp !== otp || Date.now() > user.otpExpiry) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
    }

    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "OTP verification error", error }, { status: 500 });
  }
}
