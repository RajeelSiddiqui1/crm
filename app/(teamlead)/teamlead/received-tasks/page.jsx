"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Filter,
  SortAsc,
  SortDesc,
  Info,
  Phone,
  MapPin,
  ExternalLink,
  Printer,
  Copy,
  MoreVertical,
  UserPlus,
  Target,
  BarChart3,
  ArrowBigRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";
import Link from "next/link";

export default function TeamleadReceivedTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [receivedTasks, setReceivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [viewMode, setViewMode] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [notes, setNotes] = useState("");
  const [addingNotes, setAddingNotes] = useState(false);
  const [selectedTaskForNotes, setSelectedTaskForNotes] = useState(null);

  const [shareForm, setShareForm] = useState({
    sharedTo: "",
    parentTaskId: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchReceivedTasks();
    fetchEmployees();
  }, [session, status, router]);

  const fetchReceivedTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/teamlead/received-tasks");
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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/teamlead/employees");
      const employeesData = response.data.employees || [];
      setEmployees(employeesData);

      if (employeesData.length === 0) {
        toast.info("No employees found in your department.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
      setEmployees([]);
    }
  };

  const openShareDialog = (task) => {
    setSelectedTask(task);
    setShareForm({
      sharedTo: task.sharedEmployee?._id || "",
      parentTaskId: task._id,
    });
    setShowShareDialog(true);
  };

  const handleShareWithEmployee = async () => {
    if (!shareForm.sharedTo) {
      toast.error("Please select an employee");
      return;
    }

    setSharing(true);
    try {
      const response = await axios.patch(
        `/api/teamlead/received-tasks/${shareForm.parentTaskId}`,
        { sharedTo: shareForm.sharedTo }
      );

      if (response.data.success) {
        toast.success("Task assigned successfully to employee");
        setShowShareDialog(false);
        setShareForm({
          sharedTo: "",
          parentTaskId: "",
        });
        fetchReceivedTasks();
      }
    } catch (error) {
      console.error("Error assigning task to employee:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to assign task";
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

  const openNotesDialog = (task) => {
    setSelectedTaskForNotes(task);
    setNotes(task.notes || "");
  };

  const saveNotes = async () => {
    if (!selectedTaskForNotes) return;

    setAddingNotes(true);
    try {
      const response = await axios.patch(
        `/api/teamlead/received-tasks/${selectedTaskForNotes._id}`,
        { notes }
      );

      if (response.data.success) {
        toast.success("Notes updated successfully");
        fetchReceivedTasks();
        setSelectedTaskForNotes(null);
        setNotes("");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setAddingNotes(false);
    }
  };

  // Status color functions
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      signed: "bg-green-100 text-green-800 border-green-200",
      not_available: "bg-red-100 text-red-800 border-red-200",
      not_interested: "bg-orange-100 text-orange-800 border-orange-200",
      re_schedule: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getVendorStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      not_approved: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getMachineStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      deployed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "pending":
        return <Clock className="w-3 h-3 mr-1" />;
      case "not_available":
      case "not_approved":
      case "cancelled":
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return <Info className="w-3 h-3 mr-1" />;
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

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter and sort tasks
  const filteredTasks = receivedTasks
    .filter((task) => {
      const matchesSearch =
        task.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.originalTaskId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.sharedEmployee?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        task.sharedEmployee?.lastName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        task.sharedManager?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        task.sharedManager?.lastName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "dueDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "signed", label: "Signed" },
    { value: "not_available", label: "Not Available" },
    { value: "not_interested", label: "Not Interested" },
    { value: "re_schedule", label: "Re-schedule" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "dueDate", label: "Due Date" },
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
          </div>
          <p className="text-gray-700 font-medium">Loading received tasks...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8">
          <div className="relative inline-block mb-6">
            <AlertCircle className="w-20 h-20 text-gray-400" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-xl"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in as Teamlead to access this page.
          </p>
          <Button
            onClick={() => router.push("/teamleadlogin")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link href="/teamlead/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-gray-300 hover:bg-white hover:shadow-sm text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Received Tasks
                </h1>
                <p className="text-gray-600 mt-1">
                  Tasks assigned to you by managers
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        fetchReceivedTasks();
                        fetchEmployees();
                      }}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm"
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={() => setViewMode(viewMode === "table" ? "card" : "table")}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm"
              >
                {viewMode === "table" ? "Card View" : "Table View"}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {receivedTasks.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-full">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Assigned by managers
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assigned</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {receivedTasks.filter((t) => t.sharedEmployee).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    To employees
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">
                      {receivedTasks.filter((t) => t.status === "pending").length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Need attention
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Employees</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {employees.length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full">
                    <UserPlus className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    In your department
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-300 text-gray-900">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="border-gray-300 text-gray-900">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      <SelectValue placeholder="Filter by priority" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-gray-300 text-gray-900">
                      <div className="flex items-center gap-2">
                        <SortAsc className="w-4 h-4" />
                        <SelectValue placeholder="Sort by" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm"
                  >
                    {sortOrder === "asc" ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Received Tasks
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Showing {filteredTasks.length} of {receivedTasks.length} tasks
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  {receivedTasks.length} total
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {employees.length} employees
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Download className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Tasks Found
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No tasks match your current filters. Try adjusting your search criteria."
                    : "No tasks have been assigned to you yet."}
                </p>
                {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                    }}
                    className="mt-4"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : viewMode === "table" ? (
              // Enhanced Table View with Expandable Rows
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-[50px] text-gray-700 font-semibold">
                       
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Task Details
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Assignment
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Due Date
                      </TableHead>
                      <TableHead className="text-gray-700 font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => {
                      const daysRemaining = getDaysRemaining(task.dueDate);
                      const isExpanded = expandedTasks[task._id];
                      
                      return (
                        <React.Fragment key={task._id}>
                          <TableRow className={`hover:bg-gray-50 ${isExpanded ? 'bg-blue-50/50' : ''}`}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleTaskExpansion(task._id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900">
                                    {task.taskTitle}
                                  </div>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => copyToClipboard(task.originalTaskId)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Copy Task ID</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                    {task.originalTaskId}
                                  </span>
                                  <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                                {task.taskDescription && (
                                  <p className="text-sm text-gray-600 line-clamp-1">
                                    {task.taskDescription}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge className={`${getStatusColor(task.status)} flex items-center w-fit`}>
                                  {getStatusIcon(task.status)}
                                  {task.status.replace(/_/g, ' ')}
                                </Badge>
                                <div className="flex gap-1">
                                  <Badge variant="outline" className={`${getVendorStatusColor(task.VendorStatus)} text-xs`}>
                                    Vendor: {task.VendorStatus}
                                  </Badge>
                                  <Badge variant="outline" className={`${getMachineStatusColor(task.MachineStatus)} text-xs`}>
                                    Machine: {task.MachineStatus}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {task.sharedManager?.firstName} {task.sharedManager?.lastName}
                                  </span>
                                  
                                </div>
                                {task.sharedEmployee ? (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-400" />
                                    <span className="text-sm text-gray-900">
                                      {task.sharedEmployee.firstName} {task.sharedEmployee.lastName}
                                    </span>
                                    <Badge variant="outline" className="text-xs bg-purple-50">
                                      Employee
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">Not assigned</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {task.dueDate ? formatSimpleDate(task.dueDate) : "Not set"}
                                  </span>
                                </div>
                                {daysRemaining !== null && (
                                  <div className={`text-xs ${daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {daysRemaining < 0 
                                      ? `${Math.abs(daysRemaining)} days overdue` 
                                      : `${daysRemaining} days remaining`}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                               <Link
                              href={`/shared-task-chat?sharedTaskId=${task._id}`}
                            >
                              <Button
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2 rounded-md shadow-sm transition"
                                size="sm"
                              >
                                <Eye className="w-3 h-3" />
                                Chat
                                <ArrowBigRight className="w-3 h-3" />
                              </Button>
                            </Link>

                          
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openShareDialog(task)}
                                        disabled={employees.length === 0}
                                        className="h-8 px-3 bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                                      >
                                        <Share2 className="h-3.5 w-3.5 mr-1.5" />
                                        {task.sharedEmployee ? "Change" : "Assign"}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{task.sharedEmployee ? "Change assignment" : "Assign to employee"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8  bg-white text-gray-700 hover:bg-gray-50 border-gray-300">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-white text-gray-700 hover:bg-gray-50 border-gray-300">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => toggleTaskExpansion(task._id)}>
                                      {isExpanded ? "Hide" : "View"} Details
                                    </DropdownMenuItem>
                                   
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => copyToClipboard(task.originalTaskId)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Task ID
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <TableRow className="bg-blue-50/30 hover:bg-blue-50/50">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-6 border-t border-gray-200">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Task Details */}
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        Task Information
                                      </h4>
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-medium text-gray-500">Created</label>
                                          <p className="text-sm text-gray-900">{formatDate(task.createdAt)}</p>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-gray-500">Last Updated</label>
                                          <p className="text-sm text-gray-900">{formatDate(task.updatedAt)}</p>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-gray-500">Manager Contact</label>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Mail className="h-3 w-3 text-gray-400" />
                                            <p className="text-sm text-gray-900">{task.sharedManager?.email}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Form Data */}
                                    <div className="lg:col-span-2">
                                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                        <FileText className="h-4 w-4" />
                                        Form Data
                                      </h4>
                                      {task.formId?.formData && Object.keys(task.formId.formData).length > 0 ? (
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                                            {Object.entries(task.formId.formData).map(([key, value]) => (
                                              <div key={key} className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500 capitalize">
                                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                                </label>
                                                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                                                  {Array.isArray(value)
                                                    ? value.join(", ")
                                                    : value === null || value === undefined
                                                    ? "Not provided"
                                                    : String(value)}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                          <p className="text-sm">No form data available</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Notes Section */}
                                    {task.notes && (
                                      <div className="lg:col-span-3">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4" />
                                          Notes
                                        </h4>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                          <p className="text-sm text-yellow-900">{task.notes}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Card View (optional)
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map((task) => (
                    <Card key={task._id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          {/* Card header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900 line-clamp-1">
                                {task.taskTitle}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {task.originalTaskId}
                              </p>
                            </div>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>

                          {/* Status badges */}
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              {task.status.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant="outline" className={getVendorStatusColor(task.VendorStatus)}>
                              {task.VendorStatus}
                            </Badge>
                          </div>

                          {/* Assignment info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                From: {task.sharedManager?.firstName} {task.sharedManager?.lastName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                To: {task.sharedEmployee 
                                  ? `${task.sharedEmployee.firstName} ${task.sharedEmployee.lastName}`
                                  : "Not assigned"}
                              </span>
                            </div>
                          </div>

                          {/* Due date */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                {task.dueDate ? formatSimpleDate(task.dueDate) : "No due date"}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => openShareDialog(task)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                {selectedTask?.sharedEmployee
                  ? "Change Employee Assignment"
                  : "Assign Task to Employee"}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5">
            {/* Task Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Task Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium text-gray-900">{selectedTask?.taskTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Task ID:</span>
                  <span className="font-medium text-gray-900 font-mono">{selectedTask?.originalTaskId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <Badge className={getPriorityColor(selectedTask?.priority)}>
                    {selectedTask?.priority}
                  </Badge>
                </div>
                {selectedTask?.sharedEmployee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Employee:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTask.sharedEmployee.firstName} {selectedTask.sharedEmployee.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">
                Select Employee *
              </label>
              <Select
                value={shareForm.sharedTo}
                onValueChange={(value) =>
                  setShareForm({ ...shareForm, sharedTo: value })
                }
              >
                <SelectTrigger className="w-full bg-white border-gray-900 text-gray-900">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {employees?.length > 0 ? (
                    employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{employee.email}</p>
                            </div>
                          </div>
                          {employee.department && (
                            <Badge variant="outline" className="text-xs">
                              {employee.department}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No employees available</p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Only employees from your department are shown
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowShareDialog(false)}
                disabled={sharing}
                className="min-w-[80px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareWithEmployee}
                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                disabled={sharing || !shareForm.sharedTo || employees.length === 0}
              >
                {sharing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedTask?.sharedEmployee ? (
                  "Change Employee"
                ) : (
                  "Assign Task"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={!!selectedTaskForNotes} onOpenChange={(open) => !open && setSelectedTaskForNotes(null)}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Add Notes for {selectedTaskForNotes?.taskTitle}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Add your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <div className="text-xs text-gray-500">
              Notes will be visible to you and can help track task progress.
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="bg-white text-gray-700"
                onClick={() => {
                  setSelectedTaskForNotes(null);
                  setNotes("");
                }}
                disabled={addingNotes}
              >
                Cancel
              </Button>
              <Button
                onClick={saveNotes}
                disabled={addingNotes || notes === selectedTaskForNotes?.notes}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addingNotes ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Notes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}