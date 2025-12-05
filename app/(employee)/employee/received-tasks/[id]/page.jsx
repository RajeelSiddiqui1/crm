"use client";
import React, { useState, useEffect, useRef } from "react";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Mail,
  Building,
  RefreshCw,
  Edit,
  Save,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  Download,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

export default function EmployeeTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;
  const fileInputRef = useRef(null);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Employee") {
      router.push("/login");
      return;
    }

    fetchTask();
  }, [session, status, router, taskId]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/employee/received-tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.task);
        setSelectedStatus(response.data.task.status);
        setFeedback(response.data.task.employeeFeedback || "");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("status", selectedStatus);
      if (feedback) {
        formData.append("feedback", feedback);
      }

      const response = await axios.patch(
        `/api/employee/received-tasks/${taskId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Status updated successfully");
        setTask(response.data.task);
        setShowStatusDialog(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMessage = error.response?.data?.message || "Failed to update status";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleAttachmentUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)");
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("status", task.status);
      formData.append("attachment", selectedFile);
      if (feedback) {
        formData.append("feedback", feedback);
      }

      const response = await axios.patch(
        `/api/employee/received-tasks/${taskId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Attachment uploaded successfully");
        setTask(response.data.task);
        setSelectedFile(null);
        setFilePreview(null);
        setShowAttachmentDialog(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      const errorMessage = error.response?.data?.message || "Failed to upload attachment";
      toast.error(errorMessage);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async () => {
    try {
      const response = await axios.delete(`/api/employee/received-tasks/${taskId}`);

      if (response.data.success) {
        toast.success("Attachment removed successfully");
        setTask(prev => ({
          ...prev,
          attachmentUrl: null,
          attachmentPublicId: null,
          attachmentUpdatedAt: new Date(),
        }));
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      const errorMessage = error.response?.data?.message || "Failed to remove attachment";
      toast.error(errorMessage);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)");
        return;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openStatusDialog = () => {
    setSelectedStatus(task?.status || "pending");
    setShowStatusDialog(true);
  };

  const openAttachmentDialog = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowAttachmentDialog(true);
  };

  const downloadAttachment = () => {
    if (task?.attachmentUrl) {
      const link = document.createElement("a");
      link.href = task.attachmentUrl;
      link.download = `attachment_${task.originalTaskId}_${new Date().getTime()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Status color functions
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white border-yellow-600",
      signed: "bg-green-500 text-white border-green-600",
      not_avaiable: "bg-red-500 text-white border-red-600",
      not_intrested: "bg-orange-500 text-white border-orange-600",
      re_shedule: "bg-blue-500 text-white border-blue-600",
      completed: "bg-green-500 text-white border-green-600",
      in_progress: "bg-blue-500 text-white border-blue-600",
      cancelled: "bg-red-500 text-white border-red-600",
    };
    return colors[status] || "bg-gray-500 text-white border-gray-600";
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
          <p className="text-gray-700">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Employee") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in as Employee to access this page.</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
          <p className="text-gray-600">The requested task could not be found.</p>
          <Link href="/employee/received-tasks">
            <Button className="mt-4 bg-gray-800 hover:bg-gray-900 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/employee/received-tasks">
              <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{task.taskTitle}</h1>
              <p className="text-sm md:text-base text-gray-700 mt-1">Task ID: {task.originalTaskId}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            <Button
              onClick={fetchTask}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={openStatusDialog}
              className="bg-gray-800 hover:bg-gray-900 text-white"
              size="sm"
            >
              <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Update Status
            </Button>
            <Button
              onClick={openAttachmentDialog}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              size="sm"
            >
              <Paperclip className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              {task.attachmentUrl ? "Change Attachment" : "Add Attachment"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Task Details Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200 p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl font-bold text-gray-900">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Priority</p>
                      <Badge className={`${getPriorityColor(task.priority)} border mt-1 text-xs md:text-sm`}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Status</p>
                      <Badge className={`${getStatusColor(task.status)} border mt-1 text-xs md:text-sm`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {task.taskDescription && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-gray-900 mt-1 text-sm md:text-base">{task.taskDescription}</p>
                    </div>
                  )}

                  {task.notes && (
                    <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-1">Additional Notes</p>
                      <p className="text-blue-800 text-sm md:text-base">{task.notes}</p>
                    </div>
                  )}

                  {task.employeeFeedback && (
                    <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-1">Your Feedback</p>
                      <p className="text-green-800 text-sm md:text-base">{task.employeeFeedback}</p>
                      {task.feedbackUpdatedAt && (
                        <p className="text-xs text-green-700 mt-2">
                          Updated: {formatDate(task.feedbackUpdatedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Due Date</p>
                      <p className="text-gray-900 text-sm md:text-base">
                        {task.dueDate ? formatDate(task.dueDate) : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Assigned Date</p>
                      <p className="text-gray-900 text-sm md:text-base">{formatDate(task.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachment Card */}
            {task.attachmentUrl && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-200 p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center justify-between">
                    <span>Attachment</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadAttachment}
                        variant="outline"
                        size="sm"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Download className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-md h-64 md:h-80 border-2 border-gray-300 rounded-lg overflow-hidden">
                      {/* Fixed: Use regular img tag for Cloudinary images to avoid Next.js Image error */}
                      <img
                        src={task.attachmentUrl}
                        alt="Task Attachment"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-image.png"; // Fallback image
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-4">
                      Last updated: {task.attachmentUpdatedAt ? formatDate(task.attachmentUpdatedAt) : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Data Card */}
            {task.formId?.formData && Object.keys(task.formId.formData).length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-200 p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl font-bold text-gray-900">Form Data</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {Object.entries(task.formId.formData).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                        <label className="text-xs md:text-sm font-medium text-gray-700 capitalize mb-1 md:mb-2 block">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <p className="text-gray-900 font-medium text-sm md:text-base">
                          {Array.isArray(value) ? value.join(", ") : 
                           value === null || value === undefined ? "Not provided" : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Assignment Info */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200 p-4 md:p-6">
                <CardTitle className="text-base md:text-lg font-bold text-gray-900">Assignment Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-700">Assigned by</p>
                      <p className="text-gray-900 font-semibold text-sm md:text-base">
                        {task.sharedTeamlead?.firstName} {task.sharedTeamlead?.lastName}
                      </p>
                      <p className="text-xs text-gray-600">Teamlead</p>
                      {task.sharedTeamlead?.depId && (
                        <p className="text-xs text-gray-500 mt-1">Dept ID: {task.sharedTeamlead.depId}</p>
                      )}
                    </div>
                  </div>

                  {task.sharedTeamlead?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-700">Email</p>
                        <p className="text-gray-900 text-sm md:text-base">{task.sharedTeamlead.email}</p>
                      </div>
                    </div>
                  )}

                  {task.sharedTeamlead?.department && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-700">Department</p>
                        <p className="text-gray-900 text-sm md:text-base">{task.sharedTeamlead.department}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Your Info */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200 p-4 md:p-6">
                <CardTitle className="text-base md:text-lg font-bold text-gray-900">Your Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-700">You (Employee)</p>
                      <p className="text-gray-900 font-semibold text-sm md:text-base">
                        {task.sharedEmployee?.firstName} {task.sharedEmployee?.lastName}
                      </p>
                      {task.sharedEmployee?.depId && (
                        <p className="text-xs text-gray-500 mt-1">Dept ID: {task.sharedEmployee.depId}</p>
                      )}
                    </div>
                  </div>

                  {task.sharedEmployee?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-700">Email</p>
                        <p className="text-gray-900 text-sm md:text-base">{task.sharedEmployee.email}</p>
                      </div>
                    </div>
                  )}

                  {task.sharedEmployee?.department && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-700">Department</p>
                        <p className="text-gray-900 text-sm md:text-base">{task.sharedEmployee.department}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200 p-4 md:p-6">
                <CardTitle className="text-base md:text-lg font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2 md:space-y-3">
                  <Button
                    onClick={openStatusDialog}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                    size="sm"
                  >
                    <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Update Status
                  </Button>
                  
                  <Button
                    onClick={openAttachmentDialog}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    size="sm"
                  >
                    <Paperclip className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    {task.attachmentUrl ? "Change Attachment" : "Add Attachment"}
                  </Button>
                  
                  <Link href="/employee/received-tasks">
                    <Button
                      variant="outline"
                      className="w-full border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                      size="sm"
                    >
                      <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      Back to Tasks
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold text-gray-900">Update Task Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1 md:mb-2">Task Information</h4>
              <p className="text-blue-900 text-sm md:text-base">
                <strong>Title:</strong> {task.taskTitle}
              </p>
              <p className="text-blue-900 text-sm md:text-base">
                <strong>Current Status:</strong> {task.status.replace('_', ' ')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Select New Status *</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Completed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="signed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Signed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="not_avaiable">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Not Available</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="not_intrested">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-orange-600" />
                      <span>Not Interested</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="re_shedule">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Re-schedule</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Cancelled</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Feedback (Optional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add any feedback or comments..."
                className="min-h-[100px] bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-2 md:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={updating}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={updating || !selectedStatus}
                size="sm"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attachment Upload Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold text-gray-900">
              {task.attachmentUrl ? "Change Attachment" : "Add Attachment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1 md:mb-2">Attachment Rules</h4>
              <ul className="text-blue-900 text-xs md:text-sm space-y-1">
                <li>• Only image files allowed (JPEG, PNG, GIF, WebP, SVG)</li>
                <li>• Maximum file size: 5MB</li>
                <li>• New attachment will replace existing one</li>
                <li>• Image will be optimized for web viewing</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="attachment" className="text-sm font-medium text-gray-900">
                  Select Image File *
                </Label>
                <Input
                  id="attachment"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="mt-1 bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: .jpg, .jpeg, .png, .gif, .webp, .svg
                </p>
              </div>

              {filePreview && (
                <div className="border-2 border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-900">Preview:</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="relative w-full h-48 border border-gray-200 rounded overflow-hidden">
                    {/* For file preview, we can use Next.js Image since it's a data URL */}
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    File: {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              )}

              {task.attachmentUrl && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900">
                    ⚠️ Warning: Uploading a new image will replace the existing attachment.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 md:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAttachmentDialog(false)}
                disabled={uploadingAttachment}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAttachmentUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={uploadingAttachment || !selectedFile}
                size="sm"
              >
                {uploadingAttachment ? (
                  <>
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Paperclip className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    {task.attachmentUrl ? "Replace Attachment" : "Upload Attachment"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Attachment Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-gray-900">Remove Attachment</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              Are you sure you want to remove this attachment? This action cannot be undone.
              The image will be permanently deleted from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttachment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Attachment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}