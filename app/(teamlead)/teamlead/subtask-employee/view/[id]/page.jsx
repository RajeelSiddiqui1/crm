"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Users,
  Target,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Mail,
  Shield,
  Building,
  UserCog,
  TrendingUp,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  MoreVertical,
  Send,
  ClipboardCheck,
} from "lucide-react";
import axios from "axios";
import { format, formatDistance, formatRelative } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ViewSubtaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subtaskId = params.id;

  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subtask, setSubtask] = useState(null);
  const [activeAssigneeTab, setActiveAssigneeTab] = useState("employees");
  const [activeFeedbackTab, setActiveFeedbackTab] = useState("employees");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [teamLeadFeedback, setTeamLeadFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchSubtask();
  }, [session, status, router]);

  const fetchSubtask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/teamlead/subtasks/${subtaskId}`);

      if (response.status === 200) {
        setSubtask(response.data.subtask);
        setTeamLeadFeedback(response.data.subtask.teamLeadFeedback || "");
      }
    } catch (error) {
      console.error("Error fetching subtask:", error);
      toast.error("Failed to load subtask details");
      router.push("/teamlead/subtasks");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `/api/teamlead/subtasks/${subtaskId}`
      );

      if (response.status === 200) {
        toast.success("Subtask deleted successfully!");
        setTimeout(() => {
          router.push("/teamlead/subtasks");
        }, 1000);
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast.error(error.response?.data?.error || "Failed to delete subtask");
      setIsDeleting(false);
    }
  };

  const handleSubmitTeamLeadFeedback = async () => {
    if (!teamLeadFeedback.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await axios.put(
        `/api/teamlead/subtasks/${subtaskId}/feedback`,
        { teamLeadFeedback }
      );

      if (response.status === 200) {
        toast.success("Feedback submitted successfully!");
        setSubtask({
          ...subtask,
          teamLeadFeedback,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-gray-900";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-600 text-white";
      case "in_progress":
        return "bg-blue-600 text-white";
      case "pending":
        return "bg-amber-500 text-gray-900";
      case "overdue":
        return "bg-rose-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case "positive":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "negative":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "neutral":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getFeedbackTypeIcon = (type) => {
    switch (type) {
      case "positive":
        return <ThumbsUp className="w-4 h-4" />;
      case "negative":
        return <ThumbsDown className="w-4 h-4" />;
      case "neutral":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getFeedbackTypeText = (type) => {
    switch (type) {
      case "positive":
        return "Positive";
      case "negative":
        return "Constructive";
      case "neutral":
        return "Neutral";
      default:
        return "General";
    }
  };

  const calculateTeamPerformance = () => {
    const employees = subtask?.assignedEmployees || [];
    const managers = subtask?.assignedManagers || [];
    const teamLeads = subtask?.assignedTeamLeads || [];
    const allAssignees = [...employees, ...managers, ...teamLeads];

    let totalCompleted = 0;
    let totalAssigned = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    let totalFeedback = 0;

    allAssignees.forEach((assignee) => {
      totalCompleted += assignee.leadsCompleted || 0;
      totalAssigned += assignee.leadsAssigned || 0;

      switch (assignee.status) {
        case "completed":
          completedCount++;
          break;
        case "in_progress":
          inProgressCount++;
          break;
        case "pending":
          pendingCount++;
          break;
      }

      if (assignee.feedback) totalFeedback++;
    });

    return {
      totalCompleted,
      totalAssigned,
      completedCount,
      inProgressCount,
      pendingCount,
      totalFeedback,
      overallProgress:
        totalAssigned > 0
          ? Math.round((totalCompleted / totalAssigned) * 100)
          : 0,
    };
  };

  const getFeedbackByType = () => {
    const allAssignees = [
      ...(subtask?.assignedEmployees || []),
      ...(subtask?.assignedManagers || []),
      ...(subtask?.assignedTeamLeads || []),
    ];

    const feedbacks = allAssignees
      .filter(assignee => assignee.feedback)
      .map(assignee => ({
        ...assignee,
        type: assignee.feedbackType || "neutral",
        role: assignee.employeeId ? "employee" : 
              assignee.managerId ? "manager" : "teamlead",
        name: assignee.name || "Unknown",
      }));

    return feedbacks;
  };

  const getAssigneeDisplayName = (assignee) => {
    const userObj = assignee.employeeId || assignee.managerId || assignee.teamLeadId;
    if (typeof userObj === "object" && userObj !== null) {
      if (userObj.firstName && userObj.lastName) {
        return `${userObj.firstName} ${userObj.lastName}`;
      }
      if (userObj.name) {
        return userObj.name;
      }
    }
    return assignee.name || "Unknown";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Loading Subtask Details
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Please wait while we fetch the information
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Access Restricted
              </h2>
              <p className="text-gray-700 mb-6">
                You need to be logged in as a Team Lead to view this page.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subtask) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Subtask Not Found
              </h2>
              <p className="text-gray-700 mb-6">
                The subtask you're looking for doesn't exist or has been
                removed.
              </p>
              <Button
                onClick={() => router.push("/teamlead/subtasks")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subtasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = subtask.totalLeadsRequired
    ? Math.round(
        ((subtask.leadsCompleted || 0) / subtask.totalLeadsRequired) * 100
      )
    : 0;

  const isOverdue = new Date() > new Date(subtask.endDate);
  const timeRemaining = formatDistance(new Date(), new Date(subtask.endDate), {
    addSuffix: true,
  });
  const duration = formatDistance(
    new Date(subtask.endDate),
    new Date(subtask.startDate)
  );
  const teamPerformance = calculateTeamPerformance();
  const allFeedbacks = getFeedbackByType();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Subtask Details
              </h1>
              <p className="text-gray-700 mt-2">
                View comprehensive information about this subtask
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader className="text-gray-900">
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the subtask and remove all associated data including
                    employee and manager assignments. All assigned users will be
                    notified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isDeleting}
                    className="text-gray-900"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Subtask"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={() =>
                router.push(`/teamlead/subtasks/edit/${subtaskId}`)
              }
              className="border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium shadow-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Subtask
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subtask Overview Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-white">
                    {subtask.title}
                    {subtask.hasLeadsTarget && (
                      <Badge className="ml-3 bg-green-500 text-white">
                        <Target className="w-3 h-3 mr-1" />
                        Lead Tracking
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-300 mt-2">
                    Created by {subtask.teamLeadName || session.user.name} •{" "}
                    {format(new Date(subtask.createdAt), "MMMM dd, yyyy")}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`${getPriorityColor(
                      subtask.priority
                    )} px-3 py-1 font-medium`}
                  >
                    {subtask.priority.charAt(0).toUpperCase() +
                      subtask.priority.slice(1)}{" "}
                    Priority
                  </Badge>
                  <Badge
                    className={`${getStatusColor(
                      subtask.status
                    )} px-3 py-1 font-medium flex items-center`}
                  >
                    {subtask.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    ) : subtask.status === "in_progress" ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 mr-1" />
                    )}
                    {subtask.status?.replace("_", " ")}
                  </Badge>
                  {isOverdue && (
                    <Badge className="bg-rose-600 text-white px-3 py-1 font-medium flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Description Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Description
                    </h3>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-6">
                    <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                      {subtask.description ||
                        "No description provided for this subtask."}
                    </p>
                  </div>
                </div>

                {/* Assignees Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Employees Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Employees
                        </h3>
                        <p className="text-xs text-gray-600">
                          {subtask.assignedEmployees?.length || 0} assigned
                        </p>
                      </div>
                    </div>
                    {subtask.assignedEmployees &&
                    subtask.assignedEmployees.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {subtask.assignedEmployees
                            .slice(0, 4)
                            .map((emp, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-blue-50 text-blue-700 text-xs border-blue-200"
                              >
                                {
                                  getAssigneeDisplayName(emp).split(
                                    " "
                                  )[0]
                                }
                              </Badge>
                            ))}
                          {subtask.assignedEmployees.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{subtask.assignedEmployees.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        No employees assigned
                      </p>
                    )}
                  </div>

                  {/* Managers Summary */}
                  <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Building className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Managers
                        </h3>
                        <p className="text-xs text-gray-600">
                          {subtask.assignedManagers?.length || 0} assigned
                        </p>
                      </div>
                    </div>
                    {subtask.assignedManagers &&
                    subtask.assignedManagers.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {subtask.assignedManagers
                            .slice(0, 4)
                            .map((mgr, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-purple-50 text-purple-700 text-xs border-purple-200"
                              >
                                {
                                  getAssigneeDisplayName(mgr).split(
                                    " "
                                  )[0]
                                }
                              </Badge>
                            ))}
                          {subtask.assignedManagers.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{subtask.assignedManagers.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        No managers assigned
                      </p>
                    )}
                  </div>

                  {/* Team Leads Summary */}
                  <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Shield className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Team Leads
                        </h3>
                        <p className="text-xs text-gray-600">
                          {subtask.assignedTeamLeads?.length || 0} assigned
                        </p>
                      </div>
                    </div>
                    {subtask.assignedTeamLeads &&
                    subtask.assignedTeamLeads.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {subtask.assignedTeamLeads
                            .slice(0, 4)
                            .map((tl, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-amber-50 text-amber-700 text-xs border-amber-200"
                              >
                                {
                                  getAssigneeDisplayName(tl).split(
                                    " "
                                  )[0]
                                }
                              </Badge>
                            ))}
                          {subtask.assignedTeamLeads.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{subtask.assignedTeamLeads.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        No team leads assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignees Progress Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCog className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Team Progress
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                      Individual performance metrics of assigned team members
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-medium">
                  {teamPerformance.completedCount} Completed •{" "}
                  {teamPerformance.inProgressCount} In Progress
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs
                defaultValue="employees"
                value={activeAssigneeTab}
                onValueChange={setActiveAssigneeTab}
              >
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 rounded-lg p-1">
  <TabsTrigger
    value="employees"
    className="flex items-center gap-2 justify-center rounded-md px-4 py-2 
               text-gray-900
               transition-colors duration-200 
               data-[state=active]:bg-blue-600 data-[state=active]:text-white"
  >
    <Users className="w-4 h-4" />
    Employees ({subtask.assignedEmployees?.length || 0})
  </TabsTrigger>

  <TabsTrigger
    value="managers"
    className="flex items-center gap-2 justify-center rounded-md px-4 py-2 
               text-gray-900
               transition-colors duration-200 
               data-[state=active]:bg-purple-600 data-[state=active]:text-white"
  >
    <Building className="w-4 h-4" />
    Managers ({subtask.assignedManagers?.length || 0})
  </TabsTrigger>

  <TabsTrigger
    value="teamleads"
    className="flex items-center gap-2 justify-center rounded-md px-4 py-2 
               text-gray-900
               transition-colors duration-200 
               data-[state=active]:bg-amber-600 data-[state=active]:text-white"
  >
    <Shield className="w-4 h-4" />
    Team Leads ({subtask.assignedTeamLeads?.length || 0})
  </TabsTrigger>
</TabsList>


                {/* Employees Tab Content */}
                <TabsContent value="employees" className="space-y-4">
                  {subtask.assignedEmployees &&
                  subtask.assignedEmployees.length > 0 ? (
                    <div className="space-y-4">
                      {subtask.assignedEmployees.map((assignment, index) => {
                        const employeeProgress = assignment.leadsCompleted || 0;
                        const employeeTarget = assignment.leadsAssigned || 0;
                        const employeePercentage =
                          employeeTarget > 0
                            ? Math.round(
                                (employeeProgress / employeeTarget) * 100
                              )
                            : 0;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-blue-50/50 to-white hover:bg-blue-50/80 transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                  {getAssigneeDisplayName(assignment)[0]}
                                  {
                                    getAssigneeDisplayName(assignment).split(
                                      " "
                                    )[1]?.[0]
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {getAssigneeDisplayName(assignment)}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`
                                      ${
                                        assignment.status === "completed"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : assignment.status === "in_progress"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      } 
                                      text-xs font-medium flex items-center gap-1
                                    `}
                                  >
                                    {assignment.status === "completed" ? (
                                      <Check className="w-3 h-3" />
                                    ) : assignment.status === "in_progress" ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {assignment.status?.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {assignment.email || "No email"}
                                  </span>
                                </div>
                                {assignment.feedback && (
                                  <div className="mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => {
                                        setSelectedFeedback(assignment);
                                        setFeedbackDialogOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      View Feedback
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {employeeProgress}/{employeeTarget}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Leads
                                </div>
                              </div>
                              <div className="w-32">
                                <Progress
                                  value={employeePercentage}
                                  className="h-2 bg-slate-200"
                                />
                                <div className="text-xs text-gray-600 mt-1 text-center">
                                  {employeePercentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Employees Assigned
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        This subtask doesn't have any employees assigned yet.
                      </p>
                      <Button
                        onClick={() =>
                          router.push(`/teamlead/subtasks/edit/${subtaskId}`)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Assign Employees
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Managers Tab Content */}
                <TabsContent value="managers" className="space-y-4">
                  {subtask.assignedManagers &&
                  subtask.assignedManagers.length > 0 ? (
                    <div className="space-y-4">
                      {subtask.assignedManagers.map((assignment, index) => {
                        const managerProgress = assignment.leadsCompleted || 0;
                        const managerTarget = assignment.leadsAssigned || 0;
                        const managerPercentage =
                          managerTarget > 0
                            ? Math.round(
                                (managerProgress / managerTarget) * 100
                              )
                            : 0;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-purple-50/50 to-white hover:bg-purple-50/80 transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
                                  {getAssigneeDisplayName(assignment)[0]}
                                  {
                                    getAssigneeDisplayName(assignment).split(
                                      " "
                                    )[1]?.[0]
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {getAssigneeDisplayName(assignment)}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`
                                      ${
                                        assignment.status === "completed"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : assignment.status === "in_progress"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      } 
                                      text-xs font-medium flex items-center gap-1
                                    `}
                                  >
                                    {assignment.status === "completed" ? (
                                      <Check className="w-3 h-3" />
                                    ) : assignment.status === "in_progress" ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {assignment.status?.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {assignment.email || "No email"}
                                  </span>
                                </div>
                                {assignment.feedback && (
                                  <div className="mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                      onClick={() => {
                                        setSelectedFeedback(assignment);
                                        setFeedbackDialogOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      View Feedback
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {managerProgress}/{managerTarget}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Leads
                                </div>
                              </div>
                              <div className="w-32">
                                <Progress
                                  value={managerPercentage}
                                  className="h-2 bg-slate-200"
                                />
                                <div className="text-xs text-gray-600 mt-1 text-center">
                                  {managerPercentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                        <Building className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Managers Assigned
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        This subtask doesn't have any managers assigned yet.
                      </p>
                      <Button
                        onClick={() =>
                          router.push(`/teamlead/subtasks/edit/${subtaskId}`)
                        }
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Assign Managers
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Team Leads Tab Content */}
                <TabsContent value="teamleads" className="space-y-4">
                  {subtask.assignedTeamLeads &&
                  subtask.assignedTeamLeads.length > 0 ? (
                    <div className="space-y-4">
                      {subtask.assignedTeamLeads.map((assignment, index) => {
                        const teamLeadProgress = assignment.leadsCompleted || 0;
                        const teamLeadTarget = assignment.leadsAssigned || 0;
                        const teamLeadPercentage =
                          teamLeadTarget > 0
                            ? Math.round(
                                (teamLeadProgress / teamLeadTarget) * 100
                              )
                            : 0;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-amber-50/50 to-white hover:bg-amber-50/80 transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold">
                                  {getAssigneeDisplayName(assignment)[0]}
                                  {
                                    getAssigneeDisplayName(assignment).split(
                                      " "
                                    )[1]?.[0]
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {getAssigneeDisplayName(assignment)}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`
                                      ${
                                        assignment.status === "completed"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : assignment.status === "in_progress"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      } 
                                      text-xs font-medium flex items-center gap-1
                                    `}
                                  >
                                    {assignment.status === "completed" ? (
                                      <Check className="w-3 h-3" />
                                    ) : assignment.status === "in_progress" ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {assignment.status?.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {assignment.email || "No email"}
                                  </span>
                                </div>
                                {assignment.feedback && (
                                  <div className="mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => {
                                        setSelectedFeedback(assignment);
                                        setFeedbackDialogOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      View Feedback
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {teamLeadProgress}/{teamLeadTarget}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Leads
                                </div>
                              </div>
                              <div className="w-32">
                                <Progress
                                  value={teamLeadPercentage}
                                  className="h-2 bg-slate-200"
                                />
                                <div className="text-xs text-gray-600 mt-1 text-center">
                                  {teamLeadPercentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Team Leads Assigned
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        This subtask doesn't have any team leads assigned yet.
                      </p>
                      <Button
                        onClick={() =>
                          router.push(`/teamlead/subtasks/edit/${subtaskId}`)
                        }
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Assign Team Leads
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          {(allFeedbacks.length > 0 || subtask.teamLeadFeedback) && (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Feedback & Reviews
                      </CardTitle>
                      <CardDescription className="text-gray-700">
                        Feedback from team members and your review
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
                    {allFeedbacks.length} Feedback{allFeedbacks.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs
                  defaultValue="all"
                  value={activeFeedbackTab}
                  onValueChange={setActiveFeedbackTab}
                >
                 <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 rounded-lg p-1">
  <TabsTrigger
    value="all"
    className="flex items-center gap-2 justify-center rounded-md px-4 py-2 
               text-gray-900
               transition-colors duration-200 
               data-[state=active]:bg-green-600 data-[state=active]:text-white"
  >
    All Feedback
  </TabsTrigger>

  <TabsTrigger
    value="employees"
    className="flex items-center gap-2 justify-center rounded-md px-4 py-2 
               text-gray-900
               transition-colors duration-200 
               data-[state=active]:bg-blue-600 data-[state=active]:text-white"
  >
    Employees
  </TabsTrigger>

  <TabsTrigger
    value="managers"
    className="flex items-center gap-2 justify-center rounded-md px-4 py-2 
               text-gray-900
               transition-colors duration-200 
               data-[state=active]:bg-purple-600 data-[state=active]:text-white"
  >
    Managers
  </TabsTrigger>

  
</TabsList>


                  {/* All Feedback Tab */}
                  <TabsContent value="all" className="space-y-4">
                    {allFeedbacks.length > 0 ? (
                      <div className="space-y-4">
                        {allFeedbacks.map((feedback, index) => (
                          <div
                            key={index}
                            className="p-4 border border-slate-200 rounded-xl bg-white hover:shadow-sm transition-shadow duration-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className={`
                                    ${feedback.role === 'employee' ? 'bg-blue-100 text-blue-700' : 
                                      feedback.role === 'manager' ? 'bg-purple-100 text-purple-700' : 
                                      'bg-amber-100 text-amber-700'}
                                  `}>
                                    {feedback.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {feedback.name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={`
                                        ${getFeedbackTypeColor(feedback.type)}
                                        text-xs flex items-center gap-1
                                      `}
                                    >
                                      {getFeedbackTypeIcon(feedback.type)}
                                      {getFeedbackTypeText(feedback.type)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {feedback.role === 'employee' ? 'Employee' : 
                                     feedback.role === 'manager' ? 'Manager' : 'Team Lead'}
                                  </p>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedFeedback(feedback);
                                      setFeedbackDialogOpen(true);
                                    }}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-gray-700 text-sm line-clamp-2">
                              {feedback.feedback}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`
                                    ${feedback.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                      feedback.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                      'bg-amber-50 text-amber-700 border-amber-200'}
                                    text-xs
                                  `}
                                >
                                  {feedback.status?.replace('_', ' ')}
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">
                                {feedback.completedAt 
                                  ? format(new Date(feedback.completedAt), 'MMM dd, yyyy')
                                  : 'No completion date'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                          <MessageSquare className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Feedback Yet
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          No team members have provided feedback on this subtask yet.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Team Lead Review Tab */}
                  <TabsContent value="teamlead" className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          Your Review
                        </h4>
                        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5">
                          <Textarea
                            placeholder="Add your feedback for the team..."
                            value={teamLeadFeedback}
                            onChange={(e) => setTeamLeadFeedback(e.target.value)}
                            className="min-h-[120px] bg-white"
                          />
                          <div className="flex justify-between items-center mt-4">
                            <p className="text-xs text-gray-500">
                              This feedback will be visible to all assigned team members.
                            </p>
                            <Button
                              onClick={handleSubmitTeamLeadFeedback}
                              disabled={isSubmittingFeedback || !teamLeadFeedback.trim()}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isSubmittingFeedback ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Submit Review
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {subtask.teamLeadFeedback && (
                        <div className="border-t border-slate-200 pt-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Previous Review
                          </h4>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <ClipboardCheck className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-semibold text-gray-900">
                                    Your Review
                                  </p>
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    Team Lead
                                  </Badge>
                                </div>
                                <p className="text-gray-700 whitespace-pre-line">
                                  {subtask.teamLeadFeedback}
                                </p>
                                {subtask.updatedAt && (
                                  <p className="text-xs text-gray-500 mt-3">
                                    Last updated: {format(new Date(subtask.updatedAt), 'PPP p')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline Info Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 p-6">
              <CardTitle className="text-lg font-bold text-gray-900">
                Timeline Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 font-medium">
                    Start Date
                  </div>
                  <div className="text-gray-900 font-semibold">
                    {format(new Date(subtask.startDate), "PPP")} • {subtask.startTime}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 font-medium">
                    End Date
                  </div>
                  <div className="text-gray-900 font-semibold">
                    {format(new Date(subtask.endDate), "PPP")} • {subtask.endTime}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 font-medium">
                    Duration
                  </div>
                  <div className="text-gray-900 font-semibold">
                    {duration}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 font-medium">
                    Time Remaining
                  </div>
                  <div
                    className={`font-semibold ${
                      isOverdue ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {isOverdue ? (
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Overdue by{" "}
                        {formatDistance(new Date(subtask.endDate), new Date())}
                      </span>
                    ) : (
                      timeRemaining
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 p-6">
              <CardTitle className="text-lg font-bold text-gray-900">
                Performance Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700 font-medium">
                        Total Team
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {(subtask.assignedEmployees?.length || 0) +
                         (subtask.assignedManagers?.length || 0) +
                         (subtask.assignedTeamLeads?.length || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700 font-medium">
                        Team Progress
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {teamPerformance.overallProgress}%
                      </div>
                    </div>
                  </div>
                </div>

                {subtask.hasLeadsTarget && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 font-medium">
                            Lead Target
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {subtask.totalLeadsRequired || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 font-medium">
                            Leads Completed
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {subtask.leadsCompleted || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700 font-medium">
                        Total Feedback
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {teamPerformance.totalFeedback}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 p-6">
              <CardTitle className="text-lg font-bold text-gray-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button
                  onClick={() =>
                    router.push(`/teamlead/subtasks/edit/${subtaskId}`)
                  }
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg"
                >
                  <Edit className="w-4 h-4 mr-3" />
                  Edit Subtask
                </Button>

                <Button
                  onClick={() => router.push("/teamlead/subtasks")}
                  className="w-full justify-start border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium py-3 px-4 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-3" />
                  Back to Subtasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={`
                      ${selectedFeedback.employeeId ? 'bg-blue-100 text-blue-700' : 
                        selectedFeedback.managerId ? 'bg-purple-100 text-purple-700' : 
                        'bg-amber-100 text-amber-700'}
                    `}>
                      {getAssigneeDisplayName(selectedFeedback)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-lg">
                      {getAssigneeDisplayName(selectedFeedback)}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedFeedback.employeeId ? 'Employee' : 
                         selectedFeedback.managerId ? 'Manager' : 'Team Lead'}
                      </Badge>
                      <span className="text-gray-500">
                        {selectedFeedback.email}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Feedback Type
                  </h4>
                  <Badge
                    className={`
                      ${getFeedbackTypeColor(selectedFeedback.feedbackType || 'neutral')}
                      text-sm py-1.5 px-3 flex items-center gap-2 w-fit
                    `}
                  >
                    {getFeedbackTypeIcon(selectedFeedback.feedbackType || 'neutral')}
                    {getFeedbackTypeText(selectedFeedback.feedbackType || 'neutral')}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Feedback Details
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-line">
                      {selectedFeedback.feedback}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Status
                    </h4>
                    <Badge
                      className={`
                        ${selectedFeedback.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                          selectedFeedback.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                          'bg-amber-100 text-amber-800 border-amber-200'}
                        text-sm py-1.5 px-3 w-fit
                      `}
                    >
                      {selectedFeedback.status?.replace('_', ' ') || 'Pending'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Completion Date
                    </h4>
                    <p className="text-gray-700">
                      {selectedFeedback.completedAt 
                        ? format(new Date(selectedFeedback.completedAt), 'PPP')
                        : 'Not completed'}
                    </p>
                  </div>
                </div>

                {subtask.hasLeadsTarget && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Lead Performance
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Leads Completed</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedFeedback.leadsCompleted || 0}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Lead Target</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedFeedback.leadsAssigned || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}