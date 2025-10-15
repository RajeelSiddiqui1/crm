import mongoose from "mongoose";
import bcrypt from "bcrypt"
import { NextResponse } from "next/server";
import Manager from "@/models/Manager";

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

        const emailAlreadyExists = await Manager.findOne({ email })

        if (emailAlreadyExists) {
            return NextResponse.json({
                message: "Manager is already exists"
            }, {
                status: 409
            })
        }

        const hashPassword = await bcrypt.hash(password, 12)

        const idx = Math.floor(Math.random() * 100 ) + 1
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`
        const avatarUrl = randomAvatar

        const newManager = new Manager({
            firstName,
            lastName,
            email,
            password: hashPassword,
            profilePic:avatarUrl
        })

        await newManager.save()

        return NextResponse.json({
            message: "Manager is register successfully"
        }, {
            status: 201
        })

    } catch (error) {
        return NextResponse.json({
            message: "Manager is register error", error
        }, {
            status: 404
        })
    }
}