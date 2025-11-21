"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Reply,
  Download,
  Play,
  Users,
  FileText,
  Image,
  Video,
  Music,
  X,
  Loader2,
  MessageCircle,
  ArrowLeft,
  Smile,
  Search,
  Trash2,
  Check,
  MoreVertical,
  Edit,
  Trash,
  Save,
  RotateCcw,
  Crown,
  Shield,
  User,
  Star,
} from "lucide-react";
import axios from "axios";
import EmojiPicker from 'emoji-picker-react';

export default function GroupChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  
  const [submissions, setSubmissions] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [uploadingStates, setUploadingStates] = useState({});
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const autoScrollRef = useRef(true);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);
  const menuRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Get message style based on sender role
  const getMessageStyle = (message) => {
    const isOwnMessage = message.senderEmail === session?.user?.email;
    
    if (isOwnMessage) {
      return {
        background: 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/25',
        badge: 'bg-blue-400 text-white',
        text: 'text-blue-100',
        time: 'text-blue-200',
        icon: 'bg-blue-400 text-white'
      };
    }

    // Different styles based on sender role
    switch (message.senderModel) {
      case 'Admin':
        return {
          background: 'bg-gradient-to-r from-purple-600 to-pink-700 text-white shadow-xl shadow-purple-500/25',
          badge: 'bg-purple-400 text-white',
          text: 'text-purple-100',
          time: 'text-purple-200',
          icon: 'bg-purple-400 text-white'
        };
      
      case 'Manager':
        return {
          background: 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-xl shadow-green-500/25',
          badge: 'bg-green-400 text-white',
          text: 'text-green-100',
          time: 'text-green-200',
          icon: 'bg-green-400 text-white'
        };
      
      case 'TeamLead':
        return {
          background: 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xl shadow-orange-500/25',
          badge: 'bg-orange-400 text-white',
          text: 'text-orange-100',
          time: 'text-orange-200',
          icon: 'bg-orange-400 text-white'
        };
      
      case 'Employee':
        return {
          background: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-xl shadow-gray-500/25',
          badge: 'bg-gray-400 text-white',
          text: 'text-gray-100',
          time: 'text-gray-200',
          icon: 'bg-gray-400 text-white'
        };
      
      default:
        return {
          background: 'bg-white text-gray-900 border border-gray-100 shadow-lg',
          badge: 'bg-blue-100 text-blue-600',
          text: 'text-blue-600',
          time: 'text-gray-500',
          icon: 'bg-blue-100 text-blue-600'
        };
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <Crown className="w-3 h-3" />;
      case 'Manager':
        return <Shield className="w-3 h-3" />;
      case 'TeamLead':
        return <Star className="w-3 h-3" />;
      case 'Employee':
        return <User className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'Manager':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'TeamLead':
        return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'Employee':
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Perfect auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current && autoScrollRef.current) {
      const container = messagesContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      if (scrollHeight > clientHeight) {
        container.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // Manual scroll handler
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      autoScrollRef.current = isNearBottom;
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

  // Reset auto-scroll when chat changes
  useEffect(() => {
    if (selectedChat) {
      autoScrollRef.current = true;
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedChat, scrollToBottom]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup recording timer
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    fetchSubmissions();
    
    // Initialize Socket.io
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket"]
    });
    
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [session, status, router]);

  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit("join_chat", selectedChat._id);
      
      socket.on("new_message", (message) => {
        setMessages(prev => [...prev, message]);
        // Auto-scroll when new message arrives
        setTimeout(scrollToBottom, 150);
      });

      socket.on("message_updated", (updatedMessage) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === updatedMessage._id ? updatedMessage : msg
          )
        );
        toast.success("Message updated");
      });

      socket.on("message_deleted", (messageId) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        toast.success("Message deleted");
      });
    }

    return () => {
      if (socket) {
        socket.off("new_message");
        socket.off("message_updated");
        socket.off("message_deleted");
      }
    };
  }, [socket, selectedChat, scrollToBottom]);

  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const filtered = messages.filter(msg => 
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setIsSearching(false);
      setFilteredMessages([]);
    }
  }, [searchQuery, messages]);

  // Delete Message Function
  const deleteMessage = async (messageId) => {
    try {
      const response = await axios.delete(`/api/group-chat/messages/${messageId}`);
      
      if (response.status === 200) {
        // Emit via socket for real-time update
        if (socket) {
          socket.emit("delete_message", {
            chatId: selectedChat._id,
            messageId: messageId
          });
        }
        
        setMenuOpen(null);
        toast.success("Message deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Edit Message Function
  const startEditing = (message) => {
    setEditingMessage(message._id);
    setEditContent(message.content || "");
    setMenuOpen(null);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const saveEdit = async (messageId) => {
    if (!editContent.trim()) return;

    try {
      const response = await axios.put(`/api/group-chat/messages/${messageId}`, {
        content: editContent
      });

      if (response.status === 200) {
        // Emit via socket for real-time update
        if (socket) {
          socket.emit("update_message", {
            chatId: selectedChat._id,
            messageId: messageId,
            updatedMessage: response.data.updatedMessage
          });
        }

        setEditingMessage(null);
        setEditContent("");
        toast.success("Message updated successfully");
      }
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  // Replace File/Audio in Message
  const handleReplaceFile = async (event, message) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingStates(prev => ({ ...prev, [message._id]: true }));

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64File = reader.result.split(',')[1];
        
        const response = await axios.post('/api/upload-file', {
          file: base64File,
          filename: file.name,
          fileType: file.type,
          folder: 'chat_attachments'
        });

        if (response.data.success) {
          const attachment = {
            url: response.data.secure_url,
            filename: file.name,
            fileType: file.type,
            fileSize: file.size,
            public_id: response.data.public_id
          };

          // Update message with new file
          const updateResponse = await axios.put(`/api/group-chat/messages/${message._id}`, {
            attachment
          });

          if (updateResponse.status === 200) {
            // Emit via socket for real-time update
            if (socket) {
              socket.emit("update_message", {
                chatId: selectedChat._id,
                messageId: message._id,
                updatedMessage: updateResponse.data.updatedMessage
              });
            }

            toast.success("File updated successfully");
          }
        }
      };

    } catch (error) {
      console.error("Error replacing file:", error);
      toast.error("Failed to replace file");
    } finally {
      setUploadingStates(prev => ({ ...prev, [message._id]: false }));
    }
  };

  // Replace Voice Message
  const handleReplaceVoiceMessage = async (message) => {
    try {
      setUploadingStates(prev => ({ ...prev, [message._id]: true }));
      await startRecordingForEdit(message);
    } catch (error) {
      console.error("Error replacing voice message:", error);
      toast.error("Failed to replace voice message");
      setUploadingStates(prev => ({ ...prev, [message._id]: false }));
    }
  };

  // WhatsApp-style Audio Recording Functions
  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      audioStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setRecordingTime(0);
      setShowRecordingUI(true);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        
        // Stop all audio tracks
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }

        // Only upload if recording was not cancelled and has duration
        if (recordingTime > 1 && audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await uploadVoiceMessage(audioBlob);
        }
      };

      recorder.start(1000); // Collect data every second
      setRecording(true);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Microphone access denied or not available");
      setShowRecordingUI(false);
    }
  };

  // Special recording function for editing
  const startRecordingForEdit = async (message) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      audioStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setRecordingTime(0);
      setShowRecordingUI(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }

        if (recordingTime > 1 && audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await uploadVoiceMessageForEdit(audioBlob, message);
        }
      };

      recorder.start(1000);
      setRecording(true);
      
    } catch (error) {
      console.error("Error starting recording for edit:", error);
      toast.error("Microphone access denied or not available");
      setShowRecordingUI(false);
      setUploadingStates(prev => ({ ...prev, [message._id]: false }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setShowRecordingUI(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setShowRecordingUI(false);
      setRecordingTime(0);
      setAudioChunks([]);
      
      // Clean up
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const submitRecording = () => {
    stopRecording();
  };

  const uploadVoiceMessage = async (audioBlob) => {
    try {
      setLoading(true);
      
      // Convert blob to base64 for Cloudinary
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        const response = await axios.post('/api/upload-audio', {
          audio: base64Audio,
          folder: 'chat_voice_messages'
        });

        if (response.data.success) {
          const voiceMessage = {
            url: response.data.secure_url,
            duration: recordingTime,
            filename: `voice-message-${Date.now()}.webm`,
            public_id: response.data.public_id
          };

          await axios.post("/api/group-chat/messages", {
            submissionId: selectedChat.submissionId,
            voiceMessage
          });

          toast.success("Voice message sent");
        }
      };

    } catch (error) {
      console.error("Error uploading voice message:", error);
      toast.error("Failed to send voice message");
    } finally {
      setLoading(false);
    }
  };

  const uploadVoiceMessageForEdit = async (audioBlob, message) => {
    try {
      // Convert blob to base64 for Cloudinary
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        const response = await axios.post('/api/upload-audio', {
          audio: base64Audio,
          folder: 'chat_voice_messages'
        });

        if (response.data.success) {
          const voiceMessage = {
            url: response.data.secure_url,
            duration: recordingTime,
            filename: `voice-message-${Date.now()}.webm`,
            public_id: response.data.public_id
          };

          // Update message with new voice message
          const updateResponse = await axios.put(`/api/group-chat/messages/${message._id}`, {
            voiceMessage
          });

          if (updateResponse.status === 200) {
            // Emit via socket for real-time update
            if (socket) {
              socket.emit("update_message", {
                chatId: selectedChat._id,
                messageId: message._id,
                updatedMessage: updateResponse.data.updatedMessage
              });
            }

            toast.success("Voice message updated successfully");
          }
        }
      };

    } catch (error) {
      console.error("Error updating voice message:", error);
      toast.error("Failed to update voice message");
    } finally {
      setUploadingStates(prev => ({ ...prev, [message._id]: false }));
    }
  };

  // Format recording time to MM:SS
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Chat Functions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      
      switch (session?.user?.role) {
        case "Admin":
          endpoint = "/api/admin/submissions";
          break;
        case "Manager":
          endpoint = `/api/manager/submissions?departmentId=${session.user.depId}`;
          break;
        case "TeamLead":
          endpoint = "/api/teamlead/tasks";
          break;
        case "Employee":
          endpoint = "/api/employee/tasks";
          break;
        default:
          return;
      }

      const response = await axios.get(endpoint);
      if (response.status === 200) {
        setSubmissions(response.data || []);
        
        // Auto-select if submissionId is provided
        if (submissionId) {
          const submission = response.data.find(s => s._id === submissionId);
          if (submission) {
            handleSelectSubmission(submission);
          }
        } else if (response.data.length > 0) {
          // Auto-select first submission
          handleSelectSubmission(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubmission = async (submission) => {
    try {
      setLoading(true);
      
      // Create or get group chat
      const response = await axios.post("/api/group-chat", {
        submissionId: submission._id
      });

      if (response.status === 200) {
        setSelectedChat(response.data.chat);
        setMessages(response.data.chat.messages || []);
        
        // Join socket room
        if (socket) {
          socket.emit("join_chat", response.data.chat._id);
        }

        // Reset auto-scroll and scroll to bottom
        autoScrollRef.current = true;
        setTimeout(() => {
          scrollToBottom();
        }, 500);
      }
    } catch (error) {
      console.error("Error selecting chat:", error);
      toast.error("Failed to load group chat");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !replyingTo) return;

    try {
      const messageData = {
        submissionId: selectedChat.submissionId,
        content: newMessage,
        replyTo: replyingTo?._id
      };

      const response = await axios.post("/api/group-chat/messages", messageData);

      if (response.status === 200) {
        setNewMessage("");
        setReplyingTo(null);
        setShowEmojiPicker(false);
        
        // Emit via socket
        if (socket) {
          socket.emit("send_message", {
            chatId: selectedChat._id,
            message: response.data.message
          });
        }

        // Ensure auto-scroll is enabled and scroll to bottom
        autoScrollRef.current = true;
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      // Show uploading animation
      toast.loading("Uploading file...");

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64File = reader.result.split(',')[1];
        
        const response = await axios.post('/api/upload-file', {
          file: base64File,
          filename: file.name,
          fileType: file.type,
          folder: 'chat_attachments'
        });

        if (response.data.success) {
          const attachment = {
            url: response.data.secure_url,
            filename: file.name,
            fileType: file.type,
            fileSize: file.size,
            public_id: response.data.public_id
          };

          await axios.post("/api/group-chat/messages", {
            submissionId: selectedChat.submissionId,
            attachment
          });

          toast.dismiss();
          toast.success("File uploaded successfully");
        }
      };

    } catch (error) {
      console.error("Error uploading file:", error);
      toast.dismiss();
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType?.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType?.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleEmojiClick = (emojiData) => {
    if (editingMessage) {
      setEditContent(prev => prev + emojiData.emoji);
    } else {
      setNewMessage(prev => prev + emojiData.emoji);
    }
  };

  const displayMessages = isSearching ? filteredMessages : messages;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-700 text-lg">Loading Chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <Toaster position="top-right" />
      
      {/* Recording UI Overlay - WhatsApp Style */}
      {showRecordingUI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-red-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Recording Audio</h3>
              <p className="text-2xl font-mono text-red-600 mb-4">
                {formatRecordingTime(recordingTime)}
              </p>
              <p className="text-gray-600 text-sm">
                Slide to cancel • Tap to send
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                onClick={cancelRecording}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                size="lg"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Cancel
              </Button>
              
              <Button
                onClick={submitRecording}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Check className="w-5 h-5 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Team Collaboration
              </h1>
              <p className="text-gray-600">Real-time chat with your team members</p>
            </div>
          </div>
          
          {/* Submission Selector */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 border-blue-200 focus:border-blue-500"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-lg shadow-blue-500/20">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg">
                        <Users className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {submissions.find(s => s._id === selectedChat.submissionId)?.formId?.title || 'Team Chat'}
                      </CardTitle>
                      <CardDescription className="text-gray-600 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-medium text-green-600">Live</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {selectedChat.participants?.length || 0} team members
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50/20"
                >
                  {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <MessageCircle className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {isSearching ? "No messages found" : "Start the Conversation"}
                      </h3>
                      <p className="text-gray-600 text-lg max-w-md mb-8">
                        {isSearching 
                          ? "Try different search terms" 
                          : "Be the first to send a message and get the discussion started with your team."
                        }
                      </p>
                      {!isSearching && (
                        <div className="flex items-center gap-6 text-gray-500">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            <span>Share files</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4" />
                            <span>Voice messages</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Reply className="w-4 h-4" />
                            <span>Reply to messages</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    displayMessages.map((message) => {
                      const messageStyle = getMessageStyle(message);
                      const isOwnMessage = message.senderEmail === session?.user?.email;
                      
                      return (
                        <div
                          key={message._id || message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}
                        >
                          <div
                            className={`max-w-xl rounded-2xl p-4 transition-all duration-300 hover:shadow-lg ${messageStyle.background}`}
                          >
                            {/* Message Menu Button - Only show for user's own messages */}
                            {isOwnMessage && !editingMessage && (
                              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="relative" ref={menuRef}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 w-6 p-0 rounded-full ${messageStyle.badge}`}
                                    onClick={() => setMenuOpen(menuOpen === message._id ? null : message._id)}
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                  
                                  {/* Dropdown Menu */}
                                  {menuOpen === message._id && (
                                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-gray-700 hover:bg-gray-50"
                                        onClick={() => startEditing(message)}
                                      >
                                        <Edit className="w-3 h-3 mr-2" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => deleteMessage(message._id)}
                                      >
                                        <Trash className="w-3 h-3 mr-2" />
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Reply Preview */}
                            {message.replyTo && (
                              <div className={`text-sm p-3 rounded-xl mb-3 border ${
                                isOwnMessage
                                  ? 'bg-white/20 border-white/30'
                                  : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Reply className="w-3 h-3" />
                                  <span className="font-semibold text-xs">
                                    {message.replyTo.senderName}
                                  </span>
                                </div>
                                <p className="text-xs truncate">
                                  {message.replyTo.content?.substring(0, 80)}...
                                </p>
                              </div>
                            )}

                            {/* Sender Info */}
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className={`text-xs ${messageStyle.icon}`}>
                                  {getRoleIcon(message.senderModel)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-sm ${messageStyle.text}`}>
                                  {message.senderName}
                                </span>
                                <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(message.senderModel)}`}>
                                  {message.senderModel}
                                </Badge>
                                <span className={`text-xs ${messageStyle.time}`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {message.isEdited && (
                                  <Badge variant="outline" className="text-xs bg-white/20 text-white/80 border-white/30">
                                    edited
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Message Content - Edit Mode */}
                            {editingMessage === message._id ? (
                              <div className="mb-3">
                                <Input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="mb-2 bg-white text-gray-900"
                                  placeholder="Edit your message..."
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      saveEdit(message._id);
                                    }
                                  }}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEdit(message._id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="w-3 h-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Message Content */}
                                {message.content && (
                                  <p className="text-sm leading-relaxed mb-3">{message.content}</p>
                                )}

                                {/* Attachment with Replace Option */}
                                {message.attachment && (
                                  <div className={`p-3 rounded-xl border mb-3 ${
                                    isOwnMessage
                                      ? 'bg-white/20 border-white/30'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${
                                        isOwnMessage
                                          ? 'bg-white/30 text-white'
                                          : 'bg-blue-100 text-blue-600'
                                      }`}>
                                        {getFileIcon(message.attachment.fileType)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {message.attachment.filename}
                                        </p>
                                        <p className="text-xs opacity-70">
                                          {formatFileSize(message.attachment.fileSize)}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => window.open(message.attachment.url, '_blank')}
                                          className={isOwnMessage 
                                            ? 'text-white hover:bg-white/30' 
                                            : 'text-gray-600 hover:bg-gray-100'
                                          }
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                        {isOwnMessage && (
                                          <>
                                            <input
                                              type="file"
                                              ref={editFileInputRef}
                                              onChange={(e) => handleReplaceFile(e, message)}
                                              className="hidden"
                                              accept="*/*"
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => editFileInputRef.current?.click()}
                                              disabled={uploadingStates[message._id]}
                                              className={isOwnMessage 
                                                ? 'text-white hover:bg-white/30' 
                                                : 'text-gray-600 hover:bg-gray-100'
                                              }
                                            >
                                              {uploadingStates[message._id] ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Edit className="w-4 h-4" />
                                              )}
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Voice Message with Replace Option */}
                                {message.voiceMessage && (
                                  <div className={`p-3 rounded-xl border mb-3 ${
                                    isOwnMessage
                                      ? 'bg-white/20 border-white/30'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        className={isOwnMessage
                                          ? 'bg-white/30 text-white hover:bg-white/50'
                                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                        }
                                        onClick={() => {
                                          const audio = new Audio(message.voiceMessage.url);
                                          audio.play();
                                        }}
                                      >
                                        <Play className="w-4 h-4" />
                                      </Button>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">Voice Message</p>
                                        <p className="text-xs opacity-70">
                                          {message.voiceMessage.duration}s
                                        </p>
                                      </div>
                                      <div className="w-20 bg-gray-200 rounded-full h-1">
                                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: '50%' }}></div>
                                      </div>
                                      {isOwnMessage && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleReplaceVoiceMessage(message)}
                                          disabled={uploadingStates[message._id]}
                                          className={isOwnMessage 
                                            ? 'text-white hover:bg-white/30' 
                                            : 'text-gray-600 hover:bg-gray-100'
                                          }
                                        >
                                          {uploadingStates[message._id] ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Edit className="w-4 h-4" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Message Actions */}
                            {!editingMessage && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-8 px-2 text-xs transition-all duration-200 ${
                                    isOwnMessage
                                      ? 'text-white/80 hover:text-white hover:bg-white/30'
                                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                  onClick={() => setReplyingTo(message)}
                                >
                                  <Reply className="w-3 h-3 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Invisible element for scroll reference */}
                  <div ref={messagesEndRef} className="h-0" />
                </div>

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Reply className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Replying to {replyingTo.senderName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {replyingTo.content?.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                        className="text-gray-400 hover:text-gray-600 hover:bg-white/50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Input - ALWAYS VISIBLE */}
                <div className="p-6 border-t border-blue-100/50 bg-white/80 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 p-3"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 p-3"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    
                    {/* Audio Recording Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onMouseDown={startRecording}
                      onTouchStart={startRecording}
                      className={`p-3 transition-all duration-200 ${
                        recording 
                          ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' 
                          : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>

                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message... (Press Enter to send)"
                        className="border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg py-6 pr-12"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      
                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="absolute bottom-16 left-0 z-50">
                          <EmojiPicker 
                            onEmojiClick={handleEmojiClick}
                            width={350}
                            height={400}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !replyingTo}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 p-6"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                  />
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-blue-50/30">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <MessageCircle className="w-14 h-14 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Team Chat
                </h3>
                <p className="text-gray-600 text-xl max-w-lg mb-8 leading-relaxed">
                  Select a submission from the dropdown above to start collaborating with your team in real-time.
                </p>
                <div className="flex items-center justify-center gap-8 text-gray-500 text-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time messaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5" />
                    <span>File sharing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5" />
                    <span>Voice messages</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}