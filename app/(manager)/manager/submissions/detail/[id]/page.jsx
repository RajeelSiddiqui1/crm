// app/manager/submissions/detail/[id]/page.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";
import { 
  Loader2, 
  ArrowLeft, 
  Eye, 
  Download, 
  Printer, 
  Share2, 
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Users,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  BarChart3,
  History,
  Workflow,
  TrendingUp,
  Award,
  Zap,
  MoreVertical,
  Crown,
  Star,
  ThumbsUp,
  FileBarChart,
  PieChart,
  Activity,
  Target,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  ChevronRight,
  ExternalLink,
  Filter,
  Search,
  Settings,
  Bell,
  Heart,
  Sparkles,
  Rocket,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
  CheckSquare,
  AlertTriangle,
  Info,
  HelpCircle,
  Upload,
  FolderOpen,
  Paperclip,
  Image as ImageIcon,
  File,
  Folder,
  Database,
  Cloud,
  Shield,
  Lock,
  Unlock,
  Key,
  QrCode,
  BellRing,
  Megaphone,
  Gift,
  Trophy,
  Medal,
  Coffee,
  Brain,
  Lightbulb,
  Puzzle,
  Cpu,
  Zap as ZapIcon,
  Wind,
  Waves,
  Fire,
  Leaf,
  Droplets,
  Mountain,
  Tree,
  CloudSun,
  Sunrise,
  Sunset,
  Moon,
  Sun,
  Star as StarIcon,
  Palette,
  PaintBucket,
  Brush,
  Sparkle,
  Rainbow,
  PartyPopper,
  Confetti,
  Crown as CrownIcon,
  Gem,
  Diamond,
  Sparkles as SparklesIcon,
  Send,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Color constants
const COLORS = {
  primary: {
    bg: "bg-gradient-to-br from-indigo-500 to-purple-600",
    text: "text-white",
    border: "border-indigo-400",
    light: "bg-indigo-50 text-indigo-700",
  },
  success: {
    bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    text: "text-white",
    border: "border-emerald-400",
    light: "bg-emerald-50 text-emerald-700",
  },
  warning: {
    bg: "bg-gradient-to-br from-amber-500 to-orange-600",
    text: "text-white",
    border: "border-amber-400",
    light: "bg-amber-50 text-amber-700",
  },
  danger: {
    bg: "bg-gradient-to-br from-rose-500 to-pink-600",
    text: "text-white",
    border: "border-rose-400",
    light: "bg-rose-50 text-rose-700",
  },
  info: {
    bg: "bg-gradient-to-br from-sky-500 to-blue-600",
    text: "text-white",
    border: "border-sky-400",
    light: "bg-sky-50 text-sky-700",
  },
  gradient: {
    blue: "bg-gradient-to-br from-blue-400 to-cyan-500",
    purple: "bg-gradient-to-br from-purple-400 to-pink-500",
    green: "bg-gradient-to-br from-green-400 to-emerald-500",
    orange: "bg-gradient-to-br from-orange-400 to-red-500",
    pink: "bg-gradient-to-br from-pink-400 to-rose-500",
  }
};

export default function SubmissionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch submission details
  const fetchSubmissionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/manager/submissions/details/${submissionId}`);
      if (response.data) {
        setSubmission(response.data);
        setEditableData(response.data.formData || {});
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast({
        title: "Error",
        description: "Failed to load submission details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  // Fetch timeline
  const fetchTimeline = useCallback(async () => {
    try {
      const response = await axios.get(`/api/manager/submissions/timeline/${submissionId}`);
      if (response.data.timeline) {
        setTimeline(response.data.timeline);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    }
  }, [submissionId]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchSubmissionDetails();
    fetchTimeline();
  }, [session, status, router, fetchSubmissionDetails, fetchTimeline]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await axios.put("/api/manager/submissions", {
        submissionId,
        status: newStatus,
      });
      
      if (response.status === 200) {
        toast({
          title: "🎉 Status Updated",
          description: `Submission status changed to ${newStatus.replace('_', ' ')}`,
        });
        fetchSubmissionDetails();
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error.response?.data?.error || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const response = await axios.put(`/api/manager/submissions/${submissionId}`, {
        formData: editableData,
      });
      
      if (response.status === 200) {
        toast({
          title: "✨ Changes Saved",
          description: "Submission updated successfully",
        });
        setIsEditing(false);
        fetchSubmissionDetails();
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error.response?.data?.error || "Failed to update submission",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    
    try {
      const response = await axios.post(`/api/manager/submissions/${submissionId}/feedback`, {
        feedback: feedback.trim(),
      });
      
      if (response.status === 200) {
        toast({
          title: "💬 Feedback Sent",
          description: "Your feedback has been submitted successfully",
        });
        setFeedback("");
        fetchSubmissionDetails();
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error.response?.data?.error || "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubmission = async () => {
    try {
      const response = await axios.delete(`/api/manager/submissions/${submissionId}`);
      
      if (response.status === 200) {
        toast({
          title: "🗑️ Deleted",
          description: "Submission deleted successfully",
        });
        router.push("/manager/submissions");
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error.response?.data?.error || "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/manager/submissions/detail/${submissionId}`);
      toast({
        title: "📋 Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return COLORS.success;
      case 'in_progress':
        return COLORS.info;
      case 'pending':
        return COLORS.warning;
      case 'rejected':
        return COLORS.danger;
      default:
        return COLORS.info;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "PPpp");
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return format(date, "PP");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-indigo-100 shadow-lg">
          <CardHeader>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-gray-900">Submission Not Found</CardTitle>
              <CardDescription className="text-gray-600">
                The submission you're looking for doesn't exist or you don't have access to it.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Link href="/manager/submissions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Submissions
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/manager/submissions")}
                className="rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {submission.formId?.title || "Submission Details"}
                  </h1>
                  <Badge className={`${getStatusColor(submission.status).bg} text-white border-0 px-3 py-1`}>
                    <span className="flex items-center gap-1.5">
                      {getStatusIcon(submission.status)}
                      <span className="capitalize">{submission.status?.replace("_", " ")}</span>
                    </span>
                  </Badge>
                </div>
                <p className="text-indigo-100">
                  <span className="font-medium">{submission.clinetName || "No Client Name"}</span> • 
                  Created {formatRelativeTime(submission.createdAt)} • 
                  ID: {submissionId.slice(0, 8)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Status Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button
              variant={submission.status === "pending" ? "default" : "outline"}
              className={`flex-1 rounded-lg ${submission.status === "pending" 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
                : "border-amber-200 text-amber-700 hover:bg-amber-50"}`}
              onClick={() => handleStatusUpdate("pending")}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Pending
            </Button>
            <Button
              variant={submission.status === "in_progress" ? "default" : "outline"}
              className={`flex-1 rounded-lg ${submission.status === "in_progress" 
                ? "bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600" 
                : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}
              onClick={() => handleStatusUpdate("in_progress")}
            >
              <Clock className="mr-2 h-4 w-4" />
              In Progress
            </Button>
            <Button
              variant={submission.status === "completed" ? "default" : "outline"}
              className={`flex-1 rounded-lg ${submission.status === "completed" 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
              onClick={() => handleStatusUpdate("completed")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed
            </Button>
            <Button
              variant={submission.status === "approved" ? "default" : "outline"}
              className={`flex-1 rounded-lg ${submission.status === "approved" 
                ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
                : "border-green-200 text-green-700 hover:bg-green-50"}`}
              onClick={() => handleStatusUpdate("approved")}
            >
              <Award className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant={submission.status === "rejected" ? "default" : "outline"}
              className={`flex-1 rounded-lg ${submission.status === "rejected" 
                ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600" 
                : "border-rose-200 text-rose-700 hover:bg-rose-50"}`}
              onClick={() => handleStatusUpdate("rejected")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 rounded-lg">
              <Eye className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="form-data" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 rounded-lg">
              <FileText className="mr-2 h-4 w-4" />
              Form Data
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 rounded-lg">
              <Users className="mr-2 h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 rounded-lg">
              <History className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 rounded-lg">
              <MessageCircle className="mr-2 h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-rose-600 rounded-lg">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Form Details Card */}
                <Card className="border-2 border-indigo-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Form Details
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Complete information about the submitted form
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Form Title
                        </Label>
                        <p className="font-semibold text-gray-900">{submission.formId?.title || "N/A"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          Department
                        </Label>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 text-sky-700">
                          <Building className="h-3 w-3" />
                          {submission.department?.name || submission.formId?.department?.name || "N/A"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Client Name
                        </Label>
                        <p className="font-semibold text-gray-900">{submission.clinetName || "Not specified"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Submission Date
                        </Label>
                        <p className="font-semibold text-gray-900">{formatDate(submission.createdAt)}</p>
                      </div>
                    </div>
                    
                    {submission.formId?.description && (
                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        <Label className="text-sm text-gray-500">Description</Label>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{submission.formId.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Hierarchy Card */}
                <Card className="border-2 border-sky-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
                        <Workflow className="h-5 w-5 text-white" />
                      </div>
                      Status Hierarchy
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Progress through different approval levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Manager Status */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100 hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Manager</p>
                            <p className="text-sm text-gray-600">You</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(submission.status).bg} text-white border-0 px-3 py-1`}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(submission.status)}
                            <span className="capitalize">{submission.status?.replace("_", " ")}</span>
                          </span>
                        </Badge>
                      </div>

                      {/* Team Lead Status */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-100 hover:border-amber-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                            <Crown className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Team Lead</p>
                            <p className="text-sm text-gray-600">
                              {submission.teamLeadInfo?.assigned?.length > 0 
                                ? submission.teamLeadInfo.assigned.map(tl => tl.name).join(", ")
                                : "Not assigned"}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(submission.status2).bg} text-white border-0 px-3 py-1`}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(submission.status2)}
                            <span className="capitalize">{submission.status2?.replace("_", " ")}</span>
                          </span>
                        </Badge>
                      </div>

                      {/* Employee Statuses */}
                      {submission.employees?.map((employee, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-100 hover:border-emerald-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Employee</p>
                              <p className="text-sm text-gray-600">
                                {employee.employeeId?.name || employee.email}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(employee.status).bg} text-white border-0 px-3 py-1`}>
                            <span className="flex items-center gap-1.5">
                              {getStatusIcon(employee.status)}
                              <span className="capitalize">{employee.status?.replace("_", " ")}</span>
                            </span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Submitted By Card */}
                <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      Submitted By
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 border-2 border-purple-200">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {submission.submittedBy?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-gray-900">{submission.submittedBy?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-600">{submission.submittedBy?.email || "No email"}</p>
                        <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">Manager</Badge>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-700">{session.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-700">Member since {formatDate(session.user.createdAt).split(',')[0]}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Card */}
                <Card className="border-2 border-sky-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-sky-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time Since Creation</span>
                        <span className="font-semibold text-gray-900">{formatRelativeTime(submission.createdAt)}</span>
                      </div>
                      <Progress value={75} className="h-2 bg-gradient-to-r from-sky-500 to-cyan-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-900">
                          {submission.employees?.length || 0}
                        </p>
                        <p className="text-sm text-blue-700 font-medium">Employees</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                        <MessageCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-900">
                          {submission.feedbacks?.employees?.length + submission.feedbacks?.teamLeads?.length || 0}
                        </p>
                        <p className="text-sm text-emerald-700 font-medium">Feedbacks</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Active for 48 hours</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sharing Card */}
                <Card className="border-2 border-indigo-100 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg">
                        <Share2 className="h-5 w-5 text-white" />
                      </div>
                      Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Shared with</span>
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        {submission.sharingInfo?.sharedCount || 0} managers
                      </Badge>
                    </div>
                    
                    {submission.sharingInfo?.sharedWith?.length > 0 && (
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {submission.sharingInfo.sharedWith.map((manager, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Avatar className="h-8 w-8 border border-indigo-200">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                                  {manager.name?.charAt(0) || "M"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{manager.name}</p>
                                <p className="text-xs text-gray-600 truncate">{manager.email}</p>
                              </div>
                              
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    
                    
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Form Data Tab */}
          <TabsContent value="form-data" className="space-y-6">
            <Card className="border-2 border-emerald-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Form Data
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      All submitted form fields and values
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Form Data
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="border-gray-300">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {Object.keys(editableData).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-500">No form data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(editableData).map(([key, value], index) => (
                      <div key={index} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full" />
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        {isEditing ? (
                          <Input
                            value={value || ""}
                            onChange={(e) => setEditableData(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }))}
                            placeholder={`Enter ${key}`}
                            className="border-emerald-200 focus:border-emerald-300 focus:ring-emerald-300"
                          />
                        ) : (
                          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-colors">
                            <p className="text-gray-900">
                              {value === null || value === undefined || value === "" 
                                ? <span className="text-gray-400 italic">Not provided</span> 
                                : value.toString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Leads Card */}
              <Card className="border-2 border-amber-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    Team Leads
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Team leads assigned to this submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {submission.teamLeadInfo?.assigned?.length > 0 ? (
                    <div className="space-y-3">
                      {submission.teamLeadInfo.assigned.map((tl, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-amber-200">
                              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                                {tl.name?.charAt(0) || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-gray-900">{tl.name}</p>
                              <p className="text-sm text-gray-600">{tl.email}</p>
                              <Badge className="mt-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                Primary Lead
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-amber-600 hover:text-amber-700">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                        <Crown className="h-8 w-8 text-amber-600" />
                      </div>
                      <p className="text-gray-500">No team leads assigned</p>
                    </div>
                  )}

                  {submission.teamLeadInfo?.multipleAssigned?.length > 0 && (
                    <div className="pt-4 border-t border-amber-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">Also available to:</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.teamLeadInfo.multipleAssigned.map((tl, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200"
                          >
                            {tl.name?.split(" ")[0]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employees Card */}
              <Card className="border-2 border-sky-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Employees
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Employees working on this submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {submission.employees?.length > 0 ? (
                    <div className="space-y-3">
                      {submission.employees.map((employee, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 hover:border-sky-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-sky-200">
                              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                                {employee.employeeId?.name?.charAt(0) || employee.email?.charAt(0) || "E"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-gray-900">{employee.employeeId?.name || employee.email}</p>
                              <p className="text-sm text-gray-600">{employee.email}</p>
                              <Badge className={`mt-1 ${getStatusColor(employee.status).bg} text-white border-0 text-xs`}>
                                {employee.status?.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-sky-600 hover:text-sky-700">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-sky-600" />
                      </div>
                      <p className="text-gray-500">No employees assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Progress Tracking Card */}
            <Card className="border-2 border-purple-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {submission.employees?.map((employee, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-900">
                          {employee.employeeId?.name || employee.email}
                        </span>
                        <span className={cn(
                          "font-medium",
                          employee.status === 'completed' ? "text-emerald-600" :
                          employee.status === 'in_progress' ? "text-sky-600" :
                          "text-amber-600"
                        )}>
                          {employee.status?.replace("_", " ")}
                        </span>
                      </div>
                      <Progress 
                        value={employee.status === 'completed' ? 100 : 
                               employee.status === 'in_progress' ? 50 : 
                               employee.status === 'pending' ? 10 : 0} 
                        className={cn(
                          "h-2",
                          employee.status === 'completed' ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                          employee.status === 'in_progress' ? "bg-gradient-to-r from-sky-500 to-blue-500" :
                          "bg-gradient-to-r from-amber-500 to-orange-500"
                        )}
                      />
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Assigned: {formatRelativeTime(employee.assignedAt)}
                        </span>
                        {employee.completedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed: {formatRelativeTime(employee.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="border-2 border-amber-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  Activity Timeline
                </CardTitle>
                <CardDescription className="text-gray-600">
                  All activities and events related to this submission
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {timeline.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 via-orange-200 to-amber-200" />
                    <div className="space-y-8">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="relative">
                          <div className={cn(
                            "absolute left-6 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-lg",
                            index === 0 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                            "bg-gradient-to-br from-amber-400 to-orange-400"
                          )} />
                          <div className="ml-12">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">{event.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              </div>
                              <span className="text-sm font-medium text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-full">
                                {formatRelativeTime(event.timestamp)}
                              </span>
                            </div>
                            {event.metadata && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 bg-amber-50 p-2 rounded-lg">
                                <User className="h-3 w-3 text-amber-600" />
                                <span>{event.metadata.sender}</span>
                                {event.type === 'status_change' && (
                                  <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                    Status Update
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                      <History className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-gray-500">No activity timeline available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
           
              {/* Feedback Form */}
              

              {/* Previous Feedback */}
              <Card className="border-2 border-sky-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
                      <History className="h-5 w-5 text-white" />
                    </div>
                    Previous Feedback
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    All feedback provided on this submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {submission.feedbacks?.teamLeads?.map((feedback, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-amber-200">
                                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">
                                  {feedback.teamLeadId?.name?.charAt(0) || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-bold text-gray-900">
                                  {feedback.teamLeadId?.name || "Team Lead"}
                                </span>
                                <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                  Team Lead
                                </Badge>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {formatRelativeTime(feedback.submittedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">{feedback.feedback}</p>
                        </div>
                      ))}

                      {submission.feedbacks?.employees?.map((feedback, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-sky-200">
                                <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-500 text-white text-xs">
                                  {feedback.employeeId?.name?.charAt(0) || "E"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-bold text-gray-900">
                                  {feedback.employeeId?.name || "Employee"}
                                </span>
                                <Badge className="ml-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white text-xs">
                                  Employee
                                </Badge>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {formatRelativeTime(feedback.submittedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">{feedback.feedback}</p>
                        </div>
                      ))}

                      {(submission.feedbacks?.teamLeads?.length === 0 && 
                        submission.feedbacks?.employees?.length === 0) && (
                        <div className="text-center py-8">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="h-8 w-8 text-purple-600" />
                          </div>
                          <p className="text-gray-500">No feedback yet</p>
                          <p className="text-sm text-gray-400 mt-1">Be the first to provide feedback!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-2 border-rose-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Submission Analytics
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Detailed analytics and insights about this submission
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                    <Clock className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-blue-900">48h</p>
                    <p className="text-sm font-medium text-blue-700">Time Since Creation</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 transition-colors">
                    <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-emerald-900">75%</p>
                    <p className="text-sm font-medium text-emerald-700">Overall Progress</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                    <Users className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-purple-900">
                      {submission.employees?.length || 0}
                    </p>
                    <p className="text-sm font-medium text-purple-700">Team Members</p>
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="space-y-6">
                  <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5 text-rose-600" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border-2 border-sky-200 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 hover:border-sky-300 transition-colors">
                      <p className="text-sm text-gray-600 mb-1">Response Time</p>
                      <p className="text-xl font-bold text-sky-900">12h</p>
                    </div>
                    <div className="p-4 border-2 border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:border-emerald-300 transition-colors">
                      <p className="text-sm text-gray-600 mb-1">Feedback Count</p>
                      <p className="text-xl font-bold text-emerald-900">
                        {(submission.feedbacks?.employees?.length || 0) + 
                         (submission.feedbacks?.teamLeads?.length || 0)}
                      </p>
                    </div>
                    <div className="p-4 border-2 border-amber-200 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-300 transition-colors">
                      <p className="text-sm text-gray-600 mb-1">Updates</p>
                      <p className="text-xl font-bold text-amber-900">8</p>
                    </div>
                    <div className="p-4 border-2 border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-300 transition-colors">
                      <p className="text-sm text-gray-600 mb-1">File Attachments</p>
                      <p className="text-xl font-bold text-purple-900">3</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Insight</p>
                      <p className="text-sm text-gray-600">This submission is progressing faster than 80% of similar submissions.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}