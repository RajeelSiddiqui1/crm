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
  Flag,
  Upload,
  Download,
  Settings,
  MapPin,
  Phone,
  Briefcase,
  Star,
  BarChart3,
  Truck,
  Cpu,
  Wallet,
  CreditCard,
  FileSearch,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function OperationManagerTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamleads, setTeamleads] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const [assignForm, setAssignForm] = useState({
    sharedOperationTeamlead: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchTaskDetails();
    fetchTeamleads();
  }, [session, status, router, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/manager/operation-manager-task/${taskId}`
      );
      if (response.data.success) {
        setTask(response.data.sharedTask);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      if (error.response?.status === 403) {
        toast.error("Access denied. Operation department required.");
        router.push("/managerlogin");
      } else if (error.response?.status === 404) {
        toast.error("Task not found");
        router.push("/manager/operation-manager-task");
      } else {
        toast.error("Failed to load task details");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamleads = async () => {
    try {
      const response = await axios.get("/api/manager/teamlead");
      setTeamleads(response.data.teamleads || response.data.teamLeads || []);
    } catch (error) {
      console.error("Error fetching teamleads:", error);
    }
  };

  const handleAssignToTeamlead = async () => {
    if (!assignForm.sharedOperationTeamlead) {
      toast.error("Please select a TeamLead");
      return;
    }

    setAssigning(true);
    try {
      const response = await axios.patch(
        `/api/manager/operation-manager-task/${taskId}`,
        {
          sharedOperationTeamlead: assignForm.sharedOperationTeamlead,
        }
      );

      if (response.data.success) {
        toast.success("Task assigned to Operation TeamLead successfully");
        setShowAssignDialog(false);
        setAssignForm({
          sharedOperationTeamlead: "",
        });
        fetchTaskDetails();
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to assign task";
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const openAssignDialog = () => {
    setAssignForm({
      sharedOperationTeamlead: task?.sharedOperationTeamlead?._id || "",
    });
    setShowAssignDialog(true);
  };

  const openAttachmentDialog = () => {
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

  const downloadAttachment = (attachmentUrl, fileName = "attachment") => {
    if (attachmentUrl) {
      const link = document.createElement("a");
      link.href = attachmentUrl;
      link.download = `${fileName}_${task.originalTaskId}_${new Date().getTime()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      signed: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      not_avaiable: "bg-red-100 text-red-800 border-red-200",
      not_intrested: "bg-pink-100 text-pink-800 border-pink-200",
      re_shedule: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getVendorStatusColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-800 border-green-200",
      not_approved: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getMachineStatusColor = (status) => {
    const colors = {
      deployed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
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

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Task Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested task could not be found.
          </p>
          <Link href="/manager/operation-manager-task">
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/manager/operation-manager-task">
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
                {task.taskTitle}
              </h1>
              <p className="text-gray-700 mt-2">
                Task ID: {task.originalTaskId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={fetchTaskDetails}
              variant="outline"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            
            {hasAttachment && (
              <Button
                onClick={openAttachmentDialog}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                View Attachment
              </Button>
            )}
            
            {!task.sharedOperationTeamlead && (
              <Button
                onClick={openAssignDialog}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Assign TeamLead
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Overview Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileSearch className="w-5 h-5" />
                  Task Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {task.taskDescription || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <div className="flex items-center gap-2 mt-1 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        {formatSimpleDate(task.dueDate)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <div className="mt-1">
                        <Badge
                          className={`${getPriorityColor(
                            task.priority
                          )} border flex items-center gap-1 px-3 py-1 font-medium w-fit`}
                        >
                          <Flag className="w-3 h-3" />
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {task.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Additional Notes
                      </label>
                      <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 mt-1">
                        {task.notes}
                      </p>
                    </div>
                  )}

                  {/* Attachment Preview */}
                  {hasAttachment && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Paperclip className="w-4 h-4" />
                        Employee Attachment
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Image Attachment
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded by employee
                              </p>
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
                              onClick={() => downloadAttachment(task.attachmentUrl, "attachment")}
                              variant="outline"
                              size="sm"
                              className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
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
                </div>
              </CardContent>
            </Card>

            {/* Status Display Card (Read-only) */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Current Status
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Status will be updated by assigned TeamLead
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vendor Status Display */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Vendor Status
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Badge
                        className={`${getVendorStatusColor(
                          task.VendorStatus
                        )} border flex items-center gap-1 px-3 py-1 font-medium w-fit`}
                      >
                        {task.VendorStatus.charAt(0).toUpperCase() +
                          task.VendorStatus.slice(1)}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        This status will be updated by the assigned TeamLead
                      </p>
                    </div>
                  </div>

                  {/* Machine Status Display */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Machine Status
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Badge
                        className={`${getMachineStatusColor(
                          task.MachineStatus
                        )} border flex items-center gap-1 px-3 py-1 font-medium w-fit`}
                      >
                        {task.MachineStatus.charAt(0).toUpperCase() +
                          task.MachineStatus.slice(1)}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        This status will be updated by the assigned TeamLead
                      </p>
                    </div>
                  </div>
                </div>
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
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Form Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Form Title:
                        </span>
                        <span className="text-gray-900 ml-2">
                          {task.formId.title || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Form ID:
                        </span>
                        <span className="text-gray-900 ml-2">
                          {task.formId._id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {task.formId.formData &&
                  Object.keys(task.formId.formData).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(task.formId.formData).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Task Status Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Task Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Overall Status
                    </span>
                    <Badge className={`${getStatusColor(task.status)} border`}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Vendor Status
                    </span>
                    <Badge
                      className={`${getVendorStatusColor(
                        task.VendorStatus
                      )} border`}
                    >
                      {task.VendorStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Machine Status
                    </span>
                    <Badge
                      className={`${getMachineStatusColor(
                        task.MachineStatus
                      )} border`}
                    >
                      {task.MachineStatus}
                    </Badge>
                  </div>
                  {task.employeeFeedback && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700 block mb-2">
                        Employee Feedback
                      </span>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                        {task.employeeFeedback}
                      </p>
                      {task.feedbackUpdatedAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          Feedback updated: {formatDate(task.feedbackUpdatedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assignment Info Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Operation TeamLead */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Operation TeamLead
                  </h4>
                  {task.sharedOperationTeamlead ? (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-900">
                        {task.sharedOperationTeamlead.firstName}{" "}
                        {task.sharedOperationTeamlead.lastName}
                      </p>
                      <p className="text-sm text-green-700">
                        {task.sharedOperationTeamlead.email}
                      </p>
                      {task.sharedOperationTeamlead.depId && (
                        <p className="text-xs text-green-600 mt-1">
                          Dept ID: {task.sharedOperationTeamlead.depId}
                        </p>
                      )}
                      <Button
                        onClick={openAssignDialog}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                      <p className="text-sm text-yellow-700 mb-2">
                        Not assigned
                      </p>
                      <Button
                        onClick={openAssignDialog}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Assign TeamLead
                      </Button>
                    </div>
                  )}
                </div>

                {/* Operation Employee - Read Only */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Operation Employee
                  </h4>
                  {task.sharedOperationEmployee ? (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="font-semibold text-blue-900">
                        {task.sharedOperationEmployee.firstName}{" "}
                        {task.sharedOperationEmployee.lastName}
                      </p>
                      <p className="text-sm text-blue-700">
                        {task.sharedOperationEmployee.email}
                      </p>
                      {task.sharedOperationEmployee.depId && (
                        <p className="text-xs text-blue-600 mt-1">
                          Dept ID: {task.sharedOperationEmployee.depId}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned by TeamLead
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                      <p className="text-sm text-gray-500">
                        Will be assigned by TeamLead
                      </p>
                    </div>
                  )}
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
                        onClick={() => downloadAttachment(task.attachmentUrl, "attachment")}
                        variant="outline"
                        className="w-full border-green-600 text-green-600 hover:bg-green-50"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Attachment
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
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(task.updatedAt)}
                    </span>
                  </div>
                  {task.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Due Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatSimpleDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {!task.sharedOperationTeamlead && (
                    <Button
                      onClick={openAssignDialog}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign TeamLead
                    </Button>
                  )}
                  
                  {hasAttachment && (
                    <Button
                      onClick={openAttachmentDialog}
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      size="sm"
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      View Attachment
                    </Button>
                  )}
                  
                  <Button
                    onClick={fetchTaskDetails}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Link href="/manager/operation-manager-task">
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

      {/* Assign TeamLead Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Assign to Operation TeamLead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Select Operation TeamLead *
              </label>
              <Select
                value={assignForm.sharedOperationTeamlead}
                onValueChange={(value) =>
                  setAssignForm({
                    ...assignForm,
                    sharedOperationTeamlead: value,
                  })
                }
              >
                <SelectTrigger className="bg-white border-gray-700 text-gray-900">
                  <SelectValue placeholder="Select TeamLead" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {teamleads.map((teamlead) => (
                    <SelectItem key={teamlead._id} value={teamlead._id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900">
                          {teamlead.firstName} {teamlead.lastName}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs text-gray-600"
                        >
                          {teamlead.email}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
                disabled={assigning}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignToTeamlead}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={assigning || !assignForm.sharedOperationTeamlead}
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Assign TeamLead
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attachment View Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              Task Attachment
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">Attachment Information</h4>
                  <p className="text-sm text-gray-600">
                    Uploaded by employee: {task.sharedOperationEmployee?.firstName} {task.sharedOperationEmployee?.lastName}
                  </p>
                  {task.attachmentUpdatedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last updated: {formatDate(task.attachmentUpdatedAt)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openFullscreenImage(task.attachmentUrl)}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Fullscreen
                  </Button>
                  <Button
                    onClick={() => downloadAttachment(task.attachmentUrl, "attachment")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative w-full h-[500px] border-4 border-gray-300 rounded-lg overflow-hidden bg-gray-900">
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

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAttachmentDialog(false)}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                onClick={() => downloadAttachment(selectedImage, "attachment")}
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