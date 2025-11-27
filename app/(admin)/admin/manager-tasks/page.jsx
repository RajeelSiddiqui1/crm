// app/admin/manager-tasks/page.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  FileText,
  User,
  Calendar,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  RefreshCw,
  Shield,
  Mail,
  Phone,
  MapPin,
  FileDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  Grid,
  List,
  Settings,
  Sparkles,
} from "lucide-react";
import axios from "axios";

export default function AdminManagerTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [activeTab, setActiveTab] = useState("all");

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

  // Stats
  const stats = useMemo(() => {
    const total = formSubmissions.length;
    const pending = formSubmissions.filter(s => s.status === "pending").length;
    const inProgress = formSubmissions.filter(s => s.status === "in_progress").length;
    const completed = formSubmissions.filter(s => s.status === "completed" || s.status === "approved").length;
    const rejected = formSubmissions.filter(s => s.status === "rejected").length;

    return {
      total,
      pending,
      inProgress,
      completed,
      rejected,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [formSubmissions]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/admin/login");
      return;
    }

    fetchFormSubmissions();
  }, [session, status, router]);

  // Fetch data with filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFormSubmissions();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, dateFilter, pagination.currentPage]);

  const fetchFormSubmissions = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (dateFilter && dateFilter !== "all") params.append("date", dateFilter);
      params.append("page", pagination.currentPage);
      params.append("limit", 12);

      const response = await axios.get(`/api/admin/manager-tasks?${params}`);

      if (response.data.success) {
        setFormSubmissions(response.data.formSubmissions || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        toast.error("Failed to fetch tasks");
        setFormSubmissions([]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch tasks");
      setFormSubmissions([]);
    } finally {
      setFetching(false);
    }
  };

  const handleView = (submission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleStatusUpdate = async (submissionId, newStatus) => {
    try {
      setLoading(true);
      // API call to update status would go here
      toast.success(`Status updated to ${newStatus}`);
      fetchFormSubmissions(); // Refresh data
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-emerald-500",
      approved: "bg-green-500",
      in_progress: "bg-blue-500",
      pending: "bg-amber-500",
      rejected: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusVariant = (status) => {
    const variants = {
      completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
      approved: "bg-green-50 text-green-800 border-green-200",
      in_progress: "bg-blue-50 text-blue-800 border-blue-200",
      pending: "bg-amber-50 text-amber-800 border-amber-200",
      rejected: "bg-red-50 text-red-800 border-red-200"
    };
    return variants[status] || "bg-gray-50 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="w-4 h-4 text-emerald-700" />,
      approved: <CheckCircle className="w-4 h-4 text-green-700" />,
      in_progress: <PlayCircle className="w-4 h-4 text-blue-700" />,
      pending: <Clock className="w-4 h-4 text-amber-700" />,
      rejected: <XCircle className="w-4 h-4 text-red-700" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4 text-gray-700" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEmployeeDisplayName = (employee) => {
    if (!employee) return "Unknown";
    if (employee.name) return employee.name;
    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Unknown";
  };

  const getEmployeeInitials = (employee) => {
    const name = getEmployeeDisplayName(employee);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";
  };

  const renderFormData = (formData, formFields = []) => {
    if (!formData || Object.keys(formData).length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No form data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(formData).map(([key, value]) => {
          const fieldConfig = formFields.find(field => field.name === key);
          const label = fieldConfig?.label || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());

          return (
            <div key={key} className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">{label}</Label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                {Array.isArray(value) ? (
                  <div className="flex flex-wrap gap-2">
                    {value.map((item, index) => (
                      <Badge key={index} variant="secondary" className="bg-white text-gray-900 border-gray-300">
                        {String(item)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900 font-medium">{String(value)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const exportData = (format) => {
    toast.success(`Exporting data as ${format.toUpperCase()}...`);
    // Export implementation would go here
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Admin Dashboard</h2>
          <p className="text-gray-700 mt-2">Please wait while we set up your workspace...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Toaster position="top-right" expand={true} richColors />
      
      {/* Main Layout */}
      <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Manager Tasks
              </h1>
              <p className="text-gray-700 mt-1">Monitor and manage all form submissions</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-2 bg-white text-gray-900"
              >
                <Grid className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2 bg-white text-gray-900"
              >
                <List className="w-4 h-4" />
                List
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200">
                <DropdownMenuItem onClick={() => exportData("pdf")} className="text-gray-900 hover:bg-gray-50">
                  <FileText className="w-4 h-4 mr-2 text-gray-700" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData("csv")} className="text-gray-900 hover:bg-gray-50">
                  <FileDown className="w-4 h-4 mr-2 text-gray-700" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={stats.completionRate} className="h-1 bg-gray-200" />
                <p className="text-xs text-gray-600 mt-1">{stats.completionRate}% completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Awaiting action</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">In Progress</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PlayCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Being processed</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Completed</p>
                  <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Successfully done</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Requires review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-8 border-0 shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      placeholder="Search tasks, managers, teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border-gray-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-gray-300 text-gray-900">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-gray-900">All Statuses</SelectItem>
                      <SelectItem value="pending" className="text-gray-900">Pending</SelectItem>
                      <SelectItem value="in_progress" className="text-gray-900">In Progress</SelectItem>
                      <SelectItem value="completed" className="text-gray-900">Completed</SelectItem>
                      <SelectItem value="approved" className="text-gray-900">Approved</SelectItem>
                      <SelectItem value="rejected" className="text-gray-900">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Date</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="border-gray-300 text-gray-900">
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-gray-900">All Dates</SelectItem>
                      <SelectItem value="today" className="text-gray-900">Today</SelectItem>
                      <SelectItem value="week" className="text-gray-900">This Week</SelectItem>
                      <SelectItem value="month" className="text-gray-900">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 text-gray-600" />
                  Clear
                </Button>
                <Button
                  onClick={fetchFormSubmissions}
                  disabled={fetching}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex bg-gray-100 border border-gray-200">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <FileText className="w-4 h-4" />
                All Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <Clock className="w-4 h-4" />
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="in_progress" 
                className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <PlayCircle className="w-4 h-4" />
                In Progress
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <CheckCircle className="w-4 h-4" />
                Completed
              </TabsTrigger>
              <TabsTrigger 
                value="rejected" 
                className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <XCircle className="w-4 h-4" />
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {formSubmissions.map((submission) => (
                    <Card key={submission._id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                                {submission.formId?.title || "Unknown Form"}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1 text-gray-600">
                                <User className="w-3 h-3 text-gray-500" />
                                {submission.submittedBy}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getStatusVariant(submission.status)}>
                            {getStatusIcon(submission.status)}
                            {submission.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span>{submission.assignedTo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{formatDate(submission.createdAt)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-900">Team Members</Label>
                          <div className="flex flex-wrap gap-2">
                            {submission.assignedEmployees?.slice(0, 3).map((assignment, index) => (
                              <Avatar key={index} className="w-8 h-8 border-2 border-white shadow">
                                <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {getEmployeeInitials(assignment.employeeId)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {submission.assignedEmployees?.length > 3 && (
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white">
                                +{submission.assignedEmployees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        {submission.formData && Object.keys(submission.formData).length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-900">Form Preview</Label>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1 max-h-20 overflow-y-auto">
                              {Object.entries(submission.formData).slice(0, 2).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium text-gray-900">{key}:</span>
                                  <span className="text-gray-700 truncate ml-2">
                                    {Array.isArray(value) ? value.join(", ") : String(value)}
                                  </span>
                                </div>
                              ))}
                              {Object.keys(submission.formData).length > 2 && (
                                <div className="text-gray-600 text-center">... and {Object.keys(submission.formData).length - 2} more fields</div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex gap-2 pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => handleView(submission)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="px-3 border-gray-300 text-gray-700 hover:bg-gray-50">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-gray-200">
                            <DropdownMenuItem onClick={() => handleView(submission)} className="text-gray-900 hover:bg-gray-50">
                              <Eye className="w-4 h-4 mr-2 text-gray-700" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportData("pdf")} className="text-gray-900 hover:bg-gray-50">
                              <FileDown className="w-4 h-4 mr-2 text-gray-700" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(submission._id, "approved")} className="text-gray-900 hover:bg-gray-50">
                              <CheckCircle className="w-4 h-4 mr-2 text-gray-700" />
                              Mark Approved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(submission._id, "rejected")} className="text-gray-900 hover:bg-gray-50">
                              <XCircle className="w-4 h-4 mr-2 text-gray-700" />
                              Mark Rejected
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <Card className="border-0 shadow-xl bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-900">Task List</CardTitle>
                    <CardDescription className="text-gray-600">
                      {formSubmissions.length} tasks found • Sorted by latest
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-gray-900 font-semibold">Form & Manager</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Team</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Members</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Created</TableHead>
                          <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formSubmissions.map((submission) => (
                          <TableRow key={submission._id} className="group hover:bg-blue-50/50 transition-colors border-b border-gray-200">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                  <FileText className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {submission.formId?.title || "Unknown Form"}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <User className="w-3 h-3 text-gray-500" />
                                    {submission.submittedBy}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-900">{submission.assignedTo}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex -space-x-2">
                                {submission.assignedEmployees?.slice(0, 3).map((assignment, index) => (
                                  <Avatar key={index} className="w-8 h-8 border-2 border-white">
                                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                      {getEmployeeInitials(assignment.employeeId)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {submission.assignedEmployees?.length > 3 && (
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white">
                                    +{submission.assignedEmployees.length - 3}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusVariant(submission.status)}>
                                {getStatusIcon(submission.status)}
                                {submission.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-700">
                                {formatDate(submission.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                                  <DropdownMenuItem onClick={() => handleView(submission)} className="text-gray-900 hover:bg-gray-50">
                                    <Eye className="w-4 h-4 mr-2 text-gray-700" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportData("pdf")} className="text-gray-900 hover:bg-gray-50">
                                    <FileDown className="w-4 h-4 mr-2 text-gray-700" />
                                    Export PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {formSubmissions.length === 0 && !fetching && (
                <Card className="border-0 shadow-xl bg-white">
                  <CardContent className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "No form submissions have been made yet"}
                    </p>
                    {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
                      <Button onClick={clearFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Clear All Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {fetching && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="border border-gray-200 shadow-xl bg-white animate-pulse">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalItems} total tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNext}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Submission Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto border border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <FileText className="w-6 h-6 text-blue-600" />
              Submission Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about this form submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedSubmission.formId?.title || "Unknown Form"}
                  </h3>
                  <p className="text-gray-700 mt-1">
                    Submitted by {selectedSubmission.submittedBy}
                    {selectedSubmission.managerEmail && ` • ${selectedSubmission.managerEmail}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusVariant(selectedSubmission.status)} text-sm font-semibold px-3 py-1.5`}>
                    {getStatusIcon(selectedSubmission.status)}
                    {selectedSubmission.status.replace("_", " ")}
                  </Badge>
                  <Button
                    onClick={() => exportData("pdf")}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <FileDown className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Submission Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Assignment Info */}
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                        <User className="w-5 h-5 text-blue-600" />
                        Assignment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Assigned Team</Label>
                        <p className="text-gray-900 font-semibold mt-1">{selectedSubmission.assignedTo}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Submitted By</Label>
                        <p className="text-gray-900 font-semibold mt-1">{selectedSubmission.submittedBy}</p>
                        {selectedSubmission.managerEmail && (
                          <p className="text-gray-700 text-sm mt-1 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-500" />
                            {selectedSubmission.managerEmail}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Created</Label>
                          <p className="text-gray-900 text-sm mt-1">{formatDate(selectedSubmission.createdAt)}</p>
                        </div>
                        {selectedSubmission.completedAt && (
                          <div>
                            <Label className="text-sm font-medium text-gray-900">Completed</Label>
                            <p className="text-gray-900 text-sm mt-1">{formatDate(selectedSubmission.completedAt)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Members */}
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                        <Users className="w-5 h-5 text-blue-600" />
                        Team Members ({selectedSubmission.assignedEmployees?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {selectedSubmission.assignedEmployees?.map((assignment, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                  {getEmployeeInitials(assignment.employeeId)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">
                                  {getEmployeeDisplayName(assignment.employeeId)}
                                </p>
                                <p className="text-gray-700 text-xs truncate">
                                  {assignment.employeeId?.department || "No department"}
                                </p>
                                <Badge className={`${getStatusVariant(assignment.status)} text-xs mt-1`}>
                                  {assignment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Form Data */}
                <div className="lg:col-span-2">
                  <Card className="h-full border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Form Data
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        All submitted form information and responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        {renderFormData(
                          selectedSubmission.formData,
                          selectedSubmission.formId?.fields || []
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate(selectedSubmission._id, "rejected")}
                  disabled={loading}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Submission
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(selectedSubmission._id, "approved")}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Submission
                </Button>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}