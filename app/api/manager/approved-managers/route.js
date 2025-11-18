// api/manager/approved-managers/route.js
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({
                success: false,
                message: "Unauthorized access"
            }, { status: 401 });
        }

        await dbConnect();

        // Get all approved managers except current manager
        const managers = await Manager.find({ 
            status: "approved",
            _id: { $ne: session.user.id } // Exclude current manager
        })
        .select("firstName lastName email department status")
        .sort({ firstName: 1 });

        return NextResponse.json({ 
            success: true,
            managers 
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching managers:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error.message
        }, { status: 500 });
    }
}