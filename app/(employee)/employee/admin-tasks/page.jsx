"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast, Toaster } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  Loader2,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Users,
} from "lucide-react";

export default function EmployeeAdminTasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: "", feedback: "" });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Employee") {
      router.push("/login");
    } else {
      fetchTasks();
      fetchEmployees();
    }
  }, [session, status]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/employee/admin-tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employee/employee-list");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status) {
      toast.error("Please select a status");
      return;
    }

    try {
      setUpdating(true);
      await axios.put(`/api/employee/admin-tasks/${selectedTask._id}`, statusUpdate);
      toast.success("Status updated successfully!");
      setShowStatusDialog(false);
      setStatusUpdate({ status: "", feedback: "" });
      fetchTasks();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleShareTask = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    try {
      setUpdating(true);
      await axios.post(`/api/employee/admin-tasks/${selectedTask._id}`, {
        sharedToId: selectedEmployee,
        sharedToModel: "Employee"
      });
      toast.success("Task shared successfully!");
      setShowShareDialog(false);
      setSelectedEmployee("");
      fetchTasks();
    } catch (error) {
      console.error("Error sharing task:", error);
      toast.error(error.response?.data?.message || "Failed to share task");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-yellow-400 to-orange-400";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      case "completed":
        return "bg-gradient-to-r from-green-500 to-emerald-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <TrendingUp className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-gradient-to-br from-green-500 to-emerald-600";
      case "medium":
        return "bg-gradient-to-br from-blue-500 to-cyan-600";
      case "high":
        return "bg-gradient-to-br from-orange-500 to-amber-600";
      default:
        return "bg-gray-500";
    }
  };

  const getUserStatus = (task) => {
    const userId = session?.user?.id;
    const employee = task.employees?.find(e => e.employeeId?._id === userId);
    return employee?.status || "pending";
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || getUserStatus(task) === filterStatus;
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Tasks
            </h1>
            <p className="text-gray-600 mt-2">Manage and track your assigned tasks</p>
          </div>
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-bold shadow-lg">
            <ClipboardList className="w-4 h-4 mr-2" />
            {filteredTasks.length} Tasks
          </Badge>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px] bg-white border-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Table */}
      <Card className="border-2 border-gray-200 shadow-xl bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            All Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-bold text-gray-900">Task</TableHead>
                  <TableHead className="font-bold text-gray-900">Priority</TableHead>
                  <TableHead className="font-bold text-gray-900">Status</TableHead>
                  <TableHead className="font-bold text-gray-900">Due Date</TableHead>
                  <TableHead className="font-bold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const userStatus = getUserStatus(task);
                  return (
                    <TableRow 
                      key={task._id} 
                      className="hover:bg-blue-50 transition-colors duration-200"
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{task.title}</p>
                          {task.clientName && (
                            <p className="text-sm text-gray-600">{task.clientName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(task.priority)} text-white font-bold`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(userStatus)} text-white font-semibold flex items-center gap-1.5 px-3 py-1 w-fit`}>
                          {getStatusIcon(userStatus)}
                          {userStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.endDate ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(task.endDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedTask(task);
                              setStatusUpdate({ status: userStatus, feedback: "" });
                              setShowStatusDialog(true);
                            }}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold shadow-md"
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowShareDialog(true);
                            }}
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold shadow-md"
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-20">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tasks found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Update Task Status</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the status of "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Status</label>
              <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Feedback (Optional)</label>
              <Textarea
                value={statusUpdate.feedback}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, feedback: e.target.value })}
                placeholder="Add any comments or feedback..."
                className="min-h-[100px] bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowStatusDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Task Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Share Task with Employee</DialogTitle>
            <DialogDescription className="text-gray-600">
              Share "{selectedTask?.title}" with another employee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Select Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px]">
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {emp.profilePic ? (
                            <AvatarImage src={emp.profilePic} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{emp.firstName} {emp.lastName}</span>
                        {emp.depId?.name && (
                          <Badge variant="secondary" className="text-xs">
                            {emp.depId.name}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowShareDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareTask}
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
