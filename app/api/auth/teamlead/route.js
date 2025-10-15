import mongoose from "mongoose";
import bcrypt from "bcrypt"
import { NextResponse } from "next/server";
import Teamlead from "@/models/TeamLead";
import { sendTeamLeadWelcomeEmail } from "@/helper/emails/manager/create-teamlead";

export async function POST(req) {
    try {
        const { firstName, lastName, email, password } = await req.json()

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({
                message: "All feilds are required"
            }, {
                status: 409
            })
        }

        const emailAlreadyExists = await Teamlead.findOne({ email })

        if (emailAlreadyExists) {
            return NextResponse.json({
                message: "Teamlead is already exists"
            }, {
                status: 409
            })
        }


        let userId;
        let isUnique = false;

        while (!isUnique) {
            const randomId = Math.floor(100000 + Math.random() * 900000);
            userId = `TL${randomId}`;
            const existing = await Teamlead.findOne({ userId });
            if (!existing) isUnique = true;
        }

        const hashPassword = await bcrypt.hash(password, 12)

        const idx = Math.floor(Math.random() * 100) + 1
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`
        const avatarUrl = randomAvatar

        const newTeamlead = new Teamlead({
            userId,
            firstName,
            lastName,
            email,
            password: hashPassword,
            profilePic: avatarUrl
        })

        await newTeamlead.save()

         await sendTeamLeadWelcomeEmail(email, firstName, userId, password);


        return NextResponse.json({
            message: "Teamlead is created successfully",
            userId
        }, {
            status: 201
        })

    } catch (error) {
        return NextResponse.json({
            message: "Teamlead created error", error
        }, {
            status: 404
        })
    }
}



export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json(
        { message: "Manager ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const teamLeads = await Teamlead.find({ managerId }).select(
      "userId firstName lastName email profilePic createdAt"
    );

    if (teamLeads.length === 0) {
      return NextResponse.json(
        { message: "No TeamLeads found for this manager" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "TeamLeads fetched successfully", teamLeads },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching TeamLeads:", error);
    return NextResponse.json(
      { message: "Error fetching TeamLeads", error },
      { status: 500 }
    );
  }
}