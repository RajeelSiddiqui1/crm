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
  Shield,
  Crown,
  Zap,
  DownloadCloud,
  Mail,
  Activity,
  TrendingUp,
  Target,
  MessageCircle,
  AlertTriangle,
  Send,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const COLORS = {
    manager: {
      gradient: "from-blue-600 to-indigo-700",
      accent: "blue-600",
    },
    employee: {
      gradient: "from-emerald-500 to-teal-600",
      accent: "emerald-500",
    },
    lead: {
      gradient: "from-violet-600 to-purple-700",
      accent: "violet-600",
    },
  };

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
      case "approved":
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 text-gray-900">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold truncate text-white drop-shadow-lg">
                                    {selectedSubtask.title}
                                </h2>
                            </div>
                            <p className="text-blue-100/90 text-base line-clamp-2 max-w-3xl">
                                {selectedSubtask.description}
                            </p>
                        </div>
                        <Button
                            onClick={closeModal}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full transition-all duration-300"
                        >
                            <XCircle className="w-6 h-6" />
                        </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-6">
                        <Badge className={`${getStatusVariant(selectedSubtask.status)} px-4 py-2 font-semibold text-sm`}>
                            {getStatusIcon(selectedSubtask.status)}
                            Task Status: {selectedSubtask.status.replace("_", " ")}
                        </Badge>
                        <Badge className={`${getPriorityVariant(selectedSubtask.priority)} px-4 py-2 font-semibold text-sm`}>
                            <Target className="w-3.5 h-3.5 mr-1.5" />
                            {selectedSubtask.priority || 'Medium'} Priority
                        </Badge>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 font-semibold text-sm border border-white/30">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Due: {formatDate(selectedSubtask.endDate)}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Task Details Info */}
                  <Card className="border border-gray-200 shadow-lg rounded-xl overflow-hidden bg-white">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                                  <FileText className="w-5 h-5 text-white" />
                              </div>
                              <CardTitle className="text-xl font-bold text-gray-900">
                                  Task Specifications
                              </CardTitle>
                          </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                          <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900">Task Description</h4>
                              <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed font-medium">
                                  {selectedSubtask.description}
                              </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                  <div className="flex items-center gap-2 text-blue-700">
                                      <Calendar className="w-4 h-4" />
                                      <span className="font-bold text-xs uppercase tracking-wider">Start Timeline</span>
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">
                                      {formatDate(selectedSubtask.startDate)}
                                  </div>
                              </div>
                              <div className="space-y-2 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                                  <div className="flex items-center gap-2 text-rose-700">
                                      <Calendar className="w-4 h-4" />
                                      <span className="font-bold text-xs uppercase tracking-wider">Deadline</span>
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">
                                      {formatDate(selectedSubtask.endDate)}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-800 mb-2">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="font-bold">Team Progress Tracking</span>
                              </div>
                              <div className="text-lg font-bold text-gray-900 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border-2 border-dashed border-gray-200 flex justify-between items-center">
                                  <span>Total Leads Achieved:</span>
                                  <span className="text-2xl text-blue-700">{selectedSubtask.leadsCompleted || 0} / {selectedSubtask.lead || 0}</span>
                              </div>
                          </div>
                      </CardContent>
                  </Card>

                  {/* Team Feedback & Activity - Aggregated Feed */}
                  <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden bg-white">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                                  <Activity className="w-5 h-5 text-white" />
                              </div>
                              <CardTitle className="text-xl font-bold text-gray-900">
                                  Team Feedback & Activity
                              </CardTitle>
                          </div>
                      </CardHeader>
                      <CardContent className="p-6">
                          <div className="space-y-6">
                              {/* Managers Feedback */}
                              <div className="space-y-4">
                                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                      <Shield className="w-4 h-4" />
                                      Management Updates
                                  </h4>
                                  <div className="space-y-4">
                                      {selectedSubtask.assignedManagers?.filter(m => m.feedback || m.status !== 'pending').map((mgr, idx) => (
                                          <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                                                  <AvatarFallback className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold">
                                                      {(mgr.managerId?.firstName?.[0] || mgr.name?.[0] || 'M')}
                                                  </AvatarFallback>
                                              </Avatar>
                                              <div className="space-y-2 flex-1">
                                                  <div className="flex justify-between items-start">
                                                      <div>
                                                          <p className="font-bold text-gray-900">
                                                              {mgr.managerId?.firstName ? `${mgr.managerId.firstName} ${mgr.managerId.lastName}` : (mgr.name || mgr.email)}
                                                          </p>
                                                          <p className="text-xs text-gray-500">Manager</p>
                                                      </div>
                                                      <Badge className={`text-[10px] ${getStatusVariant(mgr.status)}`}>
                                                          {mgr.status}
                                                      </Badge>
                                                  </div>
                                                  {mgr.feedback ? (
                                                      <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm text-gray-800 italic leading-relaxed shadow-sm">
                                                          "{mgr.feedback}"
                                                      </div>
                                                  ) : (
                                                      <p className="text-xs text-gray-400 italic">No feedback provided yet</p>
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                      {(!selectedSubtask.assignedManagers || selectedSubtask.assignedManagers.length === 0) && (
                                          <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">No managers assigned</p>
                                      )}
                                  </div>
                              </div>

                              {/* Team Leads Feedback */}
                              <div className="space-y-4 pt-4 border-t border-gray-100">
                                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                      <Crown className="w-4 h-4" />
                                      Lead Reviews
                                  </h4>
                                  <div className="space-y-4">
                                      {/* Primary Task Owner/Creator */}
                                      <div className="flex gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                                          <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold">
                                                  {selectedSubtask.teamLeadId?.firstName?.[0] || 'TL'}
                                              </AvatarFallback>
                                          </Avatar>
                                          <div className="space-y-2 flex-1">
                                              <div className="flex justify-between items-start">
                                                  <div>
                                                      <p className="font-bold text-gray-900">
                                                          {selectedSubtask.teamLeadId?.firstName} {selectedSubtask.teamLeadId?.lastName}
                                                      </p>
                                                      <p className="text-xs text-gray-500">Primary Team Lead (Creator)</p>
                                                  </div>
                                                  <Badge className={`text-[10px] ${getStatusVariant(selectedSubtask.status)}`}>
                                                      {selectedSubtask.status}
                                                  </Badge>
                                              </div>
                                              {selectedSubtask.teamLeadFeedback ? (
                                                  <div className="bg-white p-3 rounded-lg border border-blue-100 text-sm text-gray-800 italic leading-relaxed shadow-sm">
                                                      "{selectedSubtask.teamLeadFeedback}"
                                                  </div>
                                              ) : (
                                                  <p className="text-xs text-blue-400 italic">Expecting creator's review...</p>
                                              )}
                                          </div>
                                      </div>

                                      {/* Other Assigned Team Leads */}
                                      {selectedSubtask.assignedTeamLeads?.map((tl, idx) => (
                                          <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                                                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold">
                                                      {tl.teamLeadId?.firstName?.[0] || tl.name?.[0] || 'L'}
                                                  </AvatarFallback>
                                              </Avatar>
                                              <div className="space-y-2 flex-1">
                                                  <div className="flex justify-between items-start">
                                                      <div>
                                                          <p className="font-bold text-gray-900">
                                                              {tl.teamLeadId?.firstName ? `${tl.teamLeadId.firstName} ${tl.teamLeadId.lastName}` : (tl.name || tl.email)}
                                                          </p>
                                                          <p className="text-xs text-gray-500">Collaborating Lead</p>
                                                      </div>
                                                      <Badge className={`text-[10px] ${getStatusVariant(tl.status)}`}>
                                                          {tl.status}
                                                      </Badge>
                                                  </div>
                                                  {tl.feedback ? (
                                                      <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm text-gray-800 italic leading-relaxed shadow-sm">
                                                          "{tl.feedback}"
                                                      </div>
                                                  ) : (
                                                      <p className="text-xs text-gray-400 italic">No feedback provided yet</p>
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              {/* Employees Feedback */}
                              <div className="space-y-4 pt-4 border-t border-gray-100">
                                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                      <UsersIcon className="w-4 h-4" />
                                      Employee Updates
                                  </h4>
                                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                      {selectedSubtask.assignedEmployees?.filter(e => e.feedback || e.status !== 'pending').map((emp, idx) => (
                                          <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-colors">
                                              <Avatar className="w-9 h-9 border-2 border-white shadow-sm shrink-0">
                                                  <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold">
                                                      {emp.employeeId?.firstName?.[0] || emp.name?.[0] || 'E'}
                                                  </AvatarFallback>
                                              </Avatar>
                                              <div className="space-y-2 flex-1">
                                                  <div className="flex justify-between items-start">
                                                      <div>
                                                          <p className="font-bold text-gray-900 text-sm">
                                                              {emp.employeeId?.firstName ? `${emp.employeeId.firstName} ${emp.employeeId.lastName}` : (emp.name || emp.email)}
                                                          </p>
                                                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                               <Mail className="w-2.5 h-2.5" /> {emp.email}
                                                          </p>
                                                      </div>
                                                      <Badge className={`text-[9px] px-1.5 py-0 ${getStatusVariant(emp.status)}`}>
                                                          {emp.status}
                                                      </Badge>
                                                  </div>
                                                  {emp.feedback ? (
                                                      <div className="bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100/50 text-xs text-gray-700 leading-relaxed italic">
                                                          "{emp.feedback}"
                                                      </div>
                                                  ) : (
                                                      <p className="text-[10px] text-gray-400 italic">Progress update only</p>
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                </div>

                {/* Right Column - Stakeholders */}
                <div className="space-y-8">
                  {/* All Assignees Categories */}
                  <Tabs defaultValue="employees" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
                          <TabsTrigger value="employees" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm">
                              Employees ({selectedSubtask.assignedEmployees?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="managers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm">
                              Managers ({selectedSubtask.assignedManagers?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="leads" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm">
                              Leads ({ (selectedSubtask.assignedTeamLeads?.length || 0) + 1 })
                          </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="employees">
                          <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden mt-4">
                              <CardContent className="p-4 space-y-3">
                                  {selectedSubtask.assignedEmployees?.map((emp, index) => {
                                      const employee = emp.employeeId || emp;
                                      return (
                                          <div key={index} className="flex items-center justify-between group hover:bg-gray-50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                              <div className="flex items-center gap-3">
                                                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                      <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">
                                                          {employee.firstName?.[0] || emp.name?.[0] || 'E'}
                                                      </AvatarFallback>
                                                  </Avatar>
                                                  <div className="min-w-0">
                                                      <div className="font-bold text-gray-900 text-sm truncate">
                                                          {employee.firstName ? `${employee.firstName} ${employee.lastName}` : (emp.name || emp.email)}
                                                      </div>
                                                      <div className="text-[10px] text-gray-600 truncate flex items-center gap-1">
                                                           <Mail className="w-2.5 h-2.5" /> {emp.email}
                                                      </div>
                                                  </div>
                                              </div>
                                              <Badge className={`text-[10px] px-2 py-0.5 ${getStatusVariant(emp.status)}`}>
                                                  {emp.status}
                                              </Badge>
                                          </div>
                                      );
                                  })}
                              </CardContent>
                          </Card>
                      </TabsContent>

                      <TabsContent value="managers">
                          <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden mt-4">
                              <CardContent className="p-4 space-y-3">
                                  {selectedSubtask.assignedManagers?.map((mgr, index) => (
                                      <div key={index} className="flex items-center justify-between group hover:bg-gray-50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                          <div className="flex items-center gap-3">
                                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                  <AvatarFallback className="bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold">
                                                      {mgr.managerId?.firstName?.[0] || mgr.name?.[0] || 'M'}
                                                  </AvatarFallback>
                                              </Avatar>
                                              <div className="min-w-0">
                                                  <div className="font-bold text-gray-900 text-sm truncate">
                                                      {mgr.managerId?.firstName ? `${mgr.managerId.firstName} ${mgr.managerId.lastName}` : (mgr.name || mgr.email)}
                                                  </div>
                                                  <div className="text-[10px] text-gray-600 truncate flex items-center gap-1">
                                                       <Mail className="w-2.5 h-2.5" /> {mgr.email}
                                                  </div>
                                              </div>
                                          </div>
                                          <Badge className={`text-[10px] px-2 py-0.5 ${getStatusVariant(mgr.status)}`}>
                                              {mgr.status}
                                          </Badge>
                                      </div>
                                  ))}
                              </CardContent>
                          </Card>
                      </TabsContent>

                      <TabsContent value="leads">
                          <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden mt-4">
                              <CardContent className="p-4 space-y-3">
                                  {/* Creator */}
                                  <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                      <div className="flex items-center gap-3">
                                          <div className="relative">
                                              <Avatar className="w-10 h-10 border-2 border-blue-300 shadow-sm">
                                                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold">
                                                      {selectedSubtask.teamLeadId?.firstName?.[0] || 'TL'}
                                                  </AvatarFallback>
                                              </Avatar>
                                              <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white">
                                                  <Crown className="w-3 h-3 text-white" />
                                              </div>
                                          </div>
                                          <div className="min-w-0">
                                              <div className="font-bold text-gray-900 text-sm truncate">
                                                  {selectedSubtask.teamLeadId?.firstName} {selectedSubtask.teamLeadId?.lastName}
                                              </div>
                                              <div className="text-[10px] text-blue-700 font-extrabold uppercase tracking-tight">Lead Creator</div>
                                          </div>
                                      </div>
                                      <Badge className={`text-[10px] ${getStatusVariant(selectedSubtask.status)}`}>
                                          {selectedSubtask.status}
                                      </Badge>
                                  </div>

                                  {/* Collaborators */}
                                  {selectedSubtask.assignedTeamLeads?.map((tl, index) => (
                                      <div key={index} className="flex items-center justify-between group hover:bg-gray-50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                          <div className="flex items-center gap-3">
                                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold">
                                                      {tl.teamLeadId?.firstName?.[0] || tl.name?.[0] || 'L'}
                                                  </AvatarFallback>
                                              </Avatar>
                                              <div className="min-w-0">
                                                  <div className="font-bold text-gray-900 text-sm truncate">
                                                      {tl.teamLeadId?.firstName ? `${tl.teamLeadId.firstName} ${tl.teamLeadId.lastName}` : (tl.name || tl.email)}
                                                  </div>
                                                  <div className="text-[10px] text-gray-600 truncate">Collaborating Lead</div>
                                              </div>
                                          </div>
                                          <Badge className={`text-[10px] px-2 py-0.5 ${getStatusVariant(tl.status)}`}>
                                              {tl.status}
                                          </Badge>
                                      </div>
                                  ))}
                              </CardContent>
                          </Card>
                      </TabsContent>
                  </Tabs>

                  {/* Resource Card */}
                 
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gray-50/50 px-8 py-4 flex justify-end">
              <Button
                  variant="outline"
                  onClick={closeModal}
                  className="px-8 font-bold text-gray-900 border-gray-300 hover:bg-white hover:text-blue-600 transition-all shadow-sm"
              >
                  Close Detailed View
              </Button>
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
