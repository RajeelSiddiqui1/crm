"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  MessageCircle,
  Filter,
  Download,
  ChevronRight,
  Target,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  Info,
  MessageSquare,
  Send,
  Users,
  Building,
  Briefcase,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Shield,
  UserCog,
  FileCheck,
  ArrowRight,
  Reply,
  UserCircle,
  CalendarDays,
  ThumbsUp,
  ThumbsDown,
  History,
  Share2,
  Copy,
  Lock,
  Unlock,
  Edit,
  Save,
  Trash2,
  MoreVertical,
  ExternalLink,
  FileBarChart,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ManagerTaskDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [managerComments, setManagerComments] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("manager_comments");
  const [teamLeadFeedbacks, setTeamLeadFeedbacks] = useState([]);
  const [employeeFeedbacks, setEmployeeFeedbacks] = useState([]);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState({
    teamLead: true,
    employees: true,
    sharedManagers: true,
    formData: false
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchSubmissionDetails();
  }, [session, status, router, submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/manager/tasks/${submissionId}`);
      
      if (response.status === 200) {
        const data = response.data;
        setSubmission(data);
        setManagerComments(data.managerComments || "");
        setNewStatus(data.status || "pending");
        
        // ٹیم لیڈ اور ایمپلائی فیڈ بیکس
        setTeamLeadFeedbacks(data.teamLeadFeedbacks || []);
        setEmployeeFeedbacks(data.employeeFeedbacks || []);
      }
    } catch (error) {
      console.error("Error fetching submission details:", error);
      toast.error(error.response?.data?.error || "Failed to load submission details");
      if (error.response?.status === 404) {
        router.push("/manager/tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(`/api/manager/tasks/${submissionId}/feedback`);
      if (response.status === 200) {
        const data = response.data;
        setTeamLeadFeedbacks(data.teamLeadFeedbacks || []);
        setEmployeeFeedbacks(data.employeeFeedbacks || []);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.put(`/api/manager/tasks/${submissionId}`, {
        status: newStatus,
        managerComments: managerComments.trim()
      });

      if (response.status === 200) {
        toast.success("Status updated successfully");
        setSubmission(response.data.submission);
        setShowStatusDialog(false);
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const submitManagerFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.post(`/api/manager/tasks/${submissionId}/feedback`, {
        feedback: feedbackText.trim(),
        commentType: feedbackType
      });

      if (response.status === 201) {
        toast.success("Feedback submitted successfully");
        setFeedbackText("");
        setShowFeedbackDialog(false);
        
        // ری فریش ڈیٹا
        if (feedbackType === "manager_comments") {
          fetchSubmissionDetails();
        } else {
          fetchFeedbacks();
        }
      }
    } catch (error) {
      console.error("Feedback submit error:", error);
      toast.error(error.response?.data?.error || "Failed to submit feedback");
    } finally {
      setUpdating(false);
    }
  };

  const submitReply = async (feedbackId, feedbackType) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.put(`/api/manager/tasks/${submissionId}/feedback`, {
        feedbackId,
        reply: replyText.trim(),
        feedbackType
      });

      if (response.status === 200) {
        toast.success("Reply submitted successfully");
        setReplyText("");
        setSelectedFeedback(null);
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("Reply submit error:", error);
      toast.error(error.response?.data?.error || "Failed to submit reply");
    } finally {
      setUpdating(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: <CheckCircle className="w-4 h-4" />,
          color: "emerald"
        };
      case "in_progress":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: <TrendingUp className="w-4 h-4" />,
          color: "blue"
        };
      case "pending":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: <Clock className="w-4 h-4" />,
          color: "amber"
        };
      case "rejected":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: <XCircle className="w-4 h-4" />,
          color: "red"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
          icon: <AlertCircle className="w-4 h-4" />,
          color: "gray"
        };
    }
  };

  const getReplyBadge = (repliedByModel) => {
    switch (repliedByModel) {
      case "Employee":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Manager":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "TeamLead":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getReplyAvatar = (repliedByModel) => {
    switch (repliedByModel) {
      case "Employee":
        return <User className="w-4 h-4 text-blue-600" />;
      case "Manager":
        return <UserCog className="w-4 h-4 text-purple-600" />;
      case "TeamLead":
        return <Shield className="w-4 h-4 text-orange-600" />;
      default:
        return <UserCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <div className="space-y-1 text-sm">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="font-medium text-gray-700 capitalize min-w-[100px]">
                {key}:
              </span>
              <span className="text-gray-900">{val || "N/A"}</span>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <Badge
          variant={value ? "default" : "outline"}
          className={value ? "bg-emerald-100 text-emerald-800" : ""}
        >
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    return value.toString();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-4">The requested task could not be found or you don't have access.</p>
          <Button onClick={() => router.push("/manager/tasks")}>
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = submission.submittedBy?._id === session.user.id;
  const isSharedManager = submission.multipleManagerShared?.some(
    m => m._id === session.user.id
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-4 sm:p-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/manager/tasks")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Tasks
              </Button>
              {isOwner ? (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  <UserCog className="w-3 h-3 mr-1" />
                  Owner
                </Badge>
              ) : isSharedManager ? (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <Share2 className="w-3 h-3 mr-1" />
                  Shared Manager
                </Badge>
              ) : null}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {submission.clinetName || submission.formId?.title || "Task Details"}
            </h1>
            <p className="text-gray-600 mt-1">
              {submission.formId?.description || "No description available"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchSubmissionDetails}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowStatusDialog(true)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Status
            </Button>
          </div>
        </div>

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Manager Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={`${getStatusVariant(submission.status).bg} ${getStatusVariant(submission.status).text} ${getStatusVariant(submission.status).border} border flex items-center gap-1 px-3 py-1`}
                    >
                      {getStatusVariant(submission.status).icon}
                      {submission.status?.replace("_", " ") || "Pending"}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <UserCog className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Team Lead Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={`${getStatusVariant(submission.status2).bg} ${getStatusVariant(submission.status2).text} ${getStatusVariant(submission.status2).border} border flex items-center gap-1 px-3 py-1`}
                    >
                      {getStatusVariant(submission.status2).icon}
                      {submission.status2?.replace("_", " ") || "Pending"}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Assigned Team Leads</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {submission.assignedTo?.length || 0}
                  </h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Assigned Employees</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {submission.assignedEmployees?.length || 0}
                  </h3>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <User className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger value="overview" className="text-gray-600 data-[state=active]:text-gray-900">
              Overview
            </TabsTrigger>
            <TabsTrigger value="feedbacks" className="text-gray-600 data-[state=active]:text-gray-900">
              Feedbacks ({teamLeadFeedbacks.length + employeeFeedbacks.length})
            </TabsTrigger>
            <TabsTrigger value="formData" className="text-gray-600 data-[state=active]:text-gray-900">
              Form Data
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-gray-600 data-[state=active]:text-gray-900">
              Activity Log
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <TabsContent value="overview" className="space-y-6">
          {/* Manager Comments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <CardTitle>Manager Comments</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFeedbackType("manager_comments");
                    setFeedbackText(submission.managerComments || "");
                    setShowFeedbackDialog(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Comments
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {submission.managerComments ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-purple-900">{submission.managerComments}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No comments added yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setFeedbackType("manager_comments");
                      setFeedbackText("");
                      setShowFeedbackDialog(true);
                    }}
                  >
                    Add Comments
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shared Managers Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  <CardTitle>Shared Managers</CardTitle>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {submission.multipleManagerShared?.length || 0} Managers
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Task Owner */}
                <Card className="border border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12 border-2 border-purple-200">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                          {submission.submittedBy?.firstName?.[0]}{submission.submittedBy?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {submission.submittedBy?.firstName} {submission.submittedBy?.lastName}
                        </h4>
                        <p className="text-sm text-purple-600">Task Owner</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-700">{submission.submittedBy?.email}</span>
                      </div>
                      {submission.submittedBy?.department && (
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">{submission.submittedBy.department}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Managers */}
                {submission.multipleManagerShared?.map((manager, index) => (
                  <Card key={manager._id} className="border border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12 border-2 border-blue-200">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            {manager.firstName?.[0]}{manager.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {manager.firstName} {manager.lastName}
                          </h4>
                          <p className="text-sm text-blue-600">Shared Manager</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">{manager.email}</span>
                        </div>
                        {manager.department && (
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">{manager.department}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Leads Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <CardTitle>Assigned Team Leads</CardTitle>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {submission.assignedTo?.length || 0} Team Leads
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {submission.assignedTo?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submission.assignedTo.map((teamLead, index) => (
                    <Card key={teamLead._id} className="border border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-orange-200">
                            <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                              {teamLead.firstName?.[0]}{teamLead.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {teamLead.firstName} {teamLead.lastName}
                            </h4>
                            <p className="text-sm text-orange-600">Team Lead</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">{teamLead.email}</span>
                          </div>
                          {teamLead.department && (
                            <div className="flex items-center gap-2">
                              <Building className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-700">{teamLead.department}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">{teamLead.phone || "No phone"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No team leads assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employees Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  <CardTitle>Assigned Employees</CardTitle>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {submission.assignedEmployees?.length || 0} Employees
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {submission.assignedEmployees?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submission.assignedEmployees.map((assignment, index) => (
                    <Card key={assignment.employeeId?._id} className="border border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-green-200">
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                              {assignment.employeeId?.firstName?.[0]}{assignment.employeeId?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {assignment.employeeId?.firstName} {assignment.employeeId?.lastName}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusVariant(assignment.status).bg} ${getStatusVariant(assignment.status).text} ${getStatusVariant(assignment.status).border} text-xs`}>
                                {assignment.status?.replace("_", " ") || "Pending"}
                              </Badge>
                              {assignment.completedAt && (
                                <span className="text-xs text-gray-500">
                                  Completed: {formatDate(assignment.completedAt).split(",")[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">{assignment.employeeId?.email}</span>
                          </div>
                          {assignment.employeeId?.position && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-700">{assignment.employeeId.position}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">
                              Assigned: {formatDate(assignment.assignedAt).split(",")[0]}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No employees assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-6">
          {/* Team Lead Feedbacks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <CardTitle>Team Lead Feedbacks</CardTitle>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {teamLeadFeedbacks.length} Feedbacks
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {teamLeadFeedbacks.length > 0 ? (
                <div className="space-y-4">
                  {teamLeadFeedbacks.map((feedback) => (
                    <Card key={feedback._id} className="border border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-orange-200">
                              <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                                {feedback.teamLeadId?.firstName?.[0]}{feedback.teamLeadId?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {feedback.teamLeadId?.firstName} {feedback.teamLeadId?.lastName}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {formatDate(feedback.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            Team Lead
                          </Badge>
                        </div>

                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
                          <p className="text-gray-900">{feedback.feedback}</p>
                        </div>

                        {/* Replies Section */}
                        {feedback.replies && feedback.replies.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Reply className="w-4 h-4 text-gray-500" />
                              Replies ({feedback.replies.length})
                            </h5>
                            <div className="space-y-3">
                              {feedback.replies.map((reply, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg ${getReplyBadge(reply.repliedByModel)}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {getReplyAvatar(reply.repliedByModel)}
                                      <span className="font-medium text-gray-900">
                                        {reply.repliedBy?.firstName} {reply.repliedBy?.lastName}
                                      </span>
                                      <Badge className={`text-xs ${getReplyBadge(reply.repliedByModel)}`}>
                                        {reply.repliedByModel}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(reply.repliedAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-800">{reply.reply}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reply Button */}
                        <div className="mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() => {
                              setSelectedFeedback(feedback._id);
                              setReplyText("");
                            }}
                          >
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                        </div>

                        {/* Reply Input */}
                        {selectedFeedback === feedback._id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              className="mb-3"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedFeedback(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => submitReply(feedback._id, "teamLead_feedback")}
                                disabled={!replyText.trim() || updating}
                              >
                                {updating ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                Send Reply
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No team lead feedbacks yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Feedbacks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <CardTitle>Employee Feedbacks</CardTitle>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {employeeFeedbacks.length} Feedbacks
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {employeeFeedbacks.length > 0 ? (
                <div className="space-y-4">
                  {employeeFeedbacks.map((feedback) => (
                    <Card key={feedback._id} className="border border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-blue-200">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                {feedback.employeeId?.firstName?.[0]}{feedback.employeeId?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {feedback.employeeId?.firstName} {feedback.employeeId?.lastName}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {formatDate(feedback.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            Employee
                          </Badge>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                          <p className="text-gray-900">{feedback.feedback}</p>
                        </div>

                        {/* Replies Section */}
                        {feedback.replies && feedback.replies.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Reply className="w-4 h-4 text-gray-500" />
                              Replies ({feedback.replies.length})
                            </h5>
                            <div className="space-y-3">
                              {feedback.replies.map((reply, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg ${getReplyBadge(reply.repliedByModel)}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {getReplyAvatar(reply.repliedByModel)}
                                      <span className="font-medium text-gray-900">
                                        {reply.repliedBy?.firstName} {reply.repliedBy?.lastName}
                                      </span>
                                      <Badge className={`text-xs ${getReplyBadge(reply.repliedByModel)}`}>
                                        {reply.repliedByModel}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(reply.repliedAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-800">{reply.reply}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reply Button */}
                        <div className="mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() => {
                              setSelectedFeedback(feedback._id);
                              setReplyText("");
                            }}
                          >
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                        </div>

                        {/* Reply Input */}
                        {selectedFeedback === feedback._id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              className="mb-3"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedFeedback(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => submitReply(feedback._id, "employee_feedback")}
                                disabled={!replyText.trim() || updating}
                              >
                                {updating ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                Send Reply
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No employee feedbacks yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formData">
          {submission.formData && Object.keys(submission.formData).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Form Data
                </CardTitle>
                <CardDescription>
                  All submitted form fields and data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(submission.formData).map(([key, value]) => (
                    <Card key={key} className="border border-gray-200">
                      <CardContent className="p-4">
                        <Label className="text-sm font-medium text-gray-700 capitalize mb-2 block">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <div className="text-gray-900">
                          {formatFieldValue(value)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Form Data</h3>
              <p className="text-gray-600">No form data was submitted for this task.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                Activity Log
              </CardTitle>
              <CardDescription>
                Recent activities and changes on this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Created Activity */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Task created by {submission.submittedBy?.firstName} {submission.submittedBy?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Status Updates */}
                {submission.status && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Status updated to <Badge className={`${getStatusVariant(submission.status).bg} ${getStatusVariant(submission.status).text} ${getStatusVariant(submission.status).border}`}>
                          {submission.status.replace("_", " ")}
                        </Badge>
                      </p>
                      <p className="text-xs text-gray-500">
                        Last updated: {formatDate(submission.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Team Lead Feedback Activities */}
                {teamLeadFeedbacks.map((feedback, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <MessageSquare className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {feedback.teamLeadId?.firstName} {feedback.teamLeadId?.lastName} provided feedback
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(feedback.submittedAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Employee Feedback Activities */}
                {employeeFeedbacks.map((feedback, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {feedback.employeeId?.firstName} {feedback.employeeId?.lastName} provided feedback
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(feedback.submittedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Update Task Status
            </DialogTitle>
            <DialogDescription>
              Update the status of this task. All stakeholders will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Approved
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerComments">Comments (Optional)</Label>
              <Textarea
                id="managerComments"
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                placeholder="Add any comments or notes..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              {feedbackType === "manager_comments" ? "Add Comments" : "Add Feedback"}
            </DialogTitle>
            <DialogDescription>
              {feedbackType === "manager_comments" 
                ? "Your comments will be visible to all team leads and employees."
                : "Add general feedback about this task."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">
                {feedbackType === "manager_comments" ? "Comments" : "Feedback"}
              </Label>
              <Textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={feedbackType === "manager_comments" 
                  ? "Enter your comments here..." 
                  : "Enter your feedback here..."}
                className="min-h-[150px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitManagerFeedback}
                disabled={updating || !feedbackText.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}