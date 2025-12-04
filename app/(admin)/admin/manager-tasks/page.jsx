"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  DialogFooter,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
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
  ChevronLeft,
  ChevronRight,
  Users,
  Grid,
  List,
  Loader2,
  FileBarChart,
  UserCheck,
  Download,
  Filter,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import axios from "axios";

export default function AdminManagerTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formSubmissions, setFormSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [managerComments, setManagerComments] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [exporting, setExporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
    limit: 12
  });

  const [searchTimeout, setSearchTimeout] = useState(null);

  const stats = useMemo(() => {
    const total = pagination.totalItems;
    const pending = formSubmissions.filter(s => s.status === "pending").length;
    const inProgress = formSubmissions.filter(s => s.status === "in_progress").length;
    const completed = formSubmissions.filter(s => s.status === "completed").length;
    const approved = formSubmissions.filter(s => s.status === "approved").length;
    const rejected = formSubmissions.filter(s => s.status === "rejected").length;
    
    const adminPending = formSubmissions.filter(s => s.adminStatus === "pending").length;
    const adminApproved = formSubmissions.filter(s => s.adminStatus === "approved").length;
    const adminRejected = formSubmissions.filter(s => s.adminStatus === "rejected").length;

    const completionRate = total > 0 ? Math.round(((completed + approved) / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      approved,
      rejected,
      adminPending,
      adminApproved,
      adminRejected,
      completionRate
    };
  }, [formSubmissions, pagination.totalItems]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/admin/login");
      return;
    }

    fetchFormSubmissions();
  }, [session, status, router]);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm, statusFilter, adminStatusFilter, dateFilter]);

  useEffect(() => {
    fetchFormSubmissions();
  }, [pagination.currentPage]);

  const fetchFormSubmissions = useCallback(async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (adminStatusFilter && adminStatusFilter !== "all") params.append("adminStatus", adminStatusFilter);
      if (dateFilter && dateFilter !== "all") params.append("date", dateFilter);
      params.append("page", pagination.currentPage);
      params.append("limit", pagination.limit);

      const response = await axios.get(`/api/admin/manager-tasks?${params}`);

      if (response.data.success) {
        setFormSubmissions(response.data.formSubmissions || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
          limit: 12
        });
      } else {
        toast.error("Failed to fetch tasks");
        setFormSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to fetch tasks");
      setFormSubmissions([]);
    } finally {
      setFetching(false);
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, statusFilter, adminStatusFilter, dateFilter]);

  const handleView = async (submission) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/manager-tasks/${submission._id}`);
      if (response.data.success) {
        setSelectedSubmission(response.data.formSubmission);
        setViewDialogOpen(true);
      } else {
        toast.error("Failed to load submission details");
      }
    } catch (error) {
      console.error("Error loading submission details:", error);
      toast.error("Error loading submission details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (submissionId, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/admin/manager-tasks/${submissionId}`, {
        adminStatus: newStatus,
        managerComments: managerComments || ""
      });

      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchFormSubmissions();
        setStatusUpdateDialogOpen(false);
        setViewDialogOpen(false);
        setManagerComments("");
        setSelectedStatus("");
      } else {
        toast.error(response.data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const openStatusUpdateDialog = (submission, status) => {
    setSelectedSubmission(submission);
    setSelectedStatus(status);
    setStatusUpdateDialogOpen(true);
  };

  const getStatusVariant = (status) => {
    const variants = {
      completed: "bg-emerald-100 text-emerald-800",
      approved: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      pending: "bg-amber-100 text-amber-800",
      rejected: "bg-red-100 text-red-800"
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  const getAdminStatusVariant = (status) => {
    const variants = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-amber-100 text-amber-800",
      rejected: "bg-red-100 text-red-800"
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      approved: <CheckCircle className="w-4 h-4 text-green-600" />,
      in_progress: <PlayCircle className="w-4 h-4 text-blue-600" />,
      pending: <Clock className="w-4 h-4 text-amber-600" />,
      rejected: <XCircle className="w-4 h-4 text-red-600" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4 text-gray-600" />;
  };

  const getAdminStatusIcon = (status) => {
    const icons = {
      approved: <CheckCircle className="w-4 h-4 text-green-600" />,
      pending: <Clock className="w-4 h-4 text-amber-600" />,
      rejected: <XCircle className="w-4 h-4 text-red-600" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4 text-gray-600" />;
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
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
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

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setAdminStatusFilter("all");
    setDateFilter("all");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const exportToCSV = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`/api/admin/manager-tasks?limit=1000`);
      
      if (response.data.success) {
        const submissions = response.data.formSubmissions;
        
        const headers = [
          'ID',
          'Form Title',
          'Submitted By',
          'Manager Email',
          'Department',
          'Assigned Team Lead',
          'Status',
          'Admin Status',
          'Created Date',
          'Total Employees'
        ];
        
        const csvRows = [
          headers.join(','),
          ...submissions.map(sub => [
            sub._id,
            `"${(sub.formId?.title || 'N/A').replace(/"/g, '""')}"`,
            `"${(sub.submittedByName || 'N/A').replace(/"/g, '""')}"`,
            `"${(sub.submittedByEmail || 'N/A').replace(/"/g, '""')}"`,
            `"${(sub.submittedByDepartment || 'N/A').replace(/"/g, '""')}"`,
            `"${(sub.assignedToName || 'N/A').replace(/"/g, '""')}"`,
            sub.status,
            sub.adminStatus,
            new Date(sub.createdAt).toISOString(),
            sub.assignedEmployees?.length || 0
          ].join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `manager-tasks-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Data exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={pagination.currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(i)}
          className={`w-8 h-8 ${pagination.currentPage === i ? "bg-blue-600 text-white" : "border-gray-300 text-gray-700"}`}
        >
          {i}
        </Button>
      );
    }

    return pages;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Admin Dashboard</h2>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster position="top-right" expand={true} richColors />
      
      <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Manager Tasks Dashboard
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
                className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-50 border-gray-300"
              >
                <Grid className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-50 border-gray-300"
              >
                <List className="w-4 h-4" />
                List
              </Button>
            </div>
            
            <Button
              onClick={fetchFormSubmissions}
              disabled={fetching}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                  <FileBarChart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={stats.completionRate} className="h-2 bg-gray-200" />
                <p className="text-xs text-gray-600 mt-2">{stats.completionRate}% completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pending Review</p>
                  <p className="text-3xl font-bold text-amber-700 mt-2">{stats.adminPending}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">Awaiting admin approval</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Approved</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">{stats.adminApproved}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">Successfully approved</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Rejected</p>
                  <p className="text-3xl font-bold text-red-700 mt-2">{stats.adminRejected}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-red-100 to-red-200 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-8 border-0 shadow-2xl bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, or form..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-gray-300 bg-white text-gray-900 py-2.5">
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
                  <Label className="text-sm font-medium text-gray-900">Admin Status</Label>
                  <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
                    <SelectTrigger className="border-gray-300 bg-white text-gray-900 py-2.5">
                      <SelectValue placeholder="All admin status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-gray-900">All Admin Status</SelectItem>
                      <SelectItem value="pending" className="text-gray-900">Pending Review</SelectItem>
                      <SelectItem value="approved" className="text-gray-900">Approved</SelectItem>
                      <SelectItem value="rejected" className="text-gray-900">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="border-gray-300 bg-white text-gray-900 py-2.5">
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
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </Button>
                <Button
                  onClick={exportToCSV}
                  disabled={exporting}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex bg-gray-100 border border-gray-200">
              <TabsTrigger value="all" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <FileText className="w-4 h-4" />
                All Tasks
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Clock className="w-4 h-4" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <PlayCircle className="w-4 h-4" />
                In Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <CheckCircle className="w-4 h-4" />
                Completed
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <XCircle className="w-4 h-4" />
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {formSubmissions.map((submission) => (
                    <Card key={submission._id} className="group hover:shadow-2xl transition-all duration-300 border border-gray-200 bg-white overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                                {submission.formId?.title || "Unknown Form"}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1 text-gray-600">
                                <User className="w-3.5 h-3.5 text-gray-500" />
                                {submission.submittedByName}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getStatusVariant(submission.status)}>
                              {getStatusIcon(submission.status)}
                              {submission.status.replace("_", " ")}
                            </Badge>
                            <Badge className={getAdminStatusVariant(submission.adminStatus)}>
                              {getAdminStatusIcon(submission.adminStatus)}
                              {submission.adminStatus}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span>{submission.assignedToName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{submission.formattedCreatedAt}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-900">Team Members</Label>
                          <div className="flex flex-wrap gap-2">
                            {submission.assignedEmployees?.slice(0, 3).map((assignment, index) => (
                              <Avatar key={index} className="w-9 h-9 border-2 border-white shadow-md">
                                <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {getEmployeeInitials(assignment.employeeId)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {submission.assignedEmployees?.length > 3 && (
                              <div className="w-9 h-9 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700 border-2 border-white">
                                +{submission.assignedEmployees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="flex gap-2 pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => handleView(submission)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openStatusUpdateDialog(submission, "approved")} className="text-gray-900 hover:bg-gray-50">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusUpdateDialog(submission, "rejected")} className="text-gray-900 hover:bg-gray-50">
                              <XCircle className="w-4 h-4 mr-2 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {viewMode === "list" && (
                <Card className="border-0 shadow-2xl bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-900">Task List</CardTitle>
                    <CardDescription className="text-gray-600">
                      Showing {formSubmissions.length} of {pagination.totalItems} tasks • Sorted by latest
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-gray-900 font-semibold">Form & Manager</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Team Lead</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Members</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Admin Status</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Created</TableHead>
                          <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formSubmissions.map((submission) => (
                          <TableRow key={submission._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
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
                                    {submission.submittedByName}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-900">{submission.assignedToName}</div>
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
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusVariant(submission.status)}>
                                {getStatusIcon(submission.status)}
                                {submission.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getAdminStatusVariant(submission.adminStatus)}>
                                {getAdminStatusIcon(submission.adminStatus)}
                                {submission.adminStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-700">
                                {submission.formattedDateTime}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => handleView(submission)}
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {formSubmissions.length === 0 && !fetching && (
                <Card className="border-0 shadow-2xl bg-white">
                  <CardContent className="text-center py-16">
                    <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || statusFilter !== "all" || adminStatusFilter !== "all" || dateFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "No form submissions have been made yet"}
                    </p>
                    {(searchTerm || statusFilter !== "all" || adminStatusFilter !== "all" || dateFilter !== "all") && (
                      <Button onClick={clearFilters} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        Clear All Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {fetching && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="border border-gray-200 shadow-2xl bg-white animate-pulse">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gray-200 rounded-xl"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                          <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                          <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination Section */}
          {pagination.totalPages > 1 && (
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of {pagination.totalItems} tasks
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={pagination.currentPage === 1}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {renderPageNumbers()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.totalPages)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>
              </CardContent>
            </Card>
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
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedSubmission.formId?.title || "Unknown Form"}
                  </h3>
                  <p className="text-gray-700 mt-1">
                    Submitted by {selectedSubmission.submittedBy?.firstName} {selectedSubmission.submittedBy?.lastName}
                    {selectedSubmission.submittedBy?.email && ` • ${selectedSubmission.submittedBy.email}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${getStatusVariant(selectedSubmission.status)} text-sm font-semibold px-3 py-1.5`}>
                    {getStatusIcon(selectedSubmission.status)}
                    Status: {selectedSubmission.status.replace("_", " ")}
                  </Badge>
                  <Badge className={`${getAdminStatusVariant(selectedSubmission.adminStatus)} text-sm font-semibold px-3 py-1.5`}>
                    {getAdminStatusIcon(selectedSubmission.adminStatus)}
                    Admin: {selectedSubmission.adminStatus}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <Card className="border border-gray-200 bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                        <User className="w-5 h-5 text-blue-600" />
                        Submission Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Submitted By</Label>
                        <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {selectedSubmission.submittedBy?.firstName?.[0]}{selectedSubmission.submittedBy?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {selectedSubmission.submittedBy?.firstName} {selectedSubmission.submittedBy?.lastName}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {selectedSubmission.submittedBy?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedSubmission.assignedTo && (
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Assigned Team Lead</Label>
                          <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                {selectedSubmission.assignedTo?.firstName?.[0]}{selectedSubmission.assignedTo?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {selectedSubmission.assignedTo?.firstName} {selectedSubmission.assignedTo?.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {selectedSubmission.assignedTo?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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

                  <Card className="border border-gray-200 bg-white">
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
                                <p className="font-semibold text-gray-900 text-sm">
                                  {getEmployeeDisplayName(assignment.employeeId)}
                                </p>
                                <p className="text-gray-700 text-xs">
                                  {assignment.employeeId?.email}
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

                <div className="lg:col-span-2">
                  <Card className="h-full border border-gray-200 bg-white">
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
                      <ScrollArea className="h-[500px]">
                        {renderFormData(
                          selectedSubmission.formData,
                          selectedSubmission.formId?.fields || []
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => openStatusUpdateDialog(selectedSubmission, "rejected")}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Submission
                </Button>
                <Button
                  onClick={() => openStatusUpdateDialog(selectedSubmission, "approved")}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Submission
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStatus === "approved" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {selectedStatus === "approved" ? "Approve Submission" : "Reject Submission"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedStatus === "approved" 
                ? "This will approve the submission and mark it as completed."
                : "This will reject the submission and notify the manager."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments" className="text-gray-900">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments for the manager..."
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                className="min-h-[100px] bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusUpdateDialogOpen(false);
                setManagerComments("");
              }}
              disabled={loading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleStatusUpdate(selectedSubmission._id, selectedStatus)}
              disabled={loading}
              className={selectedStatus === "approved" 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
              }
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : selectedStatus === "approved" ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {loading ? "Processing..." : selectedStatus === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}