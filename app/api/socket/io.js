// pages/api/socket/io.js or separate server
import { Server } from "socket.io";

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Join a specific chat room
      socket.on("join_chat", (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined chat: ${chatId}`);
      });

      // Leave a chat room
      socket.on("leave_chat", (chatId) => {
        socket.leave(chatId);
        console.log(`User ${socket.id} left chat: ${chatId}`);
      });

      // Send message to all users in chat except sender
      socket.on("send_message", (data) => {
        socket.to(data.chatId).emit("new_message", data.message);
        console.log(`Message sent to chat: ${data.chatId}`);
      });

      // Update message (for future edit functionality)
      socket.on("update_message", (data) => {
        socket.to(data.chatId).emit("message_updated", data.updatedMessage);
        console.log(`Message updated in chat: ${data.chatId}`);
      });

      // Delete message - broadcast to all users in chat
      socket.on("delete_message", (data) => {
        socket.to(data.chatId).emit("message_deleted", data.messageId);
        console.log(`Message deleted from chat: ${data.chatId}, Message ID: ${data.messageId}`);
      });

      // Typing indicators
      socket.on("typing_start", (data) => {
        socket.to(data.chatId).emit("user_typing", {
          userId: socket.id,
          userName: data.userName
        });
      });

      socket.on("typing_stop", (data) => {
        socket.to(data.chatId).emit("user_stop_typing", {
          userId: socket.id
        });
      });

      // Call functionality (if needed in future)
      socket.on("start_call", (data) => {
        socket.to(data.chatId).emit("incoming_call", data);
      });

      socket.on("answer_call", (data) => {
        socket.to(data.chatId).emit("call_accepted", data);
      });

      socket.on("reject_call", (data) => {
        socket.to(data.chatId).emit("call_rejected", data);
      });

      socket.on("leave_call", (data) => {
        socket.to(data.chatId).emit("user_left_call", data);
      });

      socket.on("end_call", (data) => {
        socket.to(data.chatId).emit("call_ended", data);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });

      // Error handling
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    });
  }
  res.end();
};

export default ioHandler;