import mongoose from "mongoose";
import { NextResponse } from "next/server";

export default async function dbConnect() {
    try {
        if (mongoose.connection.readyState >= 1) {
            return NextResponse.json({
                message: "Mongodb is already connected"
            },
                {
                    status: 400
                })
        }
        await mongoose.connect(process.env.MONGODB_URI)

        return NextResponse.json({
            message: "Mongodb connected successfully"
        },
            {
                status: 200
            })

    }
    catch (error) {
        return NextResponse.json({
            message: "error to connect Mongodb"
        },
            {
                status: 404
            })
    }
}