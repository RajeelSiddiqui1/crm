"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  FilePlus,
  X,
  Play,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  Users,
  User,
  ChevronRight,
  Filter,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Download,
  Upload,
  MessageSquare,
  Star,
  Shield,
  Zap,
  Sparkles,
  Briefcase,
  Building,
  UserCog,
  Mail,
  Bell,
  ExternalLink,
  Image,
  Video,
  File,
  FileSpreadsheet,
  Crown,
  TargetIcon,
  ClipboardCheck,
} from "lucide-react";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";

// Color Palette for Team Lead
const COLORS = {
  primary: {
    gradient: "from-yellow-600 via-amber-600 to-orange-600",
    light: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200"
  },
  secondary: {
    gradient: "from-emerald-500 to-teal-600",
    light: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200"
  },
  accent: {
    gradient: "from-blue-500 to-cyan-500",
    light: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200"
  },
  teamlead: {
    gradient: "from-yellow-500 to-amber-600",
    light: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200"
  }
};

export default function TeamLeadAssignedSubtasksPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [leadsCompleted, setLeadsCompleted] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    pending: 0,
    highPriority: 0,
    overdue: 0,
    efficiency: 85,
    teamMembers: 0,
    totalLeads: 0,
    leadsCompleted: 0
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchAssignedSubtasks();
  }, [session, status, router, activeTab]);

  // Find current team lead's assignment
  const currentTeamLead = selectedSubtask?.assignedTeamLead?.find(
    (tl) => {
      const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
      return teamLeadId?.toString() === user?.id?.toString();
    }
  );

  const fetchAssignedSubtasks = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`/api/teamlead/employee-tasks`);

      if (response.status === 200 && response.data.success) {
        const data = response.data.subtasks || [];
        
        // Filter tasks where current team lead is assigned
        const assignedTasks = data.filter(task => {
          return task.assignedTeamLead?.some(tl => {
            const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
            return teamLeadId?.toString() === user?.id?.toString();
          });
        });
        
        setSubtasks(assignedTasks);
        
        // Calculate stats
        const now = new Date();
        const completed = assignedTasks.filter(task => {
          const teamLeadAss = task.assignedTeamLead?.find(tl => {
            const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
            return teamLeadId?.toString() === user?.id?.toString();
          });
          return ["completed", "approved"].includes(teamLeadAss?.status);
        }).length;
        
        const inProgress = assignedTasks.filter(task => {
          const teamLeadAss = task.assignedTeamLead?.find(tl => {
            const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
            return teamLeadId?.toString() === user?.id?.toString();
          });
          return teamLeadAss?.status === "in_progress";
        }).length;
        
        const pending = assignedTasks.filter(task => {
          const teamLeadAss = task.assignedTeamLead?.find(tl => {
            const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
            return teamLeadId?.toString() === user?.id?.toString();
          });
          return teamLeadAss?.status === "pending";
        }).length;
        
        const highPriority = assignedTasks.filter(task => task.priority === "high").length;
        const overdue = assignedTasks.filter(task => 
          new Date(task.endDate) < now && !["completed", "approved"].includes(
            task.assignedTeamLead?.find(tl => {
              const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
              return teamLeadId?.toString() === user?.id?.toString();
            })?.status
          )
        ).length;
        
        const teamMembers = assignedTasks.reduce((sum, task) => sum + (task.assignedEmployee?.length || 0), 0);
        
        // Calculate leads stats
        let totalLeadsAssigned = 0;
        let totalLeadsCompleted = 0;
        
        assignedTasks.forEach(task => {
          const teamLeadAss = task.assignedTeamLead?.find(tl => {
            const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
            return teamLeadId?.toString() === user?.id?.toString();
          });
          
          if (teamLeadAss) {
            totalLeadsAssigned += teamLeadAss.leadsAssigned || 0;
            totalLeadsCompleted += teamLeadAss.leadsCompleted || 0;
          }
        });
        
        const efficiency = assignedTasks.length > 0 
          ? Math.round((completed / assignedTasks.length) * 100)
          : 0;

        setStats({
          completed,
          inProgress,
          pending,
          highPriority,
          overdue,
          efficiency,
          teamMembers,
          totalLeads: totalLeadsAssigned,
          leadsCompleted: totalLeadsCompleted
        });
      }
    } catch (error) {
      console.error("Error fetching assigned subtasks:", error);
      toast.error("Failed to load assigned tasks", {
        icon: "❌",
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#dc2626"
        }
      });
    } finally {
      setFetching(false);
    }
  };

  const openModal = async (subtask) => {
    try {
      const response = await axios.get(`/api/teamlead/employee-tasks/${subtask._id}`);
      if (response.status === 200 && response.data.success) {
        const subtaskData = response.data.task;
        setSelectedSubtask(subtaskData);
        setFeedback("");
        
        // Set leads completed from current team lead assignment
        const teamLeadAss = subtaskData.assignedTeamLead?.find(tl => {
          const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
          return teamLeadId?.toString() === user?.id?.toString();
        });
        
        if (teamLeadAss) {
          setLeadsCompleted(teamLeadAss.leadsCompleted || 0);
        }
        
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching subtask details:", error);
      toast.error("Failed to load task details", {
        icon: "❌",
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#dc2626"
        }
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubtask(null);
    setFeedback("");
    setLeadsCompleted(0);
  };

  const updateSubtaskStatus = async (newStatus) => {
    if (!selectedSubtask) return;
    
    try {
      setUpdatingStatus(true);
      const response = await axios.put(`/api/teamlead/employee-tasks/${selectedSubtask._id}`, {
        status: newStatus,
        feedback: feedback.trim() ? feedback : undefined,
        leadsCompleted: leadsCompleted,
        sendNotification: true
      });

      if (response.status === 200 && response.data.success) {
        const updatedTask = response.data.task;
        setSelectedSubtask(updatedTask);
        
        // Update in list
        setSubtasks(prev => prev.map(st =>
          st._id === selectedSubtask._id
            ? updatedTask
            : st
        ));
        
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`, {
          icon: "🎯",
          style: {
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#15803d"
          }
        });
        
        // Show success message with notification details
        toast.info("Notification sent to task creator", {
          icon: "📧",
          style: {
            background: "#eff6ff",
            borderColor: "#bfdbfe",
            color: "#1d4ed8"
          }
        });
        
        fetchAssignedSubtasks(); // Refresh stats
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
      toast.error("Failed to update task status", {
        icon: "❌",
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#dc2626"
        }
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateLeadsProgress = async () => {
    if (!selectedSubtask) return;
    
    try {
      setUpdatingStatus(true);
      const response = await axios.put(`/api/teamlead/employee-tasks/${selectedSubtask._id}`, {
        leadsCompleted: leadsCompleted,
        sendNotification: true
      });

      if (response.status === 200 && response.data.success) {
        const updatedTask = response.data.task;
        setSelectedSubtask(updatedTask);
        setSubtasks(prev => prev.map(st =>
          st._id === selectedSubtask._id
            ? updatedTask
            : st
        ));
        
        toast.success("Leads progress updated successfully", {
          icon: "📈",
          style: {
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#15803d"
          }
        });
        
        fetchAssignedSubtasks(); // Refresh stats
      }
    } catch (error) {
      console.error("Error updating leads:", error);
      toast.error("Failed to update leads progress", {
        icon: "❌",
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#dc2626"
        }
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedSubtask || !feedback.trim()) {
      toast.error("Please enter some feedback first", {
        icon: "✍️"
      });
      return;
    }
    
    try {
      setUpdatingStatus(true);
      const response = await axios.put(`/api/teamlead/employee-tasks/${selectedSubtask._id}`, {
        feedback: feedback,
        sendNotification: true
      });

      if (response.status === 200 && response.data.success) {
        const updatedTask = response.data.task;
        setSelectedSubtask(updatedTask);
        setSubtasks(prev => prev.map(st =>
          st._id === selectedSubtask._id
            ? updatedTask
            : st
        ));
        
        toast.success("Feedback submitted successfully", {
          icon: "💬",
          style: {
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#15803d"
          }
        });
        
        toast.info("Creator notified of your feedback", {
          icon: "📧"
        });
        
        setFeedback(""); // Clear feedback input
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback", {
        icon: "❌"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  const breakTextSmartly = (text, minChars = 8, maxChars = 13) => {
    if (!text) return "";
    let lines = [];
    let currentLine = "";

    const words = text.split(" ");

    for (let word of words) {
      if ((currentLine + " " + word).trim().length > maxChars) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? " " : "") + word;
      }

      if (currentLine.length >= minChars && currentLine.length <= maxChars) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    return lines.join("\n");
  };

  const getStatusVariant = (status) => {
    const variants = {
      completed: "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400",
      approved: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400",
      in_progress: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400",
      pending: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400",
      rejected: "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400",
    };
    return variants[status] || "bg-gradient-to-r from-gray-500 to-slate-600 text-white border-gray-400";
  };

  const getPriorityVariant = (priority) => {
    const variants = {
      high: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
      medium: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      low: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white",
    };
    return variants[priority] || "bg-gradient-to-r from-gray-400 to-slate-500 text-white";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "in_progress":
        return <Clock className="w-5 h-5" />;
      case "pending":
        return <AlertCircle className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return { text: "No deadline", class: "text-gray-700" };
    
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: "Overdue", class: "text-rose-700 font-bold" };
    if (diffDays === 0) return { text: "Due today", class: "text-amber-700 font-bold" };
    if (diffDays === 1) return { text: "1 day left", class: "text-amber-700" };
    if (diffDays <= 3) return { text: `${diffDays} days left`, class: "text-amber-700" };
    return { text: `${diffDays} days left`, class: "text-emerald-700" };
  };

  // Get team lead's status for a task
  const getTeamLeadStatus = (task) => {
    const teamLeadAss = task.assignedTeamLead?.find(tl => {
      const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
      return teamLeadId?.toString() === user?.id?.toString();
    });
    return teamLeadAss?.status || "pending";
  };

  // Get team lead's feedbacks for a task
  const getTeamLeadFeedbacks = (task) => {
    const teamLeadAss = task.assignedTeamLead?.find(tl => {
      const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
      return teamLeadId?.toString() === user?.id?.toString();
    });
    return teamLeadAss?.feedbacks || [];
  };

  // Get team lead's leads progress
  const getTeamLeadLeadsProgress = (task) => {
    const teamLeadAss = task.assignedTeamLead?.find(tl => {
      const teamLeadId = tl.teamLeadId?._id || tl.teamLeadId;
      return teamLeadId?.toString() === user?.id?.toString();
    });
    
    if (!teamLeadAss) return { completed: 0, assigned: 0, percentage: 0 };
    
    const assigned = teamLeadAss.leadsAssigned || 0;
    const completed = teamLeadAss.leadsCompleted || 0;
    const percentage = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    
    return { completed, assigned, percentage };
  };

  const filteredSubtasks = subtasks.filter(subtask => {
    const matchesSearch =
      subtask.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subtask.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const teamLeadStatus = getTeamLeadStatus(subtask);
    const matchesStatus = statusFilter === "all" || teamLeadStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-yellow-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">Loading Team Lead Dashboard</h3>
            <p className="text-gray-800 mt-2">Preparing your assigned tasks workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-red-50">
        <div className="text-center max-w-md p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Team Lead Access Only</h2>
          <p className="text-gray-800 text-lg mb-6">
            This dashboard is exclusively for team leads. Please log in with your team lead credentials.
          </p>
          <Button
            onClick={() => router.push("/teamleadlogin")}
            className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:opacity-90 px-8 py-6 text-lg rounded-xl shadow-lg"
          >
            Go to Team Lead Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50/30 p-4 md:p-6">
        <Toaster 
          position="top-right"
          toastOptions={{
            className: "bg-white border border-gray-200 shadow-xl rounded-xl",
          }}
        />

        {/* Task Detail Modal */}
        {isModalOpen && selectedSubtask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50">
              {/* Modal Header */}
              <div className={`relative bg-gradient-to-r ${COLORS.teamlead.gradient} p-8 text-white overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Crown className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold truncate text-white drop-shadow-lg">
                          {selectedSubtask.title}
                        </h2>
                      </div>
                      <p className="text-amber-100/90 text-base line-clamp-2 max-w-3xl">
                        {selectedSubtask.description}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border border-white/30">
                          <Mail className="w-3.5 h-3.5 mr-1" />
                          Creator will be notified
                        </Badge>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border border-white/30">
                          <Bell className="w-3.5 h-3.5 mr-1" />
                          Real-time updates
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={closeModal}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 rounded-full transition-all duration-300"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-6">
                    <Badge className={`${getStatusVariant(currentTeamLead?.status || "pending")} px-4 py-2 font-semibold text-sm`}>
                      {getStatusIcon(currentTeamLead?.status || "pending")}
                      {formatStatus(currentTeamLead?.status || "pending")}
                    </Badge>
                    <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 font-semibold text-sm border border-white/30">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      Due: {formatDate(selectedSubtask.endDate)}
                    </Badge>
                    {currentTeamLead?.leadsAssigned > 0 && (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 font-semibold text-sm">
                        <Target className="w-3.5 h-3.5 mr-1.5" />
                        {currentTeamLead?.leadsCompleted || 0}/{currentTeamLead?.leadsAssigned} leads
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Status Update Section */}
                    <Card className="border-2 border-gray-300 shadow-xl rounded-xl overflow-hidden bg-white">
                      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b-2 border-gray-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg shadow-md">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Update Your Task Progress
                          </CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 space-y-6">
                        {/* Status Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { status: "pending", label: "Pending", icon: <AlertCircle /> },
                            { status: "in_progress", label: "In Progress", icon: <Clock /> },
                            { status: "completed", label: "Completed", icon: <CheckCircle /> }
                          ].map((item) => {
                            const isActive = currentTeamLead?.status === item.status;

                            return (
                              <Button
                                key={item.status}
                                disabled={updatingStatus || isActive}
                                variant="outline"
                                onClick={() => updateSubtaskStatus(item.status)}
                                className={`h-24 flex flex-col gap-2 font-semibold transition-all duration-300
                                  ${isActive
                                    ? `bg-gradient-to-r
                                        ${item.status === 'completed'
                                          ? 'from-emerald-600 to-green-700'
                                          : item.status === 'in_progress'
                                          ? 'from-blue-600 to-cyan-700'
                                          : 'from-amber-600 to-orange-700'}
                                        text-white border-0 shadow-xl`
                                    : 'bg-gray-50 text-gray-900 border-2 border-gray-800 hover:bg-gray-100 hover:scale-105 hover:shadow-xl'
                                  }
                                `}
                              >
                                <div className={`${isActive ? 'text-white' : 'text-gray-900'} text-2xl`}>
                                  {item.icon}
                                </div>
                                <span className="capitalize">
                                  {item.label}
                                </span>
                              </Button>
                            );
                          })}
                        </div>

                        {/* Leads Progress Update (if applicable) */}
                        {currentTeamLead?.leadsAssigned > 0 && (
                          <div className="space-y-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">Update Leads Progress</h4>
                              <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                                Target: {currentTeamLead?.leadsAssigned} leads
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">
                                  Leads Completed
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={currentTeamLead?.leadsAssigned || 1000}
                                  value={leadsCompleted}
                                  onChange={(e) => setLeadsCompleted(parseInt(e.target.value) || 0)}
                                  className="border-2 border-gray-300 focus:border-yellow-500"
                                  placeholder="Enter number of leads completed"
                                />
                                <div className="text-xs text-gray-600">
                                  Max: {currentTeamLead?.leadsAssigned} leads
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">
                                  Update Progress
                                </label>
                                <Button
                                  onClick={updateLeadsProgress}
                                  disabled={updatingStatus}
                                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white"
                                >
                                  {updatingStatus ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                  )}
                                  Update Leads
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Team Lead Actions */}
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Team Lead Actions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="border-yellow-200 text-yellow-800 hover:bg-yellow-50"
                              onClick={() => updateSubtaskStatus('in_progress')}
                              disabled={updatingStatus || currentTeamLead?.status === 'in_progress'}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Start Working
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                              onClick={() => updateSubtaskStatus('completed')}
                              disabled={updatingStatus || currentTeamLead?.status === 'completed'}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Task Details */}
                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Task Details
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Description</h4>
                          <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {selectedSubtask.description}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-800">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">Start Date</span>
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatDate(selectedSubtask.startDate)}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-800">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">End Date</span>
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatDate(selectedSubtask.endDate)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-800">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Working Hours</span>
                          </div>
                          <div className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg">
                            {selectedSubtask.startTime || '09:00'} - {selectedSubtask.endTime || '17:00'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Attachments */}
                    {selectedSubtask.fileAttachments?.length > 0 && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900">Attachments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedSubtask.fileAttachments?.map((file) => {
                              const { url, name, type, publicId } = file;
                      
                              const isImage = type.startsWith("image/");
                              const isVideo = type.startsWith("video/");
                      
                              return (
                                <div
                                  key={publicId}
                                  className="w-full rounded shadow flex flex-col overflow-hidden bg-yellow-100"
                                >
                                  {/* Preview area */}
                                  <div 
                                    className="flex-1 w-full h-40 flex items-center justify-center overflow-hidden cursor-pointer"
                                    onClick={() => setPreviewFile(file)}
                                  >
                                    {isImage ? (
                                      <img src={url} alt={name} className="object-cover w-full h-full" />
                                    ) : isVideo ? (
                                      <div className="relative w-full h-full">
                                        <video className="object-cover w-full h-full opacity-80" />
                                        <Play className="absolute w-8 h-8 text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                      </div>
                                    ) : (
                                      getFileIcon(type)
                                    )}
                                  </div>
                      
                                  {/* Bottom: file name + buttons */}
                                  <div className="p-2 bg-white flex flex-col items-center gap-2">
                                    <p className="text-sm font-medium truncate w-full text-center">{name}</p>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-gradient-to-r from-yellow-500 to-amber-600"
                                        onClick={() => setPreviewFile(file)}
                                      >
                                        Preview
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-yellow-500 to-green-600"
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
                        </CardContent>
                      </Card>
                    )}

                    {/* Team Lead Feedback Section */}
                    <Card className="border border-gray-200 rounded-xl shadow-sm">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg">
                              <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900">
                              Your Feedback & Notes
                            </CardTitle>
                          </div>

                          <Button
                            onClick={submitFeedback}
                            disabled={updatingStatus || !feedback.trim()}
                            size="sm"
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Submit
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 space-y-5">
                        {/* Add New Feedback */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Add New Feedback:</h4>
                          <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full min-h-[140px] p-4 border-2 border-gray-400 rounded-lg focus:border-yellow-600 focus:ring-4 focus:ring-yellow-100 text-gray-950 font-semibold placeholder:text-gray-500 bg-white"
                            placeholder="Add your team lead feedback, progress notes, or completion remarks here..."
                          />
                        </div>

                        <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                          Your feedback will be sent to the task creator via notification.
                        </div>
                      </CardContent>

                      {/* Feedback History Loop */}
                      {getTeamLeadFeedbacks(selectedSubtask).length > 0 ? (
                        <div className="px-6 pb-6 space-y-4">
                          <h4 className="font-semibold text-gray-900">Previous Feedback:</h4>
                          {getTeamLeadFeedbacks(selectedSubtask).map((item, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                            >
                              <p className="text-gray-900 font-medium">
                                {item.feedback}
                              </p>
                              <span className="text-xs text-gray-500 block mt-1">
                                {new Date(item.sentAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-6 pb-6">
                          <p className="text-sm text-gray-500 italic">
                            No feedback submitted yet.
                          </p>
                        </div>
                      )}
                    </Card>

                    {/* Team Overview Section */}
                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Team Overview
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {/* Assigned Employees Progress */}
                          {selectedSubtask.assignedEmployee?.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">Team Members Progress</h4>
                                <Badge variant="outline" className="border-blue-200 text-blue-800">
                                  {selectedSubtask.assignedEmployee?.length || 0} members
                                </Badge>
                              </div>
                              <div className="space-y-3">
                                {selectedSubtask.assignedEmployee.slice(0, 3).map((emp, idx) => {
                                  const employee = emp.employeeId || emp;
                                  const progress = emp.status === 'completed' || emp.status === 'approved' ? 100 :
                                                  emp.status === 'in_progress' ? 60 : 30;
                                  
                                  return (
                                    <div key={idx} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="w-8 h-8">
                                            <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                                              {employee.firstName?.[0]}{employee.lastName?.[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium text-gray-900 text-sm">
                                              {employee.firstName} {employee.lastName}
                                            </div>
                                            <div className="text-xs text-gray-600">{emp.status?.replace('_', ' ')}</div>
                                          </div>
                                        </div>
                                        <Badge className={`text-xs ${getStatusVariant(emp.status)}`}>
                                          {formatStatus(emp.status)}
                                        </Badge>
                                      </div>
                                      <Progress value={progress} className="h-2" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Assigned Managers */}
                          {selectedSubtask.assignedManager?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Managers</h4>
                              <div className="space-y-2">
                                {selectedSubtask.assignedManager.slice(0, 3).map((mgr, idx) => {
                                  const manager = mgr.managerId || mgr;
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-8 h-8">
                                          <AvatarFallback className="text-xs bg-purple-100 text-purple-800">
                                            {manager.firstName?.[0]}{manager.lastName?.[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium text-gray-900 text-sm">
                                            {manager.firstName} {manager.lastName}
                                          </div>
                                          <div className="text-xs text-gray-600">Manager</div>
                                        </div>
                                      </div>
                                      <Badge className={`text-xs ${getStatusVariant(mgr.status)}`}>
                                        {formatStatus(mgr.status)}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-8">
                    {/* Creator Info */}
                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg">
                              <UserCog className="w-5 h-5 text-white" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900">
                              Task Creator
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="border-yellow-200 text-yellow-800">
                            {selectedSubtask.submittedBy?.role || 'Creator'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-yellow-200">
                            <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold">
                              {selectedSubtask.submittedBy?.firstName?.[0]}{selectedSubtask.submittedBy?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-gray-900">
                              {selectedSubtask.submittedBy?.firstName} {selectedSubtask.submittedBy?.lastName}
                            </div>
                            <div className="text-sm text-gray-900 capitalize">
                              {selectedSubtask.submittedBy?.role || 'Creator'}
                            </div>
                            <div className="text-xs text-gray-900 mt-1">
                              Created on: {formatDate(selectedSubtask.createdAt)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Task Timeline */}
                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Task Timeline
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-900">Current Status</span>
                              <span className="text-sm font-semibold text-gray-900 capitalize">
                                {formatStatus(currentTeamLead?.status || "pending")}
                              </span>
                            </div>
                            <Progress 
                              value={
                                currentTeamLead?.status === "completed" || currentTeamLead?.status === "approved" ? 100 :
                                currentTeamLead?.status === "in_progress" ? 60 :
                                currentTeamLead?.status === "pending" ? 30 : 50
                              } 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-900">Due Date</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatDate(selectedSubtask.endDate)}
                              </span>
                            </div>
                            <div className={`h-2 rounded-full ${getTimeRemaining(selectedSubtask.endDate).class.includes('rose') ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                          </div>
                          
                          {/* Leads Progress */}
                          {currentTeamLead?.leadsAssigned > 0 && (
                            <div className="space-y-2 pt-4 border-t border-gray-200">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-900">Leads Progress</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {currentTeamLead?.leadsCompleted || 0}/{currentTeamLead?.leadsAssigned}
                                </span>
                              </div>
                              <Progress 
                                value={Math.round(((currentTeamLead?.leadsCompleted || 0) / (currentTeamLead?.leadsAssigned || 1)) * 100)} 
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Team Lead Stats */}
                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Your Stats
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-700">
                              {selectedSubtask.assignedEmployee?.length || 0}
                            </div>
                            <div className="text-sm text-gray-900">Team Members</div>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <div className="text-2xl font-bold text-emerald-700">
                              {currentTeamLead?.leadsCompleted || 0}
                            </div>
                            <div className="text-sm text-gray-900">Leads Done</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-900">
                            <span>Feedback Submitted</span>
                            <span className="font-bold">
                              {getTeamLeadFeedbacks(selectedSubtask).length}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(getTeamLeadFeedbacks(selectedSubtask).length * 20, 100)} 
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Quick Actions
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start border-yellow-200 text-yellow-800 hover:bg-yellow-50"
                          onClick={() => updateSubtaskStatus('in_progress')}
                          disabled={updatingStatus || currentTeamLead?.status === 'in_progress'}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Start Working
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                          onClick={() => updateSubtaskStatus('completed')}
                          disabled={updatingStatus || currentTeamLead?.status === 'completed'}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                        {currentTeamLead?.leadsAssigned > 0 && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start border-teal-200 text-teal-800 hover:bg-teal-50"
                            onClick={updateLeadsProgress}
                            disabled={updatingStatus}
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Update Leads
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full justify-start border-amber-200 text-amber-800 hover:bg-amber-50"
                          onClick={submitFeedback}
                          disabled={updatingStatus || !feedback.trim()}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Submit Feedback
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Page Content */}
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                      My Assigned Tasks
                    </h1>
                    <p className="text-gray-900 mt-2 text-lg">
                      Welcome back, <span className="font-semibold text-gray-900">{session?.user?.name}</span>! Manage tasks assigned to you as a Team Lead
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={fetchAssignedSubtasks}
                  variant="outline"
                  className="border-yellow-200 text-yellow-800 hover:bg-yellow-50 hover:border-yellow-300 px-6 shadow-sm"
                  disabled={fetching}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                  {fetching ? 'Refreshing...' : 'Refresh Tasks'}
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-white to-yellow-50/50 border border-yellow-100/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{subtasks.length}</div>
                      <div className="text-sm text-gray-900 mt-1">Total Assigned</div>
                    </div>
                    <div className="p-3 bg-yellow-100/50 rounded-xl">
                      <FileText className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-amber-50/50 border border-amber-100/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
                      <div className="text-sm text-gray-900 mt-1">Pending</div>
                    </div>
                    <div className="p-3 bg-amber-100/50 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-cyan-50/50 border border-cyan-100/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{stats.inProgress}</div>
                      <div className="text-sm text-gray-900 mt-1">In Progress</div>
                    </div>
                    <div className="p-3 bg-cyan-100/50 rounded-xl">
                      <Clock className="w-6 h-6 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
                      <div className="text-sm text-gray-900 mt-1">Completed</div>
                    </div>
                    <div className="p-3 bg-emerald-100/50 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-blue-50/50 border border-blue-100/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{stats.teamMembers}</div>
                      <div className="text-sm text-gray-900 mt-1">Team Members</div>
                    </div>
                    <div className="p-3 bg-blue-100/50 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-violet-50/50 border border-violet-100/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{stats.efficiency}%</div>
                      <div className="text-sm text-gray-900 mt-1">Efficiency</div>
                    </div>
                    <div className="p-3 bg-violet-100/50 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leads Stats */}
            {stats.totalLeads > 0 && (
              <Card className="bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100/50 shadow-lg mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Leads Progress Overview</h3>
                      <p className="text-sm text-gray-900 mt-1">Your overall leads completion across all tasks</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                      {Math.round((stats.leadsCompleted / stats.totalLeads) * 100)}% Complete
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-900">
                      <span>Leads Completed</span>
                      <span className="font-bold">{stats.leadsCompleted} / {stats.totalLeads}</span>
                    </div>
                    <Progress 
                      value={Math.round((stats.leadsCompleted / stats.totalLeads) * 100)} 
                      className="h-3 bg-gray-200"
                    />
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-700">{stats.leadsCompleted}</div>
                        <div className="text-sm text-gray-900">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">{stats.totalLeads - stats.leadsCompleted}</div>
                        <div className="text-sm text-gray-900">Remaining</div>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-700">{stats.totalLeads}</div>
                        <div className="text-sm text-gray-900">Total Target</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filters and Search */}
          <Card className="bg-white border border-gray-200/50 shadow-xl rounded-2xl mb-8 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-auto lg:flex-1 max-w-2xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    placeholder="Search assigned tasks by title or description..."
                    className="pl-12 pr-4 py-6 text-base border-2 border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 rounded-xl shadow-sm bg-white text-gray-900 placeholder-gray-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="min-w-[180px] py-6 border-2 border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 rounded-xl bg-white">
                      <Filter className="w-4 h-4 mr-2 text-gray-600" />
                      <SelectValue placeholder="Filter by Status" className="text-gray-900" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-gray-200 bg-white">
                      <SelectItem value="all" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                        All Status
                      </SelectItem>
                      <SelectItem value="pending" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                        Pending
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                        In Progress
                      </SelectItem>
                      <SelectItem value="completed" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                        Completed
                      </SelectItem>
                      <SelectItem value="approved" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                        Approved
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card className="bg-white border border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-white to-yellow-50/30 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Assigned Tasks
                  </CardTitle>
                  <CardDescription className="text-gray-900">
                    {filteredSubtasks.length} task{filteredSubtasks.length !== 1 ? 's' : ''} found • {stats.overdue} overdue • Creator will be notified of your updates
                  </CardDescription>
                </div>
                
                <Tabs defaultValue="all" className="w-full lg:w-auto" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full lg:w-auto grid-cols-5 bg-gray-100/50 p-1 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-800 data-[state=active]:text-gray-900">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-800 data-[state=active]:text-gray-900">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="in_progress" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-800 data-[state=active]:text-gray-900">
                      In Progress
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-800 data-[state=active]:text-gray-900">
                      Completed
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-800 data-[state=active]:text-gray-900">
                      Approved
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {fetching ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-yellow-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Assigned Tasks</h3>
                  <p className="text-gray-900">Fetching tasks assigned to you as a Team Lead...</p>
                </div>
              ) : filteredSubtasks.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Crown className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {subtasks.length === 0 ? "No Tasks Assigned Yet" : "No Tasks Found"}
                  </h3>
                  <p className="text-gray-900 max-w-md mx-auto mb-8">
                    {subtasks.length === 0
                      ? "You don't have any tasks assigned yet. Tasks will appear here once assigned by other team leads or managers."
                      : "No tasks match your search criteria. Try adjusting your filters."
                    }
                  </p>
                  {searchTerm || statusFilter !== "all" ? (
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                      variant="outline"
                      className="border-yellow-200 text-yellow-800 hover:bg-yellow-50"
                    >
                      Clear Filters
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-yellow-50/30">
                      <TableRow className="hover:bg-transparent border-b border-gray-100">
                        <TableHead className="font-semibold text-gray-900 py-6 text-left">Task Details</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-6">Creator</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-6">Team Members</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-6">Your Status</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-6">Leads Progress</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-6">Timeline</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubtasks.map((subtask) => {
                        const timeRemaining = getTimeRemaining(subtask.endDate);
                        const teamLeadStatus = getTeamLeadStatus(subtask);
                        const feedbackCount = getTeamLeadFeedbacks(subtask).length;
                        const leadsProgress = getTeamLeadLeadsProgress(subtask);
                        
                        return (
                          <TableRow
                            key={subtask._id}
                            className="group hover:bg-gradient-to-r hover:from-yellow-50/30 hover:to-amber-50/30 transition-all duration-300 border-b border-gray-100/50"
                          >
                            <TableCell className="py-5">
                              <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100">
                                  <Crown className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900 text-lg whitespace-pre-line group-hover:text-yellow-800 transition-colors">
                                      {breakTextSmartly(subtask.title)}
                                    </h4>
                                  </div>
                                  <p className="text-gray-900 text-sm line-clamp-2 mb-2">
                                    {subtask.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-900">
                                    <div className="flex items-center gap-1">
                                      <ClipboardCheck className="w-3.5 h-3.5 text-yellow-700" />
                                      <span>Team Lead Task</span>
                                    </div>
                                    {subtask.fileAttachments?.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                                        <span>{subtask.fileAttachments.length} file{subtask.fileAttachments.length === 1 ? '' : 's'}</span>
                                      </div>
                                    )}
                                    {feedbackCount > 0 && (
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                                        <span>{feedbackCount} feedback{feedbackCount === 1 ? '' : 's'}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="py-5">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs">
                                    {subtask.submittedBy?.firstName?.[0]}{subtask.submittedBy?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {subtask.submittedBy?.firstName} {subtask.submittedBy?.lastName}
                                  </div>
                                  <div className="text-xs text-gray-900 capitalize">
                                    {subtask.submittedBy?.role || 'Creator'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="py-5">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {subtask.assignedEmployee?.length || 0} employees
                                  </span>
                                </div>
                                {subtask.assignedManager?.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <UserCog className="w-3.5 h-3.5 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {subtask.assignedManager?.length || 0} managers
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="py-5">
                              <Badge className={`${getStatusVariant(teamLeadStatus)} flex items-center gap-1.5 px-3 py-1.5 font-semibold text-sm rounded-full`}>
                                {getStatusIcon(teamLeadStatus)}
                                {formatStatus(teamLeadStatus)}
                              </Badge>
                            </TableCell>
                            
                            <TableCell className="py-5">
                              {leadsProgress.assigned > 0 ? (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs text-gray-900">
                                    <span>Leads</span>
                                    <span className="font-bold">{leadsProgress.completed}/{leadsProgress.assigned}</span>
                                  </div>
                                  <Progress value={leadsProgress.percentage} className="h-2" />
                                  <div className="text-xs text-gray-900 text-center">
                                    {leadsProgress.percentage}% Complete
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 text-sm">
                                  No leads target
                                </div>
                              )}
                            </TableCell>
                            
                            <TableCell className="py-5">
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-900">
                                  Due: {formatDate(subtask.endDate)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        ["completed", "approved"].includes(teamLeadStatus) ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                        teamLeadStatus === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                        'bg-gradient-to-r from-amber-500 to-orange-500'
                                      }`}
                                      style={{ 
                                        width: ["completed", "approved"].includes(teamLeadStatus) ? '100%' : 
                                               teamLeadStatus === 'in_progress' ? '60%' : 
                                               teamLeadStatus === 'pending' ? '30%' : '50%' 
                                      }}
                                    ></div>
                                  </div>
                                  <span className={`text-xs font-semibold ${timeRemaining.class}`}>
                                    {timeRemaining.text}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="py-5">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-yellow-200 text-yellow-800 hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm rounded-lg"
                                  onClick={() => openModal(subtask)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {!fetching && filteredSubtasks.length > 0 && (
                <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-white/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-900">
                      Showing <span className="font-semibold text-gray-900">{filteredSubtasks.length}</span> of{' '}
                      <span className="font-semibold text-gray-900">{subtasks.length}</span> assigned tasks
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-white to-yellow-50/30 border border-yellow-100/50 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">Team Lead Response Rate</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.efficiency}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100/50 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">Completion Rate</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {subtasks.length > 0 ? Math.round((stats.completed / subtasks.length) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/50 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TargetIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">Leads Completed</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.leadsCompleted}/{stats.totalLeads}
                    </div>
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
    </>
  );
}