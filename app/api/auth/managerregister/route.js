import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/dbConnect";

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

    const newManager = new Manager({
      firstName,
      lastName,
      email,
      password: hashPassword,
      profilePic: avatarUrl,
      departments: depIds, // ✅ store multiple departments
    });

    await newManager.save();

    return NextResponse.json(
      { message: "Manager registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering manager:", error);
    return NextResponse.json(
      { message: "Manager registration failed", error },
      { status: 500 }
    );
  }
}
