// app/teamlead/tasks/page.js
"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  Users,
  Plus,
  ArrowRight,
  Share2,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import ShareTaskModal from "./[id]/share-modal/page";

export default function TeamLeadSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [status2Filter, setstatus2Filter] = useState("all");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchSubmissions();
  }, [session, status, router]);

  const fetchSubmissions = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/teamlead/tasks");
      if (response.status === 200) {
        setSubmissions(response.data || []);
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

  const getstatus2Variant = (status2) => {
    switch (status2) {
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

  function getEmployeeStatusVariant(status) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  const getstatus2Icon = (status2) => {
    switch (status2) {
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

  function getEmployeeStatusIcon(status) {
    switch (status) {
      case "pending":
        return "⏳"; // clock
      case "in_progress":
        return "⚙️"; // gear
      case "completed":
        return "✅"; // check
      case "rejected":
        return "❌"; // cross
      default:
        return "ℹ️";
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.formId?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.status2?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesstatus2 =
      status2Filter === "all" || submission.status2 === status2Filter;

    return matchesSearch && matchesstatus2;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border border-green-300";
      case "approved":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const status2Stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status2 === "pending").length,
    in_progress: submissions.filter((s) => s.status2 === "in_progress").length,
    completed: submissions.filter(
      (s) => s.status2 === "completed" || s.status2 === "approved"
    ).length,
    rejected: submissions.filter((s) => s.status2 === "rejected").length,
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
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 overflow-x-hidden">
      <Toaster position="top-right" />

      <div className="max-w-[100vw] mx-auto w-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Assigned Tasks
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Welcome, {session.user.firstName}! Manage your assigned form tasks
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Tasks", value: status2Stats.total, color: "gray" },
            { label: "Pending", value: status2Stats.pending, color: "amber" },
            {
              label: "In Progress",
              value: status2Stats.in_progress,
              color: "blue",
            },
            {
              label: "Completed",
              value: status2Stats.completed,
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

        <Card className="shadow-md border border-gray-200 bg-white overflow-hidden flex-1 flex flex-col">
          <CardHeader className="bg-white border-b border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">
                  All Tasks
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

                <Select value={status2Filter} onValueChange={setstatus2Filter}>
                  <SelectTrigger className="w-full sm:w-36 border border-gray-300 bg-white text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 h-9 text-sm">
                    <SelectValue placeholder="Filter status2" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 text-gray-900">
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
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
                <div className="block lg:hidden space-y-3 p-3">
                  {filteredSubmissions.map((submission) => (
                    <Card
                      key={submission._id}
                      className="p-3 hover:shadow-md transition-shadow duration-200"
                    >
                      <CardContent className="space-y-3 p-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                {submission.formId?.title || "Untitled Task"}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">
                                Assigned: {formatDate(submission.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${getstatus2Variant(
                              submission.status2
                            )} text-xs font-semibold capitalize px-2 py-1 rounded border flex items-center gap-1 flex-shrink-0 ml-2`}
                          >
                            {getstatus2Icon(submission.status2)}
                            <span className="hidden sm:inline">
                              {submission.status2.replace("_", " ")}
                            </span>
                            <span className="sm:hidden">
                              {submission.status2 === "completed"
                                ? "Done"
                                : submission.status2 === "in_progress"
                                ? "Progress"
                                : submission.status2 === "pending"
                                ? "Pending"
                                : submission.status2.slice(0, 3)}
                            </span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Submitted By:</span>
                            <p className="font-medium truncate">
                              {submission.submittedBy?.firstName || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Employees:</span>
                            <p className="font-medium">
                              {submission.assignedEmployees?.length || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Link
                            href={`/teamlead/tasks/${submission._id}`}
                            className="flex-1"
                          >
                            <Button
                              className="w-full bg-blue-600 text-white hover:bg-blue-700 text-xs h-7"
                              size="sm"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="hidden lg:block">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[250px]">
                          Task Details
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[150px]">
                          Submitted By
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[100px]">
                          Manager
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[100px]">
                          Employee Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[100px]">
                          Your Status
                        </TableHead>

                        <TableHead className="font-semibold text-gray-700 text-sm py-3 w-[100px]">
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
                          {/* Client Name */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="border border-gray-200 w-10 h-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                  <FileText className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 text-sm group-hover:text-gray-700 transition-colors truncate">
                                  {submission.clinetName || "No Client"}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Submitted By */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                                  {submission.submittedBy?.firstName?.[0] ||
                                    "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {submission.submittedBy?.firstName ||
                                    "Unknown"}{" "}
                                  {submission.submittedBy?.lastName || ""}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                  {submission.submittedBy?.email || "N/A"}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3">
                            <Badge
                              className={`${getStatusBadgeClass(
                                submission.status
                              )} capitalize px-3 py-1 text-xs font-semibold`}
                            >
                              {submission.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 flex flex-col gap-1">
                            {submission.assignedEmployees?.length > 0 ? (
                              submission.assignedEmployees.map((emp) => (
                                <Badge
                                  key={emp.employeeId.toString()}
                                  className={`${getEmployeeStatusVariant(
                                    emp.status
                                  )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                                >
                                  {getEmployeeStatusIcon(emp.status)}
                                  {emp.status.replace("_", " ")}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">
                                No Employees Assigned
                              </span>
                            )}
                          </TableCell>

                          {/* Status2 */}
                          <TableCell className="py-3">
                            <Badge
                              className={`${getstatus2Variant(
                                submission.status2
                              )} border flex items-center gap-1 px-2 py-1 font-medium text-xs`}
                            >
                              {getstatus2Icon(submission.status2)}
                              {submission.status2.replace("_", " ")}
                            </Badge>
                          </TableCell>

                          {/* Assigned Employees Status */}
                          

                          {/* Actions */}
                          <TableCell className="py-3 flex gap-2 flex-wrap">
                            <Link
                              href={`/group-chat?submissionId=${submission._id}`}
                            >
                              <Button
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2 rounded-md shadow-sm transition"
                                size="sm"
                              >
                                <Eye className="w-3 h-3" />
                                Chat
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>

                            <Link href={`/teamlead/tasks/${submission._id}`}>
                              <Button
                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2 rounded-md shadow-sm transition"
                                size="sm"
                              >
                                <Eye className="w-3 h-3" />
                                Task Details
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
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
      </div>
      <ShareTaskModal
        submissionId={submissionId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSuccess={() => {
          // Refresh task details or show success message
        }}
      />
    </div>
  );
}
