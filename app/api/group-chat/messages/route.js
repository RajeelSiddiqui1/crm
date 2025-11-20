import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import GroupChat from "@/models/GroupChat";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, content, attachment, voiceMessage, replyTo } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID required" }, { status: 400 });
    }

    if (!content && !attachment && !voiceMessage) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    const groupChat = await GroupChat.findOne({ submissionId });

    if (!groupChat) {
      return NextResponse.json({ error: "Group chat not found" }, { status: 404 });
    }

    const normalizedEmail = session.user.email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Session email not found" }, { status: 500 });
    }

    let participant = groupChat.participants.find(p => {
      let email = "";
      if (typeof p === "string") email = p;
      else if (p.email) email = p.email;
      return email.replace(/^\-?\s*/, '').toLowerCase() === normalizedEmail;
    });

    if (!participant) {
      groupChat.participants.push({
        email: session.user.email,
        userId: session.user.id || null,
        role: session.user.role || "User",
        name: session.user.name || `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
        userModel: session.user.role || "User"
      });
    }

    const newMessage = {
      senderId: session.user.id || null,
      senderModel: session.user.role || "User",
      senderName: session.user.name || `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
      senderEmail: session.user.email,
      content: content || '',
      attachment: attachment || null,
      voiceMessage: voiceMessage || null,
      replyTo: replyTo || null
    };

    groupChat.messages.push(newMessage);
    await groupChat.save();

    const savedMessage = groupChat.messages[groupChat.messages.length - 1];

    return NextResponse.json({ 
      message: savedMessage,
      success: true 
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
