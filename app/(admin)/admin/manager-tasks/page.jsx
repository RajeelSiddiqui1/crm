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
  RefreshCw,
  Shield,
  Mail,
  Phone,
  MapPin,
  FileDown,
  ChevronDown,
  Download,
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
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/admin/login");
      return;
    }

    fetchFormSubmissions();
  }, [session, status, router]);

  // Debounced search effect
  useEffect(() => {
    if (status === "loading") return;

    const timer = setTimeout(() => {
      fetchFormSubmissions();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const fetchFormSubmissions = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await axios.get(`/api/admin/manager-tasks?${params}`);

      if (response.data.success) {
        setFormSubmissions(response.data.formSubmissions || []);
      } else {
        toast.error(response.data.error || "Failed to fetch tasks");
        setFormSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      toast.error("Failed to fetch tasks. Please try again.");
      setFormSubmissions([]);
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
    if (!employee) return "Unknown Employee";
    if (employee.name) return employee.name;
    return (
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
      "Unknown Employee"
    );
  };

  const getEmployeeDepartment = (employee) => {
    return (
      employee?.department?.name || employee?.department || "No Department"
    );
  };

  const getEmployeeInitials = (employee) => {
    if (!employee) return "??";
    if (employee.name) {
      const names = employee.name.split(" ");
      return (
        `${names[0]?.charAt(0) || ""}${
          names[1]?.charAt(0) || ""
        }`.toUpperCase() || "??"
      );
    }
    const firstName = employee.firstName || "";
    const lastName = employee.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
  };

  // Professional form data display function
  const renderFormData = (formData, formFields = []) => {
    if (!formData || typeof formData !== "object") {
      return <p className="text-gray-500 italic">No form data available</p>;
    }

    const entries = Object.entries(formData);
    if (entries.length === 0) {
      return <p className="text-gray-500 italic">No form data submitted</p>;
    }

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => {
          // Find field configuration from form schema
          const fieldConfig = formFields.find((field) => field.name === key);
          const label = fieldConfig?.label || key;

          return (
            <div
              key={key}
              className="border-b border-gray-200 pb-3 last:border-b-0"
            >
              <Label className="text-sm font-medium text-gray-700 capitalize">
                {label.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <div className="mt-1">
                {Array.isArray(value) ? (
                  <div className="flex flex-wrap gap-2">
                    {value.map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700"
                      >
                        {String(item)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900 font-medium">
                    {value !== null && value !== undefined
                      ? String(value)
                      : "Not provided"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Download as PDF/CSV functionality
  const exportSubmission = (submission, format = "pdf") => {
    toast.info(`Preparing ${format.toUpperCase()} export...`);
    // In a real app, you would generate PDF/CSV here
    console.log(`Exporting submission ${submission._id} as ${format}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4 overflow-x-hidden">
      <Toaster position="top-right" />

      <div className="max-w-[100vw] mx-auto w-full px-0">
        {/* Header Section - Compact for small screens */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div className="text-center sm:text-left w-full">
            <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                Manager Tasks
              </h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto sm:mx-0 text-center sm:text-left">
              Monitor form submissions and track progress
            </p>
          </div>
          <Button
            onClick={fetchFormSubmissions}
            disabled={fetching}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full sm:w-auto text-sm"
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${fetching ? "animate-spin" : ""}`}
            />
            {fetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Stats Cards - More Compact */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formSubmissions.length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending</p>
                  <p className="text-xl font-bold text-gray-900">
                    {
                      formSubmissions.filter((s) => s.status === "pending")
                        .length
                    }
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    In Progress
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {
                      formSubmissions.filter((s) => s.status === "in_progress")
                        .length
                    }
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-gray-900">
                    {
                      formSubmissions.filter(
                        (s) =>
                          s.status === "completed" || s.status === "approved"
                      ).length
                    }
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section - More Compact */}
        <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-xl w-full">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end w-full">
              <div className="flex-1 w-full">
                <Label
                  htmlFor="search"
                  className="text-xs font-medium text-gray-700 mb-1"
                >
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search submissions..."
                    className="pl-7 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 h-9 rounded-lg text-sm w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full lg:w-32">
                <Label
                  htmlFor="status"
                  className="text-xs font-medium text-gray-900 mb-1"
                >
                  Status
                </Label>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 rounded-lg text-sm w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>

                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="all" className="text-gray-900">
                      All Status
                    </SelectItem>
                    <SelectItem value="pending" className="text-gray-900">
                      Pending
                    </SelectItem>
                    <SelectItem value="in_progress" className="text-gray-900">
                      In Progress
                    </SelectItem>
                    <SelectItem value="completed" className="text-gray-900">
                      Completed
                    </SelectItem>
                    <SelectItem value="approved" className="text-gray-900">
                      Approved
                    </SelectItem>
                    <SelectItem value="rejected" className="text-gray-900">
                      Rejected
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="h-9 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg flex-1 lg:flex-none text-sm"
                  size="sm"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table - Optimized for 13-14 inch screens */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden w-full">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full">
              <div className="w-full">
                <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Submissions
                </CardTitle>
                <CardDescription className="text-gray-600 text-xs sm:text-sm">
                  {formSubmissions.length} submission
                  {formSubmissions.length !== 1 ? "s" : ""} found
                  {fetching && " • Loading..."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 w-full">
            {fetching ? (
              <div className="flex justify-center items-center py-12 w-full">
                <div className="flex items-center gap-2 text-gray-600">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-sm font-medium">
                    Loading submissions...
                  </span>
                </div>
              </div>
            ) : formSubmissions.length === 0 ? (
              <div className="text-center py-12 w-full">
                <div className="text-gray-300 mb-3">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No matches found"
                    : "No submissions yet"}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter terms"
                    : "Form submissions from managers will appear here"}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button onClick={clearFilters} className="mt-3" size="sm">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View - Cards (for all small screens) */}
                <div className="block  xl:hidden space-y-3 p-3">
                  {formSubmissions.map((submission) => (
                    <Card
                      key={submission._id}
                      className="p-3 hover:shadow-md transition-shadow duration-200"
                    >
                      <CardContent className="space-y-3 p-0">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                {submission.formId?.title || "Unknown Form"}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">
                                By: {submission.submittedBy}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${getStatusColor(
                              submission.status
                            )} text-xs font-semibold capitalize px-2 py-1 rounded border flex items-center gap-1 flex-shrink-0 ml-2`}
                          >
                            {getStatusIcon(submission.status)}
                            <span className="hidden sm:inline">
                              {submission.status.replace("_", " ")}
                            </span>
                            <span className="sm:hidden">
                              {submission.status === "completed"
                                ? "Done"
                                : submission.status === "in_progress"
                                ? "Progress"
                                : submission.status === "pending"
                                ? "Pending"
                                : submission.status.slice(0, 3)}
                            </span>
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Team:</span>
                            <p className="font-medium truncate">
                              {submission.assignedTo}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <p className="font-medium">
                              {formatDate(submission.createdAt).split(",")[0]}
                            </p>
                          </div>
                        </div>

                        {/* Team Members */}
                        <div>
                          <span className="text-gray-500 text-xs">
                            Team Members:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {submission.assignedEmployees
                              ?.slice(0, 2)
                              .map((assignment, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-gray-50 px-1.5 py-0.5"
                                >
                                  {
                                    getEmployeeDisplayName(
                                      assignment.employeeId
                                    ).split(" ")[0]
                                  }
                                </Badge>
                              ))}
                            {submission.assignedEmployees?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{submission.assignedEmployees.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex  gap-2 pt-1">
                          <Button
                            onClick={() => handleView(submission)}
                            size="sm"
                            className="flex-1 bg-gray-900 text-xs h-8"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 bg-gray-900"
                              >
                                <MoreVertical className="w-3 h-3 " />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 bg-white "
                            >
                              <DropdownMenuItem
                                onClick={() => handleView(submission)}
                                className="text-xs "
                              >
                                <Eye className="w-3 h-3 mr-2 text-dark" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  exportSubmission(submission, "pdf")
                                }
                                className="text-xs"
                              >
                                <FileDown className="w-3 h-3 mr-2 text-dark" />
                                Export PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View - Table (only for xl screens and above) */}
                <div className="hidden xl:block overflow-x-auto w-full">
                  <div className="min-w-[900px] w-full">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                          <TableHead className="font-bold text-gray-900 text-xs uppercase tracking-wide py-3 px-3 min-w-[200px]">
                            Form & Manager
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 text-xs uppercase tracking-wide py-3 px-3 min-w-[120px]">
                            Team
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 text-xs uppercase tracking-wide py-3 px-3 min-w-[150px]">
                            Members
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 text-xs uppercase tracking-wide py-3 px-3 min-w-[100px]">
                            Status
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 text-xs uppercase tracking-wide py-3 px-3 min-w-[130px]">
                            Created
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 text-xs uppercase tracking-wide py-3 px-3 min-w-[80px]">
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
                            <TableCell className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow">
                                    <FileText className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors duration-200 truncate">
                                    {submission.formId?.title || "Unknown Form"}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">
                                      By: {submission.submittedBy}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <div className="text-sm text-gray-700 font-medium truncate">
                                {submission.assignedTo}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {submission.assignedEmployees
                                  ?.slice(0, 2)
                                  .map((assignment, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs flex items-center gap-1 bg-white text-gray-700 border-gray-300 px-1.5 py-0.5 rounded"
                                    >
                                      <Avatar className="w-3 h-3">
                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[6px] font-bold">
                                          {getEmployeeInitials(
                                            assignment.employeeId
                                          )}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-[10px] font-semibold truncate">
                                        {
                                          getEmployeeDisplayName(
                                            assignment.employeeId
                                          ).split(" ")[0]
                                        }
                                      </span>
                                    </Badge>
                                  ))}
                                {submission.assignedEmployees?.length > 2 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-gray-100 text-gray-600 border-gray-300 px-1.5 py-0.5 rounded"
                                  >
                                    +{submission.assignedEmployees.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <Badge
                                className={`${getStatusColor(
                                  submission.status
                                )} text-xs font-semibold capitalize px-2 py-1 rounded border flex items-center gap-1`}
                              >
                                {getStatusIcon(submission.status)}
                                {submission.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span className="text-xs font-semibold">
                                  {formatDate(submission.createdAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-7 w-7 p-0 rounded hover:bg-gray-100"
                                  >
                                    <MoreVertical className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-white text-gray-900 border border-gray-200 rounded-lg shadow-lg w-36"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleView(submission)}
                                    className="text-xs cursor-pointer px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      exportSubmission(submission, "pdf")
                                    }
                                    className="text-xs cursor-pointer px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                                  >
                                    <FileDown className="w-3 h-3" />
                                    Export PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Submission Dialog - Compact for small screens */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-xl w-[95vw] max-w-[95vw]">
          <DialogHeader className="p-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Submission Details
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 p-4">
              {/* Header with Status */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedSubmission.formId?.title || "Unknown Form"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Submitted by {selectedSubmission.submittedBy}
                  </p>
                </div>
                <Badge
                  className={`${getStatusColor(
                    selectedSubmission.status
                  )} text-sm font-semibold capitalize px-3 py-1.5 rounded border flex items-center gap-2`}
                >
                  {getStatusIcon(selectedSubmission.status)}
                  {selectedSubmission.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <CardHeader className="bg-gray-50 p-3 border-b">
                      <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                        <User className="w-4 h-4 text-blue-600" />
                        Assignment Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          Assigned Team
                        </Label>
                        <p className="font-semibold text-gray-900">
                          {selectedSubmission.assignedTo}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          Submitted By
                        </Label>
                        <p className="font-semibold text-gray-900">
                          {selectedSubmission.submittedBy}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          Created Date
                        </Label>
                        <p className="text-gray-900">
                          {formatDate(selectedSubmission.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assigned Employees */}
                  <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <CardHeader className="bg-gray-50 p-3 border-b">
                      <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                        <User className="w-4 h-4 text-blue-600" />
                        Team Members (
                        {selectedSubmission.assignedEmployees?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      {selectedSubmission.assignedEmployees?.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedSubmission.assignedEmployees.map(
                            (assignment, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs">
                                    {getEmployeeInitials(assignment.employeeId)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-xs truncate">
                                    {getEmployeeDisplayName(
                                      assignment.employeeId
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {getEmployeeDepartment(
                                      assignment.employeeId
                                    )}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <User className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                          <p className="text-gray-500 text-xs">
                            No team members assigned
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Form Data */}
                <div className="lg:col-span-2">
                  <Card className="bg-white border border-gray-200 rounded-lg shadow-sm h-full">
                    <CardHeader className="bg-gray-50 p-3 border-b">
                      <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Form Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      {selectedSubmission.formData ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto text-sm">
                          {renderFormData(
                            selectedSubmission.formData,
                            selectedSubmission.formId?.fields || []
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            No form data available
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200">
                <Button
                  onClick={() => exportSubmission(selectedSubmission, "pdf")}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 text-sm"
                  size="sm"
                >
                  <FileDown className="w-3 h-3 mr-1" />
                  Export PDF
                </Button>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                  size="sm"
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
