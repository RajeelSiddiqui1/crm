"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Calendar,
  FileText,
  AudioLines,
  Play,
  Pause,
  Download,
  Volume2,
  User,
  Building,
  Clock,
  Eye,
  Users,
  Check,
  X,
  Send,
  Loader2,
  MoreHorizontal,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Mail
} from "lucide-react";
import axios from "axios";

export default function ManagerAdminTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(null);
  const [managers, setManagers] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [searchManager, setSearchManager] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/manager/login");
      return;
    }

    fetchTasks();
    fetchAllManagers();
  }, [session, status, router]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/manager/admin-tasks");
      console.log("Fetched tasks:", response.data);
      
      if (response.data.success) {
        setTasks(response.data.tasks || []);
      } else {
        toast.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllManagers = async () => {
    try {
      const response = await axios.get("/api/manager/managers");
      if (response.data.success) {
        // Exclude current manager from the list
        const otherManagers = response.data.managers.filter(
          manager => manager._id !== session?.user?.id
        );
        setManagers(otherManagers || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to load managers");
    }
  };

  const handleView = async (task) => {
    try {
      // Fetch fresh task data with managers
      const response = await axios.get(`/api/manager/admin-tasks/${task._id}`);
      if (response.data.success) {
        setSelectedTask(response.data.task);
        setViewDialogOpen(true);
      } else {
        toast.error("Failed to load task details");
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to load task details");
      // Fallback to local task data
      setSelectedTask(task);
      setViewDialogOpen(true);
    }
  };

  const handleAssignClick = (task) => {
    setSelectedTask(task);
    
    // Pre-select already assigned managers (excluding current user)
    const alreadyAssigned = (task.managers || [])
      .filter(manager => manager._id !== session?.user?.id)
      .map(manager => manager._id);
    
    setSelectedManagers(alreadyAssigned);
    setSearchManager("");
    setAssignDialogOpen(true);
  };

  const handleManagerToggle = (managerId) => {
    setSelectedManagers(prev => {
      if (prev.includes(managerId)) {
        return prev.filter(id => id !== managerId);
      } else {
        return [...prev, managerId];
      }
    });
  };

  const handleAssignSubmit = async () => {
    if (!selectedTask || selectedManagers.length === 0) {
      toast.error("Please select at least one manager");
      return;
    }

    setAssigning(true);
    try {
      console.log("Submitting PUT request with:", {
        taskId: selectedTask._id,
        managerIds: selectedManagers,
        currentManager: session.user.id
      });

      const response = await axios.put(
        `/api/manager/admin-tasks/${selectedTask._id}`,
        { managerIds: selectedManagers },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log("PUT Response:", response.data);

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Update local task with new managers
        const newManagers = response.data.data.newManagers || [];
        const allAssignedManagers = response.data.data.assignedManagers || [];
        
        setTasks(prev => prev.map(task => {
          if (task._id === selectedTask._id) {
            return {
              ...task,
              managers: allAssignedManagers,
              updatedAt: response.data.data.updatedAt
            };
          }
          return task;
        }));
        
        // Refresh task list to get updated data
        setRefreshing(true);
        await fetchTasks();
        
        setAssignDialogOpen(false);
        setSelectedManagers([]);
        setSelectedTask(null);
      } else {
        toast.error(response.data.error || "Failed to share task");
      }
    } catch (error) {
      console.error("Error in PUT request:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response) {
        const errorMsg = error.response.data?.error || 
                        error.response.data?.message || 
                        "Failed to share task";
        toast.error(`Error: ${errorMsg}`);
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to share task. Please try again.");
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    toast.success("Tasks refreshed");
  };

  const playAudio = (taskId, audioUrl) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (audioPlaying === taskId) {
      setAudioPlaying(null);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setAudioPlaying(taskId);
    audio.onpause = () => {
      if (audioRef.current === audio) {
        setAudioPlaying(null);
      }
    };
    audio.onended = () => {
      if (audioRef.current === audio) {
        setAudioPlaying(null);
        audioRef.current = null;
      }
    };

    audio.play().catch(err => {
      console.error("Error playing audio:", err);
      toast.error("Failed to play audio");
    });
  };

  const downloadFile = (fileData, fileName = "attachment") => {
    try {
      const link = document.createElement("a");
      link.href = fileData;
      link.download = fileName || "task_attachment";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "medium":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900";
      case "low":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <AlertCircle className="w-3 h-3 mr-1" />;
      case "medium":
        return <Clock className="w-3 h-3 mr-1" />;
      case "low":
        return <Check className="w-3 h-3 mr-1" />;
      default:
        return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.priority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.managers?.some(manager => 
        manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const filteredManagers = managers.filter(manager => {
    if (!searchManager) return true;
    const searchLower = searchManager.toLowerCase();
    return (
      manager.firstName?.toLowerCase().includes(searchLower) ||
      manager.lastName?.toLowerCase().includes(searchLower) ||
      manager.email?.toLowerCase().includes(searchLower)
    );
  });

  // Function to get manager initials
  const getManagerInitials = (manager) => {
    if (!manager) return "M";
    if (manager.firstName && manager.lastName) {
      return `${manager.firstName.charAt(0)}${manager.lastName.charAt(0)}`.toUpperCase();
    } else if (manager.firstName) {
      return manager.firstName.charAt(0).toUpperCase();
    } else if (manager.email) {
      return manager.email.charAt(0).toUpperCase();
    }
    return "M";
  };

  // Function to get manager display name
  const getManagerName = (manager) => {
    if (!manager) return "Manager";
    if (manager.firstName && manager.lastName) {
      return `${manager.firstName} ${manager.lastName}`;
    } else if (manager.firstName) {
      return manager.firstName;
    } else if (manager.email) {
      return manager.email;
    }
    return "Manager";
  };

  const getManagerEmail = (manager) => {
    return manager.email || "No email";
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-200">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <FileText className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">Loading Manager Dashboard</p>
            <p className="text-sm text-gray-600 mt-1">Preparing your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-semibold">Admin Tasks</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                Admin Tasks
              </h1>
              <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
                Tasks assigned by Admin with voice instructions and files. Share with other managers or create forms.
              </p>
            </div>

            {/* Manager Info & Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                        {getManagerInitials(session.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {getManagerName(session.user)}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Manager
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.priority === "high").length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Require attention</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Audio</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.audioUrl).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Voice instructions</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Shared Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.managers && t.managers.length > 1).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">With other managers</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Your Assigned Tasks
                </CardTitle>
                <CardDescription className="text-gray-600 text-base mt-2">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} • Click to view details or share with managers
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search tasks, clients, priority..."
                    className="pl-12 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl bg-white/80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                  <FileText className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Tasks</h3>
                <p className="text-gray-600 max-w-md text-center">
                  Fetching your assigned tasks from the server...
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <FileText className="w-24 h-24 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {tasks.length === 0 ? "No tasks assigned yet" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                  {tasks.length === 0
                    ? "You don't have any tasks assigned to you yet. Check back later or contact admin."
                    : "Try adjusting your search terms to find what you're looking for."}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="border-gray-300"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Task Details
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Priority & Due Date
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Assigned Managers
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow
                        key={task._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200 mb-1">
                                {task.title}
                              </div>
                              {task.clientName && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                  <Building className="w-3 h-3" />
                                  <span>{task.clientName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                {task.audioUrl && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-gray-800 text-white border-gray-700 px-2 py-1 rounded-lg"
                                  >
                                    <AudioLines className="w-3 h-3 mr-1" />
                                    Voice Instructions
                                  </Badge>
                                )}
                                {task.fileAttachments && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-blue-300 text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    File Attached
                                  </Badge>
                                )}
                                {task.endDate && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-gray-300 text-gray-700 px-2 py-1 rounded-lg"
                                  >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Due: {formatDate(task.endDate)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="space-y-2">
                            {task.priority && (
                              <Badge className={`${getPriorityColor(task.priority)} px-3 py-1.5 rounded-lg font-semibold`}>
                                {getPriorityIcon(task.priority)}
                                {task.priority.toUpperCase()}
                              </Badge>
                            )}
                            {task.endDate && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>{formatDate(task.endDate)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="space-y-2">
                            {task.managers && task.managers.length > 0 ? (
                              <>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {task.managers.slice(0, 3).map((manager, index) => (
                                    <Avatar 
                                      key={manager._id || index} 
                                      className="w-8 h-8 border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200 cursor-pointer"
                                      title={`${getManagerName(manager)}\n${getManagerEmail(manager)}`}
                                    >
                                      <AvatarFallback className={`text-xs font-medium ${
                                        manager._id === session?.user?.id
                                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                                          : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                      }`}>
                                        {getManagerInitials(manager)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {task.managers.length > 3 && (
                                    <Badge 
                                      variant="outline" 
                                      className="border-gray-300 text-gray-600 text-xs"
                                      title={`${task.managers.length - 3} more managers`}
                                    >
                                      <MoreHorizontal className="w-3 h-3 mr-1" />
                                      +{task.managers.length - 3}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {task.managers.length} manager{task.managers.length !== 1 ? 's' : ''}
                                </p>
                              </>
                            ) : (
                              <Badge variant="outline" className="border-gray-300 text-gray-600">
                                Only you
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleView(task)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>

                            <Button
                              onClick={() => handleAssignClick(task)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Share
                            </Button>

                            <Button
                              onClick={() =>
                                router.push(
                                  `/manager/forms/create?taskId=${task._id}`
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Create Form
                            </Button>
                            {task.audioUrl && (
                              <Button
                                onClick={() => playAudio(task._id, task.audioUrl)}
                                variant="outline"
                                size="sm"
                                className={`rounded-lg ${
                                  audioPlaying === task._id
                                    ? "bg-green-50 border-green-300 text-green-700"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {audioPlaying === task._id ? (
                                  <Pause className="w-4 h-4 mr-2" />
                                ) : (
                                  <Play className="w-4 h-4 mr-2" />
                                )}
                                {audioPlaying === task._id ? "Pause" : "Play"}
                              </Button>
                            )}
                            {task.fileAttachments && (
                              <Button
                                onClick={() =>
                                  downloadFile(
                                    task.fileAttachments,
                                    `task_${task.title}_attachment`
                                  )
                                }
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                File
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Showing {filteredTasks.length} of {tasks.length} tasks • Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
      </div>

      {/* View Task Dialog */}
      {viewDialogOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                    <p className="text-gray-600">Task Details</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTask.priority && (
                    <Badge className={`${getPriorityColor(selectedTask.priority)} px-3 py-1.5 rounded-lg font-semibold`}>
                      {getPriorityIcon(selectedTask.priority)}
                      {selectedTask.priority.toUpperCase()}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setViewDialogOpen(false);
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        audioRef.current = null;
                      }
                      setAudioPlaying(null);
                    }}
                    className="rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Task Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">Title</label>
                        <p className="text-gray-900 font-semibold text-lg">{selectedTask.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">Client</label>
                        <p className="text-gray-900 font-semibold flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {selectedTask.clientName || "No client specified"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 block mb-1">Created</label>
                          <p className="text-gray-900 font-medium">{formatDate(selectedTask.createdAt)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 block mb-1">Due Date</label>
                          <p className="text-gray-900 font-medium">{formatDate(selectedTask.endDate)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Managers */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Assigned Managers ({selectedTask.managers?.length || 0})
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {selectedTask.managers && selectedTask.managers.length > 0 ? (
                        selectedTask.managers.map((manager, index) => (
                          <div
                            key={manager._id || index}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                          >
                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                              <AvatarFallback className={`font-medium ${
                                manager._id === session?.user?.id
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              }`}>
                                {getManagerInitials(manager)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-gray-900 truncate">
                                  {getManagerName(manager)}
                                  {manager._id === session?.user?.id && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                      You
                                    </Badge>
                                  )}
                                </p>
                                <a
                                  href={`mailto:${manager.email}`}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Send email"
                                >
                                  <Mail className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                                </a>
                              </div>
                              <p className="text-sm text-gray-600 truncate">{getManagerEmail(manager)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No managers assigned yet</p>
                          <p className="text-sm mt-1">Only you have access to this task</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Media Section */}
              <div className="space-y-6">
                {/* Audio Section */}
                {selectedTask.audioUrl && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-purple-600" />
                        Voice Instructions
                      </h3>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <AudioLines className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Audio Recording</p>
                              <p className="text-sm text-gray-600">Click play to listen</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => playAudio(selectedTask._id, selectedTask.audioUrl)}
                            variant={audioPlaying === selectedTask._id ? "destructive" : "default"}
                            className={`gap-2 ${
                              audioPlaying === selectedTask._id
                                ? "bg-gradient-to-r from-red-500 to-pink-600"
                                : "bg-gradient-to-r from-purple-500 to-pink-600"
                            } text-white`}
                          >
                            {audioPlaying === selectedTask._id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {audioPlaying === selectedTask._id ? "Pause" : "Play Audio"}
                          </Button>
                        </div>
                        <audio
                          id={`audio-${selectedTask._id}`}
                          src={selectedTask.audioUrl}
                          controls
                          className="w-full rounded-lg"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* File Attachments */}
                {selectedTask.fileAttachments && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        File Attachments
                      </h3>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Supporting Document</p>
                              <p className="text-sm text-gray-600">Download the attached file</p>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              downloadFile(
                                selectedTask.fileAttachments,
                                `task_${selectedTask.title}_attachment_${new Date().getTime()}`
                              )
                            }
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download File
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleAssignClick(selectedTask)}
                  variant="outline"
                  className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Share with Managers
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/manager/forms/create?taskId=${selectedTask._id}`);
                    setViewDialogOpen(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Form
                </Button>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  variant="ghost"
                  className="border-gray-300"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Managers Modal */}
      {assignDialogOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Share Task with Managers</h2>
                  <p className="text-gray-600 mt-1">
                    Select managers to share: <strong className="text-gray-900">{selectedTask.title}</strong>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setAssignDialogOpen(false)}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search managers by name or email..."
                  className="pl-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-12 text-base"
                  value={searchManager}
                  onChange={(e) => setSearchManager(e.target.value)}
                />
              </div>

              {/* Selected Count */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedManagers.length} manager{selectedManagers.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-gray-600">Managers will receive notifications</p>
                  </div>
                </div>
                {selectedManagers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedManagers([])}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Managers List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {filteredManagers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No managers found</p>
                    <p className="text-sm mt-1">
                      {searchManager ? "Try a different search" : "All managers are already assigned to this task"}
                    </p>
                  </div>
                ) : (
                  filteredManagers.map((manager) => {
                    const isSelected = selectedManagers.includes(manager._id);
                    const isAlreadyAssigned = selectedTask.managers?.some(
                      m => m._id === manager._id
                    );
                    
                    return (
                      <div
                        key={manager._id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : isAlreadyAssigned
                            ? 'border-gray-300 bg-gray-100 opacity-75 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                        }`}
                        onClick={() => !isAlreadyAssigned && handleManagerToggle(manager._id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className={`font-medium transition-all ${
                              isSelected ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white scale-110' : 
                              isAlreadyAssigned ? 'bg-gray-400 text-white' : 
                              'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 group-hover:bg-blue-100'
                            }`}>
                              {getManagerInitials(manager)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                              {getManagerName(manager)}
                              {isAlreadyAssigned && (
                                <Badge className="bg-gray-200 text-gray-700 text-xs font-normal">
                                  Already assigned
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {manager.email}
                            </div>
                          </div>
                        </div>
                        {!isAlreadyAssigned && (
                          <div className={`ml-3 h-6 w-6 rounded border flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500' 
                              : 'border-gray-300 group-hover:border-blue-400'
                          }`}>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleAssignSubmit}
                  disabled={selectedManagers.length === 0 || assigning}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 h-12 text-base"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sharing Task...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Share with {selectedManagers.length} Manager{selectedManagers.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAssignDialogOpen(false)}
                  className=" bg-white text-gray-900 border-gray-300 hover:bg-gray-50 h-12 text-base"
                >
                  Cancel
                </Button>
              </div>

              {/* Info Note */}
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Note</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Selected managers will receive email notifications and in-app alerts. 
                      They can then create forms for their team leads based on this task.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}