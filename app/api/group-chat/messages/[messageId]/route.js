import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import GroupChat from '@/models/GroupChat';

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