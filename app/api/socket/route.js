import { Server } from 'socket.io';

export const dynamic = 'force-dynamic';

let io;

export async function GET(req) {
  if (io) {
    return new Response('Socket is already running', { status: 200 });
  }

  return new Response('Socket endpoint', { status: 200 });
}

export async function POST(req) {
  if (!io) {
    const httpServer = global.httpServer;
    if (!httpServer) {
      return new Response('HTTP server not available', { status: 500 });
    }

    io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    const connectedUsers = new Map();

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Authentication
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      const userId = socket.handshake.query.userId;
      if (userId) {
        socket.join(`user:${userId}`);
        connectedUsers.set(socket.id, userId);
        console.log(`User ${userId} connected as socket ${socket.id}`);

        socket.emit('connected', {
          userId,
          socketId: socket.id,
          timestamp: new Date()
        });
      }

      // Join chat room
      socket.on('join_chat', (chatId) => {
        socket.join(`chat:${chatId}`);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
        
        socket.emit('chat_info', {
          chatId,
          timestamp: new Date()
        });

        socket.to(`chat:${chatId}`).emit('user_joined', {
          userId,
          socketId: socket.id,
          timestamp: new Date()
        });
      });

      // Send message
      socket.on('send_message', (data) => {
        const { chatId, message } = data;
        
        socket.to(`chat:${chatId}`).emit('new_message', message);
        socket.emit('message_sent', {
          messageId: message._id,
          timestamp: new Date()
        });
      });

      // Update message
      socket.on('update_message', (data) => {
        const { chatId, messageId, updatedMessage } = data;
        
        socket.to(`chat:${chatId}`).emit('message_updated', {
          messageId,
          updatedMessage,
          updatedAt: new Date()
        });
      });

      // Delete message
      socket.on('delete_message', (data) => {
        const { chatId, messageId } = data;
        
        socket.to(`chat:${chatId}`).emit('message_deleted', {
          messageId,
          deletedAt: new Date()
        });
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

      // Get online users
      socket.on('get_online_users', (chatId) => {
        const chatRoom = io.sockets.adapter.rooms.get(`chat:${chatId}`);
        const onlineUsers = [];
        
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
          io.emit('user_offline', { userId });
        }
      });
    });
  }

  return new Response('Socket initialized', { status: 200 });
}