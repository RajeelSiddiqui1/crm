"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  Calendar,
  Target,
  BarChart3,
  Mail,
  Phone,
  Building,
  User,
  Eye,
  X,
  TrendingUp,
  Award
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmployeeHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [performance, setPerformance] = useState({});
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Employee") {
      router.push("/login");
      return;
    }

    fetchEmployeeData();
  }, [session, status, router]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockTasks = [
        {
          id: 1,
          title: "Login Page Development",
          description: "Create responsive login page with authentication",
          status: "completed",
          priority: "high",
          dueDate: "2024-12-20",
          progress: 100
        },
        {
          id: 2,
          title: "API Integration",
          description: "Integrate user authentication API endpoints",
          status: "in-progress",
          priority: "medium",
          dueDate: "2024-12-25",
          progress: 75
        },
        {
          id: 3,
          title: "Database Optimization",
          description: "Optimize user queries and database performance",
          status: "pending",
          priority: "low",
          dueDate: "2024-12-30",
          progress: 0
        }
      ];

      const mockPerformance = {
        completionRate: 85,
        onTimeDelivery: 92,
        qualityScore: 88,
        currentStreak: 12
      };

      setTasks(mockTasks);
      setPerformance(mockPerformance);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load your data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Employee") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-100 p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-600 to-blue-700 rounded-2xl shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
                  Welcome back, {session.user.firstName}!
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Here's your work overview and current tasks
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white shadow-lg shadow-green-500/25"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white to-green-50 border-0 shadow-lg shadow-green-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{performance.completionRate}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg shadow-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{performance.onTimeDelivery}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-purple-50 border-0 shadow-lg shadow-purple-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{performance.qualityScore}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-orange-50 border-0 shadow-lg shadow-orange-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{performance.currentStreak} days</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Tasks */}
          <Card className="border-0 shadow-xl shadow-green-500/10 bg-gradient-to-br from-white to-green-50/50">
            <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">My Tasks</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your current assignments and progress
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {tasks.filter(t => t.status === 'in-progress').length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">{task.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                        <Target className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Overview */}
          <div className="space-y-8">
            <Card className="border-0 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-white to-blue-50/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Task Completion</span>
                    <span className="font-medium text-gray-900">{performance.completionRate}%</span>
                  </div>
                  <Progress value={performance.completionRate} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">On-time Delivery</span>
                    <span className="font-medium text-gray-900">{performance.onTimeDelivery}%</span>
                  </div>
                  <Progress value={performance.onTimeDelivery} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quality Score</span>
                    <span className="font-medium text-gray-900">{performance.qualityScore}%</span>
                  </div>
                  <Progress value={performance.qualityScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-purple-500/10 bg-gradient-to-br from-white to-purple-50/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-gray-700">Current Streak</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {performance.currentStreak} days
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-gray-700">Tasks Completed</span>
                    <Badge className="bg-green-100 text-green-800">
                      {tasks.filter(t => t.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-gray-700">In Progress</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {tasks.filter(t => t.status === 'in-progress').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white to-green-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
              My Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Profile Header */}
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-lg">
              <Avatar className="w-24 h-24 border-4 border-white shadow-2xl mx-auto mb-4">
                <AvatarImage src={session.user.profilePic} />
                <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-2xl font-bold">
                  {session.user.firstName?.[0]}{session.user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {session.user.firstName} {session.user.lastName}
              </h2>
              <p className="text-gray-600 mb-3">Employee</p>
              <Badge className="bg-green-100 text-green-800 px-3 py-1.5">
                <User className="w-4 h-4 mr-1" />
                {session.user.userId}
              </Badge>
            </div>

            {/* Details */}
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{session.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium text-gray-900">Engineering</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium text-gray-900">January 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}