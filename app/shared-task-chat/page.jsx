"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Target,
  Share2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function SharedTaskChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedTaskId = searchParams.get('sharedTaskId');
  
  const [sharedTasks, setSharedTasks] = useState([]);
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [uploadingStates, setUploadingStates] = useState({});
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);
  const menuRef = useRef(null);

  // Get message style
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
      default:
        return {
          background: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-xl shadow-gray-500/25',
          badge: 'bg-gray-400 text-white',
          text: 'text-gray-100',
          time: 'text-gray-200',
          icon: 'bg-gray-400 text-white'
        };
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Crown className="w-3 h-3" />;
      case 'Manager': return <Shield className="w-3 h-3" />;
      case 'TeamLead': return <Star className="w-3 h-3" />;
      case 'Employee': return <User className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'Manager': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'TeamLead': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  // Priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  // Status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'signed': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'not_available': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'not_interested': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 're_schedule': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    fetchSharedTasks();
  }, [session, status, router]);

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

  const fetchSharedTasks = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      
      switch (session?.user?.role) {
        case "Admin":
          endpoint = "/api/admin/shared-tasks";
          break;
        case "Manager":
          endpoint = `/api/manager/shared-tasks?managerId=${session.user.id}`;
          break;
        case "TeamLead":
          endpoint = "/api/teamlead/shared-tasks";
          break;
        case "Employee":
          endpoint = "/api/employee/shared-tasks";
          break;
        default:
          return;
      }

      const response = await axios.get(endpoint);
      if (response.status === 200) {
        setSharedTasks(response.data || []);
        
        if (sharedTaskId) {
          const task = response.data.find(t => t._id === sharedTaskId);
          if (task) {
            handleSelectSharedTask(task);
          }
        } else if (response.data.length > 0) {
          handleSelectSharedTask(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching shared tasks:", error);
      toast.error("Failed to fetch shared tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSharedTask = async (task) => {
    try {
      setLoading(true);
      
      const response = await axios.post("/api/shared-task-chat", {
        sharedTaskId: task._id
      });

      if (response.status === 200) {
        setSelectedChat(response.data.chat);
        setMessages(response.data.chat.messages || []);
      }
    } catch (error) {
      console.error("Error selecting task chat:", error);
      toast.error("Failed to load task chat");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !replyingTo) return;

    try {
      const messageData = {
        sharedTaskId: selectedChat.sharedTaskId,
        content: newMessage,
        replyTo: replyingTo?._id
      };

      const response = await axios.post("/api/shared-task-chat/messages", messageData);

      if (response.status === 200) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage("");
        setReplyingTo(null);
        setShowEmojiPicker(false);
        toast.success("Message sent");
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
      toast.loading("Uploading file...");

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64File = reader.result.split(',')[1];
        
        const uploadResponse = await axios.post('/api/upload-file', {
          file: base64File,
          filename: file.name,
          fileType: file.type,
          folder: 'task_chat_attachments'
        });

        if (uploadResponse.data.success) {
          const attachment = {
            url: uploadResponse.data.secure_url,
            filename: file.name,
            fileType: file.type,
            fileSize: file.size,
            public_id: uploadResponse.data.public_id
          };

          const messageResponse = await axios.post("/api/shared-task-chat/messages", {
            sharedTaskId: selectedChat.sharedTaskId,
            attachment
          });

          if (messageResponse.status === 200) {
            setMessages(prev => [...prev, messageResponse.data.message]);
            toast.dismiss();
            toast.success("File uploaded successfully");
          }
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

  const deleteMessage = async (messageId) => {
    try {
      const response = await axios.delete(`/api/shared-task-chat/messages/${messageId}?sharedTaskId=${selectedChat.sharedTaskId}`);
      
      if (response.status === 200) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        setMenuOpen(null);
        toast.success("Message deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

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
      const response = await axios.put(`/api/shared-task-chat/messages/${messageId}`, {
        content: editContent,
        sharedTaskId: selectedChat.sharedTaskId
      });

      if (response.status === 200) {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId ? response.data.updatedMessage : msg
          )
        );
        setEditingMessage(null);
        setEditContent("");
        toast.success("Message updated successfully");
      }
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  // Audio recording functions
  const startRecording = async () => {
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
        
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }

        if (recordingTime > 1 && audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await uploadVoiceMessage(audioBlob);
        }
      };

      recorder.start(1000);
      setRecording(true);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Microphone access denied or not available");
      setShowRecordingUI(false);
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

  const uploadVoiceMessage = async (audioBlob) => {
    try {
      setLoading(true);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        const uploadResponse = await axios.post('/api/upload-audio', {
          audio: base64Audio,
          folder: 'task_chat_voice_messages'
        });

        if (uploadResponse.data.success) {
          const voiceMessage = {
            url: uploadResponse.data.secure_url,
            duration: recordingTime,
            filename: `voice-message-${Date.now()}.webm`,
            public_id: uploadResponse.data.public_id
          };

          const messageResponse = await axios.post("/api/shared-task-chat/messages", {
            sharedTaskId: selectedChat.sharedTaskId,
            voiceMessage
          });

          if (messageResponse.status === 200) {
            setMessages(prev => [...prev, messageResponse.data.message]);
            toast.success("Voice message sent");
          }
        }
      };
    } catch (error) {
      console.error("Error uploading voice message:", error);
      toast.error("Failed to send voice message");
    } finally {
      setLoading(false);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <span className="text-gray-700 text-lg">Loading Task Chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <Toaster position="top-right" />
      
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
                onClick={stopRecording}
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
                Task Collaboration
              </h1>
              <p className="text-gray-600">Discuss shared tasks with your team</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 border-blue-200 focus:border-blue-500 text-gray-900"
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

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left Sidebar - Shared Tasks List */}
          <div className="w-80 flex flex-col">
            <Card className="border-0 shadow-lg shadow-blue-500/10 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  Shared Tasks
                </CardTitle>
                <CardDescription className="text-gray-900">
                  Select a task to start chatting
                </CardDescription>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-12rem)] px-4">
                <div className="space-y-3 pb-4">
                  {sharedTasks.map((task) => {
                    const isSelected = selectedChat?.sharedTaskId === task._id;
                    return (
                      <div
                        key={task._id}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-lg shadow-blue-500/20'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-200'
                        }`}
                        onClick={() => handleSelectSharedTask(task)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {task.taskTitle}
                          </h3>
                          <Badge className={`text-xs ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.taskDescription || 'No description'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={`text-xs ${getStatusBadgeColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          
                          {task.dueDate && (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Right Side - Chat Area */}
          <div className="flex-1">
            <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm h-full flex flex-col overflow-hidden">
              {selectedChat ? (
                <>
                  <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50 pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-white shadow-lg shadow-blue-500/20">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg">
                            <Target className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900">
                            {selectedChat.taskTitle}
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
                    <ScrollArea className="flex-1 p-6">
                      {displayMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <MessageCircle className="w-10 h-10 text-blue-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {isSearching ? "No messages found" : "Start the Discussion"}
                          </h3>
                          <p className="text-gray-600 text-lg max-w-md mb-8">
                            {isSearching 
                              ? "Try different search terms" 
                              : "Be the first to send a message and discuss this shared task with your team."
                            }
                          </p>
                          {!isSearching && (
                            <div className="flex items-center justify-center gap-8 text-gray-500">
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
                        <div className="space-y-4">
                          {displayMessages.map((message) => {
                            const messageStyle = getMessageStyle(message);
                            const isOwnMessage = message.senderEmail === session?.user?.email;
                            
                            return (
                              <div
                                key={message._id}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}
                              >
                                <div
                                  className={`max-w-xl rounded-2xl p-4 transition-all duration-300 hover:shadow-lg ${messageStyle.background}`}
                                >
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
                                      {message.content && (
                                        <p className="text-sm leading-relaxed mb-3">{message.content}</p>
                                      )}

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
                                          </div>
                                        </div>
                                      )}

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
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}

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
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

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

                    <div className="p-6 border-t border-blue-100/50 bg-white/80 backdrop-blur-sm flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 p-3"
                        >
                          <Smile className="w-5 h-5" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 p-3"
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onMouseDown={startRecording}
                          onTouchStart={startRecording}
                          className={`p-3 ${
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
                            className="border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg py-6 pr-12 text-gray-900"

                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                          
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
                          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/40 p-6"
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
                      <Target className="w-14 h-14 text-blue-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Welcome to Task Chat
                    </h3>
                    <p className="text-gray-600 text-xl max-w-lg mb-8 leading-relaxed">
                      Select a shared task from the sidebar to start collaborating with your team.
                    </p>
                    <div className="flex items-center justify-center gap-8 text-gray-500 text-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Real-time discussion</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-5 h-5" />
                        <span>Share task files</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mic className="w-5 h-5" />
                        <span>Voice updates</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}