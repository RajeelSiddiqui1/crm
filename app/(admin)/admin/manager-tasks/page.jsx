// app/admin/manager-tasks/page.js
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
  Download,
  RefreshCw,
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
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/admin/login");
      return;
    }

    fetchFormSubmissions();
  }, [session, status, router, searchTerm, statusFilter]);

  const fetchFormSubmissions = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);

      const response = await axios.get(`/api/admin/manager-tasks?${params}`);
      if (response.data.success) {
        setFormSubmissions(response.data.formSubmissions || []);
      }
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setFetching(false);
    }
  };

  const handleView = (submission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status) => {
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
        return <PlayCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEmployeeDisplayName = (employee) => {
    if (!employee) return "Unknown";
    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  };

  const getEmployeeDepartment = (employee) => {
    return employee?.department?.name || employee?.department || "No Department";
  };

  const getEmployeeInitials = (employee) => {
    if (!employee) return "??";
    const firstName = employee.firstName || "";
    const lastName = employee.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
  };

  const downloadFormData = (formData, fileName = "form-data") => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-700 text-lg font-medium">
            Loading Admin Panel...
          </span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Manager Tasks & Submissions
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Monitor all form submissions, assigned employees, and track progress across teams
            </p>
          </div>
          <Button
            onClick={fetchFormSubmissions}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Submissions
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formSubmissions.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formSubmissions.filter(s => s.status === "pending").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    In Progress
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formSubmissions.filter(s => s.status === "in_progress").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formSubmissions.filter(s => s.status === "completed" || s.status === "approved").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by submitted by, assigned to, or form data..."
                    className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-12 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-48">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                }}
                variant="outline"
                className="h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Submissions
                </CardTitle>
                <CardDescription className="text-gray-600 text-base mt-2">
                  {formSubmissions.length} submission{formSubmissions.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-3 text-gray-600">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-lg font-medium">Loading submissions...</span>
                </div>
              </div>
            ) : formSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <FileText className="w-24 h-24 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchTerm || statusFilter ? "No matches found" : "No submissions yet"}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  {searchTerm || statusFilter
                    ? "Try adjusting your search or filter terms"
                    : "Form submissions from managers will appear here"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Form & Submitted By
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Assigned To
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Assigned Employees
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Status
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Created
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formSubmissions.map((submission) => (
                      <TableRow
                        key={submission._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200 truncate">
                                {submission.formId?.title || "Unknown Form"}
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span>By: {submission.submittedBy}</span>
                              </div>
                              {submission.adminTask && (
                                <Badge variant="outline" className="mt-1 text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  Task: {submission.adminTask.title}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-base text-gray-700 font-medium">
                            {submission.assignedTo}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            {submission.assignedEmployees?.slice(0, 3).map((assignment, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs flex items-center gap-2 bg-white text-gray-700 border-gray-300 px-2 py-1 rounded-lg"
                              >
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[8px] font-bold">
                                    {getEmployeeInitials(assignment.employeeId)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-[10px]">
                                    {getEmployeeDisplayName(assignment.employeeId)}
                                  </span>
                                  <span className="text-[8px] text-gray-500">
                                    {getEmployeeDepartment(assignment.employeeId)}
                                  </span>
                                </div>
                              </Badge>
                            ))}
                            {submission.assignedEmployees?.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-gray-100 text-gray-600 border-gray-300 px-2 py-1 rounded-lg"
                              >
                                +{submission.assignedEmployees.length - 3} more
                              </Badge>
                            )}
                            {!submission.assignedEmployees?.length && (
                              <span className="text-sm text-gray-500 italic">
                                No employees
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            className={`${getStatusColor(submission.status)} text-sm font-semibold capitalize px-3 py-1.5 rounded-lg border flex items-center gap-1`}
                          >
                            {getStatusIcon(submission.status)}
                            {submission.status.replace("_", " ")}
                          </Badge>
                          {submission.status2 && submission.status2 !== submission.status && (
                            <Badge
                              variant="outline"
                              className="mt-1 text-xs bg-gray-100 text-gray-700 border-gray-300"
                            >
                              Secondary: {submission.status2}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3 text-gray-600">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold">
                              {formatDate(submission.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100"
                              >
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-lg w-48"
                            >
                              <DropdownMenuItem
                                onClick={() => handleView(submission)}
                                className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => downloadFormData(submission.formData, `submission-${submission._id}`)}
                                className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                              >
                                <Download className="w-4 h-4" />
                                Download Data
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Submission Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Submission Details
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 p-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <FileText className="w-6 h-6 text-blue-600" />
                      Submission Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Form Title
                      </Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">
                        {selectedSubmission.formId?.title || "Unknown Form"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Submitted By
                      </Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">
                        {selectedSubmission.submittedBy}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Assigned To
                      </Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">
                        {selectedSubmission.assignedTo}
                      </p>
                    </div>
                    {selectedSubmission.adminTask && (
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">
                          Related Task
                        </Label>
                        <p className="font-semibold text-gray-900 text-lg mt-1">
                          {selectedSubmission.adminTask.title}
                          {selectedSubmission.adminTask.clientName && (
                            <span className="text-gray-600 text-sm block">
                              Client: {selectedSubmission.adminTask.clientName}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <Clock className="w-6 h-6 text-blue-600" />
                      Status & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">
                          Primary Status
                        </Label>
                        <div className="mt-1">
                          <Badge
                            className={`${getStatusColor(selectedSubmission.status)} capitalize px-3 py-1.5 rounded-lg text-sm font-semibold border flex items-center gap-1`}
                          >
                            {getStatusIcon(selectedSubmission.status)}
                            {selectedSubmission.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">
                          Secondary Status
                        </Label>
                        <div className="mt-1">
                          <Badge
                            className={`${getStatusColor(selectedSubmission.status2)} capitalize px-3 py-1.5 rounded-lg text-sm font-semibold border flex items-center gap-1`}
                          >
                            {getStatusIcon(selectedSubmission.status2)}
                            {selectedSubmission.status2.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Created
                      </Label>
                      <p className="font-semibold text-gray-900 text-sm mt-1">
                        {formatDate(selectedSubmission.createdAt)}
                      </p>
                    </div>
                    {selectedSubmission.completedAt && (
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">
                          Completed
                        </Label>
                        <p className="font-semibold text-gray-900 text-sm mt-1">
                          {formatDate(selectedSubmission.completedAt)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Assigned Employees */}
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                  <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                    <User className="w-6 h-6 text-blue-600" />
                    Assigned Employees ({selectedSubmission.assignedEmployees?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedSubmission.assignedEmployees?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedSubmission.assignedEmployees.map((assignment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm">
                              {getEmployeeInitials(assignment.employeeId)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-base">
                              {getEmployeeDisplayName(assignment.employeeId)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {getEmployeeDepartment(assignment.employeeId)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {assignment.email}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge
                                className={`${getStatusColor(assignment.status)} text-xs capitalize px-2 py-1 rounded-md border flex items-center gap-1`}
                              >
                                {getStatusIcon(assignment.status)}
                                {assignment.status.replace("_", " ")}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(assignment.assignedAt)}
                              </span>
                            </div>
                            {assignment.completedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                Completed: {formatDate(assignment.completedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-base">
                        No employees assigned to this submission
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Data */}
              {selectedSubmission.formData && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Form Data
                      </CardTitle>
                      <Button
                        onClick={() => downloadFormData(selectedSubmission.formData, `submission-${selectedSubmission._id}-data`)}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download JSON
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedSubmission.formData, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feedback and Comments */}
              {(selectedSubmission.teamLeadFeedback || selectedSubmission.managerComments) && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <Building className="w-6 h-6 text-blue-600" />
                      Feedback & Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {selectedSubmission.teamLeadFeedback && (
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">
                          Team Lead Feedback
                        </Label>
                        <p className="text-gray-900 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          {selectedSubmission.teamLeadFeedback}
                        </p>
                      </div>
                    )}
                    {selectedSubmission.managerComments && (
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">
                          Manager Comments
                        </Label>
                        <p className="text-gray-900 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          {selectedSubmission.managerComments}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white rounded-xl px-8 py-3 font-semibold"
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