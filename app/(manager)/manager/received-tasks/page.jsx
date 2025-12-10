"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Eye,
  Mail,
  Building,
  RefreshCw,
  Share2,
  Users,
  Flag,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function ManagerReceivedTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [receivedTasks, setReceivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [teamleads, setTeamleads] = useState([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [searchTerm, setSearchTerm] = useState("");

  const [shareForm, setShareForm] = useState({
    sharedTo: "",
    parentTaskId: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchReceivedTasks();
    fetchTeamleads();
  }, [session, status, router]);

  const fetchReceivedTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/manager/received-tasks");
      if (response.data.success) {
        setReceivedTasks(response.data.receivedTasks || []);
      }
    } catch (error) {
      console.error("Error fetching received tasks:", error);
      toast.error("Failed to load received tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamleads = async () => {
    try {
      const response = await axios.get("/api/manager/teamlead");
      const teamleadsData =
        response.data.teamLeads || response.data.teamleads || [];
      setTeamleads(teamleadsData);

      if (teamleadsData.length === 0) {
        toast.info("No teamleads found. Please create teamleads first.");
      }
    } catch (error) {
      console.error("Error fetching teamleads:", error);
      toast.error("Failed to load teamleads");
      setTeamleads([]);
    }
  };

  const openShareDialog = (task) => {
    setSelectedTask(task);
    setShareForm({
      sharedTo: task.sharedTeamlead?._id || "",
      parentTaskId: task._id,
    });
    setShowShareDialog(true);
  };

  const handleShareWithTeamlead = async () => {
    if (!shareForm.sharedTo) {
      toast.error("Please select a teamlead");
      return;
    }

    setSharing(true);
    try {
      const response = await axios.patch(
        `/api/manager/received-tasks/${shareForm.parentTaskId}`,
        { sharedTo: shareForm.sharedTo }
      );

      if (response.data.success) {
        toast.success("Teamlead added successfully to task");
        setShowShareDialog(false);
        setShareForm({
          sharedTo: "",
          parentTaskId: "",
        });
        fetchReceivedTasks();
      }
    } catch (error) {
      console.error("Error adding teamlead to task:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add teamlead";
      toast.error(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Status color functions
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white border-yellow-600",
      signed: "bg-green-500 text-white border-green-600",
      not_avaiable: "bg-red-500 text-white border-red-600",
      not_intrested: "bg-orange-500 text-white border-orange-600",
      re_shedule: "bg-blue-500 text-white border-blue-600",
    };
    return colors[status] || "bg-gray-500 text-white border-gray-600";
  };

  const getVendorStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white border-yellow-600",
      approved: "bg-green-500 text-white border-green-600",
      not_approved: "bg-red-500 text-white border-red-600",
    };
    return colors[status] || "bg-gray-500 text-white border-gray-600";
  };

  const getMachineStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white border-yellow-600",
      deployed: "bg-green-500 text-white border-green-600",
      cancelled: "bg-red-500 text-white border-red-600",
    };
    return colors[status] || "bg-gray-500 text-white border-gray-600";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white border-red-600";
      case "medium":
        return "bg-yellow-500 text-white border-yellow-600";
      case "low":
        return "bg-green-500 text-white border-green-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };

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

  const formatSimpleDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter tasks based on search
  const filteredTasks = receivedTasks.filter(
    (task) =>
      task.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.originalTaskId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.sharedTeamlead?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      task.sharedTeamlead?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <p className="text-gray-700">Loading received tasks...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need to be logged in as Manager to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/manager/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Received Shared Tasks
              </h1>
              <p className="text-gray-700 mt-2">
                Tasks shared with you by other managers and teamleads
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                fetchReceivedTasks();
                fetchTeamleads();
              }}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Total Received
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {receivedTasks.length}
                  </p>
                </div>
                <Download className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    With Teamlead
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {receivedTasks.filter((t) => t.sharedTeamlead).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Pending Tasks
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {receivedTasks.filter((t) => t.status === "pending").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Available Teamleads
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {teamleads.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={`${
                      viewMode === "table"
                        ? "bg-gray-800 text-white shadow-sm hover:bg-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    Table View
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                    className={`${
                      viewMode === "card"
                        ? "bg-gray-800 text-white shadow-sm hover:bg-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    Card View
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Received Tasks
                </CardTitle>
                <CardDescription className="text-gray-700">
                  {filteredTasks.length} of {receivedTasks.length} tasks
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-800 border-gray-300"
                >
                  {receivedTasks.length} task
                  {receivedTasks.length !== 1 ? "s" : ""}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 border-purple-300"
                >
                  {teamleads.length} teamlead{teamleads.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Tasks Found
                </h3>
                <p className="text-gray-700 max-w-md mx-auto">
                  {searchTerm
                    ? "No tasks match your search criteria."
                    : "No tasks have been shared with you yet."}
                </p>
              </div>
            ) : viewMode === "table" ? (
              // Table View
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-900 font-semibold">
                        Task Title
                      </TableHead>
                      
                      <TableHead className="text-gray-900 font-semibold">
                        Assigned Teamlead
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Vendor Status
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Machine Status
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Priority
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Due Date
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {task.taskTitle}
                        </TableCell>
                       
                        <TableCell>
                          {task.sharedTeamlead ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-600" />
                              <span className="text-gray-900">
                                {task.sharedTeamlead.firstName}{" "}
                                {task.sharedTeamlead.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(task.status)} border`}
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getVendorStatusColor(
                              task.VendorStatus
                            )} border`}
                          >
                            {task.VendorStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getMachineStatusColor(
                              task.MachineStatus
                            )} border`}
                          >
                            {task.MachineStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getPriorityColor(
                              task.priority
                            )} border`}
                          >
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900">
                          {task.dueDate
                            ? formatSimpleDate(task.dueDate)
                            : "Not set"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openShareDialog(task)}
                              disabled={teamleads.length === 0}
                              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                            >
                              <Share2 className="w-4 h-4 mr-1" />
                              {task.sharedTeamlead ? "Change" : "Assign"}
                            </Button>
                            <Link href={`/manager/received-tasks/${task._id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Full Details
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Card View
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {task.taskTitle}
                              </h3>
                              <p className="text-sm text-gray-700 mb-2">
                                Original Task ID: {task.originalTaskId}
                              </p>
                              {task.taskDescription && (
                                <p className="text-gray-800 mb-3">
                                  {task.taskDescription}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                className={`${getPriorityColor(
                                  task.priority
                                )} border flex items-center gap-1 px-3 py-1 font-medium`}
                              >
                                <Flag className="w-3 h-3" />
                                {task.priority}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Status
                              </p>
                              <Badge
                                className={`${getStatusColor(
                                  task.status
                                )} border mt-1`}
                              >
                                {task.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Vendor Status
                              </p>
                              <Badge
                                className={`${getVendorStatusColor(
                                  task.VendorStatus
                                )} border mt-1`}
                              >
                                {task.VendorStatus}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Machine Status
                              </p>
                              <Badge
                                className={`${getMachineStatusColor(
                                  task.MachineStatus
                                )} border mt-1`}
                              >
                                {task.MachineStatus}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Due Date
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {task.dueDate
                                  ? formatSimpleDate(task.dueDate)
                                  : "Not set"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium text-gray-900">
                                From: {task.sharedManager?.firstName}{" "}
                                {task.sharedManager?.lastName}
                              </span>
                            </span>

                            {task.sharedTeamlead && (
                              <span className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full border border-purple-300">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">
                                  Teamlead: {task.sharedTeamlead.firstName}{" "}
                                  {task.sharedTeamlead.lastName}
                                </span>
                              </span>
                            )}
                          </div>

                          {task.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-900">
                                <strong>Notes:</strong> {task.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openShareDialog(task)}
                            className={`border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white ${
                              task.sharedTeamlead ? "bg-gray-100" : ""
                            }`}
                            disabled={teamleads.length === 0}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            {task.sharedTeamlead
                              ? "Change Teamlead"
                              : "Assign Teamlead"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTaskExpansion(task._id)}
                            className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                          >
                            {expandedTasks[task._id] ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-2" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                View Details
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {expandedTasks[task._id] && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Task Details
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  Created
                                </p>
                                <p className="text-gray-900">
                                  {formatDate(task.createdAt)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  Last Updated
                                </p>
                                <p className="text-gray-900">
                                  {formatDate(task.updatedAt)}
                                </p>
                              </div>
                              {task.sharedEmployee && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Shared Employee
                                  </p>
                                  <p className="text-gray-900">
                                    {task.sharedEmployee.firstName}{" "}
                                    {task.sharedEmployee.lastName}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Form Data
                            </h4>
                            {task.formId?.formData &&
                            Object.keys(task.formId.formData).length > 0 ? (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {Object.entries(task.formId.formData).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="bg-white p-3 rounded-lg border border-gray-200"
                                    >
                                      <label className="text-sm font-medium text-gray-700 capitalize mb-1 block">
                                        {key.replace(/([A-Z])/g, " $1").trim()}
                                      </label>
                                      <p className="text-gray-900">
                                        {Array.isArray(value)
                                          ? value.join(", ")
                                          : value === null ||
                                            value === undefined
                                          ? "Not provided"
                                          : String(value)}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No form data available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {selectedTask?.sharedTeamlead
                ? "Change Teamlead"
                : "Assign Teamlead to Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Task Details</h4>
              <p className="text-blue-900">
                <strong>Title:</strong> {selectedTask?.taskTitle}
              </p>
              <p className="text-blue-900">
                <strong>Task ID:</strong> {selectedTask?.originalTaskId}
              </p>
              {selectedTask?.sharedTeamlead && (
                <p className="text-blue-900">
                  <strong>Current Teamlead:</strong>{" "}
                  {selectedTask.sharedTeamlead.firstName}{" "}
                  {selectedTask.sharedTeamlead.lastName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Select Teamlead *
              </label>
              <Select
                value={shareForm.sharedTo}
                onValueChange={(value) =>
                  setShareForm({ ...shareForm, sharedTo: value })
                }
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select teamlead" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {teamleads?.length > 0 ? (
                    teamleads.map((teamlead) => (
                      <SelectItem key={teamlead._id} value={teamlead._id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900">
                            {teamlead.firstName} {teamlead.lastName}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs text-gray-600"
                          >
                            {teamlead.depId?.name || "No Department"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No teamleads available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowShareDialog(false)}
                disabled={sharing}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareWithTeamlead}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={
                  sharing || !shareForm.sharedTo || teamleads.length === 0
                }
              >
                {sharing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {selectedTask?.sharedTeamlead
                      ? "Updating..."
                      : "Assigning..."}
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    {selectedTask?.sharedTeamlead
                      ? "Change Teamlead"
                      : "Assign Teamlead"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
