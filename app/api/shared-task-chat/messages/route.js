import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import SharedTaskChat from "@/models/SharedTaskChat";
import SharedTask from "@/models/SharedTask";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sendNotification } from "@/lib/sendNotification";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";

// Check user access to shared task
async function checkUserAccessToSharedTask(sharedTaskId, user) {
  if (!user || !sharedTaskId) return false;
  
  const sharedTask = await SharedTask.findById(sharedTaskId).lean();
  if (!sharedTask) return false;
  
  const userModel = user.role;
  const userId = user.id;
  
  if (userModel === 'Admin') return true;
  
  if (userModel === 'Manager') {
    if (sharedTask.sharedBy?.toString() === userId) return true;
    if (sharedTask.sharedManager?.toString() === userId) return true;
  }
  
  if (userModel === 'TeamLead') {
    if (sharedTask.sharedTeamlead?.toString() === userId) return true;
    if (sharedTask.sharedOperationTeamlead?.toString() === userId) return true;
  }
  
  if (userModel === 'Employee') {
    if (sharedTask.sharedEmployee?.toString() === userId) return true;
    if (sharedTask.sharedOperationEmployee?.toString() === userId) return true;
  }
  
  return false;
}

async function getUserByEmail(email) {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  const admin = await Admin.findOne({ email: normalizedEmail });
  if (admin) return admin;
  
  const manager = await Manager.findOne({ email: normalizedEmail });
  if (manager) return manager;
  
  const teamLead = await TeamLead.findOne({ email: normalizedEmail });
  if (teamLead) return teamLead;
  
  const employee = await Employee.findOne({ email: normalizedEmail });
  return employee;
}

function getUserName(user) {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

function getUserRole(user) {
  const modelName = user.constructor.modelName;
  switch (modelName) {
    case 'Admin': return 'Admin';
    case 'Manager': return 'Manager';
    case 'TeamLead': return 'Team Lead';
    case 'Employee': return 'Employee';
    default: return 'User';
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sharedTaskId, content, attachment, voiceMessage, replyTo } = await req.json();

    if (!sharedTaskId) {
      return NextResponse.json({ error: "Shared Task ID required" }, { status: 400 });
    }

    if (!content?.trim() && !attachment && !voiceMessage) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    // Check if user has access to this shared task
    const hasAccess = await checkUserAccessToSharedTask(sharedTaskId, session.user);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied",
        message: "You don't have permission to access this shared task" 
      }, { status: 403 });
    }

    const sharedTaskChat = await SharedTaskChat.findOne({ sharedTaskId });

    if (!sharedTaskChat) {
      return NextResponse.json({ error: "Task chat not found" }, { status: 404 });
    }

    // Check if user is participant
    const participant = sharedTaskChat.participants.find(
      p => p.email?.toLowerCase() === session.user.email?.toLowerCase()
    );

    if (!participant) {
      // Add user to participants if they have access but not in participants
      const currentUser = await getUserByEmail(session.user.email);
      if (currentUser) {
        sharedTaskChat.participants.push({
          userId: currentUser._id,
          userModel: currentUser.constructor.modelName,
          email: currentUser.email,
          name: getUserName(currentUser),
          role: getUserRole(currentUser),
          department: currentUser.department,
          joinedAt: new Date(),
          isActive: true
        });
        
        await sharedTaskChat.save();
      } else {
        return NextResponse.json({ error: "You are not a participant in this chat" }, { status: 403 });
      }
    }

    const finalParticipant = participant || sharedTaskChat.participants[sharedTaskChat.participants.length - 1];

    const newMessage = {
      senderId: finalParticipant.userId,
      senderModel: finalParticipant.userModel,
      senderName: finalParticipant.name,
      senderEmail: finalParticipant.email,
      content: content?.trim() || '',
      attachment: attachment || null,
      voiceMessage: voiceMessage || null,
      replyTo: replyTo || null,
      readBy: [{
        userId: finalParticipant.userId,
        readAt: new Date()
      }],
      createdAt: new Date()
    };

    sharedTaskChat.messages.push(newMessage);
    sharedTaskChat.lastActivity = new Date();
    await sharedTaskChat.save();

    const savedMessage = sharedTaskChat.messages[sharedTaskChat.messages.length - 1];
    const messageId = savedMessage._id;

    // Populate message
    const populatedMessage = {
      ...savedMessage.toObject(),
      _id: messageId,
      senderId: {
        _id: finalParticipant.userId,
        firstName: finalParticipant.name?.split(' ')[0] || '',
        lastName: finalParticipant.name?.split(' ')[1] || '',
        email: finalParticipant.email,
        department: finalParticipant.department
      }
    };

    // Send notifications
    const otherParticipants = sharedTaskChat.participants.filter(
      p => p.userId.toString() !== finalParticipant.userId.toString()
    );

    const notificationPromises = otherParticipants.map(async (p) => {
      try {
        await sendNotification({
          senderId: finalParticipant.userId,
          senderModel: finalParticipant.userModel,
          senderName: finalParticipant.name,
          receiverId: p.userId,
          receiverModel: p.userModel,
          type: "new_shared_task_message",
          title: "New Message in Task Chat",
          message: content ? content.substring(0, 100) : "Sent an attachment",
          link: `/shared-task-chat?sharedTaskId=${sharedTaskId}#message-${messageId}`,
          referenceId: messageId,
          referenceModel: "Message"
        });
      } catch (error) {
        console.error(`Failed to send notification to ${p.email}:`, error);
      }
    });

    await Promise.allSettled(notificationPromises);

    return NextResponse.json({ 
      success: true,
      message: populatedMessage
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message", details: error.message },
      { status: 500 }
    );
  }
}