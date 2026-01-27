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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Calendar,
  Clock,
  FileText,
  User,
  Users,
  Play,
  Building,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ThumbsUp,
  Ban,
  Loader2,
  BarChart3,
  Shield,
  Target,
  ClipboardList,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function AdminEmployeeTasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
    } else {
      fetchTasks();
    }
  }, [session, status]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/employee-task");
      setTasks(response.data || []);
      calculateStats(response.data || []);
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
      toast.error("Failed to fetch employee tasks");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (taskList) => {
    const stats = {
      total: taskList.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      approved: 0,
      rejected: 0,
    };

    taskList.forEach(task => {
      if (task.status) {
        stats[task.status] = (stats[task.status] || 0) + 1;
      }
    });

    setStats(stats);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "in_progress":
        return <PlayCircle className="w-3 h-3" />;
      case "completed":
        return <CheckCircle2 className="w-3 h-3" />;
      case "approved":
        return <ThumbsUp className="w-3 h-3" />;
      case "rejected":
        return <Ban className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
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

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.submittedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.submittedBy?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getAssignedCount = (task) => {
    const teamLeads = task.assignedTeamLead?.length || 0;
    const managers = task.assignedManager?.length || 0;
    const employees = task.assignedEmployee?.length || 0;
    return teamLeads + managers + employees;
  };

  const getAssignedBadgeColor = (count) => {
    if (count === 0) return "bg-gray-100 text-gray-600";
    if (count <= 2) return "bg-blue-100 text-blue-600";
    if (count <= 5) return "bg-purple-100 text-purple-600";
    return "bg-emerald-100 text-emerald-600";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Employee Task Management</h1>
              </div>
              <p className="text-gray-600">Monitor and manage all employee-submitted tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    {session?.user?.name?.[0] || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{session?.user?.name || "Admin"}</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
              </div>
              <Button
                onClick={fetchTasks}
                variant="outline"
                className="border-gray-300 text-gray-900"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 text-gray-900 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-2">{stats.pending}</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <h3 className="text-2xl font-bold text-blue-600 mt-2">{stats.in_progress}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-2">{stats.completed}</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.approved}</h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <h3 className="text-2xl font-bold text-red-600 mt-2">{stats.rejected}</h3>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <Ban className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">All Employee Tasks</CardTitle>
                <CardDescription className="text-gray-600">
                  Overview of all tasks submitted by employees
                </CardDescription>
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks, employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-300">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span>Status: {filterStatus === "all" ? "All" : filterStatus}</span>
                    </div>
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
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-900">Task Details</TableHead>
                    <TableHead className="font-semibold text-gray-900">Submitted By</TableHead>
                    <TableHead className="font-semibold text-gray-900">Assigned To</TableHead>
                    <TableHead className="font-semibold text-gray-900">Timeline</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Attachments</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12">
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                          <span className="text-gray-600">Loading employee tasks...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ClipboardList className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                          <p className="text-gray-500 max-w-md">
                            {searchQuery || filterStatus !== "all" 
                              ? "Try adjusting your search or filters"
                              : "No employee tasks have been submitted yet"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow key={task._id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <ClipboardList className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer" 
                                    onClick={() => router.push(`/admin/employee-task/${task._id}`)}>
                                  {task.title}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{task.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                  <Calendar className="w-3 h-3" />
                                  <span>Created: {formatDate(task.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {task.submittedBy ? (
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                                  {task.submittedBy.name?.[0] || "E"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{task.submittedBy.name}</p>
                                <p className="text-sm text-gray-500">{task.submittedBy.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Unknown</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-2">
                            <Badge className={`${getAssignedBadgeColor(getAssignedCount(task))} font-medium`}>
                              <Users className="w-3 h-3 mr-1" />
                              {getAssignedCount(task)} Assigned
                            </Badge>
                            <div className="flex -space-x-2">
                              {/* Team Leads */}
                              {task.assignedTeamLead?.slice(0, 3).map((tl, idx) => (
                                <Avatar key={idx} className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                                    {tl.name?.[0] || "T"}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              
                              {/* Managers */}
                              {task.assignedManager?.slice(0, 3).map((mgr, idx) => (
                                <Avatar key={idx} className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-xs bg-purple-100 text-purple-800">
                                    {mgr.name?.[0] || "M"}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              
                              {/* Employees */}
                              {task.assignedEmployee?.slice(0, 3).map((emp, idx) => (
                                <Avatar key={idx} className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                                    {emp.name?.[0] || "E"}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              
                              {getAssignedCount(task) > 6 && (
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                                    +{getAssignedCount(task) - 6}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {task.startDate && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Start: {formatDate(task.startDate)}</span>
                              </div>
                            )}
                            {task.endDate && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">End: {formatDate(task.endDate)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={`${getStatusColor(task.status)} flex items-center gap-1.5 px-3 py-1.5`}>
                            {getStatusIcon(task.status)}
                            <span className="capitalize">{task.status?.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          {task.fileAttachments?.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <FileText className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{task.fileAttachments.length}</span>
                                <p className="text-xs text-gray-500">files</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No files</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/employee-task/${task._id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 border-gray-300 hover:bg-gray-50 cursor-pointer text-gray-600"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                       
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
          
          </CardContent>
        </Card>
      </div>
    </div>
  );
}