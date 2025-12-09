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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Eye,
  Mail,
  RefreshCw,
  Truck,
  Cpu,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  X,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function EmployeeOperationTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;
  const fileInputRef = React.useRef(null);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Employee") {
      router.push("/employeelogin");
      return;
    }

    fetchTaskDetails();
  }, [session, status, router, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/employee/operation-tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.sharedTask);
        setFeedback(response.data.sharedTask.employeeFeedback || "");
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      if (error.response?.status === 404) {
        toast.error("Task not found");
        router.push("/employee/operation-tasks");
      } else {
        toast.error("Failed to load task details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (field, value) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append(field, value);
      if (feedback) {
        formData.append("feedback", feedback);
      }

      const response = await axios.patch(
        `/api/employee/operation-tasks/${taskId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(`${field === 'VendorStatus' ? 'Vendor' : 'Machine'} status updated to ${value}`);
        setTask(response.data.sharedTask);
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
      formData.append("VendorStatus", task.VendorStatus);
      formData.append("MachineStatus", task.MachineStatus);
      formData.append("attachment", selectedFile);
      if (feedback) {
        formData.append("feedback", feedback);
      }

      const response = await axios.patch(
        `/api/employee/operation-tasks/${taskId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Attachment uploaded successfully");
        setTask(response.data.sharedTask);
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
      const response = await axios.delete(`/api/employee/operation-tasks/${taskId}`);

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

  const openAttachmentDialog = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowAttachmentDialog(true);
  };

  const openFullscreenImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowFullscreenImage(true);
  };

  const closeFullscreenImage = () => {
    setSelectedImage(null);
    setShowFullscreenImage(false);
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

  const getStatusColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-800 border-green-200",
      not_approved: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      deployed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
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

  const formatSimpleDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if task has attachment
  const hasAttachment = task?.attachmentUrl;

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
    return null;
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-4">The requested task could not be found.</p>
          <Link href="/employee/operation-tasks">
            <Button className="bg-gray-800 hover:bg-gray-900 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/employee/operation-tasks">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.taskTitle}</h1>
              <p className="text-gray-700 mt-2">Update vendor and machine status</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={fetchTaskDetails}
              variant="outline"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={openAttachmentDialog}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              {hasAttachment ? "Change Attachment" : "Add Attachment"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Overview Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Task Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {task.taskDescription || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Due Date</label>
                      <div className="flex items-center gap-2 mt-1 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        {formatSimpleDate(task.dueDate)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          {task.priority || "Not set"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {task.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                      <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 mt-1">
                        {task.notes}
                      </p>
                    </div>
                  )}

                  {/* Employee Feedback */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Your Feedback</label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add any feedback or comments..."
                      className="mt-1 bg-white border-gray-300 text-gray-900 min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Update Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Update Status
                </CardTitle>
                <CardDescription className="text-gray-700">
                  Update vendor approval and machine deployment status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vendor Status */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Vendor Status
                    </label>
                    <Select
                      value={task.VendorStatus}
                      onValueChange={(value) => handleStatusUpdate("VendorStatus", value)}
                      disabled={updating}
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-gray-900">
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span>Pending</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="approved">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Approved</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="not_approved">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>Not Approved</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={`${getStatusColor(task.VendorStatus)} border flex items-center gap-1 px-3 py-1 font-medium w-fit`}>
                      Current: {task.VendorStatus}
                    </Badge>
                  </div>

                  {/* Machine Status */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Machine Status
                    </label>
                    <Select
                      value={task.MachineStatus}
                      onValueChange={(value) => handleStatusUpdate("MachineStatus", value)}
                      disabled={updating}
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-gray-900">
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span>Pending</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="deployed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Deployed</span>
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
                    <Badge className={`${getStatusColor(task.MachineStatus)} border flex items-center gap-1 px-3 py-1 font-medium w-fit`}>
                      Current: {task.MachineStatus}
                    </Badge>
                  </div>
                </div>

                {updating && (
                  <div className="flex items-center gap-2 text-blue-600 mt-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating status...
                  </div>
                )}

                {/* Attachment Preview */}
                {hasAttachment && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                      <Paperclip className="w-4 h-4" />
                      Your Attachment
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Image Attachment</p>
                            <p className="text-xs text-gray-500">Uploaded by you</p>
                            {task.attachmentUpdatedAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Last updated: {formatDate(task.attachmentUpdatedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openFullscreenImage(task.attachmentUrl)}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={downloadAttachment}
                            variant="outline"
                            size="sm"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            onClick={() => setShowDeleteDialog(true)}
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                      {/* Small Preview */}
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                        <div 
                          className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => openFullscreenImage(task.attachmentUrl)}
                        >
                          <img
                            src={task.attachmentUrl}
                            alt="Task Attachment"
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder-image.png";
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                            <Maximize2 className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Data Card */}
            {task.formId && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Form Submission Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Form Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Current Status Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Vendor Status</span>
                    <Badge className={getStatusColor(task.VendorStatus)}>
                      {task.VendorStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Machine Status</span>
                    <Badge className={getStatusColor(task.MachineStatus)}>
                      {task.MachineStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Task Status</span>
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      {task.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Info Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Assignment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned by TeamLead</h4>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">
                      {task.sharedOperationTeamlead?.firstName} {task.sharedOperationTeamlead?.lastName}
                    </p>
                    <p className="text-sm text-green-700">{task.sharedOperationTeamlead?.email}</p>
                    {task.sharedOperationTeamlead?.depId && (
                      <p className="text-xs text-green-600 mt-1">Dept ID: {task.sharedOperationTeamlead.depId}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Original Manager</h4>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">
                      {task.sharedBy?.firstName} {task.sharedBy?.lastName}
                    </p>
                    <p className="text-sm text-blue-700">{task.sharedBy?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachment Quick View Card */}
            {hasAttachment && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative w-full h-40 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={task.attachmentUrl}
                        alt="Task Attachment"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => openFullscreenImage(task.attachmentUrl)}
                        variant="outline"
                        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        size="sm"
                      >
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Fullscreen View
                      </Button>
                      <Button
                        onClick={downloadAttachment}
                        variant="outline"
                        className="w-full border-green-600 text-green-600 hover:bg-green-50"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    {task.attachmentUpdatedAt && (
                      <p className="text-xs text-gray-500 text-center">
                        Last updated: {formatDate(task.attachmentUpdatedAt)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(task.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(task.updatedAt)}</span>
                  </div>
                  {task.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Due Date</span>
                      <span className="text-sm font-medium text-gray-900">{formatSimpleDate(task.dueDate)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button
                    onClick={openAttachmentDialog}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    size="sm"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {hasAttachment ? "Change Attachment" : "Add Attachment"}
                  </Button>
                  <Button
                    onClick={fetchTaskDetails}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Link href="/employee/operation-tasks">
                    <Button
                      variant="outline"
                      className="w-full border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                      size="sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to List
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Attachment Upload Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {hasAttachment ? "Change Attachment" : "Add Attachment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Attachment Rules</h4>
              <ul className="text-blue-900 text-sm space-y-1">
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

              {hasAttachment && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900">
                    ⚠️ Warning: Uploading a new image will replace the existing attachment.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAttachmentDialog(false)}
                disabled={uploadingAttachment}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAttachmentUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={uploadingAttachment || !selectedFile}
              >
                {uploadingAttachment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4 mr-2" />
                    {hasAttachment ? "Replace Attachment" : "Upload Attachment"}
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

      {/* Fullscreen Image Modal */}
      {showFullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative w-full h-full">
            <button
              onClick={closeFullscreenImage}
              className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={selectedImage}
                alt="Fullscreen Attachment"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder-image.png";
                }}
              />
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                onClick={downloadAttachment}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={closeFullscreenImage}
                variant="outline"
                className="bg-white hover:bg-gray-100 text-gray-800 border-gray-300"
                size="sm"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                Exit Fullscreen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}