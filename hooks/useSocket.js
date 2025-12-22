"use client";
import { useSocket } from '@/lib/socket-context';

export function useChatSocket(chatId) {
  const { socket, isConnected, onlineUsers } = useSocket();

  const joinChat = () => {
    if (socket && isConnected && chatId) {
      socket.emit('join_chat', chatId);
    }
  };

  const sendMessage = (message) => {
    if (socket && isConnected && chatId) {
      socket.emit('send_message', { chatId, message });
    }
  };

  const updateMessage = (messageId, updatedMessage) => {
    if (socket && isConnected && chatId) {
      socket.emit('update_message', { chatId, messageId, updatedMessage });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket && isConnected && chatId) {
      socket.emit('delete_message', { chatId, messageId });
    }
  };

  const sendTypingIndicator = (isTyping) => {
    if (socket && isConnected && chatId) {
      socket.emit('typing', { 
        chatId, 
        userId: localStorage.getItem('userId'),
        isTyping 
      });
    }
  };

  const getOnlineUsers = () => {
    if (socket && isConnected && chatId) {
      socket.emit('get_online_users', chatId);
    }
  };

  return {
    socket,
    isConnected,
    onlineUsers,
    joinChat,
    sendMessage,
    updateMessage,
    deleteMessage,
    sendTypingIndicator,
    getOnlineUsers
  };
}