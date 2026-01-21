"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  Loader2,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Users,
  FileText,
  User,
  Eye,
  FileIcon,
  AudioWaveform,
  CalendarDays,
  BarChart3,
  MessageSquare,
  Paperclip,
  Award,
  Send,
  FolderOpen,
  ArrowRightLeft,
  Users2,
  UserPlus,
  UserMinus,
  Trash2,
  Inbox,
  RefreshCw,
  X,
  Info,
  Download,
  Headphones,
  MoreVertical,
  Sparkles,
  TargetIcon,
  Flame,
  ChevronDown,
  Mail,
  Phone,
  Building,
  Tag,
  AlertTriangle,
  ThumbsUp,
  MessageCircle,
  FileUp,
  Mic,
  ExternalLink,
  Globe,
  Shield,
  Star,
  Rocket,
  Target,
  Zap,
  Bell,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import MediaSection from "@/components/employee/admin-task/MediaSection";

export default function EmployeeAdminTasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: "", feedback: "" });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamleadShares, setTeamleadShares] = useState([]);
  const [showTeamleadShares, setShowTeamleadShares] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Employee") {
      router.push("/login");
    } else {
      fetchAllData();
    }
  }, [session, status]);

  const fetchAllData = async () => {
  setLoading(true);

  try {
    const tasksRes = await axios.get("/api/employee/admin-tasks");
    setTasks(tasksRes.data || []);
  } catch (e) {
    console.error("Tasks error", e);
  }

  try {
    const employeesRes = await axios.get("/api/employee/employee-list");
    setEmployees(employeesRes.data || []);
  } catch (e) {
    console.error("Employees error", e);
  }

  try {
    const sharesRes = await axios.get("/api/employee/teamlead-shares");
    setTeamleadShares(sharesRes.data || []);
  } catch (e) {
    console.error("Shares error", e);
  }

  setLoading(false);
};


  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`/api/employee/admin-tasks/${taskId}`);
      console.log("Task details:", response.data);
      setTaskDetails(response.data);
      setShowDetailSheet(true);
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to fetch task details");
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status) {
      toast.error("Please select a status");
      return;
    }

    try {
      setUpdating(true);
      await axios.put(`/api/employee/admin-tasks/${selectedTask._id}`, statusUpdate);
      toast.success("Status updated successfully!");
      setShowStatusDialog(false);
      setStatusUpdate({ status: "", feedback: "" });
      fetchAllData();
      if (taskDetails?._id === selectedTask._id) {
        fetchTaskDetails(selectedTask._id);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleShareTask = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    try {
      setUpdating(true);
      await axios.post(`/api/employee/admin-tasks/${selectedTask._id}`, {
        employeeId: selectedEmployee
      });
      toast.success("Task shared successfully!");
      setShowShareDialog(false);
      setSelectedEmployee("");
      fetchAllData();
      if (taskDetails?._id === selectedTask._id) {
        fetchTaskDetails(selectedTask._id);
      }
    } catch (error) {
      console.error("Error sharing task:", error);
      toast.error(error.response?.data?.error || "Failed to share task");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveShare = async (taskId, employeeId) => {
    if (!taskId || !employeeId) {
      toast.error("Invalid request");
      return;
    }

    try {
      setUpdating(true);
      await axios.delete(`/api/employee/admin-tasks/share/${taskId}`, {
        data: { employeeId }
      });
      toast.success("Access removed successfully!");
      fetchAllData();
      if (taskDetails?._id === taskId) {
        fetchTaskDetails(taskId);
      }
    } catch (error) {
      console.error("Error removing share:", error);
      toast.error(error.response?.data?.error || "Failed to remove access");
    } finally {
      setUpdating(false);
    }
  };

  // Helper Functions with Improved Colors
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      case "in_progress":
        return "bg-gradient-to-r from-blue-600 to-cyan-500 text-white";
      case "completed":
        return "bg-gradient-to-r from-emerald-600 to-green-500 text-white";
      case "overdue":
        return "bg-gradient-to-r from-rose-600 to-pink-500 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 border-amber-200";
      case "in_progress":
        return "bg-blue-50 border-blue-200";
      case "completed":
        return "bg-emerald-50 border-emerald-200";
      case "overdue":
        return "bg-rose-50 border-rose-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <TrendingUp className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-gradient-to-r from-emerald-500 to-green-600 text-white";
      case "medium":
        return "bg-gradient-to-r from-amber-500 to-orange-600 text-white";
      case "high":
        return "bg-gradient-to-r from-rose-600 to-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "low":
        return <Sparkles className="w-4 h-4" />;
      case "medium":
        return <TargetIcon className="w-4 h-4" />;
      case "high":
        return <Flame className="w-4 h-4" />;
      default:
        return <TargetIcon className="w-4 h-4" />;
    }
  };

  const getUserStatus = (task) => {
    if (!task || !session?.user?.id) return "pending";
    const userId = session.user.id;
    
    const employee = task.employees?.find(e => 
      e.employeeId?._id === userId || 
      e.employeeId?.toString() === userId
    );
    return employee?.status || "pending";
  };

  const getSharedToMeCount = (task) => {
    if (!task?.shares) return 0;
    return task.shares.filter(share => {
      const sharedToId = share.sharedTo?._id || share.sharedTo;
      return sharedToId?.toString() === session?.user?.id && 
        share.sharedToModel === "Employee";
    }).length;
  };

  const getSharedByMeCount = (task) => {
    if (!task?.shares) return 0;
    return task.shares.filter(share => {
      const sharedById = share.sharedBy?._id || share.sharedBy;
      return sharedById?.toString() === session?.user?.id && 
        share.sharedByModel === "Employee";
    }).length;
  };

  const isTaskSharedToMe = (task) => {
    if (!task || !session?.user?.id) return false;
    return task.shares?.some(share => {
      const sharedToId = share.sharedTo?._id || share.sharedTo;
      return sharedToId?.toString() === session.user.id && 
        share.sharedToModel === "Employee";
    });
  };

  const isTaskSharedByMe = (task) => {
    if (!task || !session?.user?.id) return false;
    return task.shares?.some(share => {
      const sharedById = share.sharedBy?._id || share.sharedBy;
      return sharedById?.toString() === session.user.id && 
        share.sharedByModel === "Employee";
    });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || getUserStatus(task) === filterStatus;
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const mySharedTasks = tasks.filter(task => isTaskSharedByMe(task));
  const sharedWithMeTasks = tasks.filter(task => isTaskSharedToMe(task));

  const downloadFile = async (url, fileName) => {
    if (!url) {
      toast.error("No download link available");
      return;
    }

    try {
      toast.loading("Preparing download...", { id: "download" });
      
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("Download started", { id: "download" });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file", { id: "download" });
      // Fallback: try opening in new tab
      window.open(url, '_blank');
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" richColors />
      
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Task Management Dashboard</h1>
              <p className="text-blue-100">Manage your tasks and collaborate with team members</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500">
                    {session?.user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-sm text-blue-100">Employee</p>
                </div>
              </div>
              <Button
                onClick={fetchAllData}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 border-white text-white"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 -mt-6">
        {/* Stats Cards with Glass Effect */}
        {/* Stats Cards with Glass Effect - Updated for White Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg shadow-blue-500/10 border border-blue-100 p-6 transform hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{tasks.length}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-full bg-blue-50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${(tasks.filter(t => getUserStatus(t) === 'completed').length / Math.max(tasks.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {tasks.filter(t => getUserStatus(t) === 'completed').length} completed
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-emerald-500/10 border border-emerald-100 p-6 transform hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Shared by You</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{mySharedTasks.length}</h3>
                <p className="text-xs text-gray-500 mt-1">Tasks you've shared</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg shadow-emerald-500/20">
                <Share2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-purple-500/10 border border-purple-100 p-6 transform hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Shared with You</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{sharedWithMeTasks.length}</h3>
                <p className="text-xs text-gray-500 mt-1">Tasks shared with you</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
                <Inbox className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-amber-500/10 border border-amber-100 p-6 transform hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Team Activities</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{teamleadShares.length}</h3>
                <Button
                  onClick={() => setShowTeamleadShares(true)}
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 pl-0"
                >
                  View Activities <ArrowRightLeft className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20">
                <Users2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        {/* Main Dashboard */}
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden ring-1 ring-gray-100">
          <CardHeader className="bg-white border-b border-gray-100 pb-6 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Task Management
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Manage and track all your assigned tasks
                </CardDescription>
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-all rounded-full"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-gray-50/50 border-gray-200 rounded-full">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span>Filter Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList
  className="
    flex w-full md:w-auto
    p-1
    bg-white
    border border-gray-200
    rounded-full
    gap-2
  "
>
  {/* ALL TASKS */}
  <TabsTrigger
    value="all"
    className="
      flex-1 md:flex-none
      flex items-center justify-center
      gap-2
      rounded-full
      px-6 py-2
      text-sm font-medium
      text-gray-900
      transition-all duration-200

      hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm

      data-[state=active]:bg-gradient-to-r
      data-[state=active]:from-blue-600
      data-[state=active]:to-cyan-600
      data-[state=active]:text-white
      data-[state=active]:shadow-md
    "
  >
    <ClipboardList className="w-4 h-4" />
    All Tasks
  </TabsTrigger>

  {/* SHARED WITH ME */}
  <TabsTrigger
    value="shared-with-me"
    className="
      flex-1 md:flex-none
      flex items-center justify-center
      gap-2
      rounded-full
      px-6 py-2
      text-sm font-medium
      text-gray-900
      transition-all duration-200

      hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm

      data-[state=active]:bg-gradient-to-r
      data-[state=active]:from-purple-600
      data-[state=active]:to-pink-600
      data-[state=active]:text-white
      data-[state=active]:shadow-md
    "
  >
    <Inbox className="w-4 h-4" />
    Shared <span className="hidden sm:inline">with Me</span>
  </TabsTrigger>

  {/* SHARED BY ME */}
  <TabsTrigger
    value="shared-by-me"
    className="
      flex-1 md:flex-none
      flex items-center justify-center
      gap-2
      rounded-full
      px-6 py-2
      text-sm font-medium
      text-gray-900
      transition-all duration-200

      hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm

      data-[state=active]:bg-gradient-to-r
      data-[state=active]:from-emerald-600
      data-[state=active]:to-green-600
      data-[state=active]:text-white
      data-[state=active]:shadow-md
    "
  >
    <Share2 className="w-4 h-4" />
    Shared <span className="hidden sm:inline">by Me</span>
  </TabsTrigger>
</TabsList>


                <TabsContent value="all" className="mt-6">
                  <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-white">
                        <TableRow className="hover:bg-transparent border-b border-gray-100">
                          <TableHead className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Task Details</TableHead>
                          <TableHead className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Assigned To</TableHead>
                          <TableHead className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Priority</TableHead>
                          <TableHead className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Status</TableHead>
                          <TableHead className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Sharing</TableHead>
                          <TableHead className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-12">
                              <div className="flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                                <span className="text-gray-600">Loading tasks...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                  <ClipboardList className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                                <p className="text-gray-500 max-w-md">
                                  {searchQuery || filterStatus !== "all" 
                                    ? "Try adjusting your search or filters"
                                    : "You don't have any assigned tasks yet"}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTasks.map((task) => {
                            const userStatus = getUserStatus(task);
                            const isSharedToMe = isTaskSharedToMe(task);
                            const isSharedByMe = isTaskSharedByMe(task);
                            
                            return (
                              <TableRow key={task._id} className="group hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-50">
                                <TableCell>
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                                        <ClipboardList className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{task.title}</h4>
                                          {isSharedToMe && (
                                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] h-5">
                                              Shared with You
                                            </Badge>
                                          )}
                                          {isSharedByMe && (
                                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] h-5">
                                              You Shared
                                            </Badge>
                                          )}
                                          {(task.fileAttachments?.length > 0 || task.audioFiles?.length > 0) && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium border border-gray-200">
                                              <Paperclip className="w-3 h-3" />
                                              {task.fileAttachments?.length + task.audioFiles?.length}
                                            </div>
                                          )}
                                        </div>
                                        {task.clientName && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            <User className="w-3 h-3 inline mr-1" />
                                            {task.clientName}
                                          </p>
                                        )}
                                        {task.description && (
                                          <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                            {task.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-300 p-1">
                                    <TooltipProvider delayDuration={0}>
                                      {/* Assigned Team Leads */}
                                      {task.teamleads?.map((tl, idx) => (
                                        <Tooltip key={`tl-${idx}`}>
                                          <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-purple-100 cursor-help transition-transform hover:scale-110 hover:z-10">
                                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-[10px] font-bold">
                                                {(tl.teamleadId?.firstName?.[0] || "T").toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-purple-900 text-white border-purple-800">
                                            <p className="font-semibold">{tl.teamleadId?.firstName} {tl.teamleadId?.lastName}</p>
                                            <p className="text-xs text-purple-200">Team Lead • <span className="capitalize">{tl.status?.replace('_', ' ') || 'Pending'}</span></p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}

                                      {/* Assigned Employees */}
                                      {task.employees?.map((emp, idx) => (
                                        <Tooltip key={`emp-${idx}`}>
                                          <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-emerald-100 cursor-help transition-transform hover:scale-110 hover:z-10">
                                              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold">
                                                {(emp.employeeId?.firstName?.[0] || "E").toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-emerald-900 text-white border-emerald-800">
                                            <p className="font-semibold">{emp.employeeId?.firstName} {emp.employeeId?.lastName}</p>
                                            <p className="text-xs text-emerald-200">Employee • <span className="capitalize">{emp.status?.replace('_', ' ') || 'Pending'}</span></p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                      
                                      {(!task.teamleads?.length && !task.employees?.length) && (
                                        <span className="text-xs text-gray-400 italic pl-1">Unassigned</span>
                                      )}
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getPriorityColor(task.priority)} font-medium px-3 py-1.5`}>
                                    {getPriorityIcon(task.priority)}
                                    <span className="ml-1.5">{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(userStatus)} font-medium px-3 py-1.5`}>
                                    {getStatusIcon(userStatus)}
                                    <span className="ml-1.5 capitalize">{userStatus.replace('_', ' ')}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {isSharedByMe && (
                                      <div className="flex items-center gap-1 text-sm text-emerald-600">
                                        <Share2 className="w-3 h-3" />
                                        <span>You shared with {getSharedByMeCount(task)} person(s)</span>
                                      </div>
                                    )}
                                    {isSharedToMe && !isSharedByMe && (
                                      <div className="flex items-center gap-1 text-sm text-blue-600">
                                        <Inbox className="w-3 h-3" />
                                        <span>Shared with you</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => fetchTaskDetails(task._id)}
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3 border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm text-gray-700"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setStatusUpdate({ status: userStatus, feedback: "" });
                                        setShowStatusDialog(true);
                                      }}
                                      size="sm"
                                      className="h-8 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white "
                                    >
                                      Update
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-8 px-2 border-gray-300 text-gray-700">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-100 shadow-xl rounded-xl p-2">
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            setSelectedTask(task);
                                            setShowShareDialog(true);
                                          }}
                                          className="text-gray-700 focus:bg-gray-50 focus:text-gray-900 rounded-lg py-2"
                                        >
                                          <Share2 className="w-4 h-4 mr-2 text-emerald-500" />
                                          Share with Employee
                                        </DropdownMenuItem>
                                        {isSharedByMe && (
                                          <>
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                const myShares = task.shares?.filter(s => 
                                                  (s.sharedBy?._id || s.sharedBy)?.toString() === session?.user?.id
                                                );
                                                if (myShares?.length > 0) {
                                                  myShares.forEach(share => {
                                                    handleRemoveShare(task._id, share.sharedTo?._id || share.sharedTo);
                                                  });
                                                }
                                              }}
                                              className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 rounded-lg py-2 mt-1"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Remove All My Shares
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        {isSharedToMe && (
                                          <DropdownMenuItem 
                                            onClick={() => handleRemoveShare(task._id, session.user.id)}
                                            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 rounded-lg py-2 mt-1"
                                          >
                                            <UserMinus className="w-4 h-4 mr-2" />
                                            Leave Task
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Shared with Me Tab */}
                <TabsContent value="shared-with-me" className="mt-6">
                  <div className="rounded-lg border border-blue-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-blue-50">
                        <TableRow>
                          <TableHead className="font-bold text-blue-900">Task</TableHead>
                          <TableHead className="font-bold text-blue-900">Assigned To</TableHead>
                          <TableHead className="font-bold text-blue-900">Shared By</TableHead>
                          <TableHead className="font-bold text-blue-900">Shared Date</TableHead>
                          <TableHead className="font-bold text-blue-900">Your Status</TableHead>
                          <TableHead className="font-bold text-blue-900 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sharedWithMeTasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                  <Inbox className="w-10 h-10 text-blue-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks shared with you</h3>
                                <p className="text-gray-500 max-w-md">
                                  Tasks shared by other employees will appear here
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          sharedWithMeTasks.map((task) => {
                            const userStatus = getUserStatus(task);
                            const share = task.shares?.find(s => 
                              (s.sharedTo?._id || s.sharedTo)?.toString() === session?.user?.id
                            );
                            
                            return (
                              <TableRow key={task._id} className="hover:bg-blue-50/30 transition-colors">
                                <TableCell>
                                  <div className="flex flex-col">
                                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                    {task.clientName && (
                                      <p className="text-sm text-gray-600 mt-1">{task.clientName}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-300 p-1">
                                    <TooltipProvider delayDuration={0}>
                                      {/* Assigned Team Leads */}
                                      {task.teamleads?.map((tl, idx) => (
                                        <Tooltip key={`tl-${idx}`}>
                                          <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-purple-100 cursor-help transition-transform hover:scale-110 hover:z-10">
                                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-[10px] font-bold">
                                                {(tl.teamleadId?.firstName?.[0] || "T").toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-purple-900 text-white border-purple-800">
                                            <p className="font-semibold">{tl.teamleadId?.firstName} {tl.teamleadId?.lastName}</p>
                                            <p className="text-xs text-purple-200">Team Lead • <span className="capitalize">{tl.status?.replace('_', ' ') || 'Pending'}</span></p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}

                                      {/* Assigned Employees */}
                                      {task.employees?.map((emp, idx) => (
                                        <Tooltip key={`emp-${idx}`}>
                                          <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-emerald-100 cursor-help transition-transform hover:scale-110 hover:z-10">
                                              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold">
                                                {(emp.employeeId?.firstName?.[0] || "E").toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-emerald-900 text-white border-emerald-800">
                                            <p className="font-semibold">{emp.employeeId?.firstName} {emp.employeeId?.lastName}</p>
                                            <p className="text-xs text-emerald-200">Employee • <span className="capitalize">{emp.status?.replace('_', ' ') || 'Pending'}</span></p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                      
                                      {(!task.teamleads?.length && !task.employees?.length) && (
                                        <span className="text-xs text-gray-400 italic pl-1">Unassigned</span>
                                      )}
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {share?.sharedBy ? (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                                          {share.sharedBy.firstName?.[0] || "E"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                          {share.sharedBy.firstName || "Employee"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {share.sharedByModel === "Employee" ? "Employee" : "Team Lead"}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Unknown</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-600">
                                    {share?.sharedAt ? formatDate(share.sharedAt) : "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(userStatus)} px-3 py-1`}>
                                    {userStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => fetchTaskDetails(task._id)}
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                      View
                                    </Button>
                                    <Button
                                      onClick={() => handleRemoveShare(task._id, session.user.id)}
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3 border-rose-200 text-rose-600 hover:bg-rose-50"
                                    >
                                      Leave
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Shared by Me Tab */}
                <TabsContent value="shared-by-me" className="mt-6">
                  <div className="rounded-lg border border-emerald-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-emerald-50">
                        <TableRow>
                          <TableHead className="font-bold text-emerald-900">Task</TableHead>
                          <TableHead className="font-bold text-emerald-900">Assigned To</TableHead>
                          <TableHead className="font-bold text-emerald-900">Shared To</TableHead>
                          <TableHead className="font-bold text-emerald-900">Shared Date</TableHead>
                          <TableHead className="font-bold text-emerald-900">Status</TableHead>
                          <TableHead className="font-bold text-emerald-900 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mySharedTasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                  <Share2 className="w-10 h-10 text-emerald-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">You haven't shared any tasks</h3>
                                <p className="text-gray-500 max-w-md mb-4">
                                  Share tasks with your colleagues from the "All Tasks" tab
                                </p>
                                <Button
                                  onClick={() => setActiveTab("all")}
                                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share a Task
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          mySharedTasks.flatMap((task) => 
                            task.shares
                              ?.filter(share => 
                                (share.sharedBy?._id || share.sharedBy)?.toString() === session?.user?.id
                              )
                              .map((share, index) => (
                                <TableRow key={`${task._id}-${index}`} className="hover:bg-emerald-50/30 transition-colors">
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                      {task.clientName && (
                                        <p className="text-sm text-gray-600 mt-1">{task.clientName}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-300 p-1">
                                      <TooltipProvider delayDuration={0}>
                                        {/* Assigned Team Leads */}
                                        {task.teamleads?.map((tl, idx) => (
                                          <Tooltip key={`tl-${idx}`}>
                                            <TooltipTrigger asChild>
                                              <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-purple-100 cursor-help transition-transform hover:scale-110 hover:z-10">
                                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-[10px] font-bold">
                                                  {(tl.teamleadId?.firstName?.[0] || "T").toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-purple-900 text-white border-purple-800">
                                              <p className="font-semibold">{tl.teamleadId?.firstName} {tl.teamleadId?.lastName}</p>
                                              <p className="text-xs text-purple-200">Team Lead • <span className="capitalize">{tl.status?.replace('_', ' ') || 'Pending'}</span></p>
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}

                                        {/* Assigned Employees */}
                                        {task.employees?.map((emp, idx) => (
                                          <Tooltip key={`emp-${idx}`}>
                                            <TooltipTrigger asChild>
                                              <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-emerald-100 cursor-help transition-transform hover:scale-110 hover:z-10">
                                                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold">
                                                  {(emp.employeeId?.firstName?.[0] || "E").toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-emerald-900 text-white border-emerald-800">
                                              <p className="font-semibold">{emp.employeeId?.firstName} {emp.employeeId?.lastName}</p>
                                              <p className="text-xs text-emerald-200">Employee • <span className="capitalize">{emp.status?.replace('_', ' ') || 'Pending'}</span></p>
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                        
                                        {(!task.teamleads?.length && !task.employees?.length) && (
                                          <span className="text-xs text-gray-400 italic pl-1">Unassigned</span>
                                        )}
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                                          {share.sharedTo?.firstName?.[0] || "E"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                          {share.sharedTo?.firstName || "Employee"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {share.sharedToModel === "Employee" ? "Employee" : "Team Lead"}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-gray-600">
                                      {formatDate(share.sharedAt)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1">
                                      Shared
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end">
                                      <Button
                                        onClick={() => handleRemoveShare(task._id, share.sharedTo?._id || share.sharedTo)}
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 border-rose-200 text-rose-600 hover:bg-rose-50"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Update Task Status
            </DialogTitle>
            <DialogDescription className="text-blue-700">
              Update the status for <span className="font-semibold text-blue-900">"{selectedTask?.title}"</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Current Status</label>
          <Select
  value={statusUpdate.status}
  onValueChange={(value) =>
    setStatusUpdate({ ...statusUpdate, status: value })
  }
>
  <SelectTrigger
    className="
      h-11
      bg-white
      border border-gray-200
      rounded-xl
      text-gray-900
      transition-all duration-200

      hover:border-blue-300 hover:bg-blue-50
      focus:ring-2 focus:ring-blue-500 focus:bg-white
    "
  >
    <SelectValue
      placeholder="Select status"
      className="text-gray-500"
    />
  </SelectTrigger>

  <SelectContent
    className="
      rounded-xl
      border border-blue-100
      shadow-xl
      bg-white
      p-1
    "
  >
    {/* PENDING */}
    <SelectItem
      value="pending"
      className="
        rounded-lg
        text-gray-900
        focus:bg-amber-50 focus:text-amber-900
        hover:bg-amber-50
      "
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-500" />
        Pending
      </div>
    </SelectItem>

    {/* IN PROGRESS */}
    <SelectItem
      value="in_progress"
      className="
        rounded-lg
        text-gray-900
        focus:bg-blue-50 focus:text-blue-900
        hover:bg-blue-50
      "
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        In Progress
      </div>
    </SelectItem>

    {/* COMPLETED */}
    <SelectItem
      value="completed"
      className="
        rounded-lg
        text-gray-900
        focus:bg-emerald-50 focus:text-emerald-900
        hover:bg-emerald-50
      "
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        Completed
      </div>
    </SelectItem>

    {/* OVERDUE */}
    <SelectItem
      value="overdue"
      className="
        rounded-lg
        text-gray-900
        focus:bg-rose-50 focus:text-rose-900
        hover:bg-rose-50
      "
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-rose-500" />
        Overdue
      </div>
    </SelectItem>
  </SelectContent>
</Select>

            </div>
            
          
          </div>

          <DialogFooter className="p-6 pt-2 bg-gray-50/50">
            <Button variant="ghost" onClick={() => setShowStatusDialog(false)} className="hover:bg-gray-100 rounded-xl hover:text-gray-900">
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              disabled={updating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 rounded-xl px-6 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Status <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Task Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              Share Task Access
            </DialogTitle>
            <DialogDescription className="text-emerald-800">
              Collaborate on <span className="font-semibold text-emerald-900">"{selectedTask?.title}"</span> with another employee
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 ml-1">Select Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="h-11 bg-white border-gray-300 focus:ring-2 focus:ring-emerald-500 rounded-xl transition-all hover:bg-emerald-50 hover:border-emerald-400 text-gray-900">
                  <SelectValue placeholder="Choose an employee to share with" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-emerald-100 shadow-2xl max-h-[300px] bg-white ">
                  {employees
                    .filter(emp => {
                      if (emp._id === session?.user?.id) return false;
                      const isAssigned = selectedTask?.employees?.some(e => (e.employeeId?._id || e.employeeId) === emp._id);
                      const isShared = selectedTask?.shares?.some(s => (s.sharedTo?._id || s.sharedTo) === emp._id);
                      return !isAssigned && !isShared;
                    })
                    .map((emp) => (
                      <SelectItem key={emp._id} value={emp._id} className="focus:bg-emerald-50 cursor-pointer text-gray-900">
                        <div className="flex items-center gap-3 py-1">
                          <Avatar className="h-8 w-8 border border-emerald-100 shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs">
                              {emp.firstName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[11px] text-gray-500">{emp.email}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Info className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900 mb-1">Collaboration Access</p>
                  <p className="text-xs text-emerald-700/80 leading-relaxed">
                    The selected employee will receive full access to this task. They can view all attachments and update the status independently.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 bg-gray-50/50">
            <Button variant="ghost" onClick={() => setShowShareDialog(false)} className="hover:bg-gray-100 rounded-xl hover:text-gray-900 text-gray-600">
              Cancel
            </Button>
            <Button 
              onClick={handleShareTask}
              disabled={updating || !selectedEmployee}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl px-6 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Access
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Teamlead Shares Dialog */}
      <Dialog open={showTeamleadShares} onOpenChange={setShowTeamleadShares}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-amber-600" />
              Team Lead Sharing Activities
            </DialogTitle>
            <DialogDescription className="text-amber-700">
              View sharing activities by team leads in tasks you have access to
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[500px] overflow-y-auto p-6">
            {teamleadShares.length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-gray-50 border border-gray-100 border-dashed">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Users className="w-10 h-10 text-amber-300" />
                </div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">No activities found</h3>
                <p className="text-gray-500">Team lead sharing activities will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamleadShares.map((share, index) => (
                  <Card key={index} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                                  {share.sharedBy?.firstName?.[0] || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-amber-900 text-sm group-hover:text-amber-700 transition-colors">
                                  {share.sharedBy?.firstName} {share.sharedBy?.lastName}
                                </p>
                                <p className="text-xs text-amber-600 font-medium">Team Lead</p>
                              </div>
                            </div>
                            
                            <div className="p-1 rounded-full bg-gray-100 text-gray-400">
                              <ArrowRightLeft className="w-4 h-4" />
                            </div>

                            <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                  {share.sharedTo?.firstName?.[0] || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {share.sharedTo?.firstName} {share.sharedTo?.lastName}
                                </p>
                                <p className="text-xs text-blue-600 font-medium text-[10px] uppercase tracking-wider">Team Lead</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pl-1">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{share.taskTitle}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDate(share.sharedAt)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  router.push(`/employee/admin-tasks/${share.taskId}`);
                                  setShowTeamleadShares(false);
                                }}
                                className="h-7 text-[10px] text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold"
                              >
                                VIEW TASK <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl bg-white p-0">
          {taskDetails && (
            <div className="h-full flex flex-col">
              {/* Sheet Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <FolderOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <SheetTitle className="text-2xl font-bold text-gray-900">
                        Task Details
                      </SheetTitle>
                      <SheetDescription className="text-gray-600">
                        Complete information about this task
                      </SheetDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowDetailSheet(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sheet Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Task Header */}
                <div className="space-y-4 mb-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{taskDetails.title}</h2>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={getPriorityColor(taskDetails.priority)}>
                          {getPriorityIcon(taskDetails.priority)}
                          <span className="ml-1.5">{taskDetails.priority?.toUpperCase()} PRIORITY</span>
                        </Badge>
                        <Badge className={getStatusColor(getUserStatus(taskDetails))}>
                          {getStatusIcon(getUserStatus(taskDetails))}
                          <span className="ml-1.5">{getUserStatus(taskDetails).toUpperCase()}</span>
                        </Badge>
                        {isTaskSharedToMe(taskDetails) && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                            Shared with You
                          </Badge>
                        )}
                        {isTaskSharedByMe(taskDetails) && (
                          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                            You Shared
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedTask(taskDetails);
                          setStatusUpdate({ status: getUserStatus(taskDetails), feedback: "" });
                          setShowStatusDialog(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      >
                        Update Status
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTask(taskDetails);
                          setShowShareDialog(true);
                        }}
                        variant="outline"
                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {taskDetails.clientName && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Client:</span>
                      <span>{taskDetails.clientName}</span>
                    </div>
                  )}

                  {taskDetails.description && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-line">{taskDetails.description}</p>
                    </div>
                  )}
                </div>

                {/* Assigned Team */}
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4">Assigned Team</h3>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Team Leads */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Leads</p>
                        {taskDetails.teamleads && taskDetails.teamleads.length > 0 ? (
                          taskDetails.teamleads.map((tl, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-xs font-bold">
                                  {(tl.teamleadId?.firstName?.[0] || "T").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{tl.teamleadId?.firstName} {tl.teamleadId?.lastName}</span>
                                <Badge variant="outline" className={`${getStatusColor(tl.status)} text-[10px] px-2 py-0.5 h-auto border-0`}>
                                  {tl.status?.replace('_', ' ') || 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 italic pl-1">No Team Leads assigned</p>
                        )}
                      </div>

                      {/* Employees */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employees</p>
                        {taskDetails.employees && taskDetails.employees.length > 0 ? (
                          taskDetails.employees.map((emp, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold">
                                  {(emp.employeeId?.firstName?.[0] || "E").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{emp.employeeId?.firstName} {emp.employeeId?.lastName}</span>
                                <Badge variant="outline" className={`${getStatusColor(emp.status)} text-[10px] px-2 py-0.5 h-auto border-0`}>
                                  {emp.status?.replace('_', ' ') || 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 italic pl-1">No Employees assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sharing Information */}
                <div className="space-y-6">
                  {/* Shared with Me */}
                  {isTaskSharedToMe(taskDetails) && (
                    <div className={`${getStatusBgColor('in_progress')} border rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Inbox className="w-5 h-5 text-blue-600" />
                          <h3 className="font-bold text-gray-900">Shared with You</h3>
                        </div>
                        <Button
                          onClick={() => handleRemoveShare(taskDetails._id, session.user.id)}
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Leave Task
                        </Button>
                      </div>
                      {taskDetails.shares
                        ?.filter(share => (share.sharedTo?._id || share.sharedTo)?.toString() === session?.user?.id)
                        .map((share, index) => (
                          <div key={index} className="bg-white rounded border p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                    {share.sharedBy?.firstName?.[0] || "E"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {share.sharedBy?.firstName} {share.sharedBy?.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {share.sharedByModel === "Employee" ? "Employee" : "Team Lead"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Shared on</p>
                                <p className="font-medium">{formatDate(share.sharedAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Shared by Me */}
                  {isTaskSharedByMe(taskDetails) && (
                    <div className={`${getStatusBgColor('completed')} border rounded-lg p-4`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Share2 className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-gray-900">Shared by You</h3>
                      </div>
                      <div className="space-y-3">
                        {taskDetails.shares
                          ?.filter(share => (share.sharedBy?._id || share.sharedBy)?.toString() === session?.user?.id)
                          .map((share, index) => (
                            <div key={index} className="bg-white rounded-lg border p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                      {share.sharedTo?.firstName?.[0] || "E"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900">
                                        {share.sharedTo?.firstName} {share.sharedTo?.lastName}
                                      </p>
                                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs">
                                        {share.sharedToModel === "Employee" ? "Employee" : "Team Lead"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">{share.sharedTo?.email}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Button
                                    onClick={() => handleRemoveShare(taskDetails._id, share.sharedTo?._id || share.sharedTo)}
                                    size="sm"
                                    variant="outline"
                                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <p className="text-xs text-gray-500">{formatDate(share.sharedAt)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Teamlead Shares */}
                  {taskDetails.shares?.some(share => 
                    share.sharedByModel === "TeamLead" && share.sharedToModel === "TeamLead"
                  ) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-gray-900">Team Lead Activities</h3>
                      </div>
                      <div className="space-y-3">
                        {taskDetails.shares
                          ?.filter(share => share.sharedByModel === "TeamLead")
                          .map((share, index) => (
                            <div key={index} className="bg-white rounded-lg border p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">
                                        {share.sharedBy?.firstName?.[0] || "T"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm">
                                        {share.sharedBy?.firstName} {share.sharedBy?.lastName}
                                      </p>
                                      <p className="text-xs text-gray-500">Team Lead</p>
                                    </div>
                                  </div>
                                  <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                                        {share.sharedTo?.firstName?.[0] || "T"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm">
                                        {share.sharedTo?.firstName} {share.sharedTo?.lastName}
                                      </p>
                                      <p className="text-xs text-gray-500">Team Lead</p>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">{formatDate(share.sharedAt)}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Attachments Section */}
            <MediaSection task={taskDetails} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}