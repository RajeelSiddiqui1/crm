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
  MessageSquare,
  Paperclip,
  Eye,
  ChevronRight,
  Home,
  Briefcase,
  FileCheck,
  RefreshCcw,
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
  const [activeTab, setActiveTab] = useState("details");
  const [attachments, setAttachments] = useState([]);

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
        // Simulate attachments (you might want to fetch actual attachments from API)
        setAttachments([
          { id: 1, name: "Employee_Agreement.pdf", size: "2.4 MB", date: "2024-01-15" },
          { id: 2, name: "Vendor_Contract.pdf", size: "1.8 MB", date: "2024-01-14" },
        ]);
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

  const handleUpdateNotes = async () => {
    setUpdating(true);
    try {
      const response = await axios.put(
        `/api/manager/received-tasks/${taskId}`,
        { notes: notesForm.notes }
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

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const response = await axios.put(
        `/api/manager/received-tasks/${taskId}`,
        statusForm
      );

      if (response.data.success) {
        toast.success("Status updated successfully");
        setTask(response.data.task);
        setShowStatusDialog(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
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
    // Implement download logic here
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

          <div className="flex gap-2">
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
                  <Button
                    onClick={() => setShowStatusDialog(true)}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
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

                  {task.attachmentUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Attachments</label>
                      <div className="mt-2 space-y-2">
                        <a
                          href={task.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <Paperclip className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900">View Attachment</span>
                          <span className="ml-auto text-xs text-gray-500">
                            {task.attachmentUpdatedAt ? formatDate(task.attachmentUpdatedAt) : ""}
                          </span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Data Card */}
            {task.formId?.formData && Object.keys(task.formId.formData).length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900">Form Data</CardTitle>
                  <CardDescription className="text-gray-700">
                    Submitted form information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(task.formId.formData).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <p className="text-gray-900 p-2 bg-gray-50 rounded border border-gray-200">
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

            {/* People Involved Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">People Involved</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Shared Manager */}
                {task.sharedManager && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Shared By</p>
                        <p className="text-sm text-gray-600">
                          {task.sharedManager.firstName} {task.sharedManager.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee */}
                {task.formId?.employeeId && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Employee</p>
                        <p className="text-sm text-gray-600">
                          {task.formId.employeeId.firstName} {task.formId.employeeId.lastName}
                        </p>
                        {task.formId.employeeId.email && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {task.formId.employeeId.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shared Employee */}
                {task.sharedEmployee && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Shared Employee</p>
                        <p className="text-sm text-gray-600">
                          {task.sharedEmployee.firstName} {task.sharedEmployee.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Task Created</p>
                      <p className="text-sm text-gray-600">{formatDate(task.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">{formatDate(task.updatedAt)}</p>
                    </div>
                  </div>
                  {task.dueDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Due Date</p>
                        <p className="text-sm text-gray-600">{formatDate(task.dueDate)}</p>
                      </div>
                    </div>
                  )}
                  {task.feedbackUpdatedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Feedback Updated</p>
                        <p className="text-sm text-gray-600">{formatDate(task.feedbackUpdatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {task.attachmentUpdatedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Attachment Updated</p>
                        <p className="text-sm text-gray-600">{formatDate(task.attachmentUpdatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Update Task Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Status</label>
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
                  <SelectItem value="not_avaiable">Not Available</SelectItem>
                  <SelectItem value="not_intrested">Not Interested</SelectItem>
                  <SelectItem value="re_shedule">Re-schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Vendor Status</label>
              <Select
                value={statusForm.VendorStatus}
                onValueChange={(value) => setStatusForm({ ...statusForm, VendorStatus: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select vendor status" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="not_approved">Not Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Machine Status</label>
              <Select
                value={statusForm.MachineStatus}
                onValueChange={(value) => setStatusForm({ ...statusForm, MachineStatus: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select machine status" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Employee Feedback</label>
              <Textarea
                value={statusForm.employeeFeedback}
                onChange={(e) => setStatusForm({ ...statusForm, employeeFeedback: e.target.value })}
                placeholder="Enter employee feedback..."
                className="min-h-[100px] bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={updating}
                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={updating}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}