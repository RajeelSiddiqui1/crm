"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast, Toaster } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  Eye,
  Calendar,
  Clock,
  User,
  Mail,
  Users,
  FileText,
  Paperclip,
  X,
  Image,
  Video,
    MessageSquare,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ThumbsUp,
  Ban,
  Shield,
  Building,
  BarChart3,
  Loader2,
  Send,
  RefreshCw,
  ClipboardList,
  Star,
  Award,
  Target,
  TrendingUp,
  Sparkles,
  Crown,
  Zap,
  Play,
  File,
  
  Flame,
  Rocket,
  ChevronRight,
  MessageCircle,
  Mail as MailIcon,
  Phone,
  Globe,
  MapPin,
  Heart,
  Sparkle,
} from "lucide-react";

export default function AdminEmployeeTaskDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [zoom, setZoom] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  

   const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };


  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
    } else {
      fetchTaskDetails();
    }
  }, [session, status, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/employee-task/${taskId}`);
      setTask(response.data);
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to fetch task details");
      router.push("/admin/employee-task");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await axios.put(`/api/admin/employee-task/${taskId}`, {
        status: newStatus,
        feedback: feedback
      });
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      fetchTaskDetails();
      setFeedback("");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.error || "Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  // Colorful Status Functions
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-amber-400 to-orange-500 text-white";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "completed":
        return "bg-gradient-to-r from-emerald-400 to-green-500 text-white";
      case "approved":
        return "bg-gradient-to-r from-green-500 to-teal-500 text-white";
      case "rejected":
        return "bg-gradient-to-r from-rose-500 to-pink-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 border-amber-200 text-amber-900";
      case "in_progress":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "completed":
        return "bg-emerald-50 border-emerald-200 text-emerald-900";
      case "approved":
        return "bg-green-50 border-green-200 text-green-900";
      case "rejected":
        return "bg-rose-50 border-rose-200 text-rose-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <PlayCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "approved":
        return <ThumbsUp className="w-4 h-4" />;
      case "rejected":
        return <Ban className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Team Lead":
        return "bg-gradient-to-r from-purple-500 to-violet-600 text-white";
      case "Manager":
        return "bg-gradient-to-r from-indigo-500 to-blue-600 text-white";
      case "Employee":
        return "bg-gradient-to-r from-emerald-500 to-teal-600 text-white";
      case "Admin":
        return "bg-gradient-to-r from-rose-500 to-pink-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    return time;
  };

  const getFeedbackCount = (task) => {
    let count = 0;
    task.assignedTeamLead?.forEach(tl => count += tl.feedbacks?.length || 0);
    task.assignedManager?.forEach(mgr => count += mgr.feedbacks?.length || 0);
    task.assignedEmployee?.forEach(emp => count += emp.feedbacks?.length || 0);
    return count;
  };

  const getAllFeedback = (task) => {
    const allFeedback = [];
    
    // Team Lead feedback
    task.assignedTeamLead?.forEach(tl => {
      tl.feedbacks?.forEach(fb => {
        allFeedback.push({
          user: tl.teamLeadId,
          feedback: fb,
          role: "Team Lead",
          userStatus: tl.status
        });
      });
    });
    
    // Manager feedback
    task.assignedManager?.forEach(mgr => {
      mgr.feedbacks?.forEach(fb => {
        allFeedback.push({
          user: mgr.managerId,
          feedback: fb,
          role: "Manager",
          userStatus: mgr.status
        });
      });
    });
    
    // Employee feedback
    task.assignedEmployee?.forEach(emp => {
      emp.feedbacks?.forEach(fb => {
        allFeedback.push({
          user: emp.employeeId,
          feedback: fb,
          role: "Employee",
          userStatus: emp.status
        });
      });
    });
    
    // Sort by date (newest first)
    return allFeedback.sort((a, b) => new Date(b.feedback.sentAt) - new Date(a.feedback.sentAt));
  };

  const getFeedbackBgColor = (role) => {
    switch (role) {
      case "Team Lead":
        return "bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-500";
      case "Manager":
        return "bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500";
      case "Employee":
        return "bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500";
      case "Admin":
        return "bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-500";
      default:
        return "bg-white border-l-4 border-gray-300";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Crown className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading Admin Dashboard...</p>
          <p className="text-gray-500">Please wait while we fetch task details</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center max-w-md mx-auto">
          <div className="w-32 h-32 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-16 h-16 text-rose-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Task Not Found</h2>
          <p className="text-gray-600 mb-8 text-lg">The requested task could not be found in the system.</p>
          <Button 
            onClick={() => router.push("/admin/employee-task")}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 text-lg rounded-full shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tasks Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const allFeedback = getAllFeedback(task);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster position="top-right" richColors />
      
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Button
                  onClick={() => router.push("/admin/employee-task")}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-white/20 text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Crown className="w-6 h-6" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{task.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${getStatusColor(task.status)} flex items-center gap-2 px-4 py-2 text-sm font-bold shadow-lg`}>
                  {getStatusIcon(task.status)}
                  <span className="capitalize">{task.status?.replace('_', ' ')}</span>
                </Badge>
                <div className="flex items-center gap-2 text-white/80">
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-sm">Task ID: {task._id?.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Created: {formatDate(task.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={fetchTaskDetails}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold">
                    {session?.user?.name?.[0] || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-white">{session?.user?.name || "Admin"}</p>
                  <p className="text-sm text-white/80">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Task Overview Card */}
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                        <ClipboardList className="w-6 h-6 text-white" />
                      </div>
                      Task Overview
                    </div>
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Admin View
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 shadow-inner">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">{task.description}</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                {/* Timeline */}
                {(task.startDate || task.endDate) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-purple-500" />
                      <h4 className="text-lg font-bold text-gray-900">Timeline & Schedule</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {task.startDate && (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                              <PlayCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Start Date & Time</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{formatDate(task.startDate)}</p>
                            </div>
                          </div>
                          {task.startTime && (
                            <div className="flex items-center gap-2 bg-white/50 rounded-lg p-3">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-gray-700">{formatTime(task.startTime)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {task.endDate && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">End Date & Time</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{formatDate(task.endDate)}</p>
                            </div>
                          </div>
                          {task.endTime && (
                            <div className="flex items-center gap-2 bg-white/50 rounded-lg p-3">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium text-gray-700">{formatTime(task.endTime)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Details */}
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="border-b border-gray-200">
                    <TabsList className="flex w-full p-2 bg-gradient-to-r from-gray-50 to-blue-50">
                      <TabsTrigger 
                        value="overview" 
                        className="flex-1 text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="assignments" 
                        className="flex-1 text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Assignments
                      </TabsTrigger>
                      <TabsTrigger 
                        value="attachments" 
                        className="flex-1 text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg"
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attachments
                      </TabsTrigger>
                      <TabsTrigger 
                        value="feedback" 
                        className="flex-1 text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Feedback
                        {allFeedback.length > 0 && (
                          <Badge className="ml-2 bg-white text-amber-600 px-2 py-0.5 text-xs">
                            {allFeedback.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="p-6 space-y-8">
                    {/* Submitted By Card */}
                    {task.submittedBy && (
                      <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-white to-emerald-50 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Submitted By</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                              {task.submittedBy.profilePic ? (
                                <AvatarImage src={task.submittedBy.profilePic} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-2xl font-bold">
                                {task.submittedBy.name?.[0] || "E"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900">{task.submittedBy.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                    <Star className="w-3 h-3 mr-1" />
                                    Employee
                                  </Badge>
                                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                    Submitted Task
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                  <MailIcon className="w-5 h-5 text-gray-500" />
                                  <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900">{task.submittedBy.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                  <Calendar className="w-5 h-5 text-gray-500" />
                                  <div>
                                    <p className="text-sm text-gray-500">Submitted On</p>
                                    <p className="font-medium text-gray-900">{formatDate(task.createdAt)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status History */}
                    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-white to-blue-50 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xl font-bold text-gray-900">Status History & Analytics</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-600">Current Status</p>
                            <Badge className={`${getStatusColor(task.status)} text-lg px-6 py-3 font-bold`}>
                              {getStatusIcon(task.status)}
                              <span className="ml-2 capitalize">{task.status?.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Last Updated</p>
                            <p className="font-bold text-gray-900">{formatDate(task.updatedAt)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 text-center">
                            <p className="text-sm font-semibold text-amber-700 mb-2">Task Created</p>
                            <p className="text-lg font-bold text-gray-900">{formatDate(task.createdAt)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 text-center">
                            <p className="text-sm font-semibold text-blue-700 mb-2">Last Updated</p>
                            <p className="text-lg font-bold text-gray-900">{formatDate(task.updatedAt)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 text-center">
                            <p className="text-sm font-semibold text-emerald-700 mb-2">Duration</p>
                            <p className="text-lg font-bold text-gray-900">
                              {task.startDate && task.endDate 
                                ? `${Math.ceil((new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24))} days`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Assignments Tab */}
                  <TabsContent value="assignments" className="p-6 space-y-8">
                    {/* Team Leads */}
                    {task.assignedTeamLead?.length > 0 && (
                      <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-white to-purple-50 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-bold text-gray-900">Assigned Team Leads</span>
                            </CardTitle>
                            <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-4 py-1.5">
                              {task.assignedTeamLead.length} Team Lead{task.assignedTeamLead.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {task.assignedTeamLead.map((tl, idx) => (
                              <div key={idx} 
                                className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-gradient-to-r from-white to-purple-50 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                    {tl.teamLeadId?.profilePic ? (
                                      <AvatarImage src={tl.teamLeadId.profilePic} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xl font-bold">
                                      {tl.teamLeadId?.name?.[0] || "T"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="text-lg font-bold text-gray-900">{tl.teamLeadId?.name || "Team Lead"}</h4>
                                      <p className="text-gray-600">{tl.teamLeadId?.email || "No email"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
                                        Team Lead
                                      </Badge>
                                      <Badge className={`${getStatusColor(tl.status)}`}>
                                        {tl.status?.replace('_', ' ') || 'pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                  <div className="mb-2">
                                    <p className="text-sm text-gray-500">Feedbacks</p>
                                    <p className="text-lg font-bold text-purple-600">{tl.feedbacks?.length || 0}</p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                                    onClick={() => setActiveTab("feedback")}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View Feedback
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Managers */}
                    {task.assignedManager?.length > 0 && (
                      <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-white to-indigo-50 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                                <Building className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-bold text-gray-900">Assigned Managers</span>
                            </CardTitle>
                            <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-1.5">
                              {task.assignedManager.length} Manager{task.assignedManager.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {task.assignedManager.map((mgr, idx) => (
                              <div key={idx} 
                                className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-gradient-to-r from-white to-indigo-50 rounded-xl border border-indigo-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                    {mgr.managerId?.profilePic ? (
                                      <AvatarImage src={mgr.managerId.profilePic} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xl font-bold">
                                      {mgr.managerId?.name?.[0] || "M"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="text-lg font-bold text-gray-900">{mgr.managerId?.name || "Manager"}</h4>
                                      <p className="text-gray-600">{mgr.managerId?.email || "No email"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                                        Manager
                                      </Badge>
                                      <Badge className={`${getStatusColor(mgr.status)}`}>
                                        {mgr.status?.replace('_', ' ') || 'pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                  <div className="mb-2">
                                    <p className="text-sm text-gray-500">Feedbacks</p>
                                    <p className="text-lg font-bold text-indigo-600">{mgr.feedbacks?.length || 0}</p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => setActiveTab("feedback")}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View Feedback
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Employees */}
                    {task.assignedEmployee?.length > 0 && (
                      <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-white to-emerald-50 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-bold text-gray-900">Assigned Employees</span>
                            </CardTitle>
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5">
                              {task.assignedEmployee.length} Employee{task.assignedEmployee.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {task.assignedEmployee.map((emp, idx) => (
                              <div key={idx} 
                                className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-gradient-to-r from-white to-emerald-50 rounded-xl border border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                    {emp.employeeId?.profilePic ? (
                                      <AvatarImage src={emp.employeeId.profilePic} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xl font-bold">
                                      {emp.employeeId?.name?.[0] || "E"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="text-lg font-bold text-gray-900">{emp.employeeId?.name || "Employee"}</h4>
                                      <p className="text-gray-600">{emp.employeeId?.email || "No email"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                        Employee
                                      </Badge>
                                      <Badge className={`${getStatusColor(emp.status)}`}>
                                        {emp.status?.replace('_', ' ') || 'pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                  <div className="mb-2">
                                    <p className="text-sm text-gray-500">Feedbacks</p>
                                    <p className="text-lg font-bold text-emerald-600">{emp.feedbacks?.length || 0}</p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => setActiveTab("feedback")}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View Feedback
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Attachments Tab */}
                  <TabsContent value="attachments" className="p-6">
                    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-600 rounded-lg">
                              <Paperclip className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">File Attachments</span>
                          </CardTitle>
                          <Badge className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-4 py-1.5">
                            {task.fileAttachments?.length || 0} File{task.fileAttachments?.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                    <CardContent className="p-6">
  {/* Attachments */}
  {task.fileAttachments?.length > 0 && (
    <>
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Attachments
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {task.fileAttachments.map((file) => {
          const { url, name, type, publicId } = file;

          const isImage = type?.startsWith("image/");
          const isVideo = type?.startsWith("video/");

          return (
            <div
              key={publicId}
              className="w-full rounded-lg shadow flex flex-col overflow-hidden bg-blue-100"
            >
              {/* Preview */}
              <div
                className="w-full h-40 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setPreviewFile(file)}
              >
                {isImage ? (
                  <img
                    src={url}
                    alt={name}
                    className="object-cover w-full h-full"
                  />
                ) : isVideo ? (
                  <div className="relative w-full h-full">
                    <video
                      src={url}
                      className="object-cover w-full h-full opacity-80"
                    />
                    <Play className="absolute w-8 h-8 text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  getFileIcon(type)
                )}
              </div>

              {/* Bottom */}
              <div className="p-2 bg-white flex flex-col items-center gap-2">
                <p className="text-sm font-medium truncate w-full text-center">
                  {name}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                    onClick={() => setPreviewFile(file)}
                  >
                    Preview
                  </Button>

                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-green-600 text-white"
                    onClick={() => window.open(url, "_blank")}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}
</CardContent>

                    </Card>
                  </TabsContent>

                  {/* Feedback Tab */}
                  <TabsContent value="feedback" className="p-6">
                    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-white to-amber-50 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                              <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Feedback & Comments</span>
                          </CardTitle>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5">
                            {allFeedback.length} Feedback{allFeedback.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {allFeedback.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-32 h-32 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                              <MessageSquare className="w-16 h-16 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Feedback Yet</h3>
                            <p className="text-gray-600 max-w-md mx-auto mb-8">
                              Be the first to provide feedback on this task. Share your thoughts and guidance.
                            </p>
                            <Button 
                              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-full shadow-lg"
                              onClick={() => document.getElementById('feedback-textarea')?.focus()}
                            >
                              <Send className="w-5 h-5 mr-2" />
                              Add First Feedback
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {allFeedback.map((item, idx) => (
                              <div 
                                key={idx} 
                                className={`${getFeedbackBgColor(item.role)} rounded-xl p-6 shadow-lg`}
                              >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                                      {item.user?.profilePic ? (
                                        <AvatarImage src={item.user.profilePic} />
                                      ) : null}
                                      <AvatarFallback className={`${
                                        item.role === "Team Lead" ? "bg-gradient-to-r from-purple-500 to-violet-600" :
                                        item.role === "Manager" ? "bg-gradient-to-r from-indigo-500 to-blue-600" :
                                        "bg-gradient-to-r from-emerald-500 to-teal-600"
                                      } text-white font-bold`}>
                                        {item.user?.firstName?.[0] || item.role[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-lg font-bold text-gray-900">{item.user?.firstName || item.user?.lastName
  ? `${item.user?.firstName ?? ""} ${item.user?.lastName ?? ""}`.trim()
  : "Unknown User"}
 <br />
                                        <span className="text-sm font-medium text-gray-600">{item.user?.email}</span>
                                        </h4>
                                        <Badge className={getRoleBadgeColor(item.role)}>
                                          {item.role}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-gray-600">
                                          <Clock className="w-3 h-3" />
                                          {formatDate(item.feedback.sentAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Badge className={getStatusColor(item.userStatus)}>
                                            {item.userStatus?.replace('_', ' ') || 'pending'}
                                          </Badge>
                                        </span>
                                        {item.feedback.feedbackBy === "Admin" && (
                                          <span className="flex items-center gap-1 text-rose-600 font-medium">
                                            <Crown className="w-3 h-3" />
                                            Admin Feedback
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {item.feedback.feedbackBy === "Admin" && (
                                    <Badge className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-1.5">
                                      <Shield className="w-3 h-3 mr-2" />
                                      Admin Response
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* WHITE BACKGROUND FEEDBACK TEXT */}
                                <div className="bg-white rounded-lg p-5 shadow-inner border border-gray-100">
                                  <div className="flex items-start gap-3">
                                    <MessageCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                                      {item.feedback.feedback}
                                    </p>
                                  </div>
                                  {item.feedback.adminName && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                                      <Crown className="w-4 h-4 text-amber-500" />
                                      <span className="text-sm font-medium text-gray-700">
                                        Feedback by: <span className="text-amber-600">{item.feedback.adminName}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-8">
            {/* Admin Actions Card */}
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-rose-50">
              {/* <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Admin Actions</span>
                </CardTitle>
              </CardHeader> */}
              <CardContent className="p-6 space-y-8">
                {/* Status Update */}
                {/* <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-rose-500" />
                    <h4 className="font-bold text-gray-900 text-lg">Update Task Status</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    <Button
                      onClick={() => updateTaskStatus("approved")}
                      disabled={updating || task.status === "approved"}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {updating ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <ThumbsUp className="w-5 h-5 mr-2" />
                      )}
                      Approve Task
                    </Button>
                    <Button
                      onClick={() => updateTaskStatus("rejected")}
                      disabled={updating || task.status === "rejected"}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white h-12 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {updating ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Ban className="w-5 h-5 mr-2" />
                      )}
                      Reject Task
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => updateTaskStatus("in_progress")}
                        disabled={updating || task.status === "in_progress"}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-12 rounded-xl shadow-lg transition-all duration-300"
                      >
                        {updating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PlayCircle className="w-4 h-4 mr-2" />
                        )}
                        In Progress
                      </Button>
                      <Button
                        onClick={() => updateTaskStatus("completed")}
                        disabled={updating || task.status === "completed"}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 rounded-xl shadow-lg transition-all duration-300"
                      >
                        {updating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Complete
                      </Button>
                    </div>
                  </div>
                </div> */}

                {/* <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" /> */}

                {/* Add Feedback */}
                {/* <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-gray-900 text-lg">Add Admin Feedback</h4>
                  </div>
                  <Textarea
                    id="feedback-textarea"
                    placeholder="Share your feedback, guidance, or notes for the team..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[120px] resize-none bg-white border-gray-300 focus:ring-2 focus:ring-rose-500 rounded-xl p-4 mb-4"
                  />
                  <Button
                    onClick={() => {
                      if (feedback.trim()) {
                        updateTaskStatus(task.status); // This will add feedback without changing status
                      }
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 rounded-xl shadow-lg"
                    disabled={!feedback.trim() || updating}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Feedback...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Add Admin Feedback
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Your feedback will be visible to all assigned team members
                  </p>
                </div> */}

                {/* <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" /> */}

                {/* Task Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5 text-blue-500" />
                    <h4 className="font-bold text-gray-900 text-lg">Task Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                      <span className="text-gray-600">Task ID</span>
                      <code className="font-mono text-gray-900 bg-white px-3 py-1 rounded-md">
                        {task._id?.slice(-8)}
                      </code>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                      <span className="text-gray-600">Created</span>
                      <span className="font-medium text-gray-900">{formatDate(task.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium text-gray-900">{formatDate(task.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                      <span className="text-gray-600">Total Assignments</span>
                      <span className="font-bold text-blue-600">
                        {(task.assignedTeamLead?.length || 0) + 
                         (task.assignedManager?.length || 0) + 
                         (task.assignedEmployee?.length || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                      <span className="text-gray-600">File Attachments</span>
                      <span className="font-bold text-emerald-600">{task.fileAttachments?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                      <span className="text-gray-600">Total Feedbacks</span>
                      <span className="font-bold text-amber-600">{allFeedback.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-violet-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Team Leads</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{task.assignedTeamLead?.length || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-blue-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                          <Building className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Managers</span>
                      </div>
                      <span className="text-2xl font-bold text-indigo-600">{task.assignedManager?.length || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Employees</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-600">{task.assignedEmployee?.length || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Total Feedbacks</span>
                      </div>
                      <span className="text-2xl font-bold text-amber-600">{allFeedback.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-600 rounded-lg">
                          <Paperclip className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Attachments</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-700">{task.fileAttachments?.length || 0}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-100 rounded-xl border border-rose-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-rose-500" />
                      <p className="font-bold text-gray-900">Task Summary</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      This task has been assigned to <span className="font-bold text-purple-600">{task.assignedTeamLead?.length || 0} team leads</span>,{" "}
                      <span className="font-bold text-indigo-600">{task.assignedManager?.length || 0} managers</span>, and{" "}
                      <span className="font-bold text-emerald-600">{task.assignedEmployee?.length || 0} employees</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Full Page Preview Modal with Zoom */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <h3 className="font-bold text-gray-900 truncate">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => prev + 0.2)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom In +
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.2))}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom Out -
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFile(previewFile.url, previewFile.name)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
      
            {/* Body */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-50">
              {previewFile.type?.includes('image') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : previewFile.type?.includes('video') ? (
                <video
                  controls
                  autoPlay
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <source src={previewFile.url} type={previewFile.type} />
                  Your browser does not support the video tag.
                </video>
              ) : previewFile.type?.includes('pdf') ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[90vh] border rounded-lg"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700">Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                    className="mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}