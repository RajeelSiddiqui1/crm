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
  Briefcase,
  UserCheck,
  Users as UsersIcon,
  ViewIcon,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function OtherManagersSubtasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subtasks, setSubtasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchOtherManagersSubtasks();
  }, [session, status, router]);

  const fetchOtherManagersSubtasks = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/manager/subtasks");
      if (response.status === 200) {
        setSubtasks(response.data.subtasks || []);
      }
    } catch (error) {
      console.error("Error fetching other managers' subtasks:", error);
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

  const filteredSubtasks = subtasks.filter((subtask) => {
    const matchesSearch =
      subtask.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subtask.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subtask.submissionId?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

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

  if (!session || session.user.role !== "Manager") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <Toaster position="top-right" />

      {/* Subtask Detail Modal - विस्तृत देखने के लिए */}
      {isModalOpen && selectedSubtask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-gray-900">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-6 h-6" />
                    <h2 className="text-2xl font-bold truncate text-white">
                      {selectedSubtask.title}
                    </h2>
                  </div>
                  <p className="text-blue-100 text-sm">
                    Assigned by: {selectedSubtask.teamLeadId?.firstName}{" "}
                    {selectedSubtask.teamLeadId?.lastName}
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
                  {/* Basic Info */}
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Subtask Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Title</Label>
                        <p className="text-sm mt-1 font-medium">
                          {selectedSubtask.title}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Description
                        </Label>
                        <p className="text-sm mt-1 text-gray-700">
                          {selectedSubtask.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Priority
                          </Label>
                          <Badge
                            className={`${getPriorityVariant(
                              selectedSubtask.priority
                            )} mt-1`}
                          >
                            {selectedSubtask.priority}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge
                            className={`${getStatusVariant(
                              selectedSubtask.status
                            )} mt-1 flex items-center gap-1`}
                          >
                            {getStatusIcon(selectedSubtask.status)}
                            {selectedSubtask.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Parent Submission */}
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        Parent Submission
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold">
                          {selectedSubtask.submissionId?.title || "N/A"}
                        </h4>
                        <p className="text-sm text-gray-700">
                          {selectedSubtask.submissionId?.description ||
                            "No description"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Start Date:</span>
                        <span className="font-medium">
                          {formatDate(selectedSubtask.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">End Date:</span>
                        <span className="font-medium">
                          {formatDate(selectedSubtask.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Time:</span>
                        <span className="font-medium">
                          {selectedSubtask.startTime} -{" "}
                          {selectedSubtask.endTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Created:</span>
                        <span className="font-medium text-xs">
                          {formatDateTime(selectedSubtask.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Assignments */}
                <div className="space-y-6">
                  {/* Assigned Managers */}
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-red-600" />
                        Assigned Managers
                        <Badge variant="secondary" className="ml-2">
                          {selectedSubtask.assignedManagers?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubtask.assignedManagers &&
                        selectedSubtask.assignedManagers.length > 0 ? (
                          selectedSubtask.assignedManagers.map((mgr, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-white">
                                  <AvatarFallback className="bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold">
                                    {mgr.managerId?.firstName?.[0]}
                                    {mgr.managerId?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {mgr.managerId?.firstName}{" "}
                                    {mgr.managerId?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {mgr.email}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge className={getStatusVariant(mgr.status)}>
                                  {mgr.status.replace("_", " ")}
                                </Badge>
                                {mgr.leadsAssigned > 0 && (
                                  <span className="text-xs text-gray-700">
                                    Leads: {mgr.leadsCompleted}/
                                    {mgr.leadsAssigned}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-700">
                            No managers assigned
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assigned Employees */}
                  <Card className="border border-gray-200 shadow-sm text-gray-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                        <UsersIcon className="w-5 h-5 text-blue-600" />
                        Assigned Employees
                        <Badge variant="secondary" className="ml-2">
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
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border-2 border-white">
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold">
                                      {emp.employeeId?.firstName?.[0]}
                                      {emp.employeeId?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {emp.employeeId?.firstName}{" "}
                                      {emp.employeeId?.lastName}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      {emp.email}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    className={getStatusVariant(emp.status)}
                                  >
                                    {emp.status.replace("_", " ")}
                                  </Badge>
                                  {emp.leadsAssigned > 0 && (
                                    <span className="text-xs text-gray-700">
                                      Leads: {emp.leadsCompleted}/
                                      {emp.leadsAssigned}
                                    </span>
                                  )}
                                </div>
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

                  {/* Team Lead Info */}
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        Created By Team Lead
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
                            {selectedSubtask.teamLeadId?.firstName?.[0]}
                            {selectedSubtask.teamLeadId?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {selectedSubtask.teamLeadId?.firstName}{" "}
                            {selectedSubtask.teamLeadId?.lastName}
                          </div>
                          <div className="text-sm text-gray-700">
                            {selectedSubtask.teamLeadId?.email}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Close
                </Button>
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
              Team Subtasks Overview
            </h1>
            <p className="text-black mt-3 text-lg">
              View subtasks assigned to other managers and employees
            </p>
          </div>

          <Button
            onClick={fetchOtherManagersSubtasks}
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

        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-black">
                  Other Managers' Subtasks
                </CardTitle>
                <CardDescription className="text-gray-700">
                  {filteredSubtasks.length} subtask
                  {filteredSubtasks.length !== 1 ? "s" : ""} found (where you
                  are NOT assigned)
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search subtasks..."
                    className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-lg">
                    Loading other managers' subtasks...
                  </span>
                </div>
              </div>
            ) : filteredSubtasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full mb-6">
                  <UsersIcon className="w-20 h-20 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  No other subtasks found
                </h3>
                <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                  Currently, there are no subtasks where other managers are
                  assigned. You might be assigned to all available subtasks.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Subtask
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Assigned To (Managers)
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Assigned To (Employees)
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Status
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Created By
                      </TableHead>
                      <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubtasks.map((subtask) => (
                      <TableRow
                        key={subtask._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-bold text-black text-lg group-hover:text-blue-700 transition-colors duration-200">
                              {subtask.title}
                            </div>
                            <div className="text-sm text-gray-700 line-clamp-2">
                              {subtask.description}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {formatDate(subtask.startDate)} -{" "}
                                {formatDate(subtask.endDate)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-2">
                            {subtask.assignedManagers &&
                            subtask.assignedManagers.length > 0 ? (
                              subtask.assignedManagers
                                .slice(0, 3)
                                .map((mgr, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs bg-red-100 text-red-600">
                                        {mgr.managerId?.firstName?.[0]}
                                        {mgr.managerId?.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-xs font-medium text-black">
                                        {mgr.managerId?.firstName}{" "}
                                        {mgr.managerId?.lastName}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${getStatusVariant(
                                          mgr.status
                                        )}`}
                                      >
                                        {mgr.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <span className="text-xs text-gray-700">
                                No managers
                              </span>
                            )}
                            {subtask.assignedManagers &&
                              subtask.assignedManagers.length > 3 && (
                                <span className="text-xs text-gray-700">
                                  +{subtask.assignedManagers.length - 3} more
                                  managers
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-2">
                            {subtask.assignedEmployees &&
                            subtask.assignedEmployees.length > 0 ? (
                              subtask.assignedEmployees
                                .slice(0, 3)
                                .map((emp, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                        {emp.employeeId?.firstName?.[0]}
                                        {emp.employeeId?.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-xs font-medium text-black">
                                        {emp.employeeId?.firstName}{" "}
                                        {emp.employeeId?.lastName}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${getStatusVariant(
                                          emp.status
                                        )}`}
                                      >
                                        {emp.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <span className="text-xs text-gray-700">
                                No employees
                              </span>
                            )}
                            {subtask.assignedEmployees &&
                              subtask.assignedEmployees.length > 3 && (
                                <span className="text-xs text-gray-700">
                                  +{subtask.assignedEmployees.length - 3} more
                                  employees
                                </span>
                              )}
                          </div>
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
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xs">
                                {subtask.teamLeadId?.firstName?.[0]}
                                {subtask.teamLeadId?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-black">
                                {subtask.teamLeadId?.firstName}{" "}
                                {subtask.teamLeadId?.lastName}
                              </div>
                              <div className="text-xs text-gray-700">
                                Team Lead
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                              onClick={() => openModal(subtask)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>

                          <Button
                            onClick={() =>
                              router.push(
                                `/manager/subtasks/${subtask._id}`
                              )
                            }
                            variant="outline"
                            size="sm"
                            className=" mt-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all duration-200 justify-start"
                          >
                            <ViewIcon className="w-4 h-4 mr-2" />
                            Employee Task{" "}
                          </Button>
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
