// app/api/notification/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Get notifications for this specific user
    const notifications = await Notification.find({
      "receiver.id": userId,
      "receiver.model": userRole,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Calculate unseen count for this user only
    const unseenCount = await Notification.countDocuments({
      "receiver.id": userId,
      "receiver.model": userRole,
      "seenBy.userId": { $ne: userId } // Not seen by this user
    });

    return NextResponse.json(
      { 
        success: true, 
        notifications, 
        unseenCount 
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Notification GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}