import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import Teamlead from "@/models/TeamLead";
import Department from "@/models/Department"; // ✅ ADD THIS LINE
import dbConnect from "@/lib/db";
import { sendTeamLeadWelcomeEmail } from "@/helper/emails/manager/create-teamlead";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.userId || session.user.id;
    const { firstName, lastName, email, depId } = await req.json();

    if (!firstName || !lastName || !email || !depId) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const emailExists = await Teamlead.findOne({ email });
    if (emailExists) {
      return NextResponse.json({ message: "Team Lead already exists" }, { status: 409 });
    }

   

    let userId;
    let isUnique = false;
    while (!isUnique) {
      const randomId = Math.floor(100000 + Math.random() * 900000);
      userId = `TL${randomId}`;
      const existing = await Teamlead.findOne({ userId });
      if (!existing) isUnique = true;
    }

     const normalizedEmail = email.toLowerCase();
    const password = Math.floor(100000 + Math.random() * 900000).toString();

    const hashPassword = await bcrypt.hash(password, 12);

    const randomAvatar = `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100) + 1}.png`;

    const newLead = await Teamlead.create({
      userId,
      firstName,
      lastName,
      email:normalizedEmail,
      password: hashPassword,
      profilePic: randomAvatar,
      managerId,
      depId,
    });

        const dept = await Department.findById(depId).select("name");
    

    await sendTeamLeadWelcomeEmail(email, firstName,lastName, userId, password,dept?.name || "Not Assigned");

    return NextResponse.json(
      { message: "Team Lead created successfully", userId, data: newLead },
      { status: 201 }
    );
  } catch (error) {
    console.error("TeamLead creation error:", error);
    return NextResponse.json({ message: "Error creating Team Lead", error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.userId || session.user.id;

    const teamLeads = await Teamlead.find({ managerId })
      .populate("depId", "name"); 

    return NextResponse.json({ teamLeads }, { status: 200 });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ message: "Error fetching TeamLeads", error: error.message }, { status: 500 });
  }
}
