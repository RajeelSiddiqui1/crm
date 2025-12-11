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
  Users, User, Building, FileText, ClipboardList, 
  Share2, TrendingUp, Loader2, CheckCircle, Clock, 
  AlertCircle, BarChart3, Calendar, Mail, Phone, 
  MapPin, Target, Award, Trophy, TrendingDown,
  ArrowUpRight, ArrowDownRight, Download, Filter,
  MoreVertical, Eye, Edit, RefreshCw, UserCheck,
  Activity, PieChart, LineChart, BarChart,
  Clock4, CheckSquare, AlertTriangle, XCircle,
  ChevronRight, ExternalLink, MessageSquare, AudioLines,
  Play, Pause, Volume2, Search, Building as BuildingIcon
} from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, 
  PointElement, LineElement, BarElement, Title, 
  Tooltip, Legend, ArcElement, RadialLinearScale } from "chart.js";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale);

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }
    fetchStats();
  }, [session, status]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setChartLoading(true);
      const res = await axios.get("/api/manager/stats");
      if (res.data.success) {
        setStats(res.data.data);
        setTimeout(() => setChartLoading(false), 300);
        toast.success("Dashboard updated successfully");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-200">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <BarChart3 className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">Loading Manager Dashboard</p>
            <p className="text-sm text-gray-600 mt-1">Preparing your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") return null;

  const managerInfo = stats?.manager || {};
  const totals = stats?.totals || {};
  const todayStats = stats?.today || {};
  const breakdown = stats?.breakdown || {};
  const performance = stats?.performance || {};
  const insights = stats?.insights || {};

  // Performance indicators with proper value handling
  const performanceIndicators = [
    {
      title: "Submission Efficiency",
      value: `${breakdown.submissions?.completionRate || 0}%`,
      target: 85,
      icon: <Activity className="w-4 h-4 text-gray-900" />,
      color: breakdown.submissions?.completionRate >= 85 ? "text-green-500" : "text-amber-500",
      type: "percentage"
    },
    {
      title: "Task Completion Rate",
      value: `${breakdown.subtasks?.completionRate || 0}%`,
      target: 90,
      icon: <CheckSquare className="w-4 h-4 text-gray-900" />,
      color: breakdown.subtasks?.completionRate >= 90 ? "text-green-500" : "text-amber-500",
      type: "percentage"
    },
    {
      title: "Avg Submission Time",
      value: `${performance.avgSubmissionCompletionTime || 0}h`,
      target: 24,
      icon: <Clock4 className="w-4 h-4 text-gray-900" />,
      color: (performance.avgSubmissionCompletionTime || 0) <= 24 ? "text-green-500" : "text-red-500",
      type: "time"
    },
    {
      title: "Pending Approvals",
      value: insights.pendingApprovals || 0,
      target: 5,
      icon: <AlertTriangle className="w-4 h-4 text-gray-900" />,
      color: (insights.pendingApprovals || 0) <= 5 ? "text-green-500" : "text-red-500",
      type: "number"
    }
  ];

  // Main metrics cards
  const metricCards = [
    {
      title: "Team Leads",
      value: totals.teamLeads || 0,
      icon: <Users className="w-5 h-5" />,
      color: "from-blue-500 to-indigo-600",
      description: "Direct reports",
      link: "/manager/teamleads"
    },
    {
      title: "Employees",
      value: totals.employees || 0,
      icon: <User className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600",
      description: "Team members",
      link: "/manager/employees"
    },
    {
      title: "Form Submissions",
      value: totals.formSubmissions || 0,
      icon: <FileText className="w-5 h-5" />,
      color: "from-emerald-500 to-emerald-600",
      description: "Total processed",
      link: "/manager/submissions"
    },
    {
      title: "Subtasks",
      value: totals.subtasks || 0,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "from-amber-500 to-amber-600",
      description: "Assigned tasks",
      link: "/manager/subtasks"
    },
    {
      title: "Admin Tasks",
      value: totals.adminTasks || 0,
      icon: <Target className="w-5 h-5" />,
      color: "from-rose-500 to-rose-600",
      description: "Pending approvals",
      link: "/manager/admin-tasks"
    },
   
  ];

  // Get manager initials
  const getManagerInitials = (manager) => {
    if (!manager) return "M";
    if (manager.firstName && manager.lastName) {
      return `${manager.firstName.charAt(0)}${manager.lastName.charAt(0)}`.toUpperCase();
    } else if (manager.firstName) {
      return manager.firstName.charAt(0).toUpperCase();
    } else if (manager.email) {
      return manager.email.charAt(0).toUpperCase();
    }
    return "M";
  };

  // Get manager display name
  const getManagerName = (manager) => {
    if (!manager) return "Manager";
    if (manager.firstName && manager.lastName) {
      return `${manager.firstName} ${manager.lastName}`;
    } else if (manager.firstName) {
      return manager.firstName;
    } else if (manager.email) {
      return manager.email;
    }
    return "Manager";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Dashboard</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-semibold">Manager Portal</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                Welcome back, {managerInfo.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
                Overview of your team's performance, tasks, and analytics
              </p>
            </div>

            {/* Manager Info */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                      <AvatarImage src={managerInfo.profilePic} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                        {getManagerInitials(managerInfo)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {managerInfo.name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Manager
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={fetchStats}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg border-0 h-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm">Today's Submissions</div>
                <div className="text-2xl font-bold text-gray-900">{todayStats.submissions || 0}</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              <span>Updated recently</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm">Active Tasks</div>
                <div className="text-2xl font-bold text-gray-900">{breakdown.subtasks?.inProgress || 0}</div>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span>Requires attention</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm">Pending Approvals</div>
                <div className="text-2xl font-bold text-gray-900">{insights.pendingApprovals || 0}</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 text-red-500" />
              <span>Awaiting review</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm">Team Activity</div>
                <div className="text-2xl font-bold text-gray-900">{todayStats.subtasks || 0}</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>High engagement</span>
            </div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metricCards.map((card, idx) => (
            <Card 
              key={idx} 
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-md`}>
                    {card.icon}
                  </div>
                  <Badge className="bg-gray-100 text-gray-700">
                    {formatNumber(card.value)}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {card.description}
                </CardDescription>
                <CardFooter className="px-0 pb-0 pt-4 mt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => router.push(card.link)}
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Performance Overview</CardTitle>
                  <CardDescription className="text-gray-600">Monthly submission trends</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-300 text-gray-700"
                  onClick={() => setTimeRange(timeRange === 'month' ? 'week' : 'month')}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {timeRange === 'month' ? 'Monthly' : 'Weekly'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">Loading chart data...</p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <Line
                    data={{
                      labels: stats?.charts?.monthlySubmissions?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      datasets: [
                        {
                          label: "Form Submissions",
                          data: stats?.charts?.monthlySubmissions?.counts || [12, 19, 8, 15, 22, 18],
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4,
                          fill: true
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0,0,0,0.05)'
                          },
                          ticks: {
                            color: '#6b7280'
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(0,0,0,0.05)'
                          },
                          ticks: {
                            color: '#6b7280'
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Indicators */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Performance Indicators
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
                      <span className="text-gray-700 font-medium">{indicator.title}</span>
                    </div>
                    <span className={`font-bold ${indicator.color}`}>{indicator.value}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Target: {indicator.target}{indicator.type === "time" ? 'h' : indicator.type === "percentage" ? '%' : ''}
                    </span>
                    <span className={`${indicator.color} flex items-center gap-1 font-medium`}>
                      {indicator.type === "time" ? (
                        parseFloat(indicator.value) <= indicator.target ? '✓ On Target' : '✗ Needs Improvement'
                      ) : indicator.type === "percentage" ? (
                        parseFloat(indicator.value) >= indicator.target ? '✓ On Target' : '✗ Needs Improvement'
                      ) : (
                        parseFloat(indicator.value) <= indicator.target ? '✓ On Target' : '✗ Needs Improvement'
                      )}
                    </span>
                  </div>
                  <Progress 
                    value={
                      indicator.type === "time" 
                        ? Math.min(100, (parseFloat(indicator.value) / indicator.target) * 100)
                        : indicator.type === "percentage"
                        ? parseFloat(indicator.value)
                        : Math.min(100, (parseFloat(indicator.value) / indicator.target) * 100)
                    } 
                    className="h-2" 
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Form Submissions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">Recent Form Submissions</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => router.push('/manager/submissions')}
                >
                  View All
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {stats?.recent?.formSubmissions?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent.formSubmissions.slice(0, 5).map((submission, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer group"
                      onClick={() => router.push(`/manager/submissions/${submission._id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">
                            {submission.formId?.title || 'Untitled Form'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(submission.createdAt)}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          submission.status === "completed" ? "default" : 
                          submission.status === "in_progress" ? "secondary" : "outline"
                        }
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                      >
                        {submission.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent submissions</p>
                  <p className="text-sm mt-1">Submit your first form to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Team Leads */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Team Leads
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-amber-600 hover:text-amber-700"
                  onClick={() => router.push('/manager/teamleads')}
                >
                  View All
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {insights.topPerformingTeamLeads?.length > 0 ? (
                <div className="space-y-4">
                  {insights.topPerformingTeamLeads.slice(0, 5).map((lead, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-white">
                          <AvatarFallback className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold">
                            {getManagerInitials(lead)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">
                            {lead.firstName} {lead.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </div>
                      
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No team lead data available</p>
                  <p className="text-sm mt-1">Add team leads to track performance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600">
              Quickly access frequently used features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => router.push('/manager/managerforms')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-auto py-4"
              >
                <FileText className="w-5 h-5 mr-2" />
                Create New Form
              </Button>
              
              <Button 
                onClick={() => router.push('/manager/submissions')}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 h-auto py-4"
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                Submit Form
              </Button>
              
                
              <Button 
                onClick={() => router.push('/manager/employees')}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 h-auto py-4"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Add Employee
              </Button>

              <Button 
                onClick={() => router.push('/manager/teamleads')}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 h-auto py-4"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Add Team Lead
              </Button>
           
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>All systems operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span>Real-time updates</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-gray-400">
                Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}