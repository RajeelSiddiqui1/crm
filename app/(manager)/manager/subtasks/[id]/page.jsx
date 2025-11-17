"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function ManagerEmployeeTaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subtaskId = params.id;

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [subtaskDetails, setSubtaskDetails] = useState(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/login");
      return;
    }

    fetchSubmissions();
    fetchSubtaskDetails();
  }, [session, status, router, subtaskId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/manager/subtasks/${subtaskId}/submissions`
      );
      if (response.status === 200) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      // Temporary: Check if it's params error
      if (error.response?.status === 500) {
        toast.error("Server error. Please try again.");
      } else {
        toast.error("Failed to load employee submissions");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtaskDetails = async () => {
    try {
      const response = await axios.get(`/api/manager/subtasks/${subtaskId}`);
      if (response.status === 200) {
        setSubtaskDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching subtask details:", error);
      // Don't show error for subtask details, it's optional
    }
  };

  const handleStatusUpdate = async (submissionId, newStatus) => {
    setUpdating(true);
    try {
      const response = await axios.patch(
        `/api/manager/subtasks/${subtaskId}/submissions/${submissionId}`,
        {
          managerStatus: newStatus,
        }
      );

      if (response.status === 200) {
        toast.success("Status updated successfully");
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub._id === submissionId
              ? { ...sub, managerStatus: newStatus }
              : sub
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update status";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Pending Review";
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <p className="text-gray-700">Loading submissions...</p>
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/manager/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Employee Submissions
              </h1>
              <p className="text-gray-600 mt-2">
                Review and manage employee form submissions for this task
              </p>
              {subtaskDetails && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                    Task: {subtaskDetails.title}
                  </span>
                  {subtaskDetails.description && (
                    <span className="text-gray-600">
                      {subtaskDetails.description}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={fetchSubmissions}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                  <p className="text-sm font-medium text-gray-600">
                    Total Submissions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      submissions.filter((s) => s.managerStatus === "pending")
                        .length
                    }
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      submissions.filter((s) => s.managerStatus === "approved")
                        .length
                    }
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      submissions.filter((s) => s.managerStatus === "rejected")
                        .length
                    }
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Employee Submissions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Review each submission and update their status accordingly
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-gray-50 text-gray-700 border-gray-200"
              >
                {submissions.length} submission
                {submissions.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Submissions Yet
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Employees haven't submitted any forms for this task yet. Check
                  back later for updates.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {submissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="border border-gray-200 rounded-lg p-6 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {submission.formId?.title || "Unknown Form"}
                          </h3>
                          <Badge
                            className={`${getStatusColor(
                              submission.managerStatus
                            )} border flex items-center gap-1 px-3 py-1 font-medium`}
                          >
                            {getStatusIcon(submission.managerStatus)}
                            {getStatusText(submission.managerStatus)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-gray-700">
                              {submission.employeeId
                                ? `${submission.employeeId.firstName} ${submission.employeeId.lastName}`
                                : submission.submittedBy}
                            </span>
                          </span>

                          {submission.employeeId?.email && (
                            <span className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{submission.employeeId.email}</span>
                            </span>
                          )}

                          {submission.employeeId?.department && (
                            <span className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              <span>{submission.employeeId.department}</span>
                            </span>
                          )}

                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(submission.createdAt)}</span>
                          </span>

                          {submission.completedAt && (
                            <span className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                Completed: {formatDate(submission.completedAt)}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <Select
                          value={submission.managerStatus}
                          onValueChange={(value) =>
                            handleStatusUpdate(submission._id, value)
                          }
                          disabled={updating}
                        >
                          <SelectTrigger className="w-48 border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-white text-gray-900">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 text-gray-900">
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2 text-gray-900">
                                <AlertCircle className="w-4 h-4 text-gray-600" />
                                <span>Pending Review</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <div className="flex items-center gap-2 text-gray-900">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span>In Progress</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2 text-gray-900">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span>Completed</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="approved">
                              <div className="flex items-center gap-2 text-gray-900">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Approved</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2 text-gray-900">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span>Rejected</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedSubmission(
                              selectedSubmission?._id === submission._id
                                ? null
                                : submission
                            )
                          }
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {selectedSubmission?._id === submission._id
                            ? "Hide Details"
                            : "View Details"}
                        </Button>
                      </div>
                    </div>

                    {selectedSubmission?._id === submission._id && (
                      <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Submitted Form Data
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-white text-gray-700"
                          >
                            {Object.keys(submission.formData || {}).length}{" "}
                            fields
                          </Badge>
                        </div>

                        {submission.formData &&
                        Object.keys(submission.formData).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(submission.formData).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                >
                                  <label className="text-sm font-medium text-gray-700 capitalize mb-2 block">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </label>
                                  <p className="text-gray-900 font-medium">
                                    {Array.isArray(value)
                                      ? value.join(", ")
                                      : value === null || value === undefined
                                      ? "Not provided"
                                      : String(value)}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No form data available</p>
                          </div>
                        )}

                        {submission.teamLeadFeedback && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="font-semibold text-blue-900 mb-2">
                              Team Lead Feedback
                            </h5>
                            <p className="text-blue-800">
                              {submission.teamLeadFeedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
