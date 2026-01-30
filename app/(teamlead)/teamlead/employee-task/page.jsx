"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  X,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  Crown,
  Download,
  Image,
  Video,
  File
} from "lucide-react";
import axios from "axios";

export default function TeamLeadEmployeeTaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchTasks();
  }, [session, status, router]);

  const fetchTasks = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`/api/teamlead/employee-task`);

      if (response.status === 200) {
        const data = response.data.tasks || [];
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks", {
        icon: "❌",
      });
    } finally {
      setFetching(false);
    }
  };

  const openModal = async (task) => {
    try {
      const response = await axios.get(`/api/teamlead/employee-task/${task._id}`);
      if (response.status === 200) {
        const taskData = response.data;
        setSelectedTask(taskData);
        
        // Find current team lead's assignment
        const teamLeadAssignment = taskData.assignedTeamLead?.find(
          tl => tl.teamLeadId?._id === session.user.id || tl.teamLeadId === session.user.id
        );
        
        if (teamLeadAssignment) {
          setFeedback(teamLeadAssignment.feedback || "");
          setCurrentStatus(teamLeadAssignment.status || "pending");
        }
        
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to load task details", {
        icon: "❌",
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setFeedback("");
    setCurrentStatus("");
  };

  const updateTaskStatus = async (newStatus,feedback) => {
    if (!selectedTask) return;
    
    try {
      setUpdatingStatus(true);
      const response = await axios.put(`/api/teamlead/employee-task/${selectedTask._id}`, {
        status: newStatus,
        feedback
      });

      if (response.status === 200) {
        setSelectedTask(response.data);
        setTasks(prev => prev.map(t =>
          t._id === selectedTask._id
            ? { ...t, ...response.data }
            : t
        ));
        
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`, {
          icon: "🎯",
        });
        
        setCurrentStatus(newStatus);
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task status", {
        icon: "❌",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedTask || !feedback.trim()) {
      toast.error("Please enter some feedback first", {
        icon: "✍️"
      });
      return;
    }
    
    try {
      setUpdatingStatus(true);
      const response = await axios.put(`/api/teamlead/employee-task/${selectedTask._id}`, {
        feedback
      });

      if (response.status === 200) {
        setSelectedTask(response.data);
        setTasks(prev => prev.map(t =>
          t._id === selectedTask._id
            ? { ...t, ...response.data }
            : t
        ));
        
        toast.success("Feedback submitted successfully", {
          icon: "💬",
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback", {
        icon: "❌"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      completed: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
      approved: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
      in_progress: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      pending: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      rejected: "bg-gradient-to-r from-rose-500 to-pink-500 text-white",
    };
    return variants[status] || "bg-gradient-to-r from-gray-500 to-slate-600 text-white";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Get team lead's status from assignedTeamLead array
    const teamLeadAssignment = task.assignedTeamLead?.find(
      tl => tl.teamLeadId?._id === session?.user?.id || tl.teamLeadId === session?.user?.id
    );
    const taskStatus = teamLeadAssignment?.status || "pending";
    
    const matchesStatus = statusFilter === "all" || taskStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-600" />
          <h3 className="text-xl font-bold text-gray-900">Loading...</h3>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return null;
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Tasks</h1>
        </div>
        <p className="text-gray-600">Manage tasks assigned to you by employees</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchTasks}
              variant="outline"
              disabled={fetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const teamLeadAssignment = task.assignedTeamLead?.find(
                      tl => tl.teamLeadId?._id === session.user.id || tl.teamLeadId === session.user.id
                    );
                    const taskStatus = teamLeadAssignment?.status || "pending";
                    
                    return (
                      <TableRow key={task._id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusVariant(taskStatus)}>
                            {getStatusIcon(taskStatus)}
                            <span className="ml-1">{formatStatus(taskStatus)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(task.startDate)}</TableCell>
                        <TableCell>{formatDate(task.endDate)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal(task)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
                  <p className="text-amber-100">{selectedTask.description}</p>
                </div>
                <Button
                  onClick={closeModal}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className={getStatusVariant(currentStatus)}>
                  {getStatusIcon(currentStatus)}
                  <span className="ml-1">{formatStatus(currentStatus)}</span>
                </Badge>
                <Badge className="bg-white/20 text-white">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {formatDate(selectedTask.startDate)} - {formatDate(selectedTask.endDate)}
                </Badge>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Status Update Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { status: "pending", label: "Pending", icon: <AlertCircle /> },
                        { status: "in_progress", label: "In Progress", icon: <Clock /> },
                        { status: "completed", label: "Completed", icon: <CheckCircle /> }
                      ].map((item) => {
                        const isActive = currentStatus === item.status;
                        return (
                          <Button
                            key={item.status}
                            disabled={updatingStatus || isActive}
                            onClick={() => updateTaskStatus(item.status)}
                            className={`h-20 flex flex-col gap-2 ${
                              isActive
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            <div className="text-2xl">{item.icon}</div>
                            <span>{item.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full border rounded-lg p-3 min-h-[100px]"
                      placeholder="Enter your feedback here..."
                    />
                    <Button
                      onClick={submitFeedback}
                      disabled={updatingStatus}
                      className="mt-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white"
                    >
                      {updatingStatus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Submit Feedback
                    </Button>
                  </CardContent>
                </Card>

                {/* Attachments */}
                {selectedTask.fileAttachments && selectedTask.fileAttachments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedTask.fileAttachments.map((file, index) => (
                          <div key={index} className="border rounded-lg p-3 flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadFile(file.url, file.name)}
                                className="mt-1 h-6 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assigned People */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assigned To</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTask.assignedEmployee?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Employees</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedTask.assignedEmployee.map((emp, idx) => (
                              <Badge key={idx} variant="outline">
                                {emp.employeeId?.firstName} {emp.employeeId?.lastName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedTask.assignedManager?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Managers</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedTask.assignedManager.map((mgr, idx) => (
                              <Badge key={idx} variant="outline">
                                {mgr.managerId?.firstName} {mgr.managerId?.lastName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
