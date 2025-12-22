import { Server } from 'socket.io';
import http from 'http';
import GroupChat from '@/models/GroupChat';
import dbConnect from '@/lib/db';

// Store connected users
const connectedUsers = new Map();

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join user to their personal room
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      connectedUsers.set(socket.id, userId);
      console.log(`User ${userId} connected as socket ${socket.id}`);
    }

    // Join chat room
    socket.on('join_chat', async (chatId) => {
      try {
        await dbConnect();
        const chat = await GroupChat.findById(chatId);
        
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        socket.join(`chat:${chatId}`);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
        
        // Send chat info to user
        socket.emit('chat_info', {
          chatId,
          participants: chat.participants.length,
          lastActivity: chat.lastActivity
        });

        // Notify others in the chat that a user has joined
        socket.to(`chat:${chatId}`).emit('user_joined', {
          userId,
          socketId: socket.id,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, message } = data;
        
        await dbConnect();
        const chat = await GroupChat.findById(chatId);
        
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Broadcast message to chat room (excluding sender)
        socket.to(`chat:${chatId}`).emit('new_message', message);
        
        // Also send to sender for confirmation
        socket.emit('message_sent', {
          messageId: message._id,
          timestamp: new Date()
        });

        // Update last activity
        chat.lastActivity = new Date();
        await chat.save();

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Update message
    socket.on('update_message', async (data) => {
      try {
        const { chatId, messageId, updatedMessage } = data;
        
        // Broadcast update to chat room
        socket.to(`chat:${chatId}`).emit('message_updated', {
          messageId,
          updatedMessage,
          updatedAt: new Date()
        });

      } catch (error) {
        console.error('Error updating message:', error);
        socket.emit('error', { message: 'Failed to update message' });
      }
    });

    // Delete message
    socket.on('delete_message', async (data) => {
      try {
        const { chatId, messageId } = data;
        
        // Broadcast deletion to chat room
        socket.to(`chat:${chatId}`).emit('message_deleted', {
          messageId,
          deletedAt: new Date()
        });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { chatId, userId, isTyping } = data;
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId,
        isTyping,
        timestamp: new Date()
      });
    });

    // Read receipt
    socket.on('message_read', async (data) => {
      try {
        const { chatId, messageId, userId } = data;
        
        await dbConnect();
        const chat = await GroupChat.findById(chatId);
        
        if (chat) {
          const message = chat.messages.id(messageId);
          if (message) {
            const alreadyRead = message.readBy.some(r => r.userId.toString() === userId);
            if (!alreadyRead) {
              message.readBy.push({
                userId,
                readAt: new Date()
              });
              await chat.save();
            }
          }
        }

        // Broadcast read receipt to chat room
        socket.to(`chat:${chatId}`).emit('user_read_message', {
          messageId,
          userId,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Get online status
    socket.on('get_online_users', (chatId) => {
      const onlineUsers = [];
      
      // Get all sockets in the chat room
      const chatRoom = io.sockets.adapter.rooms.get(`chat:${chatId}`);
      
      if (chatRoom) {
        chatRoom.forEach(socketId => {
          const userId = connectedUsers.get(socketId);
          if (userId) {
            onlineUsers.push(userId);
          }
        });
      }
      
      socket.emit('online_users', onlineUsers);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
        console.log(`User ${userId} disconnected`);
        
        // Notify all chats the user was in
        io.emit('user_offline', { userId });
      }
    });
  });

  return io;
}

// Helper function to send notification to specific user
export function sendToUser(userId, event, data) {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}