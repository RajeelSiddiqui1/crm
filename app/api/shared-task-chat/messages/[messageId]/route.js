import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import SharedTaskChat from "@/models/SharedTaskChat";
import SharedTask from "@/models/SharedTask";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

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

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { messageId } = params;
    const { content, attachment, voiceMessage, sharedTaskId } = await req.json();

    if (!messageId || !sharedTaskId) {
      return NextResponse.json({ error: 'Message ID and Shared Task ID required' }, { status: 400 });
    }

    // Check if user has access to this shared task
    const hasAccess = await checkUserAccessToSharedTask(sharedTaskId, session.user);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied",
        message: "You don't have permission to access this shared task" 
      }, { status: 403 });
    }

    // Find chat with message
    const sharedTaskChat = await SharedTaskChat.findOne({ 
      sharedTaskId,
      'messages._id': messageId 
    });

    if (!sharedTaskChat) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Find message
    const message = sharedTaskChat.messages.id(messageId);
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is sender
    if (message.senderEmail !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized to edit this message' }, { status: 403 });
    }

    // Update content
    if (content !== undefined) {
      message.content = content;
    }

    // Handle file replacement
    if (attachment && message.attachment?.public_id) {
      try {
        await cloudinary.uploader.destroy(message.attachment.public_id, {
          resource_type: attachment.fileType?.startsWith('image/') ? 'image' : 
                       attachment.fileType?.startsWith('video/') ? 'video' : 'raw'
        });
      } catch (error) {
        console.error('Error deleting old file from Cloudinary:', error);
      }
      message.attachment = attachment;
    }

    // Handle voice message replacement
    if (voiceMessage && message.voiceMessage?.public_id) {
      try {
        await cloudinary.uploader.destroy(message.voiceMessage.public_id, {
          resource_type: 'raw'
        });
      } catch (error) {
        console.error('Error deleting old audio from Cloudinary:', error);
      }
      message.voiceMessage = voiceMessage;
    }

    message.updatedAt = new Date();
    message.isEdited = true;
    sharedTaskChat.lastActivity = new Date();
    
    await sharedTaskChat.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Message updated successfully',
      updatedMessage: message
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { messageId } = params;
    const { searchParams } = new URL(req.url);
    const sharedTaskId = searchParams.get('sharedTaskId');

    if (!messageId || !sharedTaskId) {
      return NextResponse.json({ error: 'Message ID and Shared Task ID required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Task chat not found' }, { status: 404 });
    }

    const message = sharedTaskChat.messages.id(messageId);
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check permissions
    const canDelete = 
      message.senderEmail === session.user.email ||  // Own message
      session.user.role === 'Admin' ||               // Admin
      (session.user.role === 'Manager' && 
       (sharedTaskChat.participants.some(p => 
         p.userId.toString() === session.user.id && p.userModel === 'Manager'
       ))) ||                                        // Manager in the chat
      (session.user.role === 'TeamLead' && 
       (sharedTaskChat.participants.some(p => 
         p.userId.toString() === session.user.id && p.userModel === 'TeamLead'
       )));                                          // Team Lead in the chat

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'Not authorized to delete this message',
        message: 'You need to be the message sender, Admin, Manager, or Team Lead to delete messages' 
      }, { status: 403 });
    }

    // Delete files from Cloudinary
    try {
      if (message.attachment?.public_id) {
        const resourceType = message.attachment.fileType?.startsWith('image/') ? 'image' : 
                           message.attachment.fileType?.startsWith('video/') ? 'video' : 'raw';
        await cloudinary.uploader.destroy(message.attachment.public_id, {
          resource_type: resourceType
        });
      }

      if (message.voiceMessage?.public_id) {
        await cloudinary.uploader.destroy(message.voiceMessage.public_id, {
          resource_type: 'raw'
        });
      }
    } catch (error) {
      console.error('Error deleting files from Cloudinary:', error);
    }

    // Remove message
    sharedTaskChat.messages.pull({ _id: messageId });
    sharedTaskChat.lastActivity = new Date();
    
    await sharedTaskChat.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}