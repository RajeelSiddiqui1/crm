// app/api/notification/seen/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    
    const userId = session.user.id;
    const userRole = session.user.role;

    if (notificationId) {
      // Mark single notification as seen by this user only
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          "receiver.id": userId,
          "receiver.model": userRole,
          "seenBy.userId": { $ne: userId } // Only if not already seen by this user
        },
        { 
          $addToSet: { 
            seenBy: {
              userId: userId,
              userRole: userRole,
              seenAt: new Date()
            }
          },
          $set: { 
            seen: true 
          } 
        }
      );
      
      return NextResponse.json({ 
        success: true, 
        message: "Notification marked as seen" 
      });
    } else {
      // Mark all notifications as seen by this user only
      const result = await Notification.updateMany(
        {
          "receiver.id": userId,
          "receiver.model": userRole,
          "seenBy.userId": { $ne: userId } // Not seen by this user
        },
        { 
          $addToSet: { 
            seenBy: {
              userId: userId,
              userRole: userRole,
              seenAt: new Date()
            }
          },
          $set: { 
            seen: true 
          } 
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: "All notifications marked as seen",
        updatedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.log("Notification Seen Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}