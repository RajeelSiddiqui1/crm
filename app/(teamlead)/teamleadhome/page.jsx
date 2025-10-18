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
import { 
  Users, 
  Target, 
  CheckCircle, 
  Clock, 
  Calendar,
  Mail,
  Phone,
  Building,
  MapPin,
  User,
  X,
  Eye,
  BarChart3,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TeamLeadHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "TeamLead") {
      router.push("/login");
      return;
    }

    fetchTeamData();
  }, [session, status, router]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockTeamMembers = [
        {
          _id: "1",
          userId: "EMP001",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@company.com",
          profilePic: "",
          position: "Software Developer",
          phone: "+1 234 567 8900",
          joinDate: "2024-01-15",
          status: "active",
          tasksCompleted: 45,
          currentProjects: 3
        },
        {
          _id: "2",
          userId: "EMP002",
          firstName: "Sarah",
          lastName: "Wilson",
          email: "sarah.wilson@company.com",
          profilePic: "",
          position: "UI/UX Designer",
          phone: "+1 234 567 8901",
          joinDate: "2024-02-20",
          status: "active",
          tasksCompleted: 38,
          currentProjects: 2
        },
        {
          _id: "3",
          userId: "EMP003",
          firstName: "Mike",
          lastName: "Johnson",
          email: "mike.johnson@company.com",
          profilePic: "",
          position: "QA Engineer",
          phone: "+1 234 567 8902",
          joinDate: "2024-03-10",
          status: "active",
          tasksCompleted: 52,
          currentProjects: 4
        }
      ];

      const mockTasks = [
        { id: 1, title: "Login Page Redesign", status: "completed", priority: "high", dueDate: "2024-12-20" },
        { id: 2, title: "API Integration", status: "in-progress", priority: "medium", dueDate: "2024-12-25" },
        { id: 3, title: "Database Optimization", status: "pending", priority: "low", dueDate: "2024-12-30" }
      ];

      setTeamMembers(mockTeamMembers);
      setTasks(mockTasks);
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const openMemberModal = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                Welcome, {session.user.firstName}!
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                Team Lead Dashboard - Manage your team efficiently
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg shadow-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{teamMembers.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 border-0 shadow-lg shadow-green-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {tasks.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-orange-50 border-0 shadow-lg shadow-orange-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Members Section */}
          <Card className="border-0 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Team Members</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your direct reports and team members
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  {teamMembers.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group"
                    onClick={() => openMemberModal(member)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="border-2 border-white shadow-lg group-hover:shadow-xl group-hover:border-blue-200 transition-all duration-300">
                        <AvatarImage src={member.profilePic} alt={`${member.firstName} ${member.lastName}`} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {member.firstName} {member.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{member.position}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            {member.userId}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tasks Overview */}
          <Card className="border-0 shadow-xl shadow-purple-500/10 bg-gradient-to-br from-white to-purple-50/50">
            <CardHeader className="bg-gradient-to-r from-white to-purple-50 border-b border-purple-100">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Team Tasks</CardTitle>
                <CardDescription className="text-gray-600">
                  Current tasks and their status
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 flex-1">{task.title}</h4>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Member Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              Team Member Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6 mt-4">
              {/* Header Section */}
              <div className="flex items-center gap-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-lg">
                <Avatar className="w-20 h-20 border-4 border-white shadow-2xl">
                  <AvatarImage src={selectedMember.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold">
                    {selectedMember.firstName?.[0]}{selectedMember.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h2>
                  <p className="text-xl text-gray-600 mb-3">{selectedMember.position}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1.5">
                      <User className="w-4 h-4 mr-1" />
                      {selectedMember.userId}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 px-3 py-1.5">
                      Active Member
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedMember.phone}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Information */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="w-5 h-5 text-green-600" />
                      Work Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Joined: {new Date(selectedMember.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Tasks Completed: {selectedMember.tasksCompleted}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Current Projects: {selectedMember.currentProjects}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-700">{selectedMember.tasksCompleted}</div>
                      <div className="text-sm text-blue-600">Tasks Done</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-700">{selectedMember.currentProjects}</div>
                      <div className="text-sm text-green-600">Active Projects</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <div className="text-2xl font-bold text-orange-700">94%</div>
                      <div className="text-sm text-orange-600">Success Rate</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-700">A+</div>
                      <div className="text-sm text-purple-600">Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}