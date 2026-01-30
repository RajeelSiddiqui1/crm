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
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  XCircle,
  ThumbsUp,
  Eye,
  ArrowUpDown,
  Download,
  BarChart3,
  Plus,
  RefreshCw,
  Loader2,
  ClipboardList,
  TrendingUp,
  Target,
  User,
  Building,
  Shield,
  Crown,
} from "lucide-react";

export default function AdminSubtasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
    } else {
      fetchSubtasks();
    }
  }, [session, status, pagination.page, statusFilter, priorityFilter]);

  const fetchSubtasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter })
      }).toString();

      const response = await axios.get(`/api/admin/subtask?${params}`);
      setSubtasks(response.data.subtasks);
      setPagination(response.data.pagination);
      setStatusCounts(response.data.statusCounts || {});
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      toast.error("Failed to fetch subtasks");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-amber-400 to-orange-500 text-white";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "completed":
        return "bg-gradient-to-r from-emerald-400 to-green-500 text-white";
      case "approved":
        return "bg-gradient-to-r from-green-500 to-teal-500 text-white";
      case "rejected":
        return "bg-gradient-to-r from-rose-500 to-pink-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <PlayCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "approved":
        return <ThumbsUp className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-gradient-to-r from-rose-500 to-pink-600 text-white";
      case "medium":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      case "low":
        return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTotalAssignments = (subtask) => {
    return (subtask.assignedEmployees?.length || 0) + 
           (subtask.assignedManagers?.length || 0) + 
           (subtask.assignedTeamLeads?.length || 0);
  };

  const getTotalFeedbacks = (subtask) => {
    let count = 0;
    
    subtask.assignedEmployees?.forEach(emp => {
      count += emp.feedbacks?.length || 0;
    });
    
    subtask.assignedManagers?.forEach(mgr => {
      count += mgr.feedbacks?.length || 0;
    });
    
    subtask.assignedTeamLeads?.forEach(tl => {
      count += tl.feedbacks?.length || 0;
    });
    
    return count;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading Subtasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-1">Admin Subtasks Dashboard</h1>
                  <p className="text-white/80">View and manage all subtasks in the system</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={fetchSubtasks}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Administrator</p>
                  <p className="text-sm text-white/80">System Overview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Total Subtasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{pagination.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statusCounts.find(s => s._id === 'in_progress')?.count || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statusCounts.find(s => s._id === 'pending')?.count || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statusCounts.find(s => s._id === 'completed')?.count || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
       
        {/* Subtasks Table */}
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  All Subtasks
                </div>
              </CardTitle>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1.5">
                {pagination.total} Subtasks
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-900">Title</TableHead>
                  <TableHead className="font-bold text-gray-900">Status</TableHead>
                  <TableHead className="font-bold text-gray-900">Priority</TableHead>
                  <TableHead className="font-bold text-gray-900">Assignments</TableHead>
                  <TableHead className="font-bold text-gray-900">Created</TableHead>
                  <TableHead className="font-bold text-gray-900">Deadline</TableHead>
                  <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subtasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ClipboardList className="w-16 h-16 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">No Subtasks Found</h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-8">
                        No subtasks match your current filters. Try adjusting your search criteria.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  subtasks.map((subtask) => (
                    <TableRow key={subtask._id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-gray-900 truncate max-w-xs">{subtask.title}</p>
                          {subtask.depId?.name && (
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{subtask.depId.name}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(subtask.status)} flex items-center gap-2 px-3 py-1.5`}>
                          {getStatusIcon(subtask.status)}
                          <span className="capitalize">{subtask.status?.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(subtask.priority)} px-3 py-1.5`}>
                          <span className="capitalize">{subtask.priority}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-blue-500" />
                            <span className="text-sm font-medium text-gray-600">{subtask.assignedEmployees?.length || 0} Employees</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3 text-purple-500" />
                            <span className="text-sm font-medium text-gray-600">{subtask.assignedManagers?.length || 0} Managers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            <span className="text-sm font-medium text-gray-600">{subtask.assignedTeamLeads?.length || 0} Team Leads</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{formatDate(subtask.createdAt)}</p>
                          {subtask.teamLeadId && (
                            <p className="text-sm text-gray-600">By: {subtask.teamLeadId?.firstName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {subtask.endDate ? (
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{formatDate(subtask.endDate)}</p>
                            {subtask.endTime && (
                              <p className="text-sm text-gray-600">{subtask.endTime}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No deadline</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => router.push(`/admin/subtask/${subtask._id}`)}
                          variant="outline"
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
  className={`bg-gray-900 text-white hover:bg-gray-800 ${
    pagination.page === 1 ? "pointer-events-none opacity-50" : ""
  }`}
/>

                </PaginationItem>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <PaginationLink
  isActive={pagination.page === pageNum}
  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
  className={`bg-gray-900 text-white hover:bg-gray-800 ${
    pagination.page === pageNum ? "ring-2 ring-white" : ""
  }`}
>
  {pageNum}
</PaginationLink>

                  );
                })}
                
                <PaginationItem>
                 <PaginationPrevious
  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
  className={`bg-gray-900 text-white hover:bg-gray-800 ${
    pagination.page === 1 ? "pointer-events-none opacity-50" : ""
  }`}
/>

                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}