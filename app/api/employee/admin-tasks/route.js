import { NextResponse } from "next/server";
import AdminTask2 from "@/models/AdminTask2";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "Employee") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }


        const employeeId = session.user.id;


        const tasks = await AdminTask2.find({
            $or: [
                { "employees.employeeId": employeeId },
                { "teamleads.teamleadId": employeeId },
                { "sharedTo": employeeId }
            ]
        })
            .populate({
                path: "teamleads.teamleadId",
                select: "name email",
            })
            .populate({
                path: "employees.employeeId",
                select: "name email",
            })
            .populate({
                path: "sharedBY",
                select: "name email", // 👈 safe
            })
            .populate({
                path: "departments",
                select: "name",
            })
            .sort({ createdAt: -1 });

        return NextResponse.json(tasks, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
