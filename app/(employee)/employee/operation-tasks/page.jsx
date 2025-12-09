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
  Loader2,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Eye,
  Truck,
  Cpu,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function EmployeeOperationTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Employee") {
      router.push("/employeelogin");
      return;
    }

    fetchTasks();
  }, [session, status, router]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/employee/operation-tasks");
      console.log("Employee tasks response:", response.data);
      if (response.data.success) {
        setTasks(response.data.sharedTasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
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
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <p className="text-gray-700">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Employee") {
    return null;
  }

  const approvedVendorTasks = tasks.filter(task => task.VendorStatus === "approved").length;
  const deployedMachineTasks = tasks.filter(task => task.MachineStatus === "deployed").length;
  const pendingTasks = tasks.filter(task => task.VendorStatus === "pending" || task.MachineStatus === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/employee/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Operation Tasks</h1>
              <p className="text-gray-700 mt-2">
                Tasks assigned to you for completion
              </p>
            </div>
          </div>

          <Button
            onClick={fetchTasks}
            variant="outline"
            className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
            disabled={loading}
          >
            <Loader2 className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Vendor Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedVendorTasks}</p>
                </div>
                <Truck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Machine Deployed</p>
                  <p className="text-2xl font-bold text-purple-600">{deployedMachineTasks}</p>
                </div>
                <Cpu className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pending Tasks</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingTasks}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
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
                  Assigned Tasks
                </CardTitle>
                <CardDescription className="text-gray-700">
                  Update vendor and machine status for your assigned tasks
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-800 border-gray-300"
              >
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Tasks Assigned
                </h3>
                <p className="text-gray-700 max-w-md mx-auto">
                  You don't have any operation tasks assigned yet. Check back later or contact your TeamLead.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {tasks.map((task) => (
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
                              Task ID: {task.originalTaskId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getVendorStatusColor(task.VendorStatus)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                              <Truck className="w-3 h-3" />
                              Vendor: {task.VendorStatus}
                            </Badge>
                            <Badge className={`${getMachineStatusColor(task.MachineStatus)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                              <Cpu className="w-3 h-3" />
                              Machine: {task.MachineStatus}
                            </Badge>
                          </div>
                        </div>

                        {task.taskDescription && (
                          <p className="text-gray-800 mb-4">{task.taskDescription}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-3">
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-gray-900">
                              Assigned by: {task.sharedOperationTeamlead?.firstName} {task.sharedOperationTeamlead?.lastName}
                            </span>
                          </span>

                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {formatDate(task.dueDate)}</span>
                          </span>

                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {formatDate(task.createdAt)}</span>
                          </span>
                        </div>

                        {task.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">
                              <strong>Notes:</strong> {task.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => router.push(`/employee/operation-tasks/${task._id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Update Status
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
    </div>
  );
}