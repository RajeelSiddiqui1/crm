import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Employee from "@/models/Employee";
import { getServerSession } from "next-auth";
import Department from "@/models/Department";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== "Employee") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }



        const employees = await Employee.find({})
            .select("firstName lastName email profilePic depId")
            .populate({
                path: "depId",
                select: "name"
            })
            .sort({ createdAt: -1 })

        return NextResponse.json(employees, { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}