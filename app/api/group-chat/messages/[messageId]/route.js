import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import GroupChat from "@/models/GroupChat";
import FormSubmission from "@/models/FormSubmission";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { editMessageEmailTemplate } from "@/helper/emails/group-chat/editMessage";
import { deleteMessageEmailTemplate } from "@/helper/emails/group-chat/deleteMessage";

// Same helper: get sender info
async function getSenderInfo(sessionUser) {
  const roleModelMap = { Admin, Manager, TeamLead, Employee };
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

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { messageId } = params;
    const { content, attachment, voiceMessage, submissionId } = await req.json();
    if (!messageId || !submissionId) return NextResponse.json({ error: 'Message ID and Submission ID required', status: 400 });

    const senderInfo = await getSenderInfo(session.user);
    if (!senderInfo) return NextResponse.json({ error: 'Sender not found', status: 404 });

    const groupChat = await GroupChat.findOne({ submissionId, 'messages._id': messageId });
    if (!groupChat) return NextResponse.json({ error: 'Message not found', status: 404 });

    const message = groupChat.messages.id(messageId);
    if (!message) return NextResponse.json({ error: 'Message not found', status: 404 });
    if (message.senderEmail !== session.user.email) return NextResponse.json({ error: 'Not authorized to edit this message', status: 403 });

    if (content !== undefined) message.content = content;

    if (attachment && message.attachment?.public_id) {
      await cloudinary.uploader.destroy(message.attachment.public_id);
      message.attachment = attachment;
    }
    if (voiceMessage && message.voiceMessage?.public_id) {
      await cloudinary.uploader.destroy(message.voiceMessage.public_id);
      message.voiceMessage = voiceMessage;
    }

    message.updatedAt = new Date();
    message.isEdited = true;
    groupChat.lastActivity = new Date();
    await groupChat.save();

    // Notify & email
    const otherParticipants = groupChat.participants.filter(p => p.userId.toString() !== senderInfo.userId.toString());
    const promises = otherParticipants.map(p => {
      const link = `/group-chat?submissionId=${submissionId}#message-${message._id}`;
      return Promise.all([
        sendNotification({
          senderId: senderInfo.userId,
          senderModel: senderInfo.userModel,
          senderName: senderInfo.name,
          receiverId: p.userId,
          receiverModel: p.userModel,
          type: 'edit_message',
          title: 'Message Edited',
          message: content?.substring(0,100) || "Attachment/Voice message updated",
          link,
          referenceId: message._id,
          referenceModel: 'Message'
        }),
        sendMail(p.email, `✏️ Message Edited by ${senderInfo.name}`, editMessageEmailTemplate({
          recipientName: p.name,
          senderName: senderInfo.name,
          messageContent: content,
          link
        }))
      ]);
    });
    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, updatedMessage: message });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}




export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { messageId } = params;
    const submissionId = new URL(req.url).searchParams.get('submissionId');
    if (!messageId || !submissionId) return NextResponse.json({ error: 'Message ID and Submission ID required', status: 400 });

    const senderInfo = await getSenderInfo(session.user);
    if (!senderInfo) return NextResponse.json({ error: 'Sender not found', status: 404 });

    const groupChat = await GroupChat.findOne({ submissionId });
    if (!groupChat) return NextResponse.json({ error: 'Group chat not found', status: 404 });

    const message = groupChat.messages.id(messageId);
    if (!message) return NextResponse.json({ error: 'Message not found', status: 404 });

    const canDelete = message.senderEmail === session.user.email || session.user.role === 'Admin';
    if (!canDelete) return NextResponse.json({ error: 'Not authorized to delete this message', status: 403 });

    // Delete files
    if (message.attachment?.public_id) await cloudinary.uploader.destroy(message.attachment.public_id);
    if (message.voiceMessage?.public_id) await cloudinary.uploader.destroy(message.voiceMessage.public_id);

    groupChat.messages.pull({ _id: messageId });
    groupChat.lastActivity = new Date();
    await groupChat.save();

    // Notify & email
    const otherParticipants = groupChat.participants.filter(p => p.userId.toString() !== senderInfo.userId.toString());
    const promises = otherParticipants.map(p => {
      const link = `/group-chat?submissionId=${submissionId}`;
      return Promise.all([
        sendNotification({
          senderId: senderInfo.userId,
          senderModel: senderInfo.userModel,
          senderName: senderInfo.name,
          receiverId: p.userId,
          receiverModel: p.userModel,
          type: 'delete_message',
          title: 'Message Deleted',
          message: 'A message has been deleted in the chat',
          link,
          referenceId: message._id,
          referenceModel: 'Message'
        }),
        sendMail(p.email, `🗑 Message Deleted by ${senderInfo.name}`, deleteMessageEmailTemplate({
          recipientName: p.name,
          senderName: senderInfo.name,
          link
        }))
      ]);
    });
    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
