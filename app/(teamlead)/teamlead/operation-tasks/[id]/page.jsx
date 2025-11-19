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
  Loader2,
  ArrowLeft,
  FileText,
  User,
  Mail,
  Calendar,
  Users,
  Truck,
  Cpu,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function TeamLeadOperationTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [assignForm, setAssignForm] = useState({
    sharedOperationEmployee: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/login");
      return;
    }

    fetchTaskDetails();
    fetchEmployees();
  }, [session, status, router, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/teamlead/operation-tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.sharedTask);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/teamlead/employees");
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleAssignToEmployee = async () => {
    if (!assignForm.sharedOperationEmployee) {
      toast.error("Please select an Employee");
      return;
    }

    setAssigning(true);
    try {
      const response = await axios.patch(
        `/api/teamlead/operation-tasks/${taskId}`,
        {
          sharedOperationEmployee: assignForm.sharedOperationEmployee,
        }
      );

      if (response.data.success) {
        toast.success("Task assigned to Employee successfully");
        setShowAssignDialog(false);
        setAssignForm({ sharedOperationEmployee: "" });
        fetchTaskDetails();
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      const errorMessage = error.response?.data?.message || "Failed to assign task";
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const openAssignDialog = () => {
    setAssignForm({
      sharedOperationEmployee: task?.sharedOperationEmployee?._id || "",
    });
    setShowAssignDialog(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      signed: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      not_avaiable: "bg-red-100 text-red-800 border-red-200",
      not_intrested: "bg-pink-100 text-pink-800 border-pink-200",
      re_shedule: "bg-blue-100 text-blue-800 border-blue-200",
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

  if (!session || session.user.role !== "TeamLead") return null;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/teamlead/operation-tasks">
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
              <p className="text-gray-700 mt-2">Task ID: {task.originalTaskId}</p>
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

            {/* Status Display Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Current Status
                </CardTitle>
                <CardDescription className="text-gray-700">
                  Status will be updated by assigned Employee
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
                      <Badge className={`${getVendorStatusColor(task.VendorStatus)} border flex items-center gap-1 px-3 py-1 font-medium w-fit`}>
                        {task.VendorStatus.charAt(0).toUpperCase() + task.VendorStatus.slice(1)}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        This status will be updated by the assigned Employee
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
                      <Badge className={`${getMachineStatusColor(task.MachineStatus)} border flex items-center gap-1 px-3 py-1 font-medium w-fit`}>
                        {task.MachineStatus.charAt(0).toUpperCase() + task.MachineStatus.slice(1)}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        This status will be updated by the assigned Employee
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
            {/* Task Status Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Task Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Overall Status</span>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Vendor Status</span>
                    <Badge className={getVendorStatusColor(task.VendorStatus)}>
                      {task.VendorStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Machine Status</span>
                    <Badge className={getMachineStatusColor(task.MachineStatus)}>
                      {task.MachineStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Info Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Team Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Operation Employee */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned to Employee</h4>
                  {task.sharedOperationEmployee ? (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-900">
                        {task.sharedOperationEmployee.firstName} {task.sharedOperationEmployee.lastName}
                      </p>
                      <p className="text-sm text-green-700">{task.sharedOperationEmployee.email}</p>
                      <Button
                        onClick={openAssignDialog}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      >
                        Change Employee
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                      <p className="text-sm text-yellow-700 mb-2">Not assigned to employee</p>
                      <Button
                        onClick={openAssignDialog}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Assign Employee
                      </Button>
                    </div>
                  )}
                </div>

                {/* Original Manager */}
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
                  {!task.sharedOperationEmployee && (
                    <Button
                      onClick={openAssignDialog}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign Employee
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
                  <Link href="/teamlead/operation-tasks">
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

      {/* Assign Employee Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Assign to Employee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Select Employee *
              </label>
              <Select
                value={assignForm.sharedOperationEmployee}
                onValueChange={(value) =>
                  setAssignForm({ ...assignForm, sharedOperationEmployee: value })
                }
              >
                <SelectTrigger className="bg-white border-gray-700 text-gray-900">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs text-gray-600"
                        >
                          {employee.email}
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
                onClick={handleAssignToEmployee}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={assigning || !assignForm.sharedOperationEmployee}
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Assign Employee
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