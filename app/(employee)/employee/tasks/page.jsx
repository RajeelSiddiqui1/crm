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
} from "lucide-react";
import axios from "axios";

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
        toast.success(`Loaded ${response.data.length} tasks`);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
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

    try {
      const updateData = {
        submissionId: taskId,
        status: newStatus,
        feedback: feedback,
      };

      const response = await axios.put("/api/employee/tasks", updateData);

      if (response.status === 200) {
        toast.success("Status updated successfully!");
        fetchTasks();
        setShowDetails(false);
        setFeedback("");
      }
    } catch (error) {
      console.error("Status update error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
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

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.formId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.employeeStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.status2?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.employeeStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-gray-500">Not provided</span>;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <div className="space-y-1 text-sm">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex">
              <span className="font-medium capitalize w-20">{key}:</span>
              <span className="text-gray-900">{val || "N/A"}</span>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-900">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Employee") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need to be logged in as Employee to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6 overflow-x-hidden">
      <Toaster position="top-right" />

      <div className="max-w-[100vw] mx-auto w-full flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              My Assigned Tasks
            </h1>
            <p className="text-gray-800 mt-1 sm:mt-2 text-sm sm:text-base">
              Welcome, {session.user.firstName}! Manage your assigned tasks
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={fetchTasks}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 flex-1 sm:flex-none text-xs sm:text-sm"
              disabled={fetching}
              size="sm"
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${fetching ? "animate-spin" : ""}`}
              />
              {fetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Tasks", value: statusStats.total, color: "gray" },
            { label: "Pending", value: statusStats.pending, color: "yellow" },
            { label: "In Progress", value: statusStats.in_progress, color: "blue" },
            { label: "Completed", value: statusStats.completed, color: "green" },
          ].map((stat, index) => (
            <Card key={index} className="bg-white border-0 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className={`text-lg sm:text-xl font-bold ${
                  stat.color === 'gray' ? 'text-gray-900' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  stat.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm overflow-hidden flex-1 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100/50 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">
                  My Tasks
                </CardTitle>
                <CardDescription className="text-gray-700 text-sm">
                  {filteredTasks.length} task
                  {filteredTasks.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-7 pr-3 focus:border-green-500 focus:ring-1 focus:ring-green-200 shadow-sm h-9 text-sm text-gray-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36 focus:border-green-500 focus:ring-1 focus:ring-green-200 text-gray-900 h-9 text-sm">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent className="text-black bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {fetching ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex items-center gap-2 text-gray-800">
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  <span className="text-sm">Loading tasks...</span>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-300 mb-3">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  {tasks.length === 0 ? "No tasks assigned" : "No matches found"}
                </h3>
                <p className="text-gray-700 text-sm max-w-md mx-auto">
                  {tasks.length === 0
                    ? "Tasks assigned to you will appear here."
                    : "Try adjusting your search terms."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile View - Cards */}
                <div className="block lg:hidden space-y-3 p-3">
                  {filteredTasks.map((task) => (
                    <Card key={task._id} className="p-3 hover:shadow-md transition-shadow duration-200">
                      <CardContent className="space-y-3 p-0">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Avatar className="border-2 border-white shadow w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xs font-bold">
                                <FileText className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                {task.formId?.title || "Untitled Task"}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">
                                Assigned by: {task.assignedTo}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${getStatusVariant(
                              task.employeeStatus
                            )} text-xs font-semibold capitalize px-2 py-1 rounded border flex items-center gap-1 flex-shrink-0 ml-2`}
                          >
                            {getStatusIcon(task.employeeStatus)}
                            <span className="hidden sm:inline">
                              {task.employeeStatus.replace("_", " ")}
                            </span>
                            <span className="sm:hidden">
                              {task.employeeStatus === 'completed' ? 'Done' : 
                               task.employeeStatus === 'in_progress' ? 'Progress' : 
                               task.employeeStatus === 'pending' ? 'Pending' : 
                               task.employeeStatus.slice(0,3)}
                            </span>
                          </Badge>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            M: {task.status?.replace("_", " ") || "N/A"}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                            TL: {task.status2?.replace("_", " ") || "N/A"}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Assigned:</span>
                            <p className="font-medium">{formatDate(task.assignedAt).split(',')[0]}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Select
                            onValueChange={(value) =>
                              handleQuickStatusUpdate(task._id, value)
                            }
                            disabled={loading}
                            className="flex-1"
                          >
                            <SelectTrigger className="w-full h-7 text-xs border-gray-300">
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200">
                              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                              <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowDetails(true);
                            }}
                            className="bg-gray-900 text-white hover:bg-gray-800 text-xs h-7 flex-1"
                            size="sm"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-green-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-gray-900 text-sm py-3 w-[250px]">
                          Task Details
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-3 w-[100px]">
                          Manager
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-3 w-[100px]">
                          TeamLead
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-3 w-[100px]">
                          Your Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-3 w-[120px]">
                          Quick Actions
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-3 w-[150px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow
                          key={task._id}
                          className="group hover:bg-gradient-to-r hover:from-green-50/80 hover:to-blue-50/80 transition-all duration-300 border-b border-gray-100/50"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="border-2 border-white shadow w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-sm">
                                  <FileText className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 text-sm group-hover:text-green-700 transition-colors duration-200 truncate">
                                  {task.ClinetName || "No Client"}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  Assigned by: {task.assignedTo}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Calendar className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">
                                    {formatDate(task.assignedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              className={`${getStatusVariant(
                                task.status
                              )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                            >
                              {getStatusIcon(task.status)}
                              {task.status?.replace("_", " ") || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              className={`${getStatusVariant(
                                task.status2
                              )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                            >
                              {getStatusIcon(task.status2)}
                              {task.status2?.replace("_", " ") || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              className={`${getStatusVariant(
                                task.employeeStatus
                              )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                            >
                              {getStatusIcon(task.employeeStatus)}
                              {task.employeeStatus.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Select
                              onValueChange={(value) =>
                                handleQuickStatusUpdate(task._id, value)
                              }
                              disabled={loading}
                            >
                              <SelectTrigger className="w-28 h-7 text-xs border-gray-300">
                                <SelectValue placeholder="Update" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 min-w-[120px]">
                                <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                                <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                                <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowDetails(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="border-green-200 text-green-700 hover:bg-green-50 text-xs h-7"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </Button>
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/group-chat?submissionId=${task._id}`
                                  )
                                }
                                variant="outline"
                                size="sm"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs h-7"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        {showDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-blue-700 text-white p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-white text-lg truncate">
                      {selectedTask.formId?.title || "Task Details"}
                    </CardTitle>
                    <CardDescription className="text-green-100 text-sm truncate">
                      View task details and update your status
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedTask(null);
                      setFeedback("");
                    }}
                    className="h-7 w-7 text-white hover:bg-white/20 flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="space-y-4">
                  {/* Task Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Task Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm">
                          Assigned Date
                        </Label>
                        <p className="text-gray-900 font-medium text-sm">
                          {formatDate(selectedTask.assignedAt)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm">
                          Manager Status
                        </Label>
                        <Badge
                          className={`${getStatusVariant(
                            selectedTask.status
                          )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                        >
                          {getStatusIcon(selectedTask.status)}
                          {selectedTask.status?.replace("_", " ") || "N/A"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-gray-800 font-semibold text-sm">
                          TeamLead Status
                        </Label>
                        <Badge
                          className={`${getStatusVariant(
                            selectedTask.status2
                          )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                        >
                          {getStatusIcon(selectedTask.status2)}
                          {selectedTask.status2?.replace("_", " ") || "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-gray-800 font-semibold text-sm">
                        Your Status
                      </Label>
                      <Badge
                        className={`${getStatusVariant(
                          selectedTask.employeeStatus
                        )} border flex items-center gap-1 px-2 py-1 font-medium text-sm`}
                      >
                        {getStatusIcon(selectedTask.employeeStatus)}
                        {selectedTask.employeeStatus.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  {/* Form Data */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Form Data
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedTask.formData &&
                        Object.entries(selectedTask.formData).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="border border-gray-200 rounded-lg p-3 bg-white"
                            >
                              <Label className="text-gray-800 font-semibold capitalize text-sm block mb-1">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </Label>
                              <div className="text-gray-900 font-medium text-sm">
                                {formatFieldValue(value)}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </div>

                  {/* Update Status */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Update Your Status
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { status: "pending", label: "Pending", variant: "outline", color: "yellow" },
                        { status: "in_progress", label: "In Progress", variant: "outline", color: "blue" },
                        { status: "completed", label: "Completed", variant: "default", color: "green" },
                        { status: "rejected", label: "Rejected", variant: "default", color: "red" },
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
                          variant={action.variant}
                          className={
                            action.variant === "default" 
                              ? `bg-${action.color}-600 text-white hover:bg-${action.color}-700 text-sm`
                              : `border-${action.color}-200 text-${action.color}-700 hover:bg-${action.color}-50 text-sm`
                          }
                          disabled={loading}
                          size="sm"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback" className="text-gray-800 font-semibold text-sm">
                        Feedback (Optional)
                      </Label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Add your feedback or comments about this task..."
                        className="focus:border-green-500 focus:ring-1 focus:ring-green-200 text-gray-900 text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}