"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Mail,
  Building,
  RefreshCw,
  Flag,
  Search,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function EmployeeReceivedTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [receivedTasks, setReceivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Employee") {
      router.push("/employeelogin");
      return;
    }

    fetchReceivedTasks();
  }, [session, status, router]);

  const fetchReceivedTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/employee/received-tasks");
      if (response.data.success) {
        setReceivedTasks(response.data.receivedTasks || []);
      }
    } catch (error) {
      console.error("Error fetching received tasks:", error);
      toast.error("Failed to load received tasks");
    } finally {
      setLoading(false);
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
    });
  };

  // Filter tasks based on search
  const filteredTasks = receivedTasks.filter(task =>
    task.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.originalTaskId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/employee/dashboard">
              <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Assigned Tasks</h1>
              <p className="text-gray-700 mt-2">Tasks assigned to you by your teamlead</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={fetchReceivedTasks}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{receivedTasks.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {receivedTasks.filter(t => t.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {receivedTasks.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {receivedTasks.filter(t => t.status === 'completed' || t.status === 'signed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search tasks by title, ID, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 text-gray-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Assigned Tasks</CardTitle>
                <CardDescription className="text-gray-700">
                  {filteredTasks.length} of {receivedTasks.length} tasks
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                {receivedTasks.length} task{receivedTasks.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {receivedTasks.length === 0 ? "No Tasks Assigned" : "No Tasks Found"}
                </h3>
                <p className="text-gray-700 max-w-md mx-auto">
                  {receivedTasks.length === 0 
                    ? "You haven't been assigned any tasks yet. Check back later for updates."
                    : "No tasks match your search criteria."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-900 font-semibold">Task Title</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Task ID</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Assigned By</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Priority</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Due Date</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Assigned Date</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          <div>
                            <p>{task.taskTitle}</p>
                            {task.taskDescription && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                {task.taskDescription}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{task.originalTaskId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="text-gray-900 font-medium">
                                {task.sharedTeamlead?.firstName} {task.sharedTeamlead?.lastName}
                              </p>
                              <p className="text-xs text-gray-600">Teamlead</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(task.status)} border`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPriorityColor(task.priority)} border`}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900">
                          {task.dueDate ? formatDate(task.dueDate) : "Not set"}
                        </TableCell>
                        <TableCell className="text-gray-900">
                          {formatDate(task.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/employee/received-tasks/${task._id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}