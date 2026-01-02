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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  AudioLines,
  Building,
  User,
  Mail,
  Download,
  Eye,
  ChevronRight,
  FileIcon,
  AudioWaveform,
  CalendarDays,
  BarChart3,
  MessageSquare,
  Paperclip,
  Award,
  Target,
  Bell,
  Clock4,
  CheckCircle,
  XCircle,
  Link,
  Send,
  FolderOpen,
  ArrowRightLeft,
  Users2,
  UserPlus,
  UserMinus,
  Trash2,
  EyeOff,
  ExternalLink,
  Inbox,
  Outbox,
  RefreshCw,
  Outdent,
} from "lucide-react";

export default function EmployeeAdminTasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // States for All Tasks
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
  
  // States for Shared Tasks
  const [sharedTasks, setSharedTasks] = useState({
    sharedToMe: [],
    sharedByMe: []
  });
  const [sharedLoading, setSharedLoading] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [taskToRemove, setTaskToRemove] = useState(null);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);

  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Employee") {
      router.push("/login");
    } else {
      fetchTasks();
      fetchEmployees();
      fetchSharedTasks();
    }
  }, [session, status]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/employee/admin-tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedTasks = async () => {
    try {
      setSharedLoading(true);
      const response = await axios.get("/api/employee/shared-tasks");
      setSharedTasks(response.data);
    } catch (error) {
      console.error("Error fetching shared tasks:", error);
      toast.error("Failed to fetch shared tasks");
    } finally {
      setSharedLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employee/employee-list");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`/api/employee/admin-tasks/${taskId}`);
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
      fetchTasks();
      fetchSharedTasks();
      if (taskDetails?._id === selectedTask._id) {
        fetchTaskDetails(selectedTask._id);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
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
        sharedToId: selectedEmployee,
        sharedToModel: "Employee"
      });
      toast.success("Task shared successfully!");
      setShowShareDialog(false);
      setSelectedEmployee("");
      fetchTasks();
      fetchSharedTasks();
      if (taskDetails?._id === selectedTask._id) {
        fetchTaskDetails(selectedTask._id);
      }
    } catch (error) {
      console.error("Error sharing task:", error);
      toast.error(error.response?.data?.message || "Failed to share task");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveSharedTask = async () => {
    if (!taskToRemove || !employeeToRemove) {
      toast.error("Invalid request");
      return;
    }

    try {
      setUpdating(true);
      await axios.delete(`/api/employee/shared-tasks/${taskToRemove._id}`, {
        data: { employeeId: employeeToRemove }
      });
      toast.success("Task access removed successfully!");
      setShowRemoveDialog(false);
      setTaskToRemove(null);
      setEmployeeToRemove(null);
      fetchTasks();
      fetchSharedTasks();
    } catch (error) {
      console.error("Error removing task access:", error);
      toast.error(error.response?.data?.message || "Failed to remove access");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-yellow-400 to-orange-400";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      case "completed":
        return "bg-gradient-to-r from-green-500 to-emerald-500";
      case "overdue":
        return "bg-gradient-to-r from-red-500 to-pink-500";
      default:
        return "bg-gray-400";
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
        return "bg-gradient-to-br from-green-500 to-emerald-600";
      case "medium":
        return "bg-gradient-to-br from-blue-500 to-cyan-600";
      case "high":
        return "bg-gradient-to-br from-orange-500 to-amber-600";
      default:
        return "bg-gray-500";
    }
  };

  const getUserStatus = (task) => {
    const userId = session?.user?.id;
    const employee = task.employees?.find(e => e.employeeId?._id === userId);
    const teamlead = task.teamleads?.find(t => t.teamleadId?._id === userId);
    return employee?.status || teamlead?.status || "pending";
  };

  const isTaskSharedToMe = (task) => {
    const userId = session?.user?.id;
    return task.sharedTo?._id === userId || 
           task.employees?.some(e => e.employeeId?._id === userId);
  };

  const isTaskSharedByMe = (task) => {
    const userId = session?.user?.id;
    return task.sharedBY?._id === userId;
  };

  const getSharedBadge = (task) => {
    if (isTaskSharedByMe(task)) {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs">
          <Share2 className="w-3 h-3 mr-1" />
          Shared by You
        </Badge>
      );
    }
    if (isTaskSharedToMe(task)) {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs">
          <Inbox className="w-3 h-3 mr-1" />
          Shared with You
        </Badge>
      );
    }
    return null;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || getUserStatus(task) === filterStatus;
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const refreshAllData = () => {
    fetchTasks();
    fetchSharedTasks();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Tasks
            </h1>
            <p className="text-gray-600 mt-2">Manage and track your assigned tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshAllData}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading || sharedLoading}
            >
              <RefreshCw className={`w-4 h-4 ${loading || sharedLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-bold shadow-lg">
              <ClipboardList className="w-4 h-4 mr-2" />
              {activeTab === "all" && `${filteredTasks.length} Tasks`}
              {activeTab === "shared-to-me" && `${sharedTasks.sharedToMe.length} Shared with You`}
              {activeTab === "shared-by-me" && `${sharedTasks.sharedByMe.length} Shared by You`}
            </Badge>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-gray-100">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                All Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="shared-to-me" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Inbox className="w-4 h-4 mr-2" />
                Shared with Me
              </TabsTrigger>
              <TabsTrigger 
                value="shared-by-me" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Outdent className="w-4 h-4 mr-2" />
                Shared by Me
              </TabsTrigger>
            </TabsList>

            {/* All Tasks Tab */}
            <TabsContent value="all" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks by title, client, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px] bg-white border-gray-300">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tasks Table */}
              <Card className="border-2 border-gray-200 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    All Tasks ({filteredTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-bold text-gray-900">Task Details</TableHead>
                          <TableHead className="font-bold text-gray-900">Priority</TableHead>
                          <TableHead className="font-bold text-gray-900">Status</TableHead>
                          <TableHead className="font-bold text-gray-900">Share Status</TableHead>
                          <TableHead className="font-bold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                              <p className="text-gray-600 mt-2">Loading tasks...</p>
                            </TableCell>
                          </TableRow>
                        ) : filteredTasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">No tasks found</p>
                              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTasks.map((task) => {
                            const userStatus = getUserStatus(task);
                            const sharedBadge = getSharedBadge(task);
                            
                            return (
                              <TableRow 
                                key={task._id} 
                                className="hover:bg-blue-50 transition-colors duration-200"
                              >
                                <TableCell>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-gray-900">{task.title}</p>
                                      {sharedBadge}
                                    </div>
                                    {task.clientName && (
                                      <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {task.clientName}
                                      </p>
                                    )}
                                    {task.description && (
                                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getPriorityColor(task.priority)} text-white font-bold`}>
                                    {task.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(userStatus)} text-white font-semibold flex items-center gap-1.5 px-3 py-1 w-fit`}>
                                    {getStatusIcon(userStatus)}
                                    {userStatus.replace("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {task.sharedBY && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className="text-gray-600">From:</span>
                                        <Avatar className="h-5 w-5">
                                          {task.sharedBY.profilePic ? (
                                            <AvatarImage src={task.sharedBY.profilePic} />
                                          ) : (
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                                              {task.sharedBY.name?.[0]}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <span className="font-medium">{task.sharedBY.name}</span>
                                      </div>
                                    )}
                                    {task.sharedTo && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className="text-gray-600">To:</span>
                                        <Avatar className="h-5 w-5">
                                          {task.sharedTo.profilePic ? (
                                            <AvatarImage src={task.sharedTo.profilePic} />
                                          ) : (
                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                                              {task.sharedTo.name?.[0]}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <span className="font-medium">{task.sharedTo.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => fetchTaskDetails(task._id)}
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setStatusUpdate({ status: userStatus, feedback: "" });
                                        setShowStatusDialog(true);
                                      }}
                                      size="sm"
                                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold shadow-md"
                                    >
                                      <TrendingUp className="w-4 h-4 mr-1" />
                                      Update
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowShareDialog(true);
                                      }}
                                      size="sm"
                                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold shadow-md"
                                    >
                                      <Share2 className="w-4 h-4 mr-1" />
                                      Share
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shared with Me Tab */}
            <TabsContent value="shared-to-me" className="space-y-6">
              <Card className="border-2 border-blue-100 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-blue-600" />
                    Tasks Shared with You ({sharedTasks.sharedToMe.length})
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Tasks that have been shared with you by others
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-bold text-gray-900">Task</TableHead>
                          <TableHead className="font-bold text-gray-900">Shared By</TableHead>
                          <TableHead className="font-bold text-gray-900">Your Status</TableHead>
                          <TableHead className="font-bold text-gray-900">Shared Date</TableHead>
                          <TableHead className="font-bold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sharedLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                              <p className="text-gray-600 mt-2">Loading shared tasks...</p>
                            </TableCell>
                          </TableRow>
                        ) : sharedTasks.sharedToMe.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">No tasks shared with you</p>
                              <p className="text-gray-400 text-sm mt-2">
                                Tasks shared with you will appear here
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          sharedTasks.sharedToMe.map((task) => {
                            const userStatus = getUserStatus(task);
                            const sharedDate = task.employees?.find(
                              e => e.employeeId?._id === session?.user?.id
                            )?.assignedAt || task.createdAt;

                            return (
                              <TableRow 
                                key={task._id} 
                                className="hover:bg-blue-50 transition-colors duration-200"
                              >
                                <TableCell>
                                  <div>
                                    <p className="font-semibold text-gray-900">{task.title}</p>
                                    {task.clientName && (
                                      <p className="text-sm text-gray-600">{task.clientName}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {task.sharedBY ? (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        {task.sharedBY.profilePic ? (
                                          <AvatarImage src={task.sharedBY.profilePic} />
                                        ) : (
                                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                                            {task.sharedBY.name?.[0]}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-900">{task.sharedBY.name}</p>
                                        <p className="text-xs text-gray-500">{task.sharedBY.email}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">Unknown</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(userStatus)} text-white font-semibold`}>
                                    {userStatus.replace("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-600">
                                    {new Date(sharedDate).toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => fetchTaskDetails(task._id)}
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setStatusUpdate({ status: userStatus, feedback: "" });
                                        setShowStatusDialog(true);
                                      }}
                                      size="sm"
                                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                                    >
                                      <TrendingUp className="w-4 h-4 mr-1" />
                                      Update
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setTaskToRemove(task);
                                        setEmployeeToRemove(session?.user?.id);
                                        setShowRemoveDialog(true);
                                      }}
                                      size="sm"
                                      variant="destructive"
                                    >
                                      <UserMinus className="w-4 h-4 mr-1" />
                                      Remove Me
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shared by Me Tab */}
            <TabsContent value="shared-by-me" className="space-y-6">
              <Card className="border-2 border-purple-100 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Outdent className="w-5 h-5 text-purple-600" />
                    Tasks Shared by You ({sharedTasks.sharedByMe.length})
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Tasks that you have shared with others
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-bold text-gray-900">Task</TableHead>
                          <TableHead className="font-bold text-gray-900">Shared To</TableHead>
                          <TableHead className="font-bold text-gray-900">Assigned Employees</TableHead>
                          <TableHead className="font-bold text-gray-900">Status</TableHead>
                          <TableHead className="font-bold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sharedLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                              <p className="text-gray-600 mt-2">Loading your shared tasks...</p>
                            </TableCell>
                          </TableRow>
                        ) : sharedTasks.sharedByMe.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Outdent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">You haven't shared any tasks</p>
                              <p className="text-gray-400 text-sm mt-2">
                                Share tasks from the "All Tasks" tab
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          sharedTasks.sharedByMe.map((task) => {
                            const userStatus = getUserStatus(task);
                            const assignedEmployees = task.employees || [];

                            return (
                              <TableRow 
                                key={task._id} 
                                className="hover:bg-purple-50 transition-colors duration-200"
                              >
                                <TableCell>
                                  <div>
                                    <p className="font-semibold text-gray-900">{task.title}</p>
                                    {task.clientName && (
                                      <p className="text-sm text-gray-600">{task.clientName}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {task.sharedTo ? (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        {task.sharedTo.profilePic ? (
                                          <AvatarImage src={task.sharedTo.profilePic} />
                                        ) : (
                                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                                            {task.sharedTo.name?.[0]}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-900">{task.sharedTo.name}</p>
                                        <p className="text-xs text-gray-500">{task.sharedTo.email}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">Not specified</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex -space-x-2">
                                    {assignedEmployees.slice(0, 3).map((emp, index) => (
                                      <Avatar 
                                        key={index} 
                                        className="h-8 w-8 border-2 border-white"
                                        title={emp.employeeId?.name}
                                      >
                                        {emp.employeeId?.profilePic ? (
                                          <AvatarImage src={emp.employeeId.profilePic} />
                                        ) : (
                                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                                            {emp.employeeId?.name?.[0]}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                    ))}
                                    {assignedEmployees.length > 3 && (
                                      <Avatar className="h-8 w-8 border-2 border-white bg-gray-300">
                                        <AvatarFallback className="text-gray-600 text-xs">
                                          +{assignedEmployees.length - 3}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {assignedEmployees.length} employee(s)
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Badge className={`${getStatusColor(userStatus)} text-white`}>
                                      Your: {userStatus}
                                    </Badge>
                                    <div className="text-xs text-gray-600">
                                      {assignedEmployees.filter(e => e.status === 'completed').length} / {assignedEmployees.length} completed
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => fetchTaskDetails(task._id)}
                                      size="sm"
                                      variant="outline"
                                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowShareDialog(true);
                                      }}
                                      size="sm"
                                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                                    >
                                      <Share2 className="w-4 h-4 mr-1" />
                                      Share More
                                    </Button>
                                    {assignedEmployees.length > 0 && (
                                      <Button
                                        onClick={() => {
                                          setTaskToRemove(task);
                                          setEmployeeToRemove(assignedEmployees[0].employeeId?._id);
                                          setShowRemoveDialog(true);
                                        }}
                                        size="sm"
                                        variant="destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Update Task Status</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the status of "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Status</label>
              <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Feedback (Optional)</label>
              <Textarea
                value={statusUpdate.feedback}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, feedback: e.target.value })}
                placeholder="Add any comments or feedback..."
                className="min-h-[100px] bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowStatusDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Task Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Share Task with Employee</DialogTitle>
            <DialogDescription className="text-gray-600">
              Share "{selectedTask?.title}" with another employee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Select Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px]">
                  {employees
                    .filter(emp => emp._id !== session?.user?.id) // Don't show yourself
                    .map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {emp.profilePic ? (
                            <AvatarImage src={emp.profilePic} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{emp.firstName} {emp.lastName}</span>
                        {emp.depId?.name && (
                          <Badge variant="secondary" className="text-xs">
                            {emp.depId.name}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowShareDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareTask}
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Shared Task Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Remove Task Access</DialogTitle>
            <DialogDescription className="text-gray-600">
              {taskToRemove && employeeToRemove === session?.user?.id
                ? `Remove yourself from "${taskToRemove.title}"?`
                : `Remove employee access from "${taskToRemove?.title}"?`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                {taskToRemove && employeeToRemove === session?.user?.id
                  ? "You will lose access to this task. This action cannot be undone."
                  : "The employee will lose access to this task. This action cannot be undone."
                }
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowRemoveDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveSharedTask}
                disabled={updating}
                variant="destructive"
                className="flex-1"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove Access
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto bg-white">
          {taskDetails && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                  Task Details
                </SheetTitle>
                <SheetDescription className="text-gray-600">
                  Complete information about this task
                </SheetDescription>
              </SheetHeader>

              {/* Task Header */}
              <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`${getPriorityColor(taskDetails.priority)} text-white font-bold text-sm`}>
                          {taskDetails.priority.toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(getUserStatus(taskDetails))} text-white font-bold text-sm`}>
                          {getUserStatus(taskDetails).replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{taskDetails.title}</h2>
                      {taskDetails.clientName && (
                        <div className="flex items-center gap-2 text-gray-700 mb-3">
                          <User className="w-4 h-4" />
                          <span className="font-medium">Client: {taskDetails.clientName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedTask(taskDetails);
                          setStatusUpdate({ status: getUserStatus(taskDetails), feedback: "" });
                          setShowStatusDialog(true);
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Update Status
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTask(taskDetails);
                          setShowShareDialog(true);
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Detailed Information */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-4 mb-6 bg-gray-100">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Eye className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="assignees" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Assignees
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attachments
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Clock4 className="w-4 h-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-line">
                        {taskDetails.description || "No description provided"}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CalendarDays className="w-5 h-5 text-blue-600" />
                          Dates
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">{formatDate(taskDetails.createdAt)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Assigned:</span>
                          <span className="font-medium">{formatDate(getAssignedDate(taskDetails))}</span>
                        </div>
                        {taskDetails.endDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-medium text-red-600">{formatDate(taskDetails.endDate)}</span>
                          </div>
                        )}
                        {taskDetails.completedAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Completed:</span>
                            <span className="font-medium text-green-600">{formatDate(taskDetails.completedAt)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{
                              taskDetails.employees?.length > 0 ? 
                              Math.round((taskDetails.employees.filter(e => e.status === 'completed').length / taskDetails.employees.length) * 100) : 
                              0
                            }%</span>
                          </div>
                          <Progress value={
                            taskDetails.employees?.length > 0 ? 
                            (taskDetails.employees.filter(e => e.status === 'completed').length / taskDetails.employees.length) * 100 : 
                            0
                          } />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{taskDetails.employees?.length || 0}</div>
                            <div className="text-sm text-gray-600">Employees</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">{taskDetails.teamleads?.length || 0}</div>
                            <div className="text-sm text-gray-600">Team Leads</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {taskDetails.departments && taskDetails.departments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="w-5 h-5 text-blue-600" />
                          Departments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {taskDetails.departments.map((dept, index) => (
                            <Badge key={index} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                              <Building className="w-3 h-3 mr-1" />
                              {dept.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Assignees Tab */}
                <TabsContent value="assignees" className="space-y-6">
                  {/* Submitted By */}
                  {taskDetails.submittedBy && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Send className="w-5 h-5 text-blue-600" />
                          Submitted By
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Avatar className="h-12 w-12">
                            {taskDetails.submittedBy.profilePic ? (
                              <AvatarImage src={taskDetails.submittedBy.profilePic} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                {taskDetails.submittedBy.name?.[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">{taskDetails.submittedBy.name}</h4>
                            <p className="text-sm text-gray-600">{taskDetails.submittedBy.email}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Shared By */}
                  {taskDetails.sharedBY && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Share2 className="w-5 h-5 text-blue-600" />
                          Shared By
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Avatar className="h-12 w-12">
                            {taskDetails.sharedBY.profilePic ? (
                              <AvatarImage src={taskDetails.sharedBY.profilePic} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {taskDetails.sharedBY.name?.[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">{taskDetails.sharedBY.name}</h4>
                            <p className="text-sm text-gray-600">{taskDetails.sharedBY.email}</p>
                            <Badge variant="outline" className="mt-1">
                              {taskDetails.sharedByModel}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Team Leads */}
                  {taskDetails.teamleads && taskDetails.teamleads.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-600" />
                          Team Leads ({taskDetails.teamleads.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {taskDetails.teamleads.map((tl, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {tl.teamleadId?.profilePic ? (
                                    <AvatarImage src={tl.teamleadId.profilePic} />
                                  ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">
                                      {tl.teamleadId?.name?.[0]}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{tl.teamleadId?.name}</h4>
                                  <p className="text-sm text-gray-600">{tl.teamleadId?.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={`${getStatusColor(tl.status)} text-white`}>
                                  {tl.status}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  Assigned: {formatDate(tl.assignedAt)}
                                </p>
                                {tl.completedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed: {formatDate(tl.completedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Employees */}
                  {taskDetails.employees && taskDetails.employees.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Employees ({taskDetails.employees.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {taskDetails.employees.map((emp, index) => {
                            const isCurrentUser = emp.employeeId?._id === session?.user?.id;
                            return (
                              <div 
                                key={index} 
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  isCurrentUser ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    {emp.employeeId?.profilePic ? (
                                      <AvatarImage src={emp.employeeId.profilePic} />
                                    ) : (
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                                        {emp.employeeId?.name?.[0]}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">{emp.employeeId?.name}</h4>
                                      {isCurrentUser && (
                                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs">
                                          You
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">{emp.employeeId?.email}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className={`${getStatusColor(emp.status)} text-white`}>
                                    {emp.status}
                                  </Badge>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Assigned: {formatDate(emp.assignedAt)}
                                  </p>
                                  {emp.completedAt && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Completed: {formatDate(emp.completedAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="space-y-6">
                  {/* File Attachment */}
                  {taskDetails.fileAttachments && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileIcon className="w-5 h-5 text-blue-600" />
                          File Attachment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <FileIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {taskDetails.fileName || "Download File"}
                              </h4>
                              {taskDetails.fileType && (
                                <p className="text-sm text-gray-600">Type: {taskDetails.fileType}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => downloadFile(taskDetails.fileAttachments, taskDetails.fileName)}
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Audio Attachment */}
                  {taskDetails.audioUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AudioWaveform className="w-5 h-5 text-blue-600" />
                          Audio Recording
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <AudioLines className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Audio Recording</h4>
                              <p className="text-sm text-gray-600">Listen or download the audio</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <audio controls className="h-10">
                              <source src={taskDetails.audioUrl} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                            <Button
                              onClick={() => downloadFile(taskDetails.audioUrl, "audio-recording.mp3")}
                              variant="outline"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!taskDetails.fileAttachments && !taskDetails.audioUrl && (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <Paperclip className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attachments</h3>
                        <p className="text-gray-600">This task has no files or audio attachments</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock4 className="w-5 h-5 text-blue-600" />
                        Task Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Task Created */}
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div className="w-0.5 h-8 bg-gray-300"></div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Task Created</h4>
                            <p className="text-sm text-gray-600">{formatDate(taskDetails.createdAt)}</p>
                            <p className="text-gray-700 mt-1">Task was created and assigned</p>
                          </div>
                        </div>

                        {/* Assigned to User */}
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div className="w-0.5 h-8 bg-gray-300"></div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Assigned to You</h4>
                            <p className="text-sm text-gray-600">{formatDate(getAssignedDate(taskDetails))}</p>
                            <p className="text-gray-700 mt-1">Task was assigned to you</p>
                          </div>
                        </div>

                        {/* Status Updates */}
                        {taskDetails.employees?.map((emp, index) => {
                          if (emp.employeeId?._id === session?.user?.id && emp.completedAt) {
                            return (
                              <div key={index} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                  <div className="w-0.5 h-8 bg-gray-300"></div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">Status Updated</h4>
                                  <p className="text-sm text-gray-600">{formatDate(emp.completedAt)}</p>
                                  <p className="text-gray-700 mt-1">You marked task as {emp.status}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}

                        {/* Due Date */}
                        {taskDetails.endDate && (
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <div className="w-0.5 h-8 bg-gray-300"></div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">Due Date</h4>
                              <p className="text-sm text-gray-600">{formatDate(taskDetails.endDate)}</p>
                              <p className="text-gray-700 mt-1">Task due date</p>
                            </div>
                          </div>
                        )}

                        {/* Task Completed */}
                        {taskDetails.completedAt && (
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">Task Completed</h4>
                              <p className="text-sm text-gray-600">{formatDate(taskDetails.completedAt)}</p>
                              <p className="text-gray-700 mt-1">Task was marked as completed</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setSelectedTask(taskDetails);
                    setStatusUpdate({ status: getUserStatus(taskDetails), feedback: "" });
                    setShowStatusDialog(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Update Status
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTask(taskDetails);
                    setShowShareDialog(true);
                  }}
                  variant="outline"
                  className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50 font-bold"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Task
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}