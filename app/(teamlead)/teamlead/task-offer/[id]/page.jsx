"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Users,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  Shield,
  Award,
  AlertCircle,
  Trophy,
  Target,
  BarChart
} from "lucide-react";
import axios from "axios";

export default function TaskOfferDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }
    fetchTask();
  }, [session, status, router, params.id]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`/api/teamlead/task-offer/${params.id}`);
      if (response.status === 200) {
        setTask(response.data.task);
        setCanClaim(response.data.canClaim);
      }
    } catch (error) {
      toast.error("Failed to load task");
      router.push("/teamlead/task-offer");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      const response = await axios.put(`/api/teamlead/task-offer/${params.id}`);
      if (response.status === 200) {
        toast.success("Task claimed successfully!");
        router.push(`/teamlead/submissions/${params.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to claim task");
    }
  };

  const getManagerFullName = (manager) => {
    if (!manager) return "Unknown Manager";
    const firstName = manager.firstName || "";
    const lastName = manager.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Manager";
  };

  const getTeamLeadFullName = (teamLead) => {
    if (!teamLead) return "Unknown Team Lead";
    const firstName = teamLead.firstName || "";
    const lastName = teamLead.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Team Lead";
  };

  const getInitials = (person) => {
    if (!person) return "??";
    const firstName = person.firstName || "";
    const lastName = person.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-green-600" />
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl shadow-red-500/10 border border-gray-100">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900 mt-4">Task Not Found</h2>
            <p className="text-gray-600 mt-2">The task you're looking for doesn't exist</p>
            <Button 
              onClick={() => router.push("/teamlead/task-offer")}
              className="mt-6 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg shadow-green-500/25"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Available Tasks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 text-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/teamlead/task-offer")}
            variant="outline"
            className="mb-6 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
                Task Details
              </h1>
              <p className="text-gray-600 mt-2">Review all information before claiming</p>
            </div>
            <Badge
              className={`${
                task.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : task.status === "in_progress"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : task.status === "completed"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              } border font-medium px-3 py-1 shadow-sm`}
            >
              {task.status?.replace('_', ' ') || "Pending"}
            </Badge>
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-white shadow-2xl shadow-green-500/10 border-gray-100">
          <CardHeader className="bg-gradient-to-r from-white to-green-50/50 border-b border-gray-100 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl text-gray-900">
                  {task.formId?.title || "Untitled Task"}
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  {task.formId?.description || "No description available"}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manager Card */}
                <div className="bg-gradient-to-br from-white to-blue-50/50 p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-lg shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Manager Details</h3>
                      <p className="text-sm text-gray-500">Task assigned by</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                        {getInitials(task.submittedBy)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {getManagerFullName(task.submittedBy)}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {task.submittedBy?.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-br from-white to-green-50/50 p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg shadow-md">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Task Stats</h3>
                      <p className="text-sm text-gray-500">Quick overview</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-bold text-gray-900">{formatDate(task.createdAt)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">Competitors</p>
                      <p className="font-bold text-gray-900">{task.multipleTeamLeadAssigned?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Leads List */}
              {task.multipleTeamLeadAssigned && task.multipleTeamLeadAssigned.length > 0 && (
                <>
                  <Separator className="bg-gray-200" />
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-md">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Eligible Team Leads</h3>
                        <p className="text-sm text-gray-500">
                          {task.multipleTeamLeadAssigned?.length || 0} team leads can claim this task
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {task.multipleTeamLeadAssigned.map((lead, index) => (
                        <div
                          key={lead._id}
                          className={`flex items-center gap-3 p-4 rounded-xl border ${
                            lead._id === session.user.id
                              ? "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md shadow-green-500/20"
                              : "border-gray-200 bg-white shadow-sm"
                          } hover:shadow-md transition-shadow`}
                        >
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className={`text-sm ${
                              lead._id === session.user.id
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                            }`}>
                              {getInitials(lead)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {getTeamLeadFullName(lead)}
                              </p>
                              {lead._id === session.user.id && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs shadow-sm">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-gray-200" />

              {/* Claim Section */}
              {canClaim ? (
                <div className="bg-gradient-to-r from-white to-green-50/50 p-6 rounded-xl border-2 border-green-200 shadow-lg shadow-green-500/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">You Are Eligible to Claim</h3>
                      <p className="text-gray-600">
                        You're in the list of assigned team leads for this task
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>First team lead to claim gets the task</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Other team leads will be notified it's taken</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Task will move to your submissions after claiming</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleClaim}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-6 text-lg font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 transition-all"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Claim Task Now
                  </Button>

                  <p className="text-center text-gray-500 text-sm mt-4">
                    Once claimed, you'll be redirected to manage this task
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-white to-red-50/50 p-6 rounded-xl border-2 border-red-200 shadow-lg shadow-red-500/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-xl shadow-lg">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Task Not Available</h3>
                      <p className="text-gray-600">
                        {task.assignedTo
                          ? "This task has been claimed by another team lead"
                          : "You are not eligible to claim this task"}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push("/teamlead/task-offer")}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 py-6 shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    View Available Tasks
                  </Button>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-500">Created</span>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">
                    {Math.floor((new Date() - new Date(task.createdAt)) / (1000 * 60 * 60))}h ago
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-500">Competing</span>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">
                    {task.multipleTeamLeadAssigned?.length || 0} leads
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-500">Priority</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-sm">
                    High
                  </Badge>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-500">Status</span>
                  </div>
                  <p className="text-gray-900 font-bold">
                    {task.status === 'pending' ? 'Available' : 'Claimed'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Tasks are assigned on a first-come, first-served basis</p>
          <p className="mt-1">Refresh regularly for new task opportunities</p>
        </div>
      </div>
    </div>
  );
}