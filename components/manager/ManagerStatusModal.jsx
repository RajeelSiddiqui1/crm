// components/ManagerStatusModal.jsx (Updated)
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Eye,
  FileText,
  MessageSquare,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  XCircle,
  User,
  Mail,
  ExternalLink,
  Filter,
  Search,
  Copy,
  AlertTriangle,
  Users,
  FileUp,
  ThumbsUp,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  Globe,
  Phone,
  Hash,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ManagerStatusModal({
  isOpen,
  onClose,
  task,
  currentManagerId,
  isManagerView = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedManager, setExpandedManager] = useState(null);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [allManagers, setAllManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    "in-progress": 0,
    rejected: 0,
    pending: 0,
  });

  // Fetch all managers' statuses
  useEffect(() => {
    if (task?._id && isOpen) {
      fetchAllManagersStatus();
    }
  }, [task?._id, isOpen]);

  const fetchAllManagersStatus = async () => {
    if (!task?._id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/manager/admin-tasks/${task._id}/managers?status=all`);
      const data = await response.json();
      
      if (data.success) {
        setAllManagers(data.managers || []);
        setStatistics(data.statistics || statistics);
        
        // Initially show all managers
        const filtered = filterManagers(data.managers || []);
        setFilteredManagers(filtered);
      } else {
        toast.error(data.message || "Failed to load manager statuses");
      }
    } catch (error) {
      console.error("Error fetching manager statuses:", error);
      toast.error("Failed to load manager statuses");
    } finally {
      setLoading(false);
    }
  };

  const filterManagers = (managersList) => {
    if (!managersList || managersList.length === 0) {
      return [];
    }

    return managersList.filter((manager) => {
      const response = getManagerResponse(manager._id);
      const managerName = getManagerName(manager).toLowerCase();
      const managerEmail = (manager.email || "").toLowerCase();
      const departments = getManagerDepartments(manager).toLowerCase();

      // Search filter
      const searchMatch =
        searchQuery === "" ||
        managerName.includes(searchQuery.toLowerCase()) ||
        managerEmail.includes(searchQuery.toLowerCase()) ||
        departments.includes(searchQuery.toLowerCase());

      // Status filter
      const statusMatch =
        statusFilter === "all" ||
        (response?.status === statusFilter) ||
        (!response && statusFilter === "pending");

      // Tab filter
      let tabMatch = true;
      if (activeTab === "responded") {
        tabMatch = !!response;
      } else if (activeTab === "pending") {
        tabMatch = !response;
      } else if (activeTab === "completed") {
        tabMatch = response?.status === "completed";
      } else if (activeTab === "rejected") {
        tabMatch = response?.status === "rejected";
      } else if (activeTab === "in-progress") {
        tabMatch = response?.status === "in-progress";
      }

      return searchMatch && statusMatch && tabMatch;
    });
  };

  useEffect(() => {
    if (allManagers.length > 0) {
      const filtered = filterManagers(allManagers);
      setFilteredManagers(filtered);
    }
  }, [allManagers, searchQuery, statusFilter, activeTab]);

  if (!task) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-10">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No Task Data</h3>
            <p className="text-gray-500 mt-2">Task information is not available.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not updated";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getManagerName = (manager) => {
    if (!manager) return "Unknown Manager";
    if (typeof manager === "string") return "Manager ID: " + manager;
    
    const fullName = `${manager.firstName || ""} ${manager.lastName || ""}`.trim();
    return fullName || manager.email || "Unknown Manager";
  };

  const getManagerDepartments = (manager) => {
    if (!manager || typeof manager === "string") return "No Department";
    if (!manager.departments || !Array.isArray(manager.departments)) {
      return "No Department";
    }
    const departmentNames = manager.departments
      .map((dept) => (typeof dept === "string" ? dept : dept?.name))
      .filter((name) => name && name !== "null" && name !== "undefined");
    return departmentNames.length > 0 ? departmentNames.join(", ") : "No Department";
  };

  const getManagerResponse = (managerId) => {
    if (!task.managerResponses || !Array.isArray(task.managerResponses)) {
      return null;
    }

    const searchId = managerId?.toString();

    for (const response of task.managerResponses) {
      let responseManagerId = null;

      // Handle different response structures
      if (response.managerId?._id) {
        responseManagerId = response.managerId._id.toString();
      } else if (response.managerId?.toString) {
        responseManagerId = response.managerId.toString();
      } else if (response.managerId) {
        responseManagerId = response.managerId;
      }

      if (responseManagerId === searchId) {
        return response;
      }
    }

    return null;
  };

  const hasFeedback = (response) => {
    return (
      response?.feedback &&
      response.feedback.trim() !== "" &&
      response.feedback !== "null" &&
      response.feedback !== "undefined"
    );
  };

  const downloadFile = (fileUrl, fileName) => {
    try {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleExpand = (managerId) => {
    setExpandedManager(expandedManager === managerId ? null : managerId);
  };

  const getCompletionPercentage = () => {
    if (statistics.total === 0) return 0;
    return Math.round((statistics.completed / statistics.total) * 100);
  };

  const getResponseRate = () => {
    if (statistics.total === 0) return 0;
    const responded = statistics.completed + statistics["in-progress"] + statistics.rejected;
    return Math.round((responded / statistics.total) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {isManagerView ? "Team Status Overview" : "Manager Status Dashboard"}
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                  {task.title || "Task Overview"}
                  {task.clientName && ` • Client: ${task.clientName}`}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
          {/* Manager View Info Banner */}
          {isManagerView && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Manager View</h3>
                  <p className="text-sm text-blue-600">
                    You can view other managers' statuses but cannot edit them. 
                    Use the filters to find specific managers or statuses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-5 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Total Assigned</p>
                  <p className="text-3xl font-bold mt-2">{statistics.total}</p>
                  <p className="text-xs opacity-80 mt-1">Managers</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Completed</p>
                  <p className="text-3xl font-bold mt-2">{statistics.completed}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {getCompletionPercentage()}% Completion
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white p-5 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">In Progress</p>
                  <p className="text-3xl font-bold mt-2">{statistics["in-progress"]}</p>
                  <p className="text-xs opacity-80 mt-1">Working on task</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <RefreshCw className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-5 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Response Rate</p>
                  <p className="text-3xl font-bold mt-2">{getResponseRate()}%</p>
                  <p className="text-xs opacity-80 mt-1">
                    {statistics.completed + statistics["in-progress"] + statistics.rejected}/{statistics.total} responded
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Overall Progress
                </h3>
                <p className="text-sm text-gray-600">
                  Track completion across all managers
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700">
                    {getCompletionPercentage()}%
                  </p>
                  <p className="text-xs text-gray-500">Completion Rate</p>
                </div>
              </div>
            </div>

          

            {/* Status Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Completed</span>
                <Badge className="ml-2 bg-green-100 text-green-800">
                  {statistics.completed}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-700">In Progress</span>
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  {statistics["in-progress"]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Rejected</span>
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {statistics.rejected}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-700">Pending</span>
                <Badge className="ml-2 bg-gray-100 text-gray-800">
                  {statistics.pending}
                </Badge>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search managers by name, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 rounded-lg bg-white border-gray-300"
                  />
                </div>
              </div>

              
            </div>

            {/* Quick Tabs */}
            <div className="flex flex-wrap gap-2 mt-4 text-gray-800">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
                className="rounded-full"
              >
                All ({statistics.total})
              </Button>
              <Button
                variant={activeTab === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("completed")}
                className="rounded-full bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed ({statistics.completed})
              </Button>
              <Button
                variant={activeTab === "in-progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("in-progress")}
                className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                In Progress ({statistics["in-progress"]})
              </Button>
              <Button
                variant={activeTab === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("rejected")}
                className="rounded-full bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Rejected ({statistics.rejected})
              </Button>
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pending")}
                className="rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
              >
                <Clock className="w-3 h-3 mr-1" />
                Pending ({statistics.pending})
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading manager statuses...</p>
            </div>
          ) : (
            /* Managers List */
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {filteredManagers.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">
                      No Managers Found
                    </h3>
                    <p className="text-gray-500 mt-2">
                      Try adjusting your search or filters
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setActiveTab("all");
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                ) : (
                  filteredManagers.map((manager) => {
                    const response = getManagerResponse(manager._id);
                    const isCurrentManager =
                      currentManagerId === manager._id.toString();
                    const isExpanded = expandedManager === manager._id.toString();

                    return (
                      <div
                        key={manager._id}
                        className={cn(
                          "bg-white rounded-xl border overflow-hidden transition-all duration-300",
                          isCurrentManager
                            ? "ring-2 ring-blue-500 ring-offset-1 shadow-md"
                            : "hover:shadow-md",
                          isExpanded ? "shadow-lg" : ""
                        )}
                      >
                        {/* Header */}
                        <div
                          className="p-5 cursor-pointer"
                          onClick={() => toggleExpand(manager._id.toString())}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="relative">
                                <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                                  {manager.profilePicture ? (
                                    <AvatarImage
                                      src={manager.profilePicture}
                                      alt={getManagerName(manager)}
                                    />
                                  ) : (
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xl">
                                      {getManagerName(manager)
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .substring(0, 2)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                {isCurrentManager && (
                                  <div className="absolute -top-1 -right-1">
                                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow">
                                      <User className="w-3 h-3 mr-1" />
                                      You
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900 truncate">
                                    {getManagerName(manager)}
                                  </h3>
                                  {manager.email && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(manager.email);
                                      }}
                                      title="Copy email"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Building className="w-4 h-4" />
                                    <span className="truncate">
                                      {getManagerDepartments(manager)}
                                    </span>
                                  </div>
                                  {manager.email && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Mail className="w-4 h-4" />
                                      <span className="truncate">{manager.email}</span>
                                    </div>
                                  )}
                                  {manager.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Phone className="w-4 h-4" />
                                      <span className="truncate">{manager.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Status Badge */}
                              <div>
                                {response ? (
                                  <Badge
                                    className={cn(
                                      "px-4 py-2 font-semibold text-sm rounded-full flex items-center gap-2",
                                      getStatusColor(response.status)
                                    )}
                                  >
                                    {getStatusIcon(response.status)}
                                    {response.status.replace("-", " ")}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="px-4 py-2 font-semibold text-gray-600 border-gray-300 rounded-full"
                                  >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Not Responded
                                  </Badge>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full hover:bg-gray-100"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t p-5 bg-gradient-to-b from-gray-50 to-white">
                            {response ? (
                              <div className="space-y-5">
                                {/* Status Timeline */}
                                <div className="grid grid-cols- md:grid-cols-2 gap-4">
                                  <div className="bg-white p-4 rounded-lg border">
                                    <div className="flex items-center gap-3 mb-3">
                                      <Calendar className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          Last Updated
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {formatDate(response.updatedAt)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white p-4 rounded-lg border">
                                    <div className="flex items-center gap-3 mb-3">
                                      <Clock className="w-5 h-5 text-green-600" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          Submitted
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {response.submittedAt
                                            ? formatDate(response.submittedAt)
                                            : "Not submitted"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                 
                                </div>

                                {/* Feedback Section */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <MessageSquare className="w-6 h-6 text-blue-600" />
                                      <div>
                                        <h4 className="font-bold text-gray-900">
                                          Manager's Feedback
                                        </h4>
                                        <p className="text-sm text-blue-700">
                                          Status:{" "}
                                          <span className="font-semibold">
                                            {response.status}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                    {hasFeedback(response) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full border-blue-300 text-blue-700 hover:bg-blue-50"
                                        onClick={() =>
                                          copyToClipboard(response.feedback)
                                        }
                                      >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Feedback
                                      </Button>
                                    )}
                                  </div>

                                  {hasFeedback(response) ? (
                                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {response.feedback}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-white/80 rounded-lg p-8 text-center border border-dashed border-blue-200">
                                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                      <p className="text-gray-600 font-medium">
                                        No feedback provided
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        Manager updated status without adding feedback
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Submitted Files */}
                                {response.submittedFiles &&
                                  response.submittedFiles.length > 0 && (
                                    <div>
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                          <FileText className="w-6 h-6 text-green-600" />
                                          <h4 className="font-bold text-gray-900">
                                            Submitted Files ({response.submittedFiles.length})
                                          </h4>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="bg-green-50 text-green-700 border-green-200"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          {response.submittedFiles.length} files
                                        </Badge>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {response.submittedFiles.map((file, idx) => (
                                          <div
                                            key={idx}
                                            className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                  <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="font-medium text-gray-900 truncate">
                                                    {file.name}
                                                  </p>
                                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span>{formatFileSize(file.size)}</span>
                                                    {file.uploadedAt && (
                                                      <span>• {formatDate(file.uploadedAt)}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-9 w-9 rounded-full hover:bg-blue-50"
                                                  onClick={() =>
                                                    window.open(file.url, "_blank")
                                                  }
                                                  title="View file"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-9 w-9 rounded-full hover:bg-green-50"
                                                  onClick={() =>
                                                    downloadFile(file.url, file.name)
                                                  }
                                                  title="Download file"
                                                >
                                                  <Download className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ) : (
                              // No Response State
                              <div className="text-center py-10">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Clock className="w-10 h-10 text-gray-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                                  Awaiting Response
                                </h4>
                                <p className="text-gray-500 max-w-md mx-auto">
                                  This manager hasn't updated their status yet. They'll be
                                  able to provide feedback and submit files once they
                                  respond.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}

          {/* Summary Footer */}
          <div className="mt-6 p-5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-xl mb-2">Task Summary</h4>
                <p className="text-gray-300">
                  {task.title} • {statistics.total} managers assigned
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  {getCompletionPercentage()}%
                </div>
                <p className="text-gray-300 text-sm">Overall Completion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredManagers.length} of {statistics.total} managers
            {isManagerView && " • You can view but not edit other managers' statuses"}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const summary = `
📊 Task: ${task.title}
📈 Status Overview:
├── Total Managers: ${statistics.total}
├── Completed: ${statistics.completed}
├── In Progress: ${statistics["in-progress"]}
├── Rejected: ${statistics.rejected}
└── Pending: ${statistics.pending}

🎯 Completion Rate: ${getCompletionPercentage()}%
⏱️ Response Rate: ${getResponseRate()}%

📝 Manager Status:
${filteredManagers
  .map((manager) => {
    const response = getManagerResponse(manager._id);
    const status = response?.status || "Not Responded";
    const feedback = hasFeedback(response)
      ? `\n   └── Feedback: ${response.feedback.substring(0, 50)}...`
      : "";
    return `├── ${getManagerName(manager)}: ${status}${feedback}`;
  })
  .join("\n")}
                `.trim();
                copyToClipboard(summary);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Report
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchAllManagersStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={onClose} variant="default" className="bg-blue-600 hover:bg-blue-700">
              Close Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}