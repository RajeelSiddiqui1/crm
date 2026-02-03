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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Play,
  X,
  File,
  FileSpreadsheet,
  Flag,
  Upload,
  Download,
  ImageIcon,
  VideoIcon,
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
  const [sharedTasks, setSharedTasks] = useState([]);
  const [managers, setManagers] = useState([]);
  const [teamleads, setTeamleads] = useState([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [activeTab, setActiveTab] = useState("submissions");

  const [shareForm, setShareForm] = useState({
    formId: "",
    originalTaskId: "",
    taskTitle: "",
    taskDescription: "",
    sharedTo: "",
    sharedToModel: "",
    dueDate: "",
    priority: "medium",
    notes: "",
  });
  const [zoom, setZoom] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  

  const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };
  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-blue-600" />;
    if (type.startsWith("video/")) return <VideoIcon className="w-4 h-4 text-red-600" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4 text-green-600" />;
    return <File className="w-4 h-4 text-gray-600" />;
  };
  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchSubmissions();
    fetchSubtaskDetails();
    fetchSharedTasks();
    fetchManagers();
    fetchTeamleads();
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
    }
  };

  const fetchSharedTasks = async () => {
    try {
      const response = await axios.get("/api/manager/sharedtask");
      if (response.data.success) {
        setSharedTasks(response.data.sharedTasks || []);
      }
    } catch (error) {
      console.error("Error fetching shared tasks:", error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get("/api/manager/managers");
      if (response.data.success) {
        setManagers(response.data.managers);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to load managers");
    }
  };

  const fetchTeamleads = async () => {
    try {
      const response = await axios.get("/api/manager/teamleads");
      if (response.data.success) {
        setTeamleads(response.data.teamleads || []);
      }
    } catch (error) {
      console.error("Error fetching teamleads:", error);
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

  const handleShareTask = async () => {
    if (!shareForm.sharedTo || !shareForm.sharedToModel) {
      toast.error("Please select a user to share with");
      return;
    }

    setSharing(true);
    try {
      const response = await axios.post("/api/manager/sharedtask", shareForm);

      if (response.data.success) {
        toast.success("Task shared successfully");
        setShowShareDialog(false);
        setShareForm({
          formId: "",
          originalTaskId: "",
          taskTitle: "",
          taskDescription: "",
          sharedTo: "",
          sharedToModel: "",
          dueDate: "",
          priority: "medium",
          notes: "",
        });
        fetchSharedTasks();
      }
    } catch (error) {
      console.error("Error sharing task:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to share task";
      toast.error(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const openShareDialog = (submission) => {
    setSelectedSubmission(submission);
    setShareForm({
      formId: submission._id,
      originalTaskId: subtaskId,
      taskTitle: submission.formId?.title || "Unknown Form",
      taskDescription: `Submission from ${submission.employeeId?.firstName} ${submission.employeeId?.lastName}`,
      sharedTo: "",
      sharedToModel: "",
      dueDate: "",
      priority: "medium",
      notes: "",
    });
    setShowShareDialog(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pending: "bg-gray-100 text-gray-800 border-gray-200",
      signed: "bg-purple-100 text-purple-800 border-purple-200",
      not_avaiable: "bg-orange-100 text-orange-800 border-orange-200",
      not_intrested: "bg-pink-100 text-pink-800 border-pink-200",
      re_shedule: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
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

  const formatSimpleDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isTaskSharedByMe = (task) => {
    return task.sharedBy._id === session?.user?.id;
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

  const tasksSharedByMe = sharedTasks.filter(task => isTaskSharedByMe(task));
  const tasksSharedWithMe = sharedTasks.filter(task => !isTaskSharedByMe(task));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/manager/subtasks">
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
                {activeTab === "submissions"
                  ? "Employee Submissions"
                  : "Shared Tasks"}
              </h1>
              <p className="text-gray-700 mt-2">
                {activeTab === "submissions"
                  ? "Review and manage employee form submissions for this task"
                  : "Manage tasks shared by you and with you"}
              </p>
              {subtaskDetails && activeTab === "submissions" && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200">
                    Task: {subtaskDetails.title}
                  </span>
                  {subtaskDetails.description && (
                    <span className="text-gray-700">
                      {subtaskDetails.description}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {activeTab === "submissions" && (
              <Button
                onClick={fetchSubmissions}
                variant="outline"
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <Button
            variant={activeTab === "submissions" ? "default" : "ghost"}
            onClick={() => setActiveTab("submissions")}
            className={`px-6 py-3 rounded-md ${
              activeTab === "submissions"
                ? "bg-gray-800 text-white shadow-sm hover:bg-gray-900"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Submissions ({submissions.length})
          </Button>
          <Button
            variant={activeTab === "shared" ? "default" : "ghost"}
            onClick={() => setActiveTab("shared")}
            className={`px-6 py-3 rounded-md ${
              activeTab === "shared"
                ? "bg-gray-800 text-white shadow-sm hover:bg-gray-900"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Shared Tasks ({sharedTasks.length})
          </Button>
        </div>

        {activeTab === "submissions" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
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
                      <p className="text-sm font-medium text-gray-700">
                        Pending Review
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {
                          submissions.filter(
                            (s) => s.managerStatus === "pending"
                          ).length
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
                      <p className="text-sm font-medium text-gray-700">
                        Approved
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {
                          submissions.filter(
                            (s) => s.managerStatus === "approved"
                          ).length
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
                      <p className="text-sm font-medium text-gray-700">
                        Rejected
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {
                          submissions.filter(
                            (s) => s.managerStatus === "rejected"
                          ).length
                        }
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Employee Submissions
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                      Review each submission and update their status accordingly
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 border-gray-300"
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
                    <p className="text-gray-700 max-w-md mx-auto">
                      Employees haven't submitted any forms for this task yet.
                      Check back later for updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {submissions.map((submission) => (
                      <div
                        key={submission._id}
                        className="border border-gray-200 rounded-lg p-6 bg-white hover:bg-gray-50 transition-colors duration-200"
                      >

   {/* Attachments Section - Moved to top for better visibility */}
      {submission.fileAttachments && submission.fileAttachments.length > 0 && (
        <Card className="mb-6 border border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Attachments ({submission.fileAttachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {submission.fileAttachments.map((file, index) => {
                const { url, name, type, publicId } = file;

                // Determine file type for styling
                const isImage = type?.startsWith("image/");
                const isVideo = type?.startsWith("video/");
                const isPDF = type?.includes("pdf") || name?.endsWith(".pdf");
                const isWord = type?.includes("word") || 
                              type?.includes("doc") || 
                              name?.endsWith(".doc") || 
                              name?.endsWith(".docx");
                const isExcel = type?.includes("excel") || 
                               type?.includes("sheet") || 
                               name?.endsWith(".xls") || 
                               name?.endsWith(".xlsx");

                // Determine colors and icons
                let bgColor = "bg-gray-100";
                let textColor = "text-gray-800";
                let Icon = File;
                
                if (isImage) {
                  bgColor = "bg-green-50";
                  textColor = "text-green-800";
                  Icon = ImageIcon;
                } else if (isVideo) {
                  bgColor = "bg-blue-50";
                  textColor = "text-blue-800";
                  Icon = VideoIcon;
                } else if (isPDF) {
                  bgColor = "bg-red-50";
                  textColor = "text-red-800";
                  Icon = FileText;
                } else if (isWord) {
                  bgColor = "bg-blue-50";
                  textColor = "text-blue-800";
                  Icon = FileText;
                } else if (isExcel) {
                  bgColor = "bg-green-50";
                  textColor = "text-green-800";
                  Icon = FileSpreadsheet;
                }

                return (
                  <div
                    key={publicId || index}
                    className={`${bgColor} border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200`}
                  >
                    {/* File Preview Area */}
                    <div 
                      className="h-40 w-full overflow-hidden relative cursor-pointer"
                      onClick={() => setPreviewFile(file)}
                    >
                      {isImage ? (
                        <img 
                          src={url} 
                          alt={name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : isVideo ? (
                        <div className="relative w-full h-full bg-black">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-12 h-12 text-white/70" />
                          </div>
                          <div className="absolute bottom-2 right-2">
                            <Badge className="bg-black/70 text-white text-xs">
                              Video
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-4">
                          <Icon className={`w-12 h-12 ${textColor} mb-2`} />
                          <span className={`text-xs font-medium ${textColor}`}>
                            {type?.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* File Info and Actions */}
                    <div className="p-3 bg-white border-t">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate mb-1">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {type || 'Unknown type'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={() => setPreviewFile(file)}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={() => downloadFile(url, name)}
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
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
                                {getStatusText(submission.managerStatus)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="font-medium text-gray-900">
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
                                  <span>
                                    {submission.employeeId.department}
                                  </span>
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
                                    Completed:{" "}
                                    {formatDate(submission.completedAt)}
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
                              <SelectTrigger className="w-48 border-gray-700 focus:border-gray-800 focus:ring-1 focus:ring-gray-800 bg-white text-gray-900">
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
                              onClick={() => openShareDialog(submission)}
                              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>

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
                              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
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
          </>
        )}

        {activeTab === "shared" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Total Shared Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{sharedTasks.length}</p>
                    </div>
                    <Share2 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Shared by Me</p>
                      <p className="text-2xl font-bold text-green-600">{tasksSharedByMe.length}</p>
                    </div>
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Shared with Me</p>
                      <p className="text-2xl font-bold text-purple-600">{tasksSharedWithMe.length}</p>
                    </div>
                    <Download className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Shared With Me Section */}
            {tasksSharedWithMe.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Tasks Shared By Me
                      </CardTitle>
                      <CardDescription className="text-gray-700">
                        Tasks that other managers have shared with you
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      {tasksSharedWithMe.length} task{tasksSharedWithMe.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {tasksSharedWithMe.map((task) => (
                      <div key={task._id} className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {task.taskTitle}
                                </h3>
                                <p className="text-sm text-gray-700 mb-2">
                                  Task ID: {task.originalTaskId}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 px-3 py-1 font-medium">
                                  <Download className="w-3 h-3" />
                                  Shared With Me
                                </Badge>
                                <Badge className={`${getPriorityColor(task.priority)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                                  <Flag className="w-3 h-3" />
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </Badge>
                                <Badge className={`${getStatusColor(task.status)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </Badge>
                              </div>
                            </div>

                            {task.taskDescription && (
                              <p className="text-gray-800 mb-4">{task.taskDescription}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                              <span className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                                <User className="w-4 h-4" />
                                <span className="font-medium">
                                  Shared by: {task.sharedBy?.firstName} {task.sharedBy?.lastName}
                                </span>
                              </span>

                              <span className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{task.sharedBy?.email}</span>
                              </span>

                              {task.dueDate && (
                                <span className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due: {formatSimpleDate(task.dueDate)}</span>
                                </span>
                              )}

                              <span className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Shared: {formatDate(task.createdAt)}</span>
                              </span>
                            </div>

                            {task.notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">
                                  <strong>Notes:</strong> {task.notes}
                                </p>
                              </div>
                            )}

                            {task.formId && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h5 className="font-semibold text-gray-900 mb-2">Form Details</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Form Title:</span>
                                    <span className="text-gray-900 ml-2">{task.formId.title || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Form ID:</span>
                                    <span className="text-gray-900 ml-2">{task.formId._id}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                               {task?.fileAttachments && task?.fileAttachments.length > 0 && (
                                      <div className="lg:col-span-3">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                          <Paperclip className="h-4 w-4" />
                                         Visitor Attachments ({task.fileAttachments.length})
                                        </h4>
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {task.fileAttachments.map((file, index) => {
                                              const { url, name, type } = file;
                            
                                              const isImage = type?.startsWith("image/");
                                              const isVideo = type?.startsWith("video/");
                                              const isPDF = type?.includes("pdf") || name?.endsWith(".pdf");
                                              const isWord = type?.includes("word") || 
                                                            type?.includes("doc") || 
                                                            name?.endsWith(".doc") || 
                                                            name?.endsWith(".docx");
                                              const isExcel = type?.includes("excel") || 
                                                             type?.includes("sheet") || 
                                                             name?.endsWith(".xls") || 
                                                             name?.endsWith(".xlsx");
                            
                                              // Determine colors and icons
                                              let bgColor = "bg-gray-100";
                                              let textColor = "text-gray-800";
                                              let Icon = FileText;
                                              
                                              if (isImage) {
                                                bgColor = "bg-green-50";
                                                textColor = "text-green-800";
                                                Icon = ImageIcon;
                                              } else if (isVideo) {
                                                bgColor = "bg-blue-50";
                                                textColor = "text-blue-800";
                                                Icon = VideoIcon;
                                              } else if (isPDF) {
                                                bgColor = "bg-red-50";
                                                textColor = "text-red-800";
                                              } else if (isWord) {
                                                bgColor = "bg-blue-50";
                                                textColor = "text-blue-800";
                                              } else if (isExcel) {
                                                bgColor = "bg-green-50";
                                                textColor = "text-green-800";
                                                Icon = FileSpreadsheet;
                                              }
                            
                                              return (
                                                <div
                                                  key={index}
                                                  className={`${bgColor} border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200`}
                                                >
                                                  {/* File Preview Area */}
                                                  <div 
                                                    className="h-32 w-full overflow-hidden relative cursor-pointer"
                                                    onClick={() => setPreviewFile(file)}
                                                  >
                                                    {isImage ? (
                                                      <img 
                                                        src={url} 
                                                        alt={name} 
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                      />
                                                    ) : isVideo ? (
                                                      <div className="relative w-full h-full bg-black">
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                          <Play className="w-8 h-8 text-white/70" />
                                                        </div>
                                                        <div className="absolute bottom-2 right-2">
                                                          <Badge className="bg-black/70 text-white text-xs">
                                                            Video
                                                          </Badge>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="h-full flex flex-col items-center justify-center p-3">
                                                        <Icon className={`w-10 h-10 ${textColor} mb-1`} />
                                                        <span className={`text-xs font-medium ${textColor}`}>
                                                          {type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                            
                                                  {/* File Info and Actions */}
                                                  <div className="p-3 bg-white border-t">
                                                    <div className="flex items-start justify-between gap-2">
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                                          {name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                          <span>{type || 'Unknown type'}</span>
                                                        </div>
                                                      </div>
                                                      <div className="flex gap-1">
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="h-8 w-8 p-0 hover:bg-gray-100"
                                                          onClick={() => setPreviewFile(file)}
                                                          title="Preview"
                                                        >
                                                          <Eye className="w-4 h-4 text-gray-600" />
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="h-8 w-8 p-0 hover:bg-gray-100"
                                                          onClick={() => downloadFile(url, name)}
                                                          title="Download"
                                                        >
                                                          <Download className="w-4 h-4 text-gray-600" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tasks Shared By Me Section */}
            {tasksSharedByMe.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Tasks Shared By Me
                      </CardTitle>
                      <CardDescription className="text-gray-700">
                        Tasks that you have shared with other managers
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {tasksSharedByMe.length} task{tasksSharedByMe.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {tasksSharedByMe.map((task) => (
                      <div key={task._id} className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {task.taskTitle}
                                </h3>
                                <p className="text-sm text-gray-700 mb-2">
                                  Task ID: {task.originalTaskId}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 px-3 py-1 font-medium">
                                  <Upload className="w-3 h-3" />
                                  Shared By You
                                </Badge>
                                <Badge className={`${getPriorityColor(task.priority)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                                  <Flag className="w-3 h-3" />
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </Badge>
                                <Badge className={`${getStatusColor(task.status)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </Badge>
                              </div>
                            </div>

                            {task.taskDescription && (
                              <p className="text-gray-800 mb-4">{task.taskDescription}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="font-medium text-gray-900">
                                  Shared with: {task.sharedManager?.firstName} {task.sharedManager?.lastName}
                                </span>
                              </span>

                              <span className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{task.sharedManager?.email}</span>
                              </span>

                              {task.dueDate && (
                                <span className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due: {formatSimpleDate(task.dueDate)}</span>
                                </span>
                              )}

                              <span className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Shared: {formatDate(task.createdAt)}</span>
                              </span>
                            </div>

                            {task.notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">
                                  <strong>Notes:</strong> {task.notes}
                                </p>
                              </div>
                            )}

                            {task.formId && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h5 className="font-semibold text-gray-900 mb-2">Form Details</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Form Title:</span>
                                    <span className="text-gray-900 ml-2">{task.formId.title || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Form ID:</span>
                                    <span className="text-gray-900 ml-2">{task.formId._id}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {sharedTasks.length === 0 && (
              <div className="text-center py-12">
                <Share2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shared Tasks</h3>
                <p className="text-gray-700 max-w-md mx-auto">
                  You haven't shared any tasks with others yet. Share a task from the Submissions tab.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Share Task Submission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Share With *
                </label>
                <Select
                  value={shareForm.sharedToModel}
                  onValueChange={(value) =>
                    setShareForm({
                      ...shareForm,
                      sharedToModel: value,
                      sharedTo: "",
                    })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-700 text-gray-900">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Select Manager *
                </label>
                <Select
                  value={shareForm.sharedTo}
                  onValueChange={(value) =>
                    setShareForm({ ...shareForm, sharedTo: value })
                  }
                  disabled={!shareForm.sharedToModel}
                >
                  <SelectTrigger className="bg-white border-gray-700 text-gray-900">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {managers.map((manager) => (
                      <SelectItem key={manager._id} value={manager._id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900">
                            {manager.firstName} {manager.lastName}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs text-gray-600"
                          >
                            {manager.email}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={shareForm.dueDate}
                  onChange={(e) =>
                    setShareForm({ ...shareForm, dueDate: e.target.value })
                  }
                  className="bg-white border-gray-700 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Priority
                </label>
                <Select
                  value={shareForm.priority}
                  onValueChange={(value) =>
                    setShareForm({ ...shareForm, priority: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-700 text-gray-900">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-green-600" />
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-yellow-600" />
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-600" />
                        <span>High</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Notes</label>
              <Textarea
                value={shareForm.notes}
                onChange={(e) =>
                  setShareForm({ ...shareForm, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
                rows={3}
                className="bg-white border-gray-700 text-gray-900"
              />
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
                onClick={handleShareTask}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={
                  sharing || !shareForm.sharedTo || !shareForm.sharedToModel
                }
              >
                {sharing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Task
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

            {/* Full Page Preview Modal with Zoom */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <h3 className="font-bold text-gray-900 truncate">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => prev + 0.2)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom In +
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.2))}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom Out -
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFile(previewFile.url, previewFile.name)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-50">
              {previewFile.type?.includes('image') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : previewFile.type?.includes('video') ? (
                <video
                  controls
                  autoPlay
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <source src={previewFile.url} type={previewFile.type} />
                  Your browser does not support the video tag.
                </video>
              ) : previewFile.type?.includes('pdf') ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[90vh] border rounded-lg"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700">Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                    className="mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}