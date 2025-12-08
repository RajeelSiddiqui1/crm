import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import GroupChat from "@/models/GroupChat";
import FormSubmission from "@/models/FormSubmission";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";

// Email template for new group chat
export function newGroupChatEmailTemplate({ recipientName, chatName, taskTitle, link }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        <h2 style="color: #333; text-align:center;">New Group Chat Created</h2>
        <p>Hi <b>${recipientName}</b>,</p>
        <p>A new group chat <b>${chatName}</b> has been created for the task: <b>${taskTitle}</b>.</p>
        <div style="text-align:center; margin-top:20px;">
          <a href="${link}" style="background:#4a6cf7; color:white; padding:12px 25px; border-radius:6px; text-decoration:none;">View Chat</a>
        </div>
        <p style="margin-top:20px; font-size:12px; color:#777; text-align:center;">You are receiving this email because you are a participant in this chat.</p>
      </div>
    </div>
  `;
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId } = await req.json();

    if (!submissionId) return NextResponse.json({ error: "Submission ID required" }, { status: 400 });

    // Fetch submission with all participants
    const submission = await FormSubmission.findById(submissionId)
      .populate("formId")
      .populate("submittedBy")      // Manager
      .populate("assignedTo")       // TeamLead
      .populate("assignedEmployees.employeeId");

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // Check if chat already exists
    const existingChat = await GroupChat.findOne({ submissionId });
    if (existingChat) return NextResponse.json({ chat: existingChat, message: "Group chat already exists" });

    // Build participants array
    const participants = [];

    // Add current user
    participants.push({
      userId: session.user.id,
      userModel: session.user.role,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    });

    // Manager
    if (submission.submittedBy && submission.submittedBy._id.toString() !== session.user.id) {
      participants.push({
        userId: submission.submittedBy._id,
        userModel: "Manager",
        email: submission.submittedBy.email,
        name: `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`,
        role: "Manager"
      });
    }

    // TeamLead
    if (submission.assignedTo && submission.assignedTo._id.toString() !== session.user.id) {
      participants.push({
        userId: submission.assignedTo._id,
        userModel: "TeamLead",
        email: submission.assignedTo.email,
        name: `${submission.assignedTo.firstName} ${submission.assignedTo.lastName}`,
        role: "TeamLead"
      });
    }

    // Employees
    if (submission.assignedEmployees && submission.assignedEmployees.length > 0) {
      submission.assignedEmployees.forEach(emp => {
        if (emp.employeeId._id.toString() !== session.user.id) {
          participants.push({
            userId: emp.employeeId._id,
            userModel: "Employee",
            email: emp.employeeId.email,
            name: `${emp.employeeId.firstName} ${emp.employeeId.lastName}`,
            role: "Employee"
          });
        }
      });
    }

    // Remove duplicates by email
    const uniqueParticipants = participants.filter((p, i, arr) =>
      i === arr.findIndex(el => el.email === p.email)
    );

    // Create group chat
    const groupChat = new GroupChat({
      submissionId,
      participants: uniqueParticipants,
      messages: [],
      lastActivity: new Date()
    });

    await groupChat.save();

    // Send notifications and emails to other participants
    const taskTitle = submission.formId?.title || "Task Chat";
    const chatName = `${taskTitle} Discussion`;
    const taskLink = `${process.env.NEXT_PUBLIC_BASE_URL}/tasks/${submissionId}/chat`;

    const userModelMap = {
      'Admin': Admin,
      'Manager': Manager,
      'TeamLead': TeamLead,
      'Employee': Employee
    };

    const notificationPromises = uniqueParticipants.map(async participant => {
      if (participant.email.toLowerCase() === session.user.email.toLowerCase()) return;

      // Send in-app notification
      notificationPromises.push(
        sendNotification({
          senderId: session.user.id,
          senderModel: session.user.role,
          senderName: session.user.name,
          receiverId: participant.userId,
          receiverModel: participant.userModel,
          type: "new_group_chat",
          title: "New Group Chat Created",
          message: `You have been added to the chat: ${chatName}`,
          link: `/tasks/${submissionId}/chat`,
          referenceId: groupChat._id,
          referenceModel: "GroupChat"
        })
      );

      // Send email notification
      const Model = userModelMap[participant.userModel];
      if (Model) {
        const user = await Model.findOne({ email: participant.email });
        if (user && user.email) {
          const emailHTML = newGroupChatEmailTemplate({
            recipientName: participant.name || user.firstName || participant.email,
            chatName,
            taskTitle,
            link: taskLink
          });
          notificationPromises.push(sendMail(user.email, `New Group Chat: ${chatName}`, emailHTML));
        }
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      chat: groupChat,
      message: "Group chat created successfully",
      notificationsSent: uniqueParticipants.length - 1
    });

  } catch (error) {
    console.error("Error creating group chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submissionId');
    if (!submissionId) return NextResponse.json({ error: "Submission ID required" }, { status: 400 });

    const groupChat = await GroupChat.findOne({ submissionId })
      .populate('messages.senderId')
      .populate('messages.replyTo')
      .sort({ 'messages.createdAt': 1 });

    if (!groupChat) return NextResponse.json({ error: "Group chat not found" }, { status: 404 });

    // Check if user is participant
    const isParticipant = groupChat.participants.some(p => p.email === session.user.email);
    if (!isParticipant) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    return NextResponse.json({ chat: groupChat });

  } catch (error) {
    console.error("Error fetching group chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
