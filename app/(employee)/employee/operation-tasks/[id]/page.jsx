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
  User,
  Calendar,
  Eye,
  Mail,
  RefreshCw,
  Truck,
  Cpu,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function EmployeeOperationTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Employee") {
      router.push("/login");
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
      const response = await axios.patch(
        `/api/employee/operation-tasks/${taskId}`,
        { [field]: value }
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

          <Button
            onClick={fetchTaskDetails}
            variant="outline"
            className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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
    </div>
  );
}