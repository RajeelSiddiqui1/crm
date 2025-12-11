"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { 
  Users, FileText, ClipboardList, Share2, Loader2, 
  CheckCircle, Clock, AlertCircle, Mail, Target, 
  Award, ChevronRight, ExternalLink, MessageSquare,
  Building, User, Activity, TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function TeamLeadDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamlead/login");
      return;
    }
    fetchStats();
  }, [session, status]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/teamlead/stats");
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
        day: "numeric"
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "approved":
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-700">Loading Team Lead Dashboard</h2>
            <p className="text-gray-500 text-sm">Fetching your team data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") return null;

  const teamLead = stats?.teamLead || {};
  const totals = stats?.totals || {};
  const today = stats?.today || {};
  const breakdown = stats?.breakdown || {};
  const performance = stats?.performance || {};
  const team = stats?.team || {};
  const recent = stats?.recent || {};

  // Main metrics cards
  const metricCards = [
    {
      title: "Team Members",
      value: totals.employees || 0,
      icon: <Users className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
      description: "Employees in team",
      link: "/teamlead/employees"
    },
    {
      title: "Active Tasks",
      value: totals.subtasks || 0,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "from-green-500 to-green-600",
      description: "Assigned subtasks",
      link: "/teamlead/tasks"
    },
    {
      title: "Employee Forms",
      value: totals.employeeFormSubmissions || 0,
      icon: <FileText className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600",
      description: "Submitted forms",
      link: "/teamlead/forms"
    },
    {
      title: "Completion Rate",
      value: `${performance.completionRate || 0}%`,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-amber-500 to-amber-600",
      description: "Task completion",
      link: "/teamlead/performance"
    }
  ];

  // Today's activity
  const todayActivity = [
    {
      title: "New Tasks",
      value: today.subtasksCreated || 0,
      icon: <ClipboardList className="w-4 h-4 text-blue-500" />
    },
    {
      title: "Completed Tasks",
      value: today.subtasksCompleted || 0,
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      title: "Team Forms",
      value: today.employeeForms || 0,
      icon: <FileText className="w-4 h-4 text-purple-500" />
    },
    {
      title: "Pending Review",
      value: breakdown.employeeForms?.pending || 0,
      icon: <AlertCircle className="w-4 h-4 text-amber-500" />
    }
  ];

  // Performance indicators
  const performanceIndicators = [
    {
      title: "Task Efficiency",
      value: `${performance.efficiency || 0}%`,
      icon: <Activity className="w-4 h-4" />,
      color: performance.efficiency >= 80 ? "text-green-500" : "text-amber-500"
    },
    {
      title: "Form Completion",
      value: `${performance.formCompletionRate || 0}%`,
      icon: <FileText className="w-4 h-4" />,
      color: performance.formCompletionRate >= 90 ? "text-green-500" : "text-amber-500"
    },
    {
      title: "Avg Task Time",
      value: `${performance.avgSubtaskCompletionTime || 0}h`,
      icon: <Clock className="w-4 h-4" />,
      color: performance.avgSubtaskCompletionTime <= 24 ? "text-green-500" : "text-red-500"
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
              <span className="text-gray-900 font-semibold">Team Lead Portal</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Welcome, {teamLead.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-3 text-base">
                Team management and performance overview
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-white/80 p-4 rounded-xl shadow-sm border border-gray-200">
                <Avatar className="w-12 h-12 border-2 border-white">
                  <AvatarImage src={teamLead.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    {teamLead.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{teamLead.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Team Lead
                  </p>
                </div>
              </div>

              <Button 
                onClick={fetchStats}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm"
              >
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {todayActivity.map((activity, idx) => (
            <div key={idx} className="bg-white/80 border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 text-sm">{activity.title}</div>
                  <div className="text-2xl font-bold text-gray-900">{activity.value}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  {activity.icon}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Today's activity
              </div>
            </div>
          ))}
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((card, idx) => (
            <Card key={idx} className="border-0 shadow-sm bg-white/80">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                    {card.icon}
                  </div>
                  <Badge className="bg-gray-100 text-gray-700">
                    View
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {card.value}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {card.title}
                </CardDescription>
                <p className="text-gray-500 text-sm mt-2">{card.description}</p>
                <CardFooter className="px-0 pb-0 pt-4 mt-4">
                
                </CardFooter>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance and Team Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Indicators */}
          <Card className="border-0 shadow-sm bg-white/80">
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

         
          {/* Team Information */}
          <Card className="border-0 shadow-sm bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="w-5 h-5 text-blue-500" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Manager */}
              {team.manager && (
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      {team.manager.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {team.manager.firstName} {team.manager.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {team.manager.email}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Department */}
              {team.department && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {team.department.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {totals.employees || 0} team members
                    </div>
                  </div>
                </div>
              )}

              {/* Top Performers */}
              {team.topPerformers?.length > 0 && (
                <div className="space-y-3">
                  {team.topPerformers.slice(0, 3).map((employee, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
                            {employee.firstName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName}{" "}
                            {employee.lastName}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {employee.completionRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Team Forms */}
        {/* <Card className="border-0 shadow-sm bg-white/80 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="w-5 h-5 text-blue-500" />
                Recent Team Forms
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-blue-600"
                onClick={() => router.push('/teamlead/tasks')}
              >
                View All
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recent.employeeForms?.length > 0 ? (
              <div className="space-y-4">
                {recent.employeeForms.map((form, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => router.push(`/teamlead/tasks/${form._id}`)}
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
                          {form.employeeId?.firstName} {form.employeeId?.lastName}
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
                <p>No recent forms</p>
              </div>
            )}
          </CardContent>
        </Card> */}

        

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
              Team Lead ID: {teamLead.id?.slice(-8) || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}