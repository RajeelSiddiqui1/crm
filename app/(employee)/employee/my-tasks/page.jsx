"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Eye,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Users,
  UserCog,
  CheckCircle,
  Clock4,
  AlertCircle,
  XCircle,
  Filter,
  MoreVertical,
  ChevronRight,
} from "lucide-react";

// Custom AvatarGroup Component
const AvatarGroup = ({ children, className, max = 3, ...props }) => {
  const avatars = React.Children.toArray(children);
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className="ring-2 ring-background rounded-full">
          {avatar}
        </div>
      ))}
      {remaining > 0 && (
        <Avatar className="ring-2 ring-background">
          <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
            +{remaining}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default function EmployeeTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");

  // Fetch tasks with axios
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get("/api/employee/assigned-subtasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Status configurations with updated colors for white background
  const statusConfig = {
    pending: {
      label: "Pending",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    in_progress: {
      label: "In Progress",
      color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      icon: <Clock4 className="h-3 w-3" />,
    },
    completed: {
      label: "Completed",
      color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    approved: {
      label: "Approved",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString;
  };

  // Get assigned users summary
  const getAssignmentSummary = (task) => {
    const employees = task.assignedEmployee || [];
    const managers = task.assignedManager || [];
    const teamLeads = task.assignedTeamLead || [];

    const counts = {
      employees: employees.length,
      managers: managers.length,
      teamLeads: teamLeads.length,
      total: employees.length + managers.length + teamLeads.length,
    };

    const preview = [];
    if (employees.length > 0) preview.push(`${employees.length} Emp`);
    if (managers.length > 0) preview.push(`${managers.length} Mgr`);
    if (teamLeads.length > 0) preview.push(`${teamLeads.length} TL`);

    return { counts, preview: preview.join(", ") };
  };

  // Get user initials for avatar
  const getUserInitials = (user) => {
    if (!user) return "?";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  // Get user display name
  const getUserName = (user) => {
    if (!user) return "Unknown";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";
  };

  // Filter tasks based on status and search
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (filterStatus !== "all" && task.status !== filterStatus) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.status.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Open assignment details dialog
  const handleViewAssignments = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };

  // Calculate completion percentage
  const getCompletionPercentage = (task) => {
    const assignedUsers = [
      ...(task.assignedEmployee || []),
      ...(task.assignedManager || []),
      ...(task.assignedTeamLead || []),
    ];

    if (assignedUsers.length === 0) return 0;

    const completedCount = assignedUsers.filter(
      (user) => user.status === "completed" || user.status === "approved"
    ).length;

    return Math.round((completedCount / assignedUsers.length) * 100);
  };

  // Create new task
  const handleCreateTask = () => {
    router.push("/employee/my-tasks/create");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Employee Tasks</h1>
          <p className="text-gray-600">Manage and track all assigned tasks</p>
        </div>
        <Button onClick={handleCreateTask} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" />
          Create New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter((t) => t.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock4 className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter((t) => t.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t) => t.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6 bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-gray-300"
              />
            </div>

            {/* <Select value={filterStatus} onValueChange={setFilterStatus} className="text-gray-700">
              <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-300">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={setViewMode} className="text-gray-700">
              <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-300">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-700">
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="grid">Grid View</SelectItem>
              </SelectContent>
            </Select> */}

            <Button variant="outline" onClick={fetchTasks} className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table/Grid */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2 mb-6 bg-gray-100 p-1">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-white text-gray-700 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            List View
          </TabsTrigger>
          <TabsTrigger 
            value="grid"
            className="data-[state=active]:bg-white text-gray-700 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            Grid View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="bg-white border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-gray-700 font-semibold">Task Details</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Timeline</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Assignments</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Progress</TableHead>
                  <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const summary = getAssignmentSummary(task);
                  const completionPercent = getCompletionPercentage(task);
                  const status = statusConfig[task.status];

                  return (
                    <TableRow key={task._id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {task.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Created by: {getUserName(task.submittedBy)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-700">
                              {formatDate(task.startDate)} - {formatDate(task.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-700">
                              {formatTime(task.startTime)} - {formatTime(task.endTime)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">{summary.preview}</div>
                          <TooltipProvider>
                            <AvatarGroup className="justify-start">
                              {task.assignedEmployee?.map((assigned, index) => (
                                <Tooltip key={index}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border border-white bg-blue-100 text-blue-700">
                                      <AvatarFallback className="text-xs">
                                        <User className="h-3 w-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white text-gray-900">
                                    Employee: {getUserName(assigned.employeeId)}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {task.assignedManager?.map((assigned, index) => (
                                <Tooltip key={index}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border border-white bg-green-100 text-green-700">
                                      <AvatarFallback className="text-xs">
                                        <UserCog className="h-3 w-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white text-gray-900">
                                    Manager: {getUserName(assigned.managerId)}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {task.assignedTeamLead?.map((assigned, index) => (
                                <Tooltip key={index}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border border-white bg-orange-100 text-orange-700">
                                      <AvatarFallback className="text-xs">
                                        <Users className="h-3 w-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white text-gray-900">
                                    Team Lead: {getUserName(assigned.teamLeadId)}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                          </TooltipProvider>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={`${status.color} border`} variant="outline">
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={completionPercent} className="h-2 bg-gray-200" />
                          <div className="text-sm text-gray-600">
                            {completionPercent}% Complete
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewAssignments(task)}
                                  className="h-8 w-8 p-0 border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-gray-900">
                                <p>View Assignments</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employee/my-tasks/detail/${task._id}`)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const summary = getAssignmentSummary(task);
              const completionPercent = getCompletionPercentage(task);
              const status = statusConfig[task.status];

              return (
                <Card key={task._id} className="hover:shadow-lg transition-shadow bg-white border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className={`${status.color} border`} variant="outline">
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                          <DropdownMenuItem 
                            onClick={() => handleViewAssignments(task)}
                            className="text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Assignments
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/employee/my-tasks/detail/${task._id}`)}
                            className="text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg mt-2 text-gray-900">{task.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-gray-600">
                      {task.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Assignments */}
                    <div>
                      <div className="text-sm font-medium mb-2 text-gray-700">Assignments: {summary.preview}</div>
                      <TooltipProvider>
                        <AvatarGroup max={4}>
                          {task.assignedEmployee?.map((assigned, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-white bg-blue-100 text-blue-700">
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-gray-900">
                                Employee: {getUserName(assigned.employeeId)}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {task.assignedManager?.map((assigned, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-white bg-green-100 text-green-700">
                                  <AvatarFallback>
                                    <UserCog className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-gray-900">
                                Manager: {getUserName(assigned.managerId)}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {task.assignedTeamLead?.map((assigned, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-white bg-orange-100 text-orange-700">
                                  <AvatarFallback>
                                    <Users className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-gray-900">
                                Team Lead: {getUserName(assigned.teamLeadId)}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </TooltipProvider>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {formatDate(task.startDate)} - {formatDate(task.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {formatTime(task.startTime)} - {formatTime(task.endTime)}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Progress</span>
                        <span className="text-gray-600">{completionPercent}%</span>
                      </div>
                      <Progress value={completionPercent} className="h-2 bg-gray-200" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => handleViewAssignments(task)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Assignments
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push(`/employee/my-tasks/detail/${task._id}`)}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* No tasks message */}
      {filteredTasks.length === 0 && (
        <Card className="text-center py-12 bg-white border border-gray-200">
          <CardContent>
            <div className="mx-auto max-w-md">
              <div className="rounded-full bg-gray-100 p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No tasks found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Create your first task to get started"}
              </p>
              <Button onClick={handleCreateTask} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                Create New Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-gray-900">Assignments for: {selectedTask.title}</DialogTitle>
                <DialogDescription className="text-gray-600">
                  View all assigned users and their status
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Employees Section */}
                {selectedTask.assignedEmployee?.length > 0 && (
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <User className="h-5 w-5" />
                        Employees ({selectedTask.assignedEmployee.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedTask.assignedEmployee.map((assigned, index) => (
                          <Card key={index} className="hover:shadow-md transition-shadow bg-white border border-gray-200">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="bg-blue-100 text-blue-700">
                                  <AvatarFallback>
                                    {getUserInitials(assigned.employeeId)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {getUserName(assigned.employeeId)}
                                  </div>
                                  <div className="text-xs text-gray-500">Employee</div>
                                </div>
                              </div>
                              <Badge
                                className={`w-full justify-center ${
                                  statusConfig[assigned.status]?.color || "bg-gray-100 text-gray-700"
                                } border`}
                                variant="outline"
                              >
                                {statusConfig[assigned.status]?.icon}
                                <span className="ml-1">
                                  {statusConfig[assigned.status]?.label || assigned.status}
                                </span>
                              </Badge>
                              {assigned.feedback && (
                                <div className="mt-3 text-sm">
                                  <div className="font-medium text-gray-900">Feedback:</div>
                                  <div className="text-gray-600 mt-1">{assigned.feedback}</div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Managers Section */}
                {selectedTask.assignedManager?.length > 0 && (
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="bg-green-50 border-b border-green-100">
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <UserCog className="h-5 w-5" />
                        Managers ({selectedTask.assignedManager.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedTask.assignedManager.map((assigned, index) => (
                          <Card key={index} className="hover:shadow-md transition-shadow bg-white border border-gray-200">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="bg-green-100 text-green-700">
                                  <AvatarFallback>
                                    {getUserInitials(assigned.managerId)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {getUserName(assigned.managerId)}
                                  </div>
                                  <div className="text-xs text-gray-500">Manager</div>
                                </div>
                              </div>
                              <Badge
                                className={`w-full justify-center ${
                                  statusConfig[assigned.status]?.color || "bg-gray-100 text-gray-700"
                                } border`}
                                variant="outline"
                              >
                                {statusConfig[assigned.status]?.icon}
                                <span className="ml-1">
                                  {statusConfig[assigned.status]?.label || assigned.status}
                                </span>
                              </Badge>
                              {assigned.feedback && (
                                <div className="mt-3 text-sm">
                                  <div className="font-medium text-gray-900">Feedback:</div>
                                  <div className="text-gray-600 mt-1">{assigned.feedback}</div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Team Leads Section */}
                {selectedTask.assignedTeamLead?.length > 0 && (
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="bg-orange-50 border-b border-orange-100">
                      <CardTitle className="flex items-center gap-2 text-orange-700">
                        <Users className="h-5 w-5" />
                        Team Leads ({selectedTask.assignedTeamLead.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedTask.assignedTeamLead.map((assigned, index) => (
                          <Card key={index} className="hover:shadow-md transition-shadow bg-white border border-gray-200">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="bg-orange-100 text-orange-700">
                                  <AvatarFallback>
                                    {getUserInitials(assigned.teamLeadId)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {getUserName(assigned.teamLeadId)}
                                  </div>
                                  <div className="text-xs text-gray-500">Team Lead</div>
                                </div>
                              </div>
                              <Badge
                                className={`w-full justify-center ${
                                  statusConfig[assigned.status]?.color || "bg-gray-100 text-gray-700"
                                } border`}
                                variant="outline"
                              >
                                {statusConfig[assigned.status]?.icon}
                                <span className="ml-1">
                                  {statusConfig[assigned.status]?.label || assigned.status}
                                </span>
                              </Badge>
                              {assigned.feedback && (
                                <div className="mt-3 text-sm">
                                  <div className="font-medium text-gray-900">Feedback:</div>
                                  <div className="text-gray-600 mt-1">{assigned.feedback}</div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleCloseDialog();
                    router.push(`/employee/my-tasks/detail/${selectedTask._id}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Full Details
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}