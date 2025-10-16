
import bcrypt from "bcrypt"
import { NextResponse } from "next/server";
import Admin from "@/models/Admin";
import dbConnect from "@/lib/db";



export async function POST(req) {
    try {

        await dbConnect();

        const { firstName, lastName, email, password } = await req.json()

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({
                message: "All feilds are required"
            }, {
                status: 409
            })
        }

        const emailAlreadyExists = await Admin.findOne({ email })

        if (emailAlreadyExists) {
            return NextResponse.json({
                message: "Admin is already exists"
            }, {
                status: 409
            })
        }

        const hashPassword = await bcrypt.hash(password, 12)

        const idx = Math.floor(Math.random() * 100 ) + 1
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`
        const avatarUrl = randomAvatar

        const newAdmin = new Admin({
            firstName,
            lastName,
            email,
            password: hashPassword,
            profilePic:avatarUrl
        })

        await newAdmin.save()

        return NextResponse.json({
            message: "Admin is register successfully"
        }, {
            status: 201
        })

    } catch (error) {
        return NextResponse.json({
            message: "Admin is register error", error
        }, {
            status: 404
        })
    }
}