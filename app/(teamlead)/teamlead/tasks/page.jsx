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
  Users,
  Plus,
  Trash2,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function TeamLeadSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/login");
      return;
    }

    fetchSubmissions();
    fetchEmployees();
  }, [session, status, router]);

  const fetchSubmissions = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/teamlead/tasks");
      if (response.status === 200) {
        setSubmissions(response.data || []);
        toast.success(`Loaded ${response.data.length} submissions`);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
        router.push("/login");
      } else {
        toast.error(
          error.response?.data?.error || "Failed to fetch submissions"
        );
      }
    } finally {
      setFetching(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await axios.get("/api/teamlead/employees");
      if (response.status === 200) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleStatusUpdate = async (submissionId, newStatus, feedback = "") => {
    setLoading(true);

    try {
      const updateData = {
        submissionId: submissionId,
        status: newStatus,
        teamLeadFeedback: feedback,
      };

      const response = await axios.put("/api/teamlead/tasks", updateData);

      if (response.status === 200) {
        toast.success("Status updated successfully!");
        fetchSubmissions();
        setShowDetails(false);
        setFeedback("");
      }
    } catch (error) {
      console.error("Status update error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
        router.push("/login");
      } else if (error.response?.status === 403) {
        toast.error(error.response.data.error);
      } else {
        toast.error(error.response?.data?.error || "Failed to update status");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (submissionId, newStatus) => {
    setLoading(true);
    try {
      const updateData = {
        submissionId: submissionId,
        status: newStatus,
        teamLeadFeedback: `Status changed to ${newStatus}`,
      };

      const response = await axios.put("/api/teamlead/tasks", updateData);

      if (response.status === 200) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        fetchSubmissions();
      }
    } catch (error) {
      console.error("Quick status update error:", error);
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEmployees = async (submissionId) => {
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    setLoading(true);
    try {
      const assignedEmployeesData = selectedEmployees.map((empId) => {
        const employee = employees.find((e) => e._id === empId);
        return {
          employeeId: empId,
          email: employee.email,
          status: "pending",
        };
      });

      const updateData = {
        submissionId: submissionId,
        assignedEmployees: assignedEmployeesData,
      };

      const response = await axios.put("/api/teamlead/tasks", updateData);

      if (response.status === 200) {
        toast.success(
          `Assigned ${selectedEmployees.length} employee(s) successfully!`
        );
        fetchSubmissions();
        setSelectedEmployees([]);
        setShowDetails(false);
      }
    } catch (error) {
      console.error("Assign employees error:", error);
      toast.error(error.response?.data?.error || "Failed to assign employees");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeStatusUpdate = async (
    submissionId,
    employeeId,
    newStatus
  ) => {
    setLoading(true);
    try {
      const submission = submissions.find((s) => s._id === submissionId);
      const updatedEmployees = submission.assignedEmployees.map((emp) =>
        emp.employeeId._id === employeeId ? { ...emp, status: newStatus } : emp
      );

      const updateData = {
        submissionId: submissionId,
        assignedEmployees: updatedEmployees,
      };

      const response = await axios.put("/api/teamlead/tasks", updateData);

      if (response.status === 200) {
        toast.success(`Employee status updated to ${newStatus}`);
        fetchSubmissions();
      }
    } catch (error) {
      console.error("Employee status update error:", error);
      toast.error(
        error.response?.data?.error || "Failed to update employee status"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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

  // Get available employees for assignment (excluding already assigned ones)
  const getAvailableEmployees = (submission) => {
    if (!Array.isArray(employees)) return [];

    if (!submission || !submission.assignedEmployees) return employees;

    const assignedEmployeeIds = submission.assignedEmployees
      .map((emp) => emp.employeeId?._id)
      .filter((id) => id);

    return employees.filter(
      (employee) => !assignedEmployeeIds.includes(employee._id)
    );
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.formId?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.status?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter;

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
      return <span className="text-gray-400">Not provided</span>;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <div className="space-y-1 text-sm">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex">
              <span className="font-medium capitalize w-20 text-gray-700">
                {key}:
              </span>
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
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    in_progress: submissions.filter((s) => s.status === "in_progress").length,
    completed: submissions.filter((s) => s.status === "completed").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need to be logged in as TeamLead to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 overflow-x-hidden">
      <Toaster position="top-right" />

      <div className="max-w-[100vw] mx-auto w-full flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Assigned Tasks
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Welcome, {session.user.firstName}! Manage your assigned form
              submissions
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            {/* View All Subtasks Button */}
            <Link href="/teamlead/subtasks" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 w-full sm:w-auto text-xs sm:text-sm"
                size="sm"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                View Subtasks
              </Button>
            </Link>

            <Button
              onClick={fetchSubmissions}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 flex-1 sm:flex-none text-xs sm:text-sm"
              disabled={fetching}
              size="sm"
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${
                  fetching ? "animate-spin" : ""
                }`}
              />
              {fetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Tasks", value: statusStats.total, color: "gray" },
            { label: "Pending", value: statusStats.pending, color: "amber" },
            {
              label: "In Progress",
              value: statusStats.in_progress,
              color: "blue",
            },
            {
              label: "Completed",
              value: statusStats.completed,
              color: "green",
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className="bg-white border border-gray-200 shadow-sm"
            >
              <CardContent className="p-3 text-center">
                <div
                  className={`text-lg sm:text-xl font-bold ${
                    stat.color === "gray"
                      ? "text-gray-900"
                      : stat.color === "amber"
                      ? "text-amber-600"
                      : stat.color === "blue"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Card */}
        <Card className="shadow-md border border-gray-200 bg-white overflow-hidden flex-1 flex flex-col">
          <CardHeader className="bg-white border-b border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">
                  My Tasks
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm">
                  {filteredSubmissions.length} task
                  {filteredSubmissions.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-7 pr-3 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 border-gray-300 h-9 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36 border border-gray-300 bg-white text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 h-9 text-sm">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 text-gray-900">
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
                <div className="flex items-center gap-2 text-gray-700">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  <span className="text-sm">Loading tasks...</span>
                </div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-300 mb-3">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  {submissions.length === 0
                    ? "No tasks assigned"
                    : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  {submissions.length === 0
                    ? "Tasks assigned to you will appear here."
                    : "Try adjusting your search terms."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile View - Cards */}
                <div className="block lg:hidden space-y-3 p-3">
                  {filteredSubmissions.map((submission) => (
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
                                {submission.formId?.title || "Untitled Form"}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">
                                {submission.formId?.description ||
                                  "No description"}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${getStatusVariant(
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
                            <span className="text-gray-500">Assigned:</span>
                            <p className="font-medium">
                              {formatDate(submission.createdAt).split(",")[0]}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Employees:</span>
                            <p className="font-medium">
                              {submission.assignedEmployees?.length || 0}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Link
                            href={`/teamlead/subtasks/create?submissionId=${submission._id}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-xs h-7"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Subtask
                            </Button>
                          </Link>

                          <Button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowDetails(true);
                              setSelectedEmployees([]);
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
                    <TableHeader className="bg-gray-50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[300px]">
                          Form Details
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[120px]">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[150px]">
                          Employees
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[120px]">
                          Quick Actions
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[150px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((submission) => (
                        <TableRow
                          key={submission._id}
                          className="group hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="border border-gray-200 w-10 h-10">
                                <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                                  <FileText className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 text-sm group-hover:text-gray-700 transition-colors truncate">
                                  {submission.formId?.title || "Untitled Form"}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {submission.formId?.description ||
                                    "No description"}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Calendar className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">
                                    {formatDate(submission.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              className={`${getStatusVariant(
                                submission.status
                              )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                            >
                              {getStatusIcon(submission.status)}
                              {submission.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-1">
                              {submission.assignedEmployees &&
                              submission.assignedEmployees.length > 0 ? (
                                <>
                                  {submission.assignedEmployees
                                    .slice(0, 2)
                                    .map((emp, index) => (
                                      <div
                                        key={emp.employeeId._id}
                                        className="flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                              {emp.employeeId.firstName?.[0]}
                                              {emp.employeeId.lastName?.[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs text-gray-700 truncate max-w-[80px]">
                                            {emp.employeeId.firstName}
                                          </span>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${getStatusVariant(
                                            emp.status
                                          )}`}
                                        >
                                          {emp.status}
                                        </Badge>
                                      </div>
                                    ))}
                                  {submission.assignedEmployees.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{submission.assignedEmployees.length - 2}{" "}
                                      more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  No employees
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Select
                              onValueChange={(value) =>
                                handleQuickStatusUpdate(submission._id, value)
                              }
                              disabled={loading}
                            >
                              <SelectTrigger className="w-28 h-7 text-xs border border-gray-300 bg-white">
                                <SelectValue placeholder="Update" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 min-w-[120px]">
                                <SelectItem value="pending" className="text-xs">
                                  Pending
                                </SelectItem>
                                <SelectItem
                                  value="in_progress"
                                  className="text-xs"
                                >
                                  In Progress
                                </SelectItem>
                                <SelectItem
                                  value="completed"
                                  className="text-xs"
                                >
                                  Completed
                                </SelectItem>
                                <SelectItem
                                  value="rejected"
                                  className="text-xs"
                                >
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              <Link
                                href={`/teamlead/subtasks/create?submissionId=${submission._id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs h-7"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Subtask
                                </Button>
                              </Link>
                              <Button
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowDetails(true);
                                  setSelectedEmployees([]);
                                }}
                                className="bg-gray-900 text-white hover:bg-gray-800 text-xs h-7"
                                size="sm"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
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
        {showDetails && selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white border border-gray-200 shadow-xl">
              <CardHeader className="bg-gray-900 text-white p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-white text-lg truncate">
                      {selectedSubmission.formId?.title || "Task Details"}
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-sm truncate">
                      View task details, assign employees, and update status
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedSubmission(null);
                      setFeedback("");
                      setSelectedEmployees([]);
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-700 font-semibold text-sm">
                          Assigned Date
                        </Label>
                        <p className="text-gray-900 font-medium text-sm">
                          {formatDate(selectedSubmission.createdAt)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-semibold text-sm">
                          Status
                        </Label>
                        <Badge
                          className={`${getStatusVariant(
                            selectedSubmission.status
                          )} border flex items-center gap-1 px-2 py-1 font-medium text-sm`}
                        >
                          {getStatusIcon(selectedSubmission.status)}
                          {selectedSubmission.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Form Data */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Form Data
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedSubmission.formData &&
                        Object.entries(selectedSubmission.formData).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="border border-gray-200 rounded-lg p-3 bg-white"
                            >
                              <Label className="text-gray-700 font-semibold capitalize text-sm block mb-1">
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

                  <div className="w-full lg:w-32">
                    <Label
                      htmlFor="status"
                      className="text-xs font-medium text-gray-900 mb-1"
                    >
                      Status
                    </Label>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
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
                        <SelectItem
                          value="in_progress"
                          className="text-gray-900"
                        >
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
