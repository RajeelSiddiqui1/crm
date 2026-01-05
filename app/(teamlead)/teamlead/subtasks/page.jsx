"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  Plus,
  Users,
  ArrowRight,
  X,
  MapPin,
  Flag,
  MessageSquare,
  Paperclip,
  Edit,
  Trash2,
  Building,
  Target,
  BarChart3,
  ViewIcon
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import {  AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription } from "@radix-ui/react-alert-dialog";

import { format } from "date-fns";

export default function AllSubtasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if current team lead has the specific depId for leads tracking
  const shouldShowLeadsField = () => {
    if (!session?.user?.depId) return false;
    return session.user.depId === "694161a12ab0b6a3ab0e0788";
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchSubtasks();
  }, [session, status, router]);

  const fetchSubtasks = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/teamlead/subtasks");
      if (response.status === 200) {
        const subtasksData = response.data.subtasks || response.data || [];
        setSubtasks(subtasksData);
      }
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      toast.error("Failed to fetch subtasks");
    } finally {
      setFetching(false);
    }
  };

  const openModal = (subtask) => {
    setSelectedSubtask(subtask);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubtask(null);
  };

  const handleDelete = async (subtaskId) => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `/api/teamlead/subtasks/${subtaskId}`
      );

      if (response.status === 200) {
        toast.success("Subtask deleted successfully!");
        // Remove from state
        setSubtasks(prev => prev.filter(sub => sub._id !== subtaskId));
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast.error(error.response?.data?.error || "Failed to delete subtask");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
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

  const getAssigneeTypeColor = (type) => {
    switch (type) {
      case "employee":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "manager":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAssigneeTypeIcon = (type) => {
    switch (type) {
      case "employee":
        return <Users className="w-3 h-3" />;
      case "manager":
        return <Building className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const filteredSubtasks = subtasks.filter((subtask) => {
    const matchesSearch =
      subtask.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subtask.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subtask.submissionId?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      subtask.teamLeadName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || subtask.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusStats = {
    total: subtasks.length,
    pending: subtasks.filter((s) => s.status === "pending").length,
    in_progress: subtasks.filter((s) => s.status === "in_progress").length,
    completed: subtasks.filter((s) => s.status === "completed").length,
    rejected: subtasks.filter((s) => s.status === "rejected").length,
  };

  const calculateLeadsProgress = (subtask) => {
    if (!subtask.hasLeadsTarget) {
      return {
        hasLeads: false,
        completed: 0,
        total: 0,
        percentage: 0
      };
    }

    const totalLeads = subtask.totalLeadsRequired || 0;
    const completedLeads = subtask.leadsCompleted || 0;
    const percentage = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

    return {
      hasLeads: true,
      completed: completedLeads,
      total: totalLeads,
      percentage: percentage
    };
  };

  const getEmployeeDisplayName = (employee) => {
    if (typeof employee === 'object' && employee !== null) {
      if (employee.firstName && employee.lastName) {
        return `${employee.firstName} ${employee.lastName}`;
      }
      if (employee.name) {
        return employee.name;
      }
    }
    return "Unknown Employee";
  };

  const getManagerDisplayName = (manager) => {
    if (typeof manager === 'object' && manager !== null) {
      if (manager.firstName && manager.lastName) {
        return `${manager.firstName} ${manager.lastName}`;
      }
      if (manager.name) {
        return manager.name;
      }
    }
    return "Unknown Manager";
  };

  const getTeamLeadDisplayName = (teamLead) => {
    if (typeof teamLead === 'object' && teamLead !== null) {
      if (teamLead.firstName && teamLead.lastName) {
        return `${teamLead.firstName} ${teamLead.lastName}`;
      }
      if (teamLead.name) {
        return teamLead.name;
      }
    }
    return "Unknown Team Lead";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-black">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
          <p className="text-gray-700">
            You need to be logged in as TeamLead to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <Toaster position="top-right" />

      {/* Subtask Detail Modal */}
      {isModalOpen && selectedSubtask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6" />
                    <h2 className="text-2xl font-bold truncate text-white">
                      {selectedSubtask.title}
                    </h2>
                  </div>
                  <p className="text-blue-100 text-sm line-clamp-2">
                    {selectedSubtask.description}
                  </p>
                </div>
                <Button
                  onClick={closeModal}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  {/* Status and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border border-gray-200 shadow-sm bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-black">
                            Status
                          </span>
                        </div>
                        <Badge
                          className={`${getStatusVariant(
                            selectedSubtask.status
                          )} border flex items-center gap-1 px-3 py-1.5 font-medium w-full justify-center`}
                        >
                          {getStatusIcon(selectedSubtask.status)}
                          {selectedSubtask.status.replace("_", " ")}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-black">
                            Priority
                          </span>
                        </div>
                        <Badge
                          className={`${getPriorityVariant(
                            selectedSubtask.priority
                          )} border flex items-center gap-1 px-3 py-1.5 font-medium w-full justify-center`}
                        >
                          {selectedSubtask.priority}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Leads Progress */}
                  {selectedSubtask.hasLeadsTarget && (
                    <Card className="border border-gray-200 shadow-sm bg-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-black">
                          <Target className="w-5 h-5 text-green-600" />
                          Leads Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-black">Total Leads:</span>
                            <span className="font-bold text-black">
                              {selectedSubtask.totalLeadsRequired || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-black">Completed Leads:</span>
                            <span className="font-bold text-green-600">
                              {selectedSubtask.leadsCompleted || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${calculateLeadsProgress(selectedSubtask).percentage}%` 
                              }}
                            ></div>
                          </div>
                          <div className="text-center text-sm text-gray-600">
                            {calculateLeadsProgress(selectedSubtask).percentage}% Complete
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Timeline */}
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-black">Start Date:</span>
                        <span className="font-medium text-black">
                          {formatDate(selectedSubtask.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-black">End Date:</span>
                        <span className="font-medium text-black">
                          {formatDate(selectedSubtask.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-black">Time:</span>
                        <span className="font-medium text-black">
                          {selectedSubtask.startTime} -{" "}
                          {selectedSubtask.endTime}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-black">Created:</span>
                        <span className="font-medium text-xs text-black">
                          {formatDateTime(selectedSubtask.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Parent Submission */}
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <FileText className="w-5 h-5 text-green-600" />
                        Parent Submission
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-black">
                          {selectedSubtask.submissionId?.title || "N/A"}
                        </h4>
                        <p className="text-sm text-gray-700">
                          {selectedSubtask.submissionId?.description ||
                            "No description available"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Assignees and Details */}
                <div className="space-y-6">
                  {/* Assigned Employees */}
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <Users className="w-5 h-5 text-blue-600" />
                        Assigned Employees
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-blue-100 text-blue-800"
                        >
                          {selectedSubtask.assignedEmployees?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubtask.assignedEmployees &&
                        selectedSubtask.assignedEmployees.length > 0 ? (
                          selectedSubtask.assignedEmployees.map(
                            (emp, index) => (
                              <div
                                key={emp.employeeId?._id || emp.employeeId || index}
                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold">
                                      {getEmployeeDisplayName(emp.employeeId)[0]}
                                      {getEmployeeDisplayName(emp.employeeId).split(' ')[1]?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-black">
                                      {getEmployeeDisplayName(emp.employeeId)}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      {emp.email}
                                    </div>
                                    {selectedSubtask.hasLeadsTarget && emp.leadsAssigned && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        Leads: {emp.leadsCompleted || 0}/{emp.leadsAssigned}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge className={getStatusVariant(emp.status)}>
                                  {emp.status.replace("_", " ")}
                                </Badge>
                              </div>
                            )
                          )
                        ) : (
                          <div className="text-center py-4 text-gray-700">
                            No employees assigned
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assigned Managers */}
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <Building className="w-5 h-5 text-purple-600" />
                        Assigned Managers
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-purple-100 text-purple-800"
                        >
                          {selectedSubtask.assignedManagers?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubtask.assignedManagers &&
                        selectedSubtask.assignedManagers.length > 0 ? (
                          selectedSubtask.assignedManagers.map(
                            (mgr, index) => (
                              <div
                                key={mgr.managerId?._id || mgr.managerId || index}
                                className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold">
                                      {getManagerDisplayName(mgr.managerId)[0]}
                                      {getManagerDisplayName(mgr.managerId).split(' ')[1]?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-black">
                                      {getManagerDisplayName(mgr.managerId)}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      {mgr.email}
                                    </div>
                                    {selectedSubtask.hasLeadsTarget && mgr.leadsAssigned && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        Leads: {mgr.leadsCompleted || 0}/{mgr.leadsAssigned}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge className={getStatusVariant(mgr.status)}>
                                  {mgr.status.replace("_", " ")}
                                </Badge>
                              </div>
                            )
                          )
                        ) : (
                          <div className="text-center py-4 text-gray-700">
                            No managers assigned
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assigned Team Leads */}
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Assigned Team Leads
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-indigo-100 text-indigo-800"
                        >
                          {selectedSubtask.assignedTeamLeads?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubtask.assignedTeamLeads &&
                        selectedSubtask.assignedTeamLeads.length > 0 ? (
                          selectedSubtask.assignedTeamLeads.map(
                            (tl, index) => (
                              <div
                                key={tl.teamLeadId?._id || tl.teamLeadId || index}
                                className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold">
                                      {getTeamLeadDisplayName(tl.teamLeadId)[0]}
                                      {getTeamLeadDisplayName(tl.teamLeadId).split(' ')[1]?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-black">
                                      {getTeamLeadDisplayName(tl.teamLeadId)}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      {tl.email}
                                    </div>
                                    {selectedSubtask.hasLeadsTarget && tl.leadsAssigned && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        Leads: {tl.leadsCompleted || 0}/{tl.leadsAssigned}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge className={getStatusVariant(tl.status)}>
                                  {tl.status.replace("_", " ")}
                                </Badge>
                              </div>
                            )
                          )
                        ) : (
                          <div className="text-center py-4 text-gray-700">
                            No team leads assigned
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <MessageSquare className="w-5 h-5 text-orange-600" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedSubtask.teamLeadFeedback && (
                        <div>
                          <Label className="text-sm font-medium text-black">
                            Team Lead Feedback
                          </Label>
                          <p className="text-sm text-gray-800 mt-1 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            {selectedSubtask.teamLeadFeedback}
                          </p>
                        </div>
                      )}

                      {selectedSubtask.attachments &&
                        selectedSubtask.attachments.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-black flex items-center gap-2">
                              <Paperclip className="w-4 h-4" />
                              Attachments ({selectedSubtask.attachments.length})
                            </Label>
                            <div className="space-y-2 mt-2">
                              {selectedSubtask.attachments.map(
                                (file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span className="text-black">
                                      {file.originalName}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {selectedSubtask.completedAt && (
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm font-medium text-green-800">
                            Completed At:
                          </span>
                          <span className="text-sm text-green-700">
                            {formatDateTime(selectedSubtask.completedAt)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Created by: {selectedSubtask.teamLeadName || "Unknown Team Lead"}
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={closeModal}
                    className="border-gray-300 text-black hover:bg-gray-100"
                  >
                    Close
                  </Button>
                  <Link href={`/teamlead/subtasks/edit/${selectedSubtask._id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Edit Subtask
                      <Edit className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              All Subtasks
            </h1>
            <p className="text-black mt-3 text-lg">
              Manage all your assigned subtasks
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => router.push("/teamlead/subtask-employee")}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              disabled={fetching}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Subtask
            </Button>

            <Button
              onClick={fetchSubtasks}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              disabled={fetching}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${fetching ? "animate-spin" : ""}`}
              />
              {fetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-black">
                {statusStats.total}
              </div>
              <div className="text-sm text-gray-700">Total Subtasks</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {statusStats.pending}
              </div>
              <div className="text-sm text-gray-700">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statusStats.in_progress}
              </div>
              <div className="text-sm text-gray-700">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {statusStats.completed}
              </div>
              <div className="text-sm text-gray-700">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {subtasks.filter(s => s.hasLeadsTarget).length}
              </div>
              <div className="text-sm text-gray-700 flex items-center justify-center gap-1">
                <Target className="w-4 h-4" />
                Lead Tracking
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-black">
                  All Subtasks
                </CardTitle>
                <CardDescription className="text-gray-700 text-base">
                  {filteredSubtasks.length} subtask
                  {filteredSubtasks.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search subtasks..."
                    className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11 text-base text-black bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black bg-white">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent className="text-black bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-3 text-black">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-lg">Loading subtasks...</span>
                </div>
              </div>
            ) : filteredSubtasks.length === 0 ? (
              <div className="text-center py-16">
                <div>
                  <div className="text-gray-300 mb-4">
                    <FileText className="w-20 h-20 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">
                    {subtasks.length === 0
                      ? "No subtasks created"
                      : "No matches found"}
                  </h3>
                  <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                    {subtasks.length === 0
                      ? "Get started by creating your first subtask from a submission."
                      : "Try adjusting your search terms to find what you're looking for."}
                  </p>
                  {subtasks.length === 0 && (
                    <Button
                      onClick={() => router.push("/teamlead/subtasks/create")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Subtask
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Subtask Details
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Assigned To
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Lead Target
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Status
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Priority
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Timeline
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubtasks.map((subtask) => {
                      const leadsProgress = calculateLeadsProgress(subtask);
                      const totalAssignees = 
                        (subtask.assignedEmployees?.length || 0) + 
                        (subtask.assignedManagers?.length || 0) +
                        (subtask.assignedTeamLeads?.length || 0);
                      
                      return (
                      <TableRow
                        key={subtask._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-600/30 transition-all duration-300">
                              <AvatarFallback className={`${subtask.hasLeadsTarget ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-cyan-600'} text-white font-bold`}>
                                {subtask.hasLeadsTarget ? (
                                  <Target className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                             <div className="font-bold text-black text-lg group-hover:text-blue-700 transition-colors duration-200 break-words">
  {subtask.title.split(' ').map((word, idx) => (
    <span key={idx} className="inline-block mr-1">
      {word}
    </span>
  ))}
  {subtask.hasLeadsTarget && (
    <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
      <Target className="w-3 h-3 mr-1" />
      Leads
    </Badge>
  )}
</div>

                            
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            {/* Employees */}
                            {subtask.assignedEmployees && subtask.assignedEmployees.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Users className="w-3 h-3" />
                                  <span>Employees ({subtask.assignedEmployees.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {subtask.assignedEmployees.slice(0, 2).map((emp, index) => (
                                    <Badge 
                                      key={emp.employeeId?._id || emp.employeeId || index}
                                      className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                                      variant="outline"
                                    >
                                      {getEmployeeDisplayName(emp.employeeId)}
                                    </Badge>
                                  ))}
                                  {subtask.assignedEmployees.length > 2 && (
                                    <Badge className="text-xs bg-gray-100 text-gray-800">
                                      +{subtask.assignedEmployees.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Managers */}
                            {subtask.assignedManagers && subtask.assignedManagers.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Building className="w-3 h-3" />
                                  <span>Managers ({subtask.assignedManagers.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {subtask.assignedManagers.slice(0, 2).map((mgr, index) => (
                                    <Badge 
                                      key={mgr.managerId?._id || mgr.managerId || index}
                                      className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                                      variant="outline"
                                    >
                                      {getManagerDisplayName(mgr.managerId)}
                                    </Badge>
                                  ))}
                                  {subtask.assignedManagers.length > 2 && (
                                    <Badge className="text-xs bg-gray-100 text-gray-800">
                                      +{subtask.assignedManagers.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Team Leads */}
                            {subtask.assignedTeamLeads && subtask.assignedTeamLeads.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Users className="w-3 h-3" />
                                  <span>Team Leads ({subtask.assignedTeamLeads.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {subtask.assignedTeamLeads.slice(0, 2).map((tl, index) => (
                                    <Badge 
                                      key={tl.teamLeadId?._id || tl.teamLeadId || index}
                                      className="text-xs bg-indigo-100 text-indigo-800 border-indigo-200"
                                      variant="outline"
                                    >
                                      {getTeamLeadDisplayName(tl.teamLeadId)}
                                    </Badge>
                                  ))}
                                  {subtask.assignedTeamLeads.length > 2 && (
                                    <Badge className="text-xs bg-gray-100 text-gray-800">
                                      +{subtask.assignedTeamLeads.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {totalAssignees === 0 && (
                              <span className="text-xs text-gray-500 italic">
                                No assignees
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          {leadsProgress.hasLeads ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Leads:</span>
                                <span className="font-medium">
                                  {leadsProgress.completed}/{leadsProgress.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${leadsProgress.percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-center text-gray-600">
                                {leadsProgress.percentage}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">
                              No lead target
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="py-4">
                          <Badge
                            className={`${getStatusVariant(
                              subtask.status
                            )} border flex items-center gap-1 px-3 py-1.5 font-medium`}
                          >
                            {getStatusIcon(subtask.status)}
                            {subtask.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4">
                          <Badge
                            className={`${getPriorityVariant(
                              subtask.priority
                            )} border flex items-center gap-1 px-3 py-1.5 font-medium`}
                          >
                            {subtask.priority}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600 flex items-center">
                              <Calendar className="w-3 h-3 inline mr-1 " />
                              {formatDate(subtask.startDate)}
                            </div>
                            <div className="text-xs text-gray-600">
                              {subtask.startTime} - {subtask.endTime}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(subtask)}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                              <Link
                              href={`/teamlead/subtask-employee/view/${subtask._id}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                              >
                                <ViewIcon className="w-4 h-4" />
                                View Full
                              </Button>
                            </Link>

                            <Link
                              href={`/teamlead/subtask-employee/edit/${subtask._id}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>   
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
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