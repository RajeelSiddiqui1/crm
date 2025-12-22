"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  X,
  MessageCircle,
  Filter,
  Download,
  MoreVertical,
  ChevronRight,
  Target,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  Info,
  MessageSquare,
  Send,
  Users,
  Building,
  Briefcase,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Shield,
  UserCog,
  Users2,
  FolderTree,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function EmployeeTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedTaskForFeedback, setSelectedTaskForFeedback] = useState(null);
  const [showManagerDetails, setShowManagerDetails] = useState(false);
  const [showTeamLeadDetails, setShowTeamLeadDetails] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Employee") {
      router.push("/employeelogin");
      return;
    }

    fetchTasks();
  }, [session, status, router]);

  const fetchTasks = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/employee/tasks");
      if (response.status === 200) {
        setTasks(response.data || []);
        toast.success("Tasks updated successfully", {
          icon: "🔄",
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again");
        router.push("/login");
      } else {
        toast.error(error.response?.data?.error || "Failed to fetch tasks");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus, feedback = "") => {
    setLoading(true);
    const statusText = newStatus.replace("_", " ");

    try {
      const updateData = {
        submissionId: taskId,
        status: newStatus,
        feedback: feedback,
      };

      const response = await axios.put("/api/employee/tasks", updateData);

      if (response.status === 200) {
        toast.success(`✅ Task marked as ${statusText}`, {
          description: feedback ? "Feedback submitted successfully" : "",
        });
        fetchTasks();
        setShowDetails(false);
        setFeedback("");
        setShowFeedbackDialog(false);
      }
    } catch (error) {
      console.error("Status update error:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again");
        router.push("/login");
      } else {
        toast.error(error.response?.data?.error || "Failed to update status");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (taskId, newStatus) => {
    setLoading(true);
    try {
      const updateData = {
        submissionId: taskId,
        status: newStatus,
      };

      const response = await axios.put("/api/employee/tasks", updateData);

      if (response.status === 200) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        fetchTasks();
      }
    } catch (error) {
      console.error("Quick status update error:", error);
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackDialog = (task) => {
    setSelectedTaskForFeedback(task);
    setFeedback(task.employeeFeedback || "");
    setShowFeedbackDialog(true);
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: <CheckCircle className="w-3 h-3" />,
          color: "emerald"
        };
      case "approved":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: <CheckCircle className="w-3 h-3" />,
          color: "green"
        };
      case "in_progress":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: <TrendingUp className="w-3 h-3" />,
          color: "blue"
        };
      case "pending":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: <Clock className="w-3 h-3" />,
          color: "amber"
        };
      case "rejected":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: <XCircle className="w-3 h-3" />,
          color: "red"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
          icon: <AlertCircle className="w-3 h-3" />,
          color: "gray"
        };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-emerald-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.clinetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.formId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.employeeStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.submittedBy?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.submittedBy?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.employeeStatus === statusFilter;

    const matchesTab =
      activeTab === "all" || task.employeeStatus === activeTab;

    return matchesSearch && matchesStatus && matchesTab;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <div className="space-y-1 text-sm">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="font-medium text-gray-700 capitalize min-w-[100px]">
                {key}:
              </span>
              <span className="text-gray-900">{val || "N/A"}</span>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <Badge
          variant={value ? "default" : "outline"}
          className={value ? "bg-emerald-100 text-emerald-800" : ""}
        >
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    return value.toString();
  };

  const statusStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.employeeStatus === "pending").length,
    in_progress: tasks.filter((t) => t.employeeStatus === "in_progress").length,
    completed: tasks.filter((t) => t.employeeStatus === "completed").length,
    rejected: tasks.filter((t) => t.employeeStatus === "rejected").length,
  };

  const completionPercentage =
    tasks.length > 0
      ? Math.round((statusStats.completed / tasks.length) * 100)
      : 0;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Employee") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-4 sm:p-6 overflow-x-hidden">
      <Toaster position="top-right" richColors />

      <div className="max-w-[100vw] mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Task Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back,{" "}
              <span className="font-semibold text-blue-600">
                {session.user.firstName}
              </span>
              ! Manage your assigned tasks efficiently.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchTasks}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-50"
              disabled={fetching}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${fetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push("/group-chat")}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Tasks</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {statusStats.total}
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-amber-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Pending</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {statusStats.pending}
                  </h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-emerald-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    In Progress
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {statusStats.in_progress}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {statusStats.completed}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Completion Progress</h3>
                <p className="text-sm text-gray-600">
                  {statusStats.completed} of {statusStats.total} tasks completed
                </p>
              </div>
              <span className="font-bold text-blue-600">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  My Tasks
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}{" "}
                  found
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64 text-gray-900">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-900" />
                  <Input
                    placeholder="Search tasks, client names, managers..."
                    className="pl-10 text-gray-900 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-gray-900">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900  border border-gray-200 shadow-lg">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-6"
            >
              <TabsList className="bg-gray-100 p-1">
                <TabsTrigger
                  value="all"
                  className="text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  All ({tasks.length})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Pending ({statusStats.pending})
                </TabsTrigger>
                <TabsTrigger
                  value="in_progress"
                  className="text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  In Progress ({statusStats.in_progress})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Completed ({statusStats.completed})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tasks...</p>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tasks.length === 0 ? "No tasks assigned yet" : "No tasks found"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {tasks.length === 0
                    ? "When tasks are assigned to you, they will appear here."
                    : "Try adjusting your search or filter criteria."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table with Expandable Rows */}
                <Table className="hidden lg:table">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-[30px] text-gray-700 font-semibold"></TableHead>
                      <TableHead className="w-[300px] text-gray-700 font-semibold">
                        Client & Task
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Department
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Manager
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Team Lead
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Your Status
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => {
                      const statusVariant = getStatusVariant(task.employeeStatus);
                      const isExpanded = expandedTasks[task._id];
                      
                      return (
                        <React.Fragment key={task._id}>
                          <TableRow
                            className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                            onClick={() => toggleTaskExpansion(task._id)}
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-white shadow">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                    {task.clinetName?.[0]?.toUpperCase() || "C"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {task.clinetName || "Unnamed Client"}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {task.formId?.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    Assigned: {formatDate(task.assignedAt)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  {task.depId?.name || "No Department"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-purple-500" />
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {task.submittedBy?.email || "No email"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {task.assignedTo?.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-orange-500" />
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      {task.assignedTo[0]?.firstName} {task.assignedTo[0]?.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {task.assignedTo[0]?.email || "No email"}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No Team Lead</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`${statusVariant.bg} ${statusVariant.text} ${statusVariant.border} border flex items-center gap-1 px-3 py-1`}
                                >
                                  {statusVariant.icon}
                                  {task.employeeStatus.replace("_", " ")}
                                </Badge>
                                <Select
                                  onValueChange={(value) =>
                                    handleQuickStatusUpdate(task._id, value)
                                  }
                                  disabled={loading}
                                >
                                  <SelectTrigger className="w-28 h-8 border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
                                    <SelectValue placeholder="Update" className="text-gray-900" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
                                    <SelectItem value="pending">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Pending
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                      <div className="flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3" />
                                        In Progress
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3" />
                                        Completed
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="w-3 h-3" />
                                        Rejected
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-gray-900 hover:bg-gray-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setShowDetails(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFeedbackDialog(task);
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                              </div>
                              <Link
                              href={`/group-chat?submissionId=${task._id}`}
                            >
                              <Button
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2 rounded-md shadow-sm transition mt-2"
                                size="sm"
                              >
                                <Eye className="w-3 h-3" />
                                Chat
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <TableRow className="bg-blue-50/30">
                              <TableCell colSpan={7} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Manager Details */}
                                  <Card className="border border-blue-100">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <UserCog className="w-5 h-5 text-purple-600" />
                                        <h4 className="font-semibold text-gray-900">Manager Details</h4>
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4 text-gray-400" />
                                          <span className="font-medium">Name:</span>
                                          <span>{task.submittedBy?.firstName} {task.submittedBy?.lastName}</span>
                                        </div>
                                        {task.submittedBy?.email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">Email:</span>
                                            <span className="truncate">{task.submittedBy.email}</span>
                                          </div>
                                        )}
                                        {task.submittedBy?.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">Phone:</span>
                                            <span>{task.submittedBy.phone}</span>
                                          </div>
                                        )}
                                        <div className="mt-3">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTask(task);
                                              setShowManagerDetails(true);
                                            }}
                                          >
                                            View Full Manager Info
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Team Lead Details */}
                                  <Card className="border border-orange-100">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-5 h-5 text-orange-600" />
                                        <h4 className="font-semibold text-gray-900">Team Lead Details</h4>
                                      </div>
                                      {task.assignedTo?.length > 0 ? (
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">Name:</span>
                                            <span>{task.assignedTo[0]?.firstName} {task.assignedTo[0]?.lastName}</span>
                                          </div>
                                          {task.assignedTo[0]?.email && (
                                            <div className="flex items-center gap-2">
                                              <Mail className="w-4 h-4 text-gray-400" />
                                              <span className="font-medium">Email:</span>
                                              <span className="truncate">{task.assignedTo[0].email}</span>
                                            </div>
                                          )}
                                          {task.assignedTo[0]?.department && (
                                            <div className="flex items-center gap-2">
                                              <Building className="w-4 h-4 text-gray-400" />
                                              <span className="font-medium">Department:</span>
                                              <span>{task.assignedTo[0].department}</span>
                                            </div>
                                          )}
                                          {task.teamLeadFeedback && (
                                            <div className="mt-2 pt-2 border-t">
                                              <div className="flex items-center gap-2 mb-1">
                                                <MessageSquare className="w-4 h-4 text-orange-500" />
                                                <span className="font-medium">Feedback:</span>
                                              </div>
                                              <p className="text-sm text-gray-600 italic">
                                                "{task.teamLeadFeedback}"
                                              </p>
                                            </div>
                                          )}
                                          <div className="mt-3">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTask(task);
                                                setShowTeamLeadDetails(true);
                                              }}
                                            >
                                              View Full Team Lead Info
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-4">
                                          <p className="text-gray-500 text-sm">No Team Lead Assigned</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>

                                  {/* Task Status & Feedback */}
                                  <Card className="border border-emerald-100">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                        <h4 className="font-semibold text-gray-900">Task Status</h4>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">Manager Status</div>
                                          <Badge className={`${getStatusVariant(task.status).bg} ${getStatusVariant(task.status).text} ${getStatusVariant(task.status).border}`}>
                                            {task.status?.replace("_", " ") || "N/A"}
                                          </Badge>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">Team Lead Status</div>
                                          <Badge className={`${getStatusVariant(task.status2).bg} ${getStatusVariant(task.status2).text} ${getStatusVariant(task.status2).border}`}>
                                            {task.status2?.replace("_", " ") || "N/A"}
                                          </Badge>
                                        </div>
                                        {task.managerComments && (
                                          <div className="pt-2 border-t">
                                            <div className="text-xs text-gray-500 mb-1">Manager Comments</div>
                                            <p className="text-sm text-gray-700 italic">
                                              "{task.managerComments}"
                                            </p>
                                          </div>
                                        )}
                                        {task.employeeFeedback && (
                                          <div className="pt-2 border-t">
                                            <div className="text-xs text-gray-500 mb-1">Your Feedback</div>
                                            <p className="text-sm text-gray-700 italic">
                                              "{task.employeeFeedback}"
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Mobile View */}
                <div className="block lg:hidden space-y-3 p-4">
                  {filteredTasks.map((task) => {
                    const statusVariant = getStatusVariant(task.employeeStatus);
                    return (
                      <Card
                        key={task._id}
                        className="border border-gray-200 hover:border-blue-200 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {task.clinetName || "Unnamed Client"}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {task.formId?.title}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                {task.formId?.description || "No description"}
                              </p>
                            </div>
                            <Badge
                              className={`${statusVariant.bg} ${statusVariant.text} ${statusVariant.border} border flex items-center gap-1`}
                            >
                              {statusVariant.icon}
                              <span className="text-xs font-medium">
                                {task.employeeStatus.replace("_", " ")}
                              </span>
                            </Badge>
                          </div>

                          <div className="space-y-3 mt-3">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Building className="w-3 h-3" />
                                <span>{task.depId?.name || "No Dept"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(task.assignedAt)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-600 border-purple-200"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowManagerDetails(true);
                                }}
                              >
                                <UserCog className="w-4 h-4 mr-2" />
                                Manager
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600 border-orange-200"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowTeamLeadDetails(true);
                                }}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Team Lead
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-gray-700 border-gray-300"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-200"
                                onClick={() => openFeedbackDialog(task)}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Task Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              View and manage task details
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="overflow-y-auto max-h-[70vh] pr-2 space-y-6">
              {/* Task Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedTask.clinetName || "Unnamed Client"}
                    </h3>
                    <p className="text-gray-600">
                      {selectedTask.formId?.title}
                    </p>
                    {selectedTask.depId && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                        <Building className="w-4 h-4" />
                        <span>Department: {selectedTask.depId.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={`${getStatusVariant(selectedTask.employeeStatus).bg} ${getStatusVariant(selectedTask.employeeStatus).text} ${getStatusVariant(selectedTask.employeeStatus).border} border flex items-center gap-2 px-3 py-1`}
                    >
                      {getStatusVariant(selectedTask.employeeStatus).icon}
                      {selectedTask.employeeStatus.replace("_", " ")}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Assigned: {formatFullDate(selectedTask.assignedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stakeholders Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manager Details Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <UserCog className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Manager</h4>
                        <Badge className="text-sm text-white bg-green-900">Task Submitted By</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">Name:</span>
                        <span className="text-blue-900">{selectedTask.submittedBy?.firstName} {selectedTask.submittedBy?.lastName}</span>
                      </div>
                      {selectedTask.submittedBy?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">Email:</span>
                          <span className="text-blue-900">{selectedTask.submittedBy.email}</span>
                        </div>
                      )}
                      {selectedTask.managerComments && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-purple-500" />
                            <span className="font-medium text-gray-900">Manager Comments</span>
                          </div>
                          <p className="text-sm text-gray-900 italic">
                            "{selectedTask.managerComments}"
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Lead Details Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Shield className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Team Lead</h4>
                        <Badge className="text-sm text-white bg-green-900">Task Supervisor</Badge>
                      </div>
                    </div>
                    {selectedTask.assignedTo?.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">Name:</span>
                          <span className="text-blue-900">{selectedTask.assignedTo[0]?.firstName} {selectedTask.assignedTo[0]?.lastName}</span>
                        </div>
                        {selectedTask.assignedTo[0]?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">Email:</span>
                            <span className="text-blue-900">{selectedTask.assignedTo[0].email}</span>
                          </div>
                        )}
                        {selectedTask.assignedTo[0]?.department && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Department:</span>
                            <span>{selectedTask.assignedTo[0].department}</span>
                          </div>
                        )}
                        {selectedTask.teamLeadFeedback && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-orange-500" />
                              <span className="font-medium text-gray-900">Team Lead Feedback</span>
                            </div>
                            <p className="text-sm text-gray-600 italic">
                              "{selectedTask.teamLeadFeedback}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No Team Lead Assigned</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Manager Status
                        </p>
                        <Badge
                          variant="outline"
                          className={`${getStatusVariant(selectedTask.status).bg} ${getStatusVariant(selectedTask.status).text} ${getStatusVariant(selectedTask.status).border} border mt-1`}
                        >
                          {selectedTask.status?.replace("_", " ") || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          TeamLead Status
                        </p>
                        <Badge
                          variant="outline"
                          className={`${getStatusVariant(selectedTask.status2).bg} ${getStatusVariant(selectedTask.status2).text} ${getStatusVariant(selectedTask.status2).border} border mt-1`}
                        >
                          {selectedTask.status2?.replace("_", " ") || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Your Current Status
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={`${getStatusVariant(selectedTask.employeeStatus).bg} ${getStatusVariant(selectedTask.employeeStatus).text} ${getStatusVariant(selectedTask.employeeStatus).border} border`}
                          >
                            {selectedTask.employeeStatus.replace("_", " ")}
                          </Badge>
                          {selectedTask.completedAt && (
                            <span className="text-xs text-gray-500">
                              Completed: {formatDate(selectedTask.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Form Data */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Form Data
                </h4>
                <div className="space-y-3">
                  {selectedTask.formData &&
                    Object.entries(selectedTask.formData).map(([key, value]) => (
                      <Card key={key} className="border border-gray-200">
                        <CardContent className="p-4">
                          <Label className="text-sm font-medium text-gray-700 capitalize mb-2 block">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </Label>
                          <div className="text-gray-900">
                            {formatFieldValue(value)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Previous Feedback */}
              {selectedTask.employeeFeedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      Your Previous Feedback
                    </h4>
                  </div>
                  <p className="text-blue-800 italic">
                    "{selectedTask.employeeFeedback}"
                  </p>
                </div>
              )}

              {/* Update Section */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Update Task Status
                </h4>
                <div className="space-y-4">
                  <div>

                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { status: "pending", label: "Mark as Pending", color: "amber" },
                      { status: "in_progress", label: "Start Progress", color: "blue" },
                      { status: "completed", label: "Mark Completed", color: "emerald" },
                      { status: "rejected", label: "Reject Task", color: "red" },
                    ].map((action) => (
                      <Button
                        key={action.status}
                        onClick={() =>
                          handleStatusUpdate(
                            selectedTask._id,
                            action.status,
                            feedback
                          )
                        }
                        className={`
                          ${action.color === 'amber' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' : ''}
                          ${action.color === 'blue' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' : ''}
                          ${action.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : ''}
                          ${action.color === 'red' ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200' : ''}
                          border font-medium
                        `}
                        disabled={loading}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manager Details Modal */}
      <Dialog open={showManagerDetails} onOpenChange={setShowManagerDetails}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-purple-600" />
              Manager Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the manager
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-purple-200">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg">
                    {selectedTask.submittedBy?.firstName?.[0]}
                    {selectedTask.submittedBy?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedTask.submittedBy?.firstName} {selectedTask.submittedBy?.lastName}
                  </h3>
                  <p className="text-purple-600 font-medium">Manager</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium truncate">
                        {selectedTask.submittedBy?.email || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {selectedTask.submittedBy?.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTask.managerComments && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <Label className="text-sm text-gray-500 block mb-2">Manager Comments</Label>
                    <p className="text-purple-800 italic">
                      "{selectedTask.managerComments}"
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Manager Role</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    This manager submitted the task and will receive notifications about task updates.
                    They have full visibility into task progress and your performance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Lead Details Modal */}
      <Dialog open={showTeamLeadDetails} onOpenChange={setShowTeamLeadDetails}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Team Lead Details
            </DialogTitle>
            <DialogDescription>
              Information about your team lead supervisor
            </DialogDescription>
          </DialogHeader>

          {selectedTask && selectedTask.assignedTo?.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-orange-200">
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-600 text-white text-lg">
                    {selectedTask.assignedTo[0]?.firstName?.[0]}
                    {selectedTask.assignedTo[0]?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedTask.assignedTo[0]?.firstName} {selectedTask.assignedTo[0]?.lastName}
                  </h3>
                  <p className="text-orange-600 font-medium">Team Lead</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium truncate">
                        {selectedTask.assignedTo[0]?.email || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Department</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {selectedTask.assignedTo[0]?.department || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTask.teamLeadFeedback && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <Label className="text-sm text-gray-500 block mb-2">Team Lead Feedback</Label>
                    <p className="text-orange-800 italic">
                      "{selectedTask.teamLeadFeedback}"
                    </p>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Team Lead Role</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your team lead supervises this task, provides guidance, and reviews your work.
                    They can update task status and provide feedback on your performance.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Team Lead Assigned</h3>
              <p className="text-gray-600">
                This task does not have a team lead assigned yet.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Add Feedback
            </DialogTitle>
            <DialogDescription>
              Provide feedback for{" "}
              <span className="font-semibold">
                {selectedTaskForFeedback?.clinetName || "this task"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your detailed feedback here..."
                className="min-h-[120px] bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTaskForFeedback) {
                    handleStatusUpdate(
                      selectedTaskForFeedback._id,
                      selectedTaskForFeedback.employeeStatus,
                      feedback
                    );
                  }
                }}
                disabled={loading || !feedback.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}