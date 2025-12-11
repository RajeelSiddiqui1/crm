"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
  ClipboardList, FileText, Share2, TrendingUp, Loader2, 
  CheckCircle, Clock, AlertCircle, Calendar, Mail, 
  Target, Award, Trophy, ArrowUpRight, ChevronRight, 
  Users, User, Building, Zap, BarChart3, Activity,
  Clock4, AlertTriangle, TrendingDown, RefreshCw,
  MoreVertical, Eye, ExternalLink, MessageSquare
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Employee") {
      router.push("/employee/login");
      return;
    }
    fetchStats();
  }, [session, status]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/employee/stats");
      if (res.data.success) {
        setStats(res.data.data);
        toast.success("Dashboard updated");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "approved":
      case "signed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
      case "overdue":
      case "late":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-700">Loading Employee Dashboard</h2>
            <p className="text-gray-500 text-sm">Fetching your work data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Employee") return null;

  const employee = stats?.employee || {};
  const totals = stats?.totals || {};
  const today = stats?.today || {};
  const performance = stats?.performance || {};
  const team = stats?.team || {};
  const recent = stats?.recent || {};

  // Main metrics cards
  const metricCards = [
    {
      title: "Total Tasks",
      value: totals.tasks?.total || 0,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
      change: "+5",
      description: "Assigned to you"
    },
    {
      title: "Completed Tasks",
      value: totals.tasks?.completed || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-green-500 to-green-600",
      change: "+3",
      description: "Successfully finished"
    },
    {
      title: "Forms Submitted",
      value: totals.forms?.total || 0,
      icon: <FileText className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600",
      change: "+2",
      description: "Completed forms"
    },
    {
      title: "Shared Tasks",
      value: totals.sharedTasks?.total || 0,
      icon: <Share2 className="w-5 h-5" />,
      color: "from-amber-500 to-amber-600",
      change: "+1",
      description: "Collaborative work"
    }
  ];

  // Performance indicators
  const performanceIndicators = [
    {
      title: "Task Completion",
      value: `${performance.taskCompletionRate || 0}%`,
      icon: <Target className="w-4 h-4" />,
      color: performance.taskCompletionRate >= 80 ? "text-green-500" : "text-amber-500"
    },
    {
      title: "Form Completion",
      value: `${performance.formCompletionRate || 0}%`,
      icon: <FileText className="w-4 h-4" />,
      color: performance.formCompletionRate >= 90 ? "text-green-500" : "text-amber-500"
    },
    {
      title: "Productivity",
      value: `${performance.productivityScore || 0}%`,
      icon: <Zap className="w-4 h-4" />,
      color: performance.productivityScore >= 85 ? "text-green-500" : "text-amber-500"
    },
    {
      title: "Avg Task Time",
      value: `${performance.avgTaskCompletionTime || 0}h`,
      icon: <Clock4 className="w-4 h-4" />,
      color: performance.avgTaskCompletionTime <= 24 ? "text-green-500" : "text-red-500"
    }
  ];

  // Today's activity
  const todayActivity = [
    {
      title: "Tasks Assigned",
      value: today.tasksAssigned || 0,
      icon: <ClipboardList className="w-4 h-4 text-blue-500" />
    },
    {
      title: "Tasks Completed",
      value: today.tasksCompleted || 0,
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      title: "Forms Submitted",
      value: today.formsSubmitted || 0,
      icon: <FileText className="w-4 h-4 text-purple-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-semibold">Employee Portal</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Welcome back, {employee.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-3 text-base">
                Track your tasks, forms, and performance metrics
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200">
                <Avatar className="w-12 h-12 border-2 border-white">
                  <AvatarImage src={employee.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    {employee.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Employee
                  </p>
                </div>
              </div>

              <Button 
                onClick={fetchStats}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {todayActivity.map((activity, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 text-sm">{activity.title}</div>
                  <div className="text-2xl font-bold text-gray-900">{activity.value}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  {activity.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <ArrowUpRight className="w-3 h-3 text-green-500" />
                <span>Today</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((card, idx) => (
            <Card key={idx} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                    {card.icon}
                  </div>
                  <Badge className="bg-gray-100 text-gray-700">
                    {card.change}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {card.value}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {card.title}
                </CardDescription>
                <p className="text-gray-500 text-sm mt-2">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance and Team Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Indicators */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="w-5 h-5 text-blue-500" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {performanceIndicators.map((indicator, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${indicator.color.replace('text', 'bg')}/20`}>
                        {indicator.icon}
                      </div>
                      <span className="text-gray-700">{indicator.title}</span>
                    </div>
                    <span className={`font-bold ${indicator.color}`}>
                      {indicator.value}
                    </span>
                  </div>
                  <Progress 
                    value={
                      indicator.title.includes("Time") 
                        ? Math.max(0, 100 - (parseFloat(indicator.value) * 4))
                        : parseFloat(indicator.value)
                    }
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  Recent Tasks
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600"
                  onClick={() => router.push('/employee/tasks')}
                >
                  View All
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recent.tasks?.length > 0 ? (
                <div className="space-y-4">
                  {recent.tasks.map((task, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => router.push(`/employee/tasks/${task._id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {task.teamLeadId?.firstName || "Team Lead"}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks assigned</p>
                  <p className="text-sm mt-1">You'll see tasks here when assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="w-5 h-5 text-blue-500" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Lead */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      {team.teamLead?.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {team.teamLead?.firstName || "Team Lead"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {team.teamLead?.email || "teamlead@example.com"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600"
                    onClick={() => router.push('/employee/contact-teamlead')}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Manager */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      {employee.manager?.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {employee.manager?.firstName || "Manager"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.manager?.email || "manager@example.com"}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Department */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {employee.department?.name || "Department"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {team.teamMembers || 0} team members
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Work Hours */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Work Schedule</div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-700">
                    {employee.startTime || "09:00 AM"} - {employee.endTime || "05:00 PM"}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Standard
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Forms and Shared Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Forms */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Recent Forms
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-900"
                  disabled
                >
                 By Manager
                 
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recent.forms?.length > 0 ? (
                <div className="space-y-4">
                  {recent.forms.map((form, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => router.push(`/employee/forms/${form._id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {form.formId?.title || "Form Submission"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(form.createdAt)}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(form.teamleadstatus)}>
                        {form.teamleadstatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No forms submitted</p>
                  <p className="text-sm mt-1">Submit forms to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shared Tasks */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Share2 className="w-5 h-5 text-blue-500" />
                  Shared Tasks
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600"
                  onClick={() => router.push('/employee/shared-tasks')}
                >
                  View All
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recent.sharedTasks?.length > 0 ? (
                <div className="space-y-4">
                  {recent.sharedTasks.map((task, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => router.push(`/employee/shared-tasks/${task._id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Share2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {task.taskTitle}
                          </div>
                          <div className="text-sm text-gray-500">
                            From: {task.sharedBy?.firstName || "Colleague"}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Share2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No shared tasks</p>
                  <p className="text-sm mt-1">Shared tasks will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
      

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <div className="text-gray-400">
              Employee ID: {employee.id?.slice(-8) || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}