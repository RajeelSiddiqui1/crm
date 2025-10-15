import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import Teamlead from "@/models/TeamLead";
import { dbConnect } from "@/lib/db";
import { sendTeamLeadWelcomeEmail } from "@/helper/emails/manager/create-teamlead";

export async function POST(req) {
  try {
    await dbConnect();
    const { firstName, lastName, email, password, managerId, depId } = await req.json();

    if (!firstName || !lastName || !email || !password || !depId) {
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

    const hashPassword = await bcrypt.hash(password, 12);
    const randomAvatar = `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100) + 1}.png`;

    const newLead = await Teamlead.create({
      userId,
      firstName,
      lastName,
      email,
      password: hashPassword,
      profilePic: randomAvatar,
      managerId: managerId || null,
      depId,
    });

    await sendTeamLeadWelcomeEmail(email, firstName, userId, password);

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
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json({ message: "Manager ID is required" }, { status: 400 });
    }

    await dbConnect();
    const teamLeads = await Teamlead.find({ managerId })
      .populate("depId", "name")
      .select("userId firstName lastName email profilePic createdAt depId");

    if (teamLeads.length === 0) {
      return NextResponse.json({ message: "No TeamLeads found for this manager" }, { status: 404 });
    }

    return NextResponse.json({ message: "Fetched successfully", teamLeads }, { status: 200 });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ message: "Error fetching TeamLeads", error: error.message }, { status: 500 });
  }
}
