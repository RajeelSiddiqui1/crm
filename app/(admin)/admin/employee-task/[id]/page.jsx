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
import {
  ArrowLeft,
  Download,
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
  Building,
  BarChart3,
  Loader2,
  ClipboardList,
  Star,
  Target,
  Play,
  File,
  MessageCircle,
  Phone,
  Globe,
  MapPin,
  ChevronRight,
} from "lucide-react";

export default function AdminEmployeeTaskDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [previewFile, setPreviewFile] = useState(null);
  const [zoom, setZoom] = useState(1);

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

  const getFullName = (user) => {
    if (!user) return "Unknown User";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading Task Details...</p>
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
      
      {/* Header */}
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
                  <ClipboardList className="w-6 h-6" />
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
                  <span className="text-sm">ID: {task._id?.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(task.createdAt)}</span>
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
                <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold">
                    {session?.user?.name?.[0] || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-white">Admin View</p>
                  <p className="text-sm text-white/80">Task Details</p>
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    Task Overview
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">{task.description}</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                {/* Timeline */}
                {(task.startDate || task.endDate) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-purple-500" />
                      <h4 className="text-lg font-bold text-gray-900">Timeline</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {task.startDate && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-500 rounded-lg">
                              <PlayCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Start Date</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">{formatDate(task.startDate)}</p>
                            </div>
                          </div>
                          {task.startTime && (
                            <div className="flex items-center gap-2 bg-white rounded-lg p-3">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-gray-700">{task.startTime}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {task.endDate && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-500 rounded-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">End Date</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">{formatDate(task.endDate)}</p>
                            </div>
                          </div>
                          {task.endTime && (
                            <div className="flex items-center gap-2 bg-white rounded-lg p-3">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium text-gray-700">{task.endTime}</span>
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
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="border-b border-gray-200">
                    <TabsList className="flex w-full p-2 bg-gray-50">
                      <TabsTrigger 
                        value="overview" 
                        className="flex-1 text-gray-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="assignments" 
                        className="flex-1 text-gray-600 data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Assignments
                      </TabsTrigger>
                      <TabsTrigger 
                        value="attachments" 
                        className="flex-1 text-gray-600 data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg"
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attachments
                      </TabsTrigger>
                      <TabsTrigger 
                        value="feedback" 
                        className="flex-1 text-gray-600 data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg"
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
                      <Card className="border border-gray-200 rounded-xl">
                        <CardHeader className="bg-emerald-50 border-b">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Submitted By</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                              {task.submittedBy.profilePic ? (
                                <AvatarImage src={task.submittedBy.profilePic} />
                              ) : null}
                              <AvatarFallback className="bg-emerald-500 text-white text-xl font-bold">
                                {getFullName(task.submittedBy)[0] || "E"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                  {getFullName(task.submittedBy)}
                                </h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge className="bg-emerald-500 text-white">
                                    <Star className="w-3 h-3 mr-1" />
                                    Employee
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                  <Mail className="w-5 h-5 text-gray-500" />
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

                    {/* Task Information */}
                    <Card className="border border-gray-200 rounded-xl">
                      <CardHeader className="bg-blue-50 border-b">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xl font-bold text-gray-900">Task Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Task ID</span>
                            <code className="font-mono text-gray-900 bg-white px-3 py-1 rounded-md">
                              {task._id?.slice(-8)}
                            </code>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Created</span>
                            <span className="font-medium text-gray-900">{formatDate(task.createdAt)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Last Updated</span>
                            <span className="font-medium text-gray-900">{formatDate(task.updatedAt)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Status</span>
                            <Badge className={`${getStatusColor(task.status)}`}>
                              {task.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Assignments Tab */}
                  <TabsContent value="assignments" className="p-6 space-y-8">
                    {/* Team Leads */}
                    {task.assignedTeamLead?.length > 0 && (
                      <Card className="border border-gray-200 rounded-xl">
                        <CardHeader className="bg-purple-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500 rounded-lg">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-bold text-gray-900">Assigned Team Leads</span>
                            </CardTitle>
                            <Badge className="bg-purple-500 text-white px-4 py-1.5">
                              {task.assignedTeamLead.length} Team Lead{task.assignedTeamLead.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {task.assignedTeamLead.map((tl, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-14 w-14 border-2 border-white">
                                    {tl.teamLeadId?.profilePic ? (
                                      <AvatarImage src={tl.teamLeadId.profilePic} />
                                    ) : null}
                                    <AvatarFallback className="bg-purple-500 text-white font-bold">
                                      {getFullName(tl.teamLeadId)[0] || "T"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900">
                                      {getFullName(tl.teamLeadId)}
                                    </h4>
                                    <p className="text-gray-600">{tl.teamLeadId?.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className="bg-purple-500 text-white">
                                        Team Lead
                                      </Badge>
                                      <Badge className={`${getStatusColor(tl.status)}`}>
                                        {tl.status?.replace('_', ' ') || 'pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Feedbacks</p>
                                  <p className="text-lg font-bold text-purple-600">{tl.feedbacks?.length || 0}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Managers */}
                    {task.assignedManager?.length > 0 && (
                      <Card className="border border-gray-200 rounded-xl">
                        <CardHeader className="bg-indigo-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500 rounded-lg">
                                <Building className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-bold text-gray-900">Assigned Managers</span>
                            </CardTitle>
                            <Badge className="bg-indigo-500 text-white px-4 py-1.5">
                              {task.assignedManager.length} Manager{task.assignedManager.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {task.assignedManager.map((mgr, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-14 w-14 border-2 border-white">
                                    {mgr.managerId?.profilePic ? (
                                      <AvatarImage src={mgr.managerId.profilePic} />
                                    ) : null}
                                    <AvatarFallback className="bg-indigo-500 text-white font-bold">
                                      {getFullName(mgr.managerId)[0] || "M"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900">
                                      {getFullName(mgr.managerId)}
                                    </h4>
                                    <p className="text-gray-600">{mgr.managerId?.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className="bg-indigo-500 text-white">
                                        Manager
                                      </Badge>
                                      <Badge className={`${getStatusColor(mgr.status)}`}>
                                        {mgr.status?.replace('_', ' ') || 'pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Feedbacks</p>
                                  <p className="text-lg font-bold text-indigo-600">{mgr.feedbacks?.length || 0}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Employees */}
                    {task.assignedEmployee?.length > 0 && (
                      <Card className="border border-gray-200 rounded-xl">
                        <CardHeader className="bg-emerald-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500 rounded-lg">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xl font-bold text-gray-900">Assigned Employees</span>
                            </CardTitle>
                            <Badge className="bg-emerald-500 text-white px-4 py-1.5">
                              {task.assignedEmployee.length} Employee{task.assignedEmployee.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {task.assignedEmployee.map((emp, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-14 w-14 border-2 border-white">
                                    {emp.employeeId?.profilePic ? (
                                      <AvatarImage src={emp.employeeId.profilePic} />
                                    ) : null}
                                    <AvatarFallback className="bg-emerald-500 text-white font-bold">
                                      {getFullName(emp.employeeId)[0] || "E"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900">
                                      {getFullName(emp.employeeId)}
                                    </h4>
                                    <p className="text-gray-600">{emp.employeeId?.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className="bg-emerald-500 text-white">
                                        Employee
                                      </Badge>
                                      <Badge className={`${getStatusColor(emp.status)}`}>
                                        {emp.status?.replace('_', ' ') || 'pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Feedbacks</p>
                                  <p className="text-lg font-bold text-emerald-600">{emp.feedbacks?.length || 0}</p>
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
                    <Card className="border border-gray-200 rounded-xl">
                      <CardHeader className="bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-gray-500 rounded-lg">
                              <Paperclip className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">File Attachments</span>
                          </CardTitle>
                          <Badge className="bg-gray-500 text-white px-4 py-1.5">
                            {task.fileAttachments?.length || 0} File{task.fileAttachments?.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {task.fileAttachments?.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {task.fileAttachments.map((file) => {
                              const { url, name, type, publicId } = file;
                              const isImage = type?.startsWith("image/");
                              const isVideo = type?.startsWith("video/");

                              return (
                                <div
                                  key={publicId}
                                  className="w-full rounded-lg shadow border overflow-hidden bg-white"
                                >
                                  {/* Preview */}
                                  <div
                                    className="w-full h-40 flex items-center justify-center overflow-hidden cursor-pointer bg-gray-100"
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
                                  <div className="p-3 flex flex-col items-center gap-2">
                                    <p className="text-sm font-medium truncate w-full text-center">
                                      {name}
                                    </p>

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="bg-blue-500 hover:bg-blue-600"
                                        variant="outline"
                                        onClick={() => setPreviewFile(file)}
                                      >
                                        Preview
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-green-500 hover:bg-green-600"
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
                        ) : (
                          <div className="text-center py-12">
                            <Paperclip className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-700">No attachments available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Feedback Tab */}
                  <TabsContent value="feedback" className="p-6">
                    <Card className="border border-gray-200 rounded-xl">
                      <CardHeader className="bg-amber-50 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-lg">
                              <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Feedback & Comments</span>
                          </CardTitle>
                          <Badge className="bg-amber-500 text-white px-4 py-1.5">
                            {allFeedback.length} Feedback{allFeedback.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {allFeedback.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                              <MessageSquare className="w-16 h-16 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Feedback Yet</h3>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {allFeedback.map((item, idx) => (
                              <div 
                                key={idx} 
                                className="bg-white border-l-4 border-gray-300 rounded-xl p-6 shadow-sm"
                              >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white">
                                      {item.user?.profilePic ? (
                                        <AvatarImage src={item.user.profilePic} />
                                      ) : null}
                                      <AvatarFallback className={
                                        item.role === "Team Lead" ? "bg-purple-500 text-white" :
                                        item.role === "Manager" ? "bg-indigo-500 text-white" :
                                        "bg-emerald-500 text-white"
                                      }>
                                        {getFullName(item.user)[0] || item.role[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-bold text-gray-900">
                                          {getFullName(item.user)}
                                        </h4>
                                        <Badge className={getRoleBadgeColor(item.role)}>
                                          {item.role}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{item.user?.email}</p>
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
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Feedback Content */}
                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                  <div className="flex items-start gap-3">
                                    <MessageCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                                      {item.feedback.feedback}
                                    </p>
                                  </div>
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

          {/* Right Column - Stats & Quick Info */}
          <div className="space-y-8">
            {/* Quick Stats Card */}
            <Card className="border border-gray-200 rounded-xl">
              <CardHeader className="bg-purple-50 border-b">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-gray-700">Team Leads</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">{task.assignedTeamLead?.length || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-gray-700">Managers</span>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">{task.assignedManager?.length || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-gray-700">Employees</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">{task.assignedEmployee?.length || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-gray-700">Total Feedbacks</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">{allFeedback.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Attachments</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-700">{task.fileAttachments?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Summary Card */}
            <Card className="border border-gray-200 rounded-xl">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Task Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Assignments</span>
                    <span className="font-bold text-blue-600">
                      {(task.assignedTeamLead?.length || 0) + 
                       (task.assignedManager?.length || 0) + 
                       (task.assignedEmployee?.length || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Task Duration</span>
                    <span className="font-medium text-gray-900">
                      {task.startDate && task.endDate 
                        ? `${Math.ceil((new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24))} days`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-gray-600">
                      This task involves <span className="font-bold text-purple-600">{task.assignedTeamLead?.length || 0} team leads</span>,{" "}
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

      {/* File Preview Modal */}
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
                  className="text-blue-600"
                >
                  Zoom In +
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.2))}
                  className="text-blue-600"
                >
                  Zoom Out -
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(previewFile.url, "_blank")}
                  className="text-green-600"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-600"
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
                    onClick={() => window.open(previewFile.url, "_blank")}
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