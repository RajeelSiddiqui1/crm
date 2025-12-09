"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Flag,
  Upload,
  Download,
  Settings,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function OperationManagerTaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sharedTasks, setSharedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamleads, setTeamleads] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [assignForm, setAssignForm] = useState({
    sharedOperationTeamlead: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchSharedTasks();
    fetchTeamleads();
  }, [session, status, router]);

 const fetchSharedTasks = async () => {
  setLoading(true);
  try {
    const response = await axios.get("/api/manager/operation-manager-task");
    console.log("API Response:", response.data); // Debug ke liye
    if (response.data.success) {
      console.log("Shared Tasks:", response.data.sharedTasks); // Data check karo
      setSharedTasks(response.data.sharedTasks || []);
    }
  } catch (error) {
    console.error("Error fetching shared tasks:", error);
    if (error.response?.status === 403) {
      toast.error("Access denied. Operation department required.");
    } else {
      toast.error("Failed to load operation tasks");
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
        `/api/manager/operation-manager-task/${selectedTask._id}`,
        {
          sharedOperationTeamlead: assignForm.sharedOperationTeamlead,
        }
      );

      if (response.data.success) {
        toast.success("Task assigned to Operation TeamLead successfully");
        setShowAssignDialog(false);
        setAssignForm({ sharedOperationTeamlead: "" });
        setSelectedTask(null);
        fetchSharedTasks();
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      const errorMessage = error.response?.data?.message || "Failed to assign task";
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const openAssignDialog = (task) => {
    setSelectedTask(task);
    setAssignForm({
      sharedOperationTeamlead: task.sharedOperationTeamlead?._id || "",
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
          <p className="text-gray-700">Loading operation tasks...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/manager/dashboard">
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
                Operation Manager Tasks
              </h1>
              <p className="text-gray-700 mt-2">
                Manage signed tasks and assign them to operation team
              </p>
            </div>
          </div>

          <Button
            onClick={fetchSharedTasks}
            variant="outline"
            className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Signed Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{sharedTasks.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Assigned to TeamLead</p>
                  <p className="text-2xl font-bold text-green-600">
                    {sharedTasks.filter(task => task.sharedOperationTeamlead).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pending Assignment</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {sharedTasks.filter(task => !task.sharedOperationTeamlead).length}
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
                  <p className="text-sm font-medium text-gray-700">Vendor Approved</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {sharedTasks.filter(task => task.VendorStatus === "approved").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Signed Tasks
                </CardTitle>
                <CardDescription className="text-gray-700">
                  Assign signed tasks to operation team leads
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-800 border-gray-300"
              >
                {sharedTasks.length} task{sharedTasks.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {sharedTasks.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Signed Tasks
                </h3>
                <p className="text-gray-700 max-w-md mx-auto">
                  There are no signed tasks available for operation management yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sharedTasks.map((task) => (
                  <div
                    key={task._id}
                    className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {task.taskTitle}
                            </h3>
                            <p className="text-sm text-gray-700 mb-2">
                              Original Task ID: {task.originalTaskId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(task.status)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                            {task.sharedOperationTeamlead && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 px-3 py-1 font-medium">
                                <Users className="w-3 h-3" />
                                Assigned
                              </Badge>
                            )}
                          </div>
                        </div>

                        {task.taskDescription && (
                          <p className="text-gray-800 mb-4">{task.taskDescription}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-3">
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-gray-900">
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
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </span>
                          )}
                        </div>

                        {/* Vendor and Machine Status */}
                        <div className="flex flex-wrap gap-4 mb-3">
                          <Badge className={`${getVendorStatusColor(task.VendorStatus)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                            Vendor: {task.VendorStatus}
                          </Badge>
                          <Badge className={`${getMachineStatusColor(task.MachineStatus)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                            Machine: {task.MachineStatus}
                          </Badge>
                        </div>

                        {/* Assigned TeamLead Info */}
                        {task.sharedOperationTeamlead && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-green-900 mb-2">Assigned to Operation TeamLead</h5>
                            <div className="flex items-center gap-2 text-sm text-green-800">
                              <User className="w-4 h-4" />
                              <span>
                                {task.sharedOperationTeamlead.firstName} {task.sharedOperationTeamlead.lastName}
                              </span>
                              <span className="mx-2">•</span>
                              <Mail className="w-4 h-4" />
                              <span>{task.sharedOperationTeamlead.email}</span>
                            </div>
                          </div>
                        )}

                        {task.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">
                              <strong>Notes:</strong> {task.notes}
                            </p>
                          </div>
                        )}

                        {/* Form Data */}
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

                      <div className="flex flex-col gap-2">
                        {!task.sharedOperationTeamlead ? (
                          <Button
                            onClick={() => openAssignDialog(task)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Assign to TeamLead
                          </Button>
                        ) : (
                          <Button
                            onClick={() => openAssignDialog(task)}
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Change TeamLead
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                          onClick={() => router.push(`/manager/operation-manager-task/${task._id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
                  setAssignForm({ ...assignForm, sharedOperationTeamlead: value })
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
    </div>
  );
}