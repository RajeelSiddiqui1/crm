import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import GroupChat from '@/models/GroupChat';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { messageId } = params;
    const { content, attachment, voiceMessage } = await request.json();

    // Find the group chat that contains this message
    const groupChat = await GroupChat.findOne({
      'messages._id': messageId
    });

    if (!groupChat) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Find the message
    const message = groupChat.messages.id(messageId);
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender
    if (message.senderEmail !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized to edit this message' }, { status: 403 });
    }

    // Update message content
    if (content !== undefined) {
      message.content = content;
    }

    // Handle file replacement - delete old file from Cloudinary
    if (attachment && message.attachment) {
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

    // Handle voice message replacement - delete old audio from Cloudinary
    if (voiceMessage && message.voiceMessage) {
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

    await groupChat.save();

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

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { messageId } = params;

    // Find the group chat that contains this message
    const groupChat = await GroupChat.findOne({
      'messages._id': messageId
    });

    if (!groupChat) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Find the message
    const message = groupChat.messages.id(messageId);
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender or has permission to delete
    const canDelete = 
      message.senderEmail === session.user.email || 
      session.user.role === 'Admin' || 
      session.user.role === 'Manager';

    if (!canDelete) {
      return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 });
    }

    // Delete files from Cloudinary before removing message
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
      // Continue with message deletion even if Cloudinary deletion fails
    }

    // Remove the message
    groupChat.messages.pull({ _id: messageId });
    
    // Save the updated chat
    await groupChat.save();

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