import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import GroupChat from "@/models/GroupChat";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";

// Helper to get full sender info
async function getSenderInfo(sessionUser) {
  const roleModelMap = {
    Admin: Admin,
    Manager: Manager,
    TeamLead: TeamLead,
    Employee: Employee,
  };

  const Model = roleModelMap[sessionUser.role];
  if (!Model) return null;

  const user = await Model.findById(sessionUser.id).lean();
  if (!user) return null;

  return {
    userId: user._id,
    userModel: sessionUser.role,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || user.email.split('@')[0],
    email: user.email,
    department: user.department || null,
  };
}

// Email template
function newMessageEmailTemplate({ recipientName, senderName, messageContent, link }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f2f5;">
      <div style="max-width: 480px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">New Message from ${senderName}</h2>
        <p style="color: #555;">Hi ${recipientName},</p>
        <p style="color: #555;">You have received a new message in the group chat:</p>
        <blockquote style="border-left: 4px solid #4a6cf7; padding-left: 12px; color: #333; font-style: italic;">
          ${messageContent || "<i>Attachment or voice message</i>"}
        </blockquote>
        <a href="${link}" style="display: inline-block; margin-top: 20px; background: #4a6cf7; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none;">View Chat</a>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">This is an automated email notification.</p>
      </div>
    </div>
  `;
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, content, attachment, voiceMessage, replyTo } = await req.json();
    if (!submissionId) return NextResponse.json({ error: "Submission ID required" }, { status: 400 });
    if (!content?.trim() && !attachment && !voiceMessage) return NextResponse.json({ error: "Message content required" }, { status: 400 });

    const groupChat = await GroupChat.findOne({ submissionId });
    if (!groupChat) return NextResponse.json({ error: "Group chat not found" }, { status: 404 });

    // Check if user is participant
    const participant = groupChat.participants.find(
      p => p.email?.toLowerCase() === session.user.email?.toLowerCase()
    );
    if (!participant) return NextResponse.json({ error: "You are not a participant in this chat" }, { status: 403 });

    // Get full sender info from DB
    const senderInfo = await getSenderInfo(session.user);
    if (!senderInfo) return NextResponse.json({ error: "Sender not found" }, { status: 404 });

    // Create message
    const newMessage = {
      senderId: senderInfo.userId,
      senderModel: senderInfo.userModel,
      senderName: senderInfo.name,
      senderEmail: senderInfo.email,
      content: content?.trim() || "",
      attachment: attachment || null,
      voiceMessage: voiceMessage || null,
      replyTo: replyTo || null,
      readBy: [{ userId: senderInfo.userId, readAt: new Date() }],
      createdAt: new Date(),
    };

    groupChat.messages.push(newMessage);
    groupChat.lastActivity = new Date();
    await groupChat.save();

    const savedMessage = groupChat.messages[groupChat.messages.length - 1];

    // Populate message for response
    const populatedMessage = { ...savedMessage.toObject(), _id: savedMessage._id, senderId: senderInfo };

    // Notify and send email to other participants in parallel
    const otherParticipants = groupChat.participants.filter(
      p => p.userId.toString() !== senderInfo.userId.toString()
    );

    const notificationAndEmailPromises = otherParticipants.map(async (p) => {
      const chatLink = `/group-chat?submissionId=${submissionId}#message-${savedMessage._id}`;
      try {
        // Notification
        const notifyPromise = sendNotification({
          senderId: senderInfo.userId,
          senderModel: senderInfo.userModel,
          senderName: senderInfo.name,
          receiverId: p.userId,
          receiverModel: p.userModel,
          type: "new_message",
          title: "New Message in Group Chat",
          message: content ? content.substring(0, 100) : "Sent an attachment",
          link: chatLink,
          referenceId: savedMessage._id,
          referenceModel: "Message"
        });

        // Email
        const emailHtml = newMessageEmailTemplate({
          recipientName: p.name,
          senderName: senderInfo.name,
          messageContent: content,
          link: chatLink
        });
        const mailPromise = sendMail(p.email, `📩 New Message from ${senderInfo.name}`, emailHtml);

        await Promise.all([notifyPromise, mailPromise]);
      } catch (error) {
        console.error(`Failed to notify/email ${p.email}:`, error);
      }
    });

    await Promise.allSettled(notificationAndEmailPromises);

    return NextResponse.json({ success: true, message: populatedMessage });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message", details: error.message }, { status: 500 });
  }
}
