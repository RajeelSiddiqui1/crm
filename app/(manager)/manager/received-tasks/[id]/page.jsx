"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Phone,
  MapPin,
  Edit,
  Save,
  Download,
  Printer,
  Share2,
  Users,
  Flag,
  ImageIcon,
  VideoIcon,
  Play,
  X,
  File,
  MessageSquare,
  Paperclip,
  Eye,
  ChevronRight,
  Home,
  Briefcase,
  FileCheck,
  RefreshCcw,
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  FileUp,
  Send,
  Trash,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function ReceivedTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [teamleads, setTeamleads] = useState([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // File Upload States
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [totalUploadProgress, setTotalUploadProgress] = useState(0);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [completedUploads, setCompletedUploads] = useState([]);
  const [failedUploads, setFailedUploads] = useState([]);
  const [maxSize] = useState(100 * 1024 * 1024); // 100MB max per file
  const [totalMaxSize] = useState(500 * 1024 * 1024); // 500MB total max

  const [shareForm, setShareForm] = useState({
    sharedTo: "",
  });

  const [notesForm, setNotesForm] = useState({
    notes: "",
  });

  const [statusForm, setStatusForm] = useState({
    status: "",
    VendorStatus: "",
    MachineStatus: "",
    employeeFeedback: "",
  });

  const [zoom, setZoom] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);

  const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    if (taskId) {
      fetchTaskDetails();
      fetchTeamleads();
    }
  }, [session, status, router, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/manager/received-tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.task);
        setNotesForm({ notes: response.data.task.notes || "" });
        setStatusForm({
          status: response.data.task.status,
          VendorStatus: response.data.task.VendorStatus,
          MachineStatus: response.data.task.MachineStatus,
          employeeFeedback: response.data.task.employeeFeedback || "",
        });
      } else {
        toast.error("Failed to load task details");
        router.push("/manager/received-tasks");
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to load task details");
      router.push("/manager/received-tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamleads = async () => {
    try {
      const response = await axios.get("/api/manager/teamlead");
      const teamleadsData = response.data.teamLeads || response.data.teamleads || [];
      setTeamleads(teamleadsData);
    } catch (error) {
      console.error("Error fetching teamleads:", error);
      toast.error("Failed to load teamleads");
      setTeamleads([]);
    }
  };

  // File Upload Functions
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check total size
    const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);
    const existingSize = files.reduce((total, file) => total + file.size, 0);
    
    if (totalSize + existingSize > totalMaxSize) {
      toast.error(`Total files size exceeds ${formatFileSize(totalMaxSize)} limit`);
      return;
    }
    
    // Check individual file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} file(s) exceed ${formatFileSize(maxSize)} limit`);
      return;
    }
    
    // Filter out duplicates
    const newFiles = selectedFiles.filter(newFile => 
      !files.some(existingFile => 
        existingFile.name === newFile.name && 
        existingFile.size === newFile.size
      )
    );
    
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`Added ${newFiles.length} file(s)`);
    e.target.value = ""; // Reset input
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setUploadProgress({});
    setTotalUploadProgress(0);
    setUploadQueue([]);
    setCompletedUploads([]);
    setFailedUploads([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-green-600" />;
    if (fileType.startsWith("video/")) return <VideoIcon className="w-5 h-5 text-blue-600" />;
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-red-600" />;
    if (fileType.includes("word") || fileType.includes("doc")) return <FileText className="w-5 h-5 text-blue-600" />;
    if (fileType.includes("excel") || fileType.includes("sheet")) return <FileText className="w-5 h-5 text-green-600" />;
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  // Combined update with files upload
  const handleUpdateWithFiles = async () => {
    if (files.length === 0) {
      handleUpdateStatus();
      return;
    }

    setUpdating(true);
    setUploading(true);
    setUploadQueue(files.map((file, index) => ({ file, index })));
    setCompletedUploads([]);
    setFailedUploads([]);
    setUploadProgress({});
    setTotalUploadProgress(0);

    const totalFiles = files.length;
    const formData = new FormData();
    
    // Add all form data
    formData.append("status", statusForm.status);
    formData.append("VendorStatus", statusForm.VendorStatus);
    formData.append("MachineStatus", statusForm.MachineStatus);
    formData.append("employeeFeedback", statusForm.employeeFeedback);
    
    // Add files
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const response = await axios.put(
        `/api/manager/received-tasks/${taskId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setTotalUploadProgress(percentCompleted);
              
              // Calculate individual file progress
              const filesCount = files.length;
              const fileProgress = Math.round(percentCompleted / filesCount);
              
              const newProgress = {};
              files.forEach(file => {
                newProgress[file.name] = fileProgress;
              });
              setUploadProgress(newProgress);
            }
          },
        }
      );

      if (response.data.success) {
        toast.success("Task status and files updated successfully");
        setTask(response.data.task);
        setShowStatusDialog(false);
        setShowUploadDialog(false);
        
        // Reset upload states
        setFiles([]);
        setUploadProgress({});
        setTotalUploadProgress(0);
        setUploadQueue([]);
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.message || "Failed to update task");
    } finally {
      setUpdating(false);
      setUploading(false);
    }
  };

  // Separate file upload only
  const uploadFilesOnly = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);
    setUploadQueue(files.map((file, index) => ({ file, index })));
    setCompletedUploads([]);
    setFailedUploads([]);
    setUploadProgress({});
    setTotalUploadProgress(0);

    const totalFiles = files.length;
    const formData = new FormData();
    
    // Add files
    files.forEach(file => {
      formData.append("files", file);
    });

    // Add minimal status data (keep current status)
    formData.append("status", task.status);
    formData.append("VendorStatus", task.VendorStatus || "pending");
    formData.append("MachineStatus", task.MachineStatus || "pending");

    try {
      const response = await axios.put(
        `/api/manager/received-tasks/${taskId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setTotalUploadProgress(percentCompleted);
              
              // Calculate individual file progress
              const filesCount = files.length;
              const fileProgress = Math.round(percentCompleted / filesCount);
              
              const newProgress = {};
              files.forEach(file => {
                newProgress[file.name] = fileProgress;
              });
              setUploadProgress(newProgress);
            }
          },
        }
      );

      if (response.data.success) {
        toast.success(`Successfully uploaded ${files.length} file(s)`);
        setTask(response.data.task);
        setShowUploadDialog(false);
        
        // Reset upload states
        setFiles([]);
        setUploadProgress({});
        setTotalUploadProgress(0);
        setUploadQueue([]);
      } else {
        toast.error("Failed to upload files");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(error.response?.data?.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // Update status only (without files)
  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("status", statusForm.status);
      formData.append("VendorStatus", statusForm.VendorStatus);
      formData.append("MachineStatus", statusForm.MachineStatus);
      formData.append("employeeFeedback", statusForm.employeeFeedback);
      
      const response = await axios.put(
        `/api/manager/received-tasks/${taskId}`,
        formData
      );

      if (response.data.success) {
        toast.success("Status updated successfully");
        setTask(response.data.task);
        setShowStatusDialog(false);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Update notes only
  const handleUpdateNotes = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("notes", notesForm.notes);
      formData.append("status", task.status); // Keep existing status
      formData.append("VendorStatus", task.VendorStatus || "pending");
      formData.append("MachineStatus", task.MachineStatus || "pending");

      const response = await axios.put(
        `/api/manager/received-tasks/${taskId}`,
        formData
      );

      if (response.data.success) {
        toast.success("Notes updated successfully");
        setTask(response.data.task);
        setShowNotesDialog(false);
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    } finally {
      setUpdating(false);
    }
  };

  const openShareDialog = () => {
    setShareForm({
      sharedTo: task?.sharedTeamlead?._id || "",
    });
    setShowShareDialog(true);
  };

  const handleShareWithTeamlead = async () => {
    if (!shareForm.sharedTo) {
      toast.error("Please select a teamlead");
      return;
    }

    setSharing(true);
    try {
      const response = await axios.patch(
        `/api/manager/received-tasks/${taskId}`,
        { sharedTo: shareForm.sharedTo }
      );

      if (response.data.success) {
        toast.success("Teamlead assigned successfully");
        setShowShareDialog(false);
        fetchTaskDetails();
      }
    } catch (error) {
      console.error("Error assigning teamlead:", error);
      const errorMessage = error.response?.data?.message || "Failed to assign teamlead";
      toast.error(errorMessage);
    } finally {
      setSharing(false);
    }
  };


const handleDeleteAttachment = async (file) => {
  try {

    if (!file?.publicId) {
      console.error("publicId missing", file);
      return;
    }

    await axios.delete(
      `/api/manager/received-tasks/${taskId}?fileKey=${encodeURIComponent(file.publicId)}`
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



  // Status color functions
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white border-yellow-600",
      signed: "bg-green-500 text-white border-green-600",
      not_available: "bg-red-500 text-white border-red-600",
      not_interested: "bg-orange-500 text-white border-orange-600",
      re_schedule: "bg-blue-500 text-white border-blue-600",
      completed: "bg-green-600 text-white border-green-700",
      in_progress: "bg-blue-500 text-white border-blue-600",
      cancelled: "bg-red-600 text-white border-red-700",
    };
    return colors[status] || "bg-gray-500 text-white border-gray-600";
  };

  const getVendorStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white border-yellow-600",
      approved: "bg-green-500 text-white border-green-600",
      not_approved: "bg-red-500 text-white border-red-600",
    };
    return colors[status] || "bg-gray-500 text-white border-gray-600";
  };

  const getMachineStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500 text-white border-yellow-600",
      deployed: "bg-green-500 text-white border-green-600",
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

  const formatSimpleDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info("Download functionality will be implemented soon");
  };

  const openUploadDialog = () => {
    setShowUploadDialog(true);
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

  if (!session || session.user.role !== "Manager") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in as Manager to access this page.</p>
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
          <Button
            onClick={() => router.push("/manager/received-tasks")}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/manager/received-tasks">
              <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Link href="/manager/dashboard" className="hover:text-gray-900 flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Dashboard
                </Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/manager/received-tasks" className="hover:text-gray-900">
                  Received Tasks
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-900 font-medium">{task.originalTaskId}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{task.taskTitle}</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={openUploadDialog}
              variant="outline"
              className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
            <Button
              onClick={() => setShowStatusDialog(true)}
              variant="outline"
              className="border-green-700 text-green-700 hover:bg-green-700 hover:text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Status
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={() => fetchTaskDetails()}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge className={`${getStatusColor(task.status)} border mt-1`}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
                <Flag className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Priority</p>
                  <Badge className={`${getPriorityColor(task.priority)} border mt-1`}>
                    {task.priority}
                  </Badge>
                </div>
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Due Date</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {task.dueDate ? formatSimpleDate(task.dueDate) : "Not set"}
                  </p>
                </div>
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Task ID</p>
                  <p className="text-sm font-mono text-gray-900 mt-1">{task.originalTaskId}</p>
                </div>
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold text-gray-900">Task Information</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowStatusDialog(true)}
                      variant="outline"
                      size="sm"
                      className="border-green-700 text-green-700 hover:bg-green-700 hover:text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Task Title</label>
                    <p className="text-gray-900 mt-1">{task.taskTitle}</p>
                  </div>

                  {task.taskDescription && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{task.taskDescription}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Vendor Status</label>
                      <Badge className={`${getVendorStatusColor(task.VendorStatus)} border mt-1`}>
                        {task.VendorStatus}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Machine Status</label>
                      <Badge className={`${getMachineStatusColor(task.MachineStatus)} border mt-1`}>
                        {task.MachineStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Employee Feedback</label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {task.employeeFeedback ? (
                        <p className="text-gray-900 whitespace-pre-wrap">{task.employeeFeedback}</p>
                      ) : (
                        <p className="text-gray-500 italic">No feedback provided</p>
                      )}
                      {task.feedbackUpdatedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Updated: {formatDate(task.feedbackUpdatedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {task.notes || "No notes added"}
                        </p>
                        <Button
                          onClick={() => setShowNotesDialog(true)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Last updated: {task.updatedAt ? formatDate(task.updatedAt) : "Never"}
                      </p>
                    </div>
                  </div>


 {task.formId?.fileAttachments && task.formId?.fileAttachments.length > 0 && (
                    <div className="mt-4">
                      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
                      <label className="text-xl font-large text-gray-700 mb-2 block">
                        Attachments ({task.formId?.fileAttachments.length})
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {task.formId?.fileAttachments.map((file, index) => {
                          const isImage = file.type?.startsWith("image/");
                          const isVideo = file.type?.startsWith("video/");
                          const isPDF = file.type?.includes("pdf") || file.name?.endsWith(".pdf");
                          const isWord = file.type?.includes("word") || file.type?.includes("doc");
                          
                          let bgColor = "bg-gray-100";
                          let Icon = FileText;
                          
                          if (isImage) {
                            bgColor = "bg-green-50";
                            Icon = ImageIcon;
                          } else if (isVideo) {
                            bgColor = "bg-blue-50";
                            Icon = VideoIcon;
                          } else if (isPDF) {
                            bgColor = "bg-red-50";
                          } else if (isWord) {
                            bgColor = "bg-blue-50";
                          }

                          return (
                            <div
                              key={index}
                              className={`${bgColor} border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200`}
                            >
                              <div 
                                className="h-40 w-full overflow-hidden relative cursor-pointer"
                                onClick={() => setPreviewFile(file)}
                              >
                                {isImage ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.name} 
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
                                    <Icon className="w-12 h-12 text-gray-600 mb-2" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-3 bg-white border-t">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                      {file.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{formatFileSize(file.size)}</span>
                                      <span>•</span>
                                      <span>{file.type || 'Unknown type'}</span>
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
                                      onClick={() => downloadFile(file.url, file.name)}
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
                      </Card>
                    </div>
                  )}


                  {/* Existing Attachments */}
                  {task.fileAttachments && task.fileAttachments.length > 0 && (
                    <div className="mt-4">
                      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
                      <label className="text-xl font-large text-gray-700 mb-2 block">
                        Visit Attachments ({task.fileAttachments.length})
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {task.fileAttachments.map((file, index) => {
                          const isImage = file.type?.startsWith("image/");
                          const isVideo = file.type?.startsWith("video/");
                          const isPDF = file.type?.includes("pdf") || file.name?.endsWith(".pdf");
                          const isWord = file.type?.includes("word") || file.type?.includes("doc");
                          
                          let bgColor = "bg-gray-100";
                          let Icon = FileText;
                          
                          if (isImage) {
                            bgColor = "bg-green-50";
                            Icon = ImageIcon;
                          } else if (isVideo) {
                            bgColor = "bg-blue-50";
                            Icon = VideoIcon;
                          } else if (isPDF) {
                            bgColor = "bg-red-50";
                          } else if (isWord) {
                            bgColor = "bg-blue-50";
                          }

                          return (
                            <div
                              key={index}
                              className={`${bgColor} border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200`}
                            >
                              <div 
                                className="h-40 w-full overflow-hidden relative cursor-pointer"
                                onClick={() => setPreviewFile(file)}
                              >
                                {isImage ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.name} 
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
                                    <Icon className="w-12 h-12 text-gray-600 mb-2" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-3 bg-white border-t">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                      {file.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{formatFileSize(file.size)}</span>
                                      <span>•</span>
                                      <span>{file.type || 'Unknown type'}</span>
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
  onClick={() => handleDeleteAttachment(file)}

  title="Delete"
>
  <Trash className="w-4 h-4 text-gray-600" />
</Button>


                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-gray-100"
                                      onClick={() => downloadFile(file.url, file.name)}
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
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - People & Actions */}
          <div className="space-y-6">
            {/* Assignment Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">Assignment</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Assigned Teamlead</label>
                  {task.sharedTeamlead ? (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {task.sharedTeamlead.firstName} {task.sharedTeamlead.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {task.sharedTeamlead.email}
                          </p>
                          {task.sharedTeamlead.depId?.name && (
                            <Badge variant="outline" className="mt-1 text-xs bg-white">
                              {task.sharedTeamlead.depId.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">No teamlead assigned</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={openShareDialog}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                  disabled={teamleads.length === 0}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {task.sharedTeamlead ? "Change Teamlead" : "Assign Teamlead"}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button
                  onClick={() => setShowNotesDialog(true)}
                  variant="outline"
                  className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Notes
                </Button>
                <Button
                  onClick={openUploadDialog}
                  variant="outline"
                  className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
                <Button
                  onClick={() => setShowStatusDialog(true)}
                  variant="outline"
                  className="w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* File Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Files
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Upload multiple files to this task (max {formatFileSize(maxSize)} per file)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Upload Progress */}
            {uploading && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Uploading {files.length} files...
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {totalUploadProgress}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${totalUploadProgress}%` }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>{files.length} files</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-600" />
                          <span>In progress</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Selection Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Click to select files or drag and drop
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Supports all file types up to {formatFileSize(maxSize)} each
                    </p>
                  </div>
                  <Button 
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-700"
                    disabled={uploading}
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              </label>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Selected Files ({files.length})
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFiles}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                  <CardDescription className="text-gray-900">
                    Total size: {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{file.type || "Unknown type"}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Upload Progress for this file */}
                        {uploadProgress[file.name] !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-8">
                              {uploadProgress[file.name]}%
                            </span>
                          </div>
                        )}
                        
                        {/* Remove button */}
                        {!uploading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={uploading}
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={uploadFilesOnly}
              disabled={files.length === 0 || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length} File{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog - With option to add files */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Update Task Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Status *</label>
              <Select
                value={statusForm.status}
                onValueChange={(value) => setStatusForm({ ...statusForm, status: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="re_schedule">Re-schedule</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            

           

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Your Feedback</label>
              <Textarea
                value={statusForm.employeeFeedback}
                onChange={(e) => setStatusForm({ ...statusForm, employeeFeedback: e.target.value })}
                placeholder="Enter employee feedback..."
                className="min-h-[100px] bg-white border-gray-300 text-gray-900"
              />
            </div>

            {/* File Upload Option in Status Dialog */}
            {files.length === 0 ? (
              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStatusDialog(false);
                    setTimeout(() => setShowUploadDialog(true), 100);
                  }}
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Files to Upload
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Files to upload ({files.length})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFiles}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.type)}
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={updating || uploading}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={files.length > 0 ? handleUpdateWithFiles : handleUpdateStatus}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={updating || uploading || !statusForm.status}
              >
                {(updating || uploading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {files.length > 0 ? "Updating with Files..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {files.length > 0 ? `Update with ${files.length} File${files.length !== 1 ? 's' : ''}` : "Update Status"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              value={notesForm.notes}
              onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
              placeholder="Add your notes here..."
              className="min-h-[200px] bg-white border-gray-300 text-gray-900"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNotesDialog(false)}
                disabled={updating}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateNotes}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {task?.sharedTeamlead ? "Change Teamlead" : "Assign Teamlead"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Select Teamlead *</label>
              <Select
                value={shareForm.sharedTo}
                onValueChange={(value) => setShareForm({ ...shareForm, sharedTo: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select teamlead" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {teamleads?.length > 0 ? (
                    teamleads.map((teamlead) => (
                      <SelectItem key={teamlead._id} value={teamlead._id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900">{teamlead.firstName} {teamlead.lastName}</span>
                          <Badge variant="outline" className="ml-2 text-xs text-gray-600">
                            {teamlead.depId?.name || "No Department"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No teamleads available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowShareDialog(false)}
                disabled={sharing}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareWithTeamlead}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={sharing || !shareForm.sharedTo || teamleads.length === 0}
              >
                {sharing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {task?.sharedTeamlead ? "Updating..." : "Assigning..."}
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    {task?.sharedTeamlead ? "Change Teamlead" : "Assign Teamlead"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {previewFile.type?.startsWith("image/") ? (
                  <ImageIcon className="w-4 h-4 text-green-600" />
                ) : previewFile.type?.startsWith("video/") ? (
                  <VideoIcon className="w-4 h-4 text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-600" />
                )}
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
              {previewFile.type?.startsWith('image/') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : previewFile.type?.startsWith('video/') ? (
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
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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