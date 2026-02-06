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
  DialogFooter,
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  VideoIcon,
  Play,
  Upload,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileSpreadsheet,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

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
  const [showFullscreenSlider, setShowFullscreenSlider] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Employee") {
      router.push("/employeelogin");
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
        formData
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
    if (!selectedFiles.length) {
      toast.error("Please select at least one file");
      return;
    }

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("status", task.status);
      
      // Append all files
      selectedFiles.forEach(file => {
        formData.append("files", file);
      });
      
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
        toast.success("Files uploaded successfully");
        setTask(response.data.task);
        setSelectedFiles([]);
        setFilePreviews([]);
        setShowAttachmentDialog(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      const errorMessage = error.response?.data?.message || "Failed to upload files";
      toast.error(errorMessage);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (file) => {
     try {

    if (!file?.publicId) {
      console.error("publicId missing", file);
      return;
    }

    await axios.delete(
      `/api/employee/received-tasks/${taskId}?fileKey=${encodeURIComponent(file.publicId)}`
    );

    setTask((prev) => ({
      ...prev,
      fileAttachments: prev.fileAttachments.filter(
        (f) => f.publicId !== file.publicId
      ),
    }));

  } catch (error) {
    console.error(error);
  }
  };



  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const validPreviews = [];

    // Reset previous files
    setSelectedFiles([]);
    setFilePreviews([]);

    files.forEach(file => {
      // Validate file type
      const allowedTypes = [
        "image/jpeg", "image/jpg", "image/png", "image/gif", 
        "image/webp", "image/svg+xml", "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "video/mp4", "video/webm", "video/ogg"
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not an allowed type`);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreview = {
          name: file.name,
          url: reader.result,
          size: file.size,
          type: file.type
        };
        setFilePreviews(prev => [...prev, newPreview]);
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles(validFiles);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...filePreviews];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const openStatusDialog = () => {
    setSelectedStatus(task?.status || "pending");
    setShowStatusDialog(true);
  };

  const openAttachmentDialog = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowAttachmentDialog(true);
  };

  const openFullscreenSlider = (index = 0) => {
    setCurrentImageIndex(index);
    setZoomLevel(1);
    setRotation(0);
    setShowFullscreenSlider(true);
  };

  const closeFullscreenSlider = () => {
    setShowFullscreenSlider(false);
    setZoomLevel(1);
    setRotation(0);
  };

  const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Slider functions
  const nextImage = () => {
    const images = getImages();
    setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
    setZoomLevel(1);
    setRotation(0);
  };

  const prevImage = () => {
    const images = getImages();
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
    setZoomLevel(1);
    setRotation(0);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetTransform = () => {
    setZoomLevel(1);
    setRotation(0);
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get all images from task attachments
  const getImages = () => {
    if (!task?.fileAttachments || task.fileAttachments.length === 0) return [];
    
    return task.fileAttachments
      .filter(file => file.type?.startsWith('image/'))
      .map((file, index) => ({
        id: index,
        url: file.url,
        title: file.name,
        type: file.type,
        size: file.size,
        uploadedBy: task.sharedEmployee?.firstName + " " + task.sharedEmployee?.lastName,
        date: file.createdAt || task.updatedAt
      }));
  };

  const images = getImages();
  const hasAttachments = task?.fileAttachments && task.fileAttachments.length > 0;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-gray-600" />
          <p className="text-gray-700 text-lg font-medium">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Employee") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be logged in as Employee to access this page.</p>
          <Link href="/employeelogin">
            <Button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 text-lg">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Task Not Found</h2>
          <p className="text-gray-600 mb-6">The requested task could not be found.</p>
          <Link href="/employee/received-tasks">
            <Button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 text-lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/employee/received-tasks">
              <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-white hover:shadow-md">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {task.taskTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  ID: {task.originalTaskId}
                </p>
                <Badge className={`${getStatusColor(task.status)} border-0 font-medium px-3 py-1`}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge className={`${getPriorityColor(task.priority)} border-0 font-medium px-3 py-1`}>
                  {task.priority} Priority
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={fetchTask}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-white hover:shadow-md"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={openStatusDialog}
              className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white shadow-md hover:shadow-lg"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Status
            </Button>
            <Button
              onClick={openAttachmentDialog}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:shadow-md"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              {hasAttachments ? "Manage Files" : "Add Files"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details Card */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {task.taskDescription && (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Description</h3>
                      <p className="text-gray-900 leading-relaxed">{task.taskDescription}</p>
                    </div>
                  )}

                  {task.notes && (
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Additional Notes</h3>
                      </div>
                      <p className="text-blue-800 leading-relaxed">{task.notes}</p>
                    </div>
                  )}

                  {task.employeeFeedback && (
                    <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wide">Your Feedback</h3>
                      </div>
                      <p className="text-green-800 leading-relaxed mb-3">{task.employeeFeedback}</p>
                      {task.feedbackUpdatedAt && (
                        <p className="text-xs text-green-700">
                          Updated: {formatDate(task.feedbackUpdatedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-700">Due Date</h3>
                      </div>
                      <p className="text-gray-900 font-semibold text-lg">
                        {task.dueDate ? formatDate(task.dueDate) : "Not set"}
                      </p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-700">Assigned Date</h3>
                      </div>
                      <p className="text-gray-900 font-semibold text-lg">{formatDate(task.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Attachments Card */}
            {hasAttachments && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-5">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Paperclip className="w-6 h-6 text-green-600" />
                      </div>
                     Your Attachments ({task.fileAttachments.length})
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => task.fileAttachments.length > 0 && openFullscreenSlider()}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        disabled={task.fileAttachments.length === 0}
                      >
                        <Maximize2 className="w-4 h-4 mr-2" />
                        View All
                      </Button>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        disabled={task.fileAttachments.length === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove All
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {task.fileAttachments.map((file, index) => {
                      const isImage = file.type?.startsWith("image/");
                      const isVideo = file.type?.startsWith("video/");
                      const isPDF = file.type?.includes("pdf") || file.name?.endsWith(".pdf");
                      
                      return (
                        <div
                          key={file.publicId || index}
                          className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                          <div 
                            className="h-48 relative overflow-hidden bg-gray-100 cursor-pointer"
                            onClick={() => {
                              if (isImage) {
                                openFullscreenSlider(index);
                              } else if (isVideo) {
                                setPreviewFile(file);
                              } else {
                                window.open(file.url, '_blank');
                              }
                            }}
                          >
                            {isImage ? (
                              <>
                                <img 
                                  src={file.url} 
                                  alt={file.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                              </>
                            ) : isVideo ? (
                              <div className="relative w-full h-full bg-gray-900">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="w-12 h-12 text-white/70" />
                                </div>
                                <div className="absolute bottom-2 right-2">
                                  <Badge className="bg-black/70 text-white text-xs">
                                    Video
                                  </Badge>
                                </div>
                              </div>
                            ) : isPDF ? (
                              <div className="h-full flex flex-col items-center justify-center p-4">
                                <FileText className="w-16 h-16 text-red-500 mb-2" />
                                <span className="text-xs font-medium text-gray-600">
                                  PDF Document
                                </span>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center p-4">
                                <File className="w-16 h-16 text-gray-500 mb-2" />
                                <span className="text-xs font-medium text-gray-600">
                                  {file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                </span>
                              </div>
                            )}
                            
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(file.url, file.name);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                                  {file.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span>•</span>
                                  <span>{file.type?.split('/')[1]?.toUpperCase() || 'File'}</span>
                                </div>
                                {file.createdAt && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    Uploaded: {formatDate(file.createdAt)}
                                  </p>
                                )}

                                                      <Button
  size="sm"
  variant="ghost"
  className="h-8 w-8 p-0 hover:bg-gray-100"
  onClick={() => handleDeleteAttachment(file)}

  title="Delete"
>
  <Trash2 className="w-4 h-4 text-gray-600" />
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

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Your Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {task.employeeFeedback && (
                    <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wide">Your Feedback</h3>
                      </div>
                      <p className="text-green-800 leading-relaxed mb-3">{task.employeeFeedback}</p>
                      {task.feedbackUpdatedAt && (
                        <p className="text-xs text-green-700">
                          Updated: {formatDate(task.feedbackUpdatedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Data Card */}
            {task.formId?.formData && Object.keys(task.formId.formData).length > 0 && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-5">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    Form Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(task.formId.formData).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <p className="text-gray-900 font-medium">
                          {Array.isArray(value) ? value.join(", ") : 
                           value === null || value === undefined ? "Not provided" : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}


                 {/* Attachments Section */}
            {task.formId?.fileAttachments && task.formId.fileAttachments.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Attachments</CardTitle>
                  <CardDescription className="text-gray-700">
                    {task.formId.fileAttachments.length} file(s) attached to this submission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {task.formId.fileAttachments.map((file, index) => {
                      const { url, name, type, publicId } = file;
            
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  Assignment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Assigned by</p>
                      <p className="text-lg font-bold text-gray-900">
                        {task.sharedTeamlead?.firstName} {task.sharedTeamlead?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">Teamlead</p>
                      {task.sharedTeamlead?.depId && (
                        <p className="text-xs text-gray-500 mt-2">Dept ID: {task.sharedTeamlead.depId}</p>
                      )}
                    </div>
                  </div>

                  {task.sharedTeamlead?.email && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-gray-900 font-medium">{task.sharedTeamlead.email}</p>
                      </div>
                    </div>
                  )}

                  {task.sharedTeamlead?.department && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Building className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Department</p>
                        <p className="text-gray-900 font-medium">{task.sharedTeamlead.department}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Your Info */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  Your Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">You (Employee)</p>
                      <p className="text-lg font-bold text-gray-900">
                        {task.sharedEmployee?.firstName} {task.sharedEmployee?.lastName}
                      </p>
                      {task.sharedEmployee?.depId && (
                        <p className="text-xs text-gray-500 mt-2">Dept ID: {task.sharedEmployee.depId}</p>
                      )}
                    </div>
                  </div>

                  {task.sharedEmployee?.email && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-gray-900 font-medium">{task.sharedEmployee.email}</p>
                      </div>
                    </div>
                  )}

                  {task.sharedEmployee?.department && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Building className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Department</p>
                        <p className="text-gray-900 font-medium">{task.sharedEmployee.department}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={openStatusDialog}
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white shadow-md hover:shadow-lg"
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Update Status
                  </Button>
                  
                  <Button
                    onClick={openAttachmentDialog}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:shadow-md"
                  >
                    <Paperclip className="w-4 h-4 mr-3" />
                    {hasAttachments ? "Manage Files" : "Add Files"}
                  </Button>
                  
                  {hasAttachments && (
                    <Button
                      onClick={() => openFullscreenSlider(0)}
                      variant="outline"
                      className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 hover:border-purple-700 hover:shadow-md"
                    >
                      <Maximize2 className="w-4 h-4 mr-3" />
                      View Gallery
                    </Button>
                  )}
                  
                  <Link href="/employee/received-tasks">
                    <Button
                      variant="outline"
                      className="w-full border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white hover:shadow-md"
                    >
                      <ArrowLeft className="w-4 h-4 mr-3" />
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
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Edit className="w-6 h-6 text-gray-700" />
              Update Task Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Task Information</h4>
              <p className="text-blue-900">
                <strong>Title:</strong> {task.taskTitle}
              </p>
              <p className="text-blue-900 mt-1">
                <strong>Current Status:</strong> 
                <Badge className={`${getStatusColor(task.status)} ml-2`}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900">Select New Status *</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-12">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="pending">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <span className="font-medium">Pending</span>
                        <p className="text-xs text-gray-500">Task is waiting to start</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="font-medium">In Progress</span>
                        <p className="text-xs text-gray-500">Working on the task</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <span className="font-medium">Completed</span>
                        <p className="text-xs text-gray-500">Task is finished</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="signed">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <span className="font-medium">Signed</span>
                        <p className="text-xs text-gray-500">Document signed</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="not_avaiable">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <span className="font-medium">Not Available</span>
                        <p className="text-xs text-gray-500">Client not available</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="not_intrested">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-orange-600" />
                      <div>
                        <span className="font-medium">Not Interested</span>
                        <p className="text-xs text-gray-500">Client not interested</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="re_shedule">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="font-medium">Re-schedule</span>
                        <p className="text-xs text-gray-500">Need to reschedule</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <span className="font-medium">Cancelled</span>
                        <p className="text-xs text-gray-500">Task cancelled</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900">Feedback (Optional)</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add any feedback or comments..."
                className="min-h-[120px] bg-white border-gray-300 text-gray-900 resize-none"
              />
            </div>

            <DialogFooter className="pt-6">
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStatusDialog(false)}
                  disabled={updating}
                  className="flex-1 border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  className="flex-1 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white"
                  disabled={updating || !selectedStatus}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Status
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog - यहाँ फिक्स है */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Paperclip className="w-6 h-6 text-blue-600" />
              {hasAttachments ? "Manage Files" : "Add Files"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">File Upload Rules</h4>
              <ul className="text-blue-900 text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Allowed: Images, PDFs, Documents, Spreadsheets, Videos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Maximum file size: 10MB per file
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Multiple files can be uploaded
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  New files will be added to existing attachments
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="attachment" className="text-sm font-semibold text-gray-900 block mb-3">
                  Select Files *
                </Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors duration-300 bg-gray-50 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Input
                    id="attachment"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,video/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Supports: JPG, PNG, GIF, PDF, DOC, XLS, MP4 up to 10MB
                      </p>
                    </div>
                    <Button type="button" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Selected Files ({selectedFiles.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {file.type?.startsWith('image/') ? (
                            <ImageIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : file.type?.includes('pdf') ? (
                            <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                          ) : file.type?.includes('video/') ? (
                            <VideoIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <File className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)} • {file.type}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Previews */}
              {filePreviews.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">File Previews</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                        {preview.type?.startsWith('image/') ? (
                          <img 
                            src={preview.url} 
                            alt={preview.name}
                            className="w-full h-32 object-cover"
                          />
                        ) : preview.type?.includes('pdf') ? (
                          <div className="w-full h-32 bg-red-50 flex flex-col items-center justify-center">
                            <FileText className="w-12 h-12 text-red-500" />
                            <span className="text-xs text-gray-700 mt-1">PDF</span>
                          </div>
                        ) : preview.type?.includes('video/') ? (
                          <div className="w-full h-32 bg-blue-50 flex flex-col items-center justify-center">
                            <VideoIcon className="w-12 h-12 text-blue-500" />
                            <span className="text-xs text-gray-700 mt-1">Video</span>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-50 flex flex-col items-center justify-center">
                            <File className="w-12 h-12 text-gray-500" />
                            <span className="text-xs text-gray-700 mt-1">Document</span>
                          </div>
                        )}
                        <div className="absolute top-1 right-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 p-0 bg-white/90 hover:bg-white"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs font-medium text-gray-900 truncate">{preview.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(preview.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasAttachments && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-yellow-900">
                      Note: New files will be added to existing attachments. Use "Remove All" to delete all attachments.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-6">
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAttachmentDialog(false)}
                  disabled={uploadingAttachment}
                  className="flex-1 border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAttachmentUpload}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                  disabled={uploadingAttachment || selectedFiles.length === 0}
                >
                  {uploadingAttachment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                Remove All Attachments
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-700">
              <p className="mb-3">Are you sure you want to remove all attachments?</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  This will permanently delete {task?.fileAttachments?.length || 0} file(s) from the server
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  This action cannot be undone
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  All file data will be lost
                </li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
        </AlertDialogContent>
      </AlertDialog>

      {/* Fullscreen Gallery Modal */}
      {showFullscreenSlider && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/90 text-white">
            <div className="flex items-center gap-4">
              <Button
                onClick={closeFullscreenSlider}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
              <div>
                <h3 className="font-semibold text-lg">{images[currentImageIndex]?.title}</h3>
                <p className="text-sm text-gray-300">
                  {currentImageIndex + 1} of {images.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => downloadFile(images[currentImageIndex].url, images[currentImageIndex].title)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Main Image Area */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-7xl mx-auto">
              {/* Navigation Buttons */}
              <div className="absolute inset-0 flex items-center justify-between z-20 px-4">
                <Button
                  onClick={prevImage}
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>
                <Button
                  onClick={nextImage}
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </div>

              {/* Image Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={images[currentImageIndex]?.url}
                  alt={images[currentImageIndex]?.title}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease',
                    cursor: zoomLevel > 1 ? 'move' : 'default'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder-image.png";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="p-4 bg-black/90 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={zoomOut}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      disabled={zoomLevel <= 0.5}
                    >
                      <ZoomOut className="h-5 w-5" />
                    </Button>
                    <span className="min-w-[60px] text-center font-medium">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                      onClick={zoomIn}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      disabled={zoomLevel >= 3}
                    >
                      <ZoomIn className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={rotateImage}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={resetTransform}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="text-center md:text-right">
                  <p className="text-sm">
                    {images[currentImageIndex]?.uploadedBy || "You"}
                  </p>
                  {images[currentImageIndex]?.date && (
                    <p className="text-xs text-gray-300">
                      {formatDate(images[currentImageIndex].date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Image Thumbnails */}
              <div className="flex justify-center mt-4 gap-2 overflow-x-auto py-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setZoomLevel(1);
                      setRotation(0);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-blue-500 scale-105"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs p-3 rounded-lg backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-800 rounded">←</kbd>
                <kbd className="px-2 py-1 bg-gray-800 rounded">→</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-800 rounded">+</kbd>
                <kbd className="px-2 py-1 bg-gray-800 rounded">-</kbd>
                <span>Zoom</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-800 rounded">R</kbd>
                <span>Rotate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-800 rounded">ESC</kbd>
                <span>Close</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {previewFile.type?.startsWith("image/") ? (
                  <ImageIcon className="w-5 h-5 text-green-600" />
                ) : previewFile.type?.startsWith("video/") ? (
                  <VideoIcon className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-600" />
                )}
                <h3 className="font-bold text-gray-900 text-lg truncate">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(previewFile.url, previewFile.name)}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewFile(null)}
                  className="hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-50">
              {previewFile.type?.startsWith('image/') ? (
                <div className="relative">
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="rounded-lg max-w-full max-h-[70vh] object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.2))}
                      className="bg-white/90 hover:bg-white"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setZoom(1)}
                      className="bg-white/90 hover:bg-white"
                    >
                      {Math.round(zoom * 100)}%
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setZoom(prev => prev + 0.2)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : previewFile.type?.startsWith('video/') ? (
                <div className="w-full max-w-4xl">
                  <video
                    controls
                    autoPlay
                    className="w-full rounded-lg"
                  >
                    <source src={previewFile.url} type={previewFile.type} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : previewFile.type?.includes('pdf') ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[70vh] border rounded-lg"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-12 max-w-md mx-auto">
                  <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <p className="text-gray-700 text-lg mb-4">Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                    className="px-6 py-3"
                  >
                    <Download className="w-5 h-5 mr-2" />
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