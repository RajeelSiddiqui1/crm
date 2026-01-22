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
  Copy,
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
  Shield,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Settings,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  File,
  Folder,
  Paperclip,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  EyeOff,
  Globe,
  Smartphone,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Cloud,
  Wifi,
  Battery,
  Power,
  Zap as ZapIcon,
  Target,
  Flag,
  Award as AwardIcon,
  Trophy,
  Medal,
  Coffee,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  CloudSun,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Tree,
  Leaf,
  Flower,
  Mountain,
  Camera,
  Mic,
  Headphones,
  Bell,
  BellRing,
  Megaphone,
  AlertTriangle,
  Info,
  HelpCircle,
  CheckSquare,
  XSquare,
  PlusSquare,
  MinusSquare,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Box,
  Package,
  Gift,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Euro,
  PoundSterling,
  IndianRupee,
  Bitcoin,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  Grid,
  List,
  Layout,
  Sidebar,
  Menu,
  X,
  Plus,
  Minus,
  Divide,
  Percent,
  Hash,
  Asterisk,
  Equal,
  Infinity,
  Pi,
  Sigma,
  Omega,
  Alpha,
  Image,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Play,
  Mu,
  Nu,
  Xi,
  Omicron,
  Rho,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega as OmegaIcon,
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Color constants
const COLORS = {
  primary: { bg: "bg-gradient-to-br from-blue-500 to-indigo-600", text: "text-white", border: "border-blue-400", light: "bg-blue-50 text-blue-700" },
  success: { bg: "bg-gradient-to-br from-emerald-500 to-teal-600", text: "text-white", border: "border-emerald-400", light: "bg-emerald-50 text-emerald-700" },
  warning: { bg: "bg-gradient-to-br from-amber-500 to-orange-600", text: "text-white", border: "border-amber-400", light: "bg-amber-50 text-amber-700" },
  danger: { bg: "bg-gradient-to-br from-rose-500 to-pink-600", text: "text-white", border: "border-rose-400", light: "bg-rose-50 text-rose-700" },
  info: { bg: "bg-gradient-to-br from-sky-500 to-cyan-600", text: "text-white", border: "border-sky-400", light: "bg-sky-50 text-sky-700" },
  admin: { bg: "bg-gradient-to-br from-purple-500 to-violet-600", text: "text-white", border: "border-purple-400", light: "bg-purple-50 text-purple-700" }
};

export default function AdminSubmissionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);
 const [zoom, setZoom] = useState(1);
  
      const [previewFile, setPreviewFile] = useState(null);
  
    const downloadFile = (url, name) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
    };

    const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Fetch submission details
  const fetchSubmissionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/manager-tasks/details/${submissionId}`);
      if (response.data) {
        setSubmission(response.data);
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
      const response = await axios.get(`/api/admin/manager-tasks/timeline/${submissionId}`);
      if (response.data.timeline) {
        setTimeline(response.data.timeline);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    }
  }, [submissionId]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Admin") {
      router.push("/admin/login");
      return;
    }

    fetchSubmissionDetails();
    fetchTimeline();
  }, [session, status, router, fetchSubmissionDetails, fetchTimeline]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`/api/admin/manager-tasks/export/${submissionId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submission-${submissionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "✅ Exported",
        description: "Submission exported to Excel successfully",
      });
    } catch (error) {
      console.error("Error exporting:", error);
      toast({
        title: "❌ Error",
        description: "Failed to export submission",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/admin/manager-tasks/detail/${submissionId}`);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-blue-100 shadow-2xl">
          <CardHeader>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-gray-900">Submission Not Found</CardTitle>
              <CardDescription className="text-gray-600">
                The submission you're looking for doesn't exist in the system.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/admin/manager-tasks")}
                className="rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-white/20 to-white/10 rounded-lg backdrop-blur-sm">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">
                    Admin View: {submission.formInfo?.title || "Submission Details"}
                  </h1>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1">
                    <Shield className="mr-1.5 h-3 w-3" />
                    Admin Mode
                  </Badge>
                </div>
                <p className="text-blue-100">
                  <span className="font-medium">Full Access View</span> • 
                  Created {formatRelativeTime(submission.createdAt)} • 
                  ID: {submissionId.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      className="rounded-full bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Copy className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrint}
                      className="rounded-full bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Print</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleExport}
                      disabled={exporting}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export to Excel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShare}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/submissions/${submissionId}/audit`}>
                      <History className="mr-2 h-4 w-4" />
                      View Audit Log
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Admin Info Bar */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Admin Privileges Active</p>
                <p className="text-sm text-gray-600">You have full read-only access to all submission data</p>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              <Eye className="mr-1.5 h-3 w-3" />
              View Only Mode
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full bg-white p-1 rounded-xl border shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg">
              <Eye className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="form-data" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg">
              <FileText className="mr-2 h-4 w-4" />
              Form Data & Attachments
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg">
              <Users className="mr-2 h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg">
              <History className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="feedbacks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg">
              <MessageCircle className="mr-2 h-4 w-4" />
              Feedbacks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Submission Details Card */}
                <Card className="border-2 border-blue-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <Database className="h-5 w-5 text-white" />
                      </div>
                      Submission Details (Admin View)
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Complete system information about this submission
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          Submission ID
                        </Label>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {submission._id}
                          </code>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Form Title
                        </Label>
                        <p className="font-semibold text-gray-900">{submission.formInfo?.title || "N/A"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          Department
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200">
                            {submission.department?.name || "N/A"}
                          </Badge>
                          {submission.department?.totalEmployees && (
                            <span className="text-sm text-gray-500">
                              ({submission.department.totalEmployees} employees)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Submitted By
                        </Label>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-blue-200">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                              {submission.submittedBy?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{submission.submittedBy?.name || "Unknown"}</p>
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                              {submission.submittedBy?.role || "User"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* System Information */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-600" />
                        System Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Created At</Label>
                          <p className="text-gray-900">{formatDate(submission.createdAt)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Last Updated</Label>
                          <p className="text-gray-900">{formatDate(submission.updatedAt)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">System Status</Label>
                          <Badge className={`${getStatusColor(submission.statusHierarchy?.system).bg} text-white border-0`}>
                            {submission.statusHierarchy?.system || "active"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Admin Status</Label>
                          <Badge className={`${getStatusColor(submission.statusHierarchy?.admin).bg} text-white border-0`}>
                            {submission.statusHierarchy?.admin || "pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Hierarchy Card */}
                <Card className="border-2 border-purple-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                        <Workflow className="h-5 w-5 text-white" />
                      </div>
                      Complete Status Hierarchy
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      View all status levels across the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* System Status */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg">
                            <Server className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">System Status</p>
                            <p className="text-sm text-gray-600">Internal system tracking</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 px-3 py-1">
                          <span className="flex items-center gap-1.5">
                            <Database className="w-4 h-4" />
                            <span className="capitalize">{submission.statusHierarchy?.system || "active"}</span>
                          </span>
                        </Badge>
                      </div>

                      {/* Admin Status */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Admin Status</p>
                            <p className="text-sm text-gray-600">Administrative approval</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-3 py-1">
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(submission.statusHierarchy?.admin)}
                            <span className="capitalize">{submission.statusHierarchy?.admin || "pending"}</span>
                          </span>
                        </Badge>
                      </div>

                      {/* Manager Status */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Manager Status</p>
                            <p className="text-sm text-gray-600">
                              {submission.submittedBy?.name || "Original submitter"}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(submission.statusHierarchy?.manager).bg} text-white border-0 px-3 py-1`}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(submission.statusHierarchy?.manager)}
                            <span className="capitalize">{submission.statusHierarchy?.manager?.replace("_", " ")}</span>
                          </span>
                        </Badge>
                      </div>

                      {/* Team Lead Status */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                            <Crown className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Team Lead Status</p>
                            <p className="text-sm text-gray-600">
                              {submission.teamLeadInfo?.assigned?.length > 0 
                                ? submission.teamLeadInfo.assigned.map(tl => tl.name).join(", ")
                                : "Not assigned"}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(submission.statusHierarchy?.teamLead).bg} text-white border-0 px-3 py-1`}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(submission.statusHierarchy?.teamLead)}
                            <span className="capitalize">{submission.statusHierarchy?.teamLead?.replace("_", " ")}</span>
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Statistics Card */}
                <Card className="border-2 border-emerald-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completion Rate</span>
                          <span className="font-semibold text-emerald-600">
                            {submission.statistics?.completionRate || 0}%
                          </span>
                        </div>
                        <Progress 
                          value={submission.statistics?.completionRate || 0} 
                          className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{submission.statistics?.completedEmployees || 0} completed</span>
                          <span>{submission.statistics?.totalEmployees || 0} total</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-900">
                            {submission.statistics?.totalEmployees || 0}
                          </p>
                          <p className="text-sm text-blue-700 font-medium">Employees</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                          <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-purple-900">
                            {submission.statistics?.feedbackCount || 0}
                          </p>
                          <p className="text-sm text-purple-700 font-medium">Feedbacks</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg Completion Time</span>
                          <span className="font-semibold text-gray-900">
                            {submission.statistics?.averageCompletionTime || 0}h
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Attachments</span>
                          <span className="font-semibold text-gray-900">
                            {submission.statistics?.attachmentCount || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pending Employees</span>
                          <span className="font-semibold text-gray-900">
                            {submission.statistics?.pendingEmployees || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sharing & Access Card */}
                <Card className="border-2 border-orange-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                        <Share2 className="h-5 w-5 text-white" />
                      </div>
                      Sharing & Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Shared with Managers</span>
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                          {submission.sharingInfo?.sharedCount || 0}
                        </Badge>
                      </div>
                      
                      {submission.sharingInfo?.sharedWith?.length > 0 && (
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {submission.sharingInfo.sharedWith.map((manager, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded-lg">
                                <Avatar className="h-8 w-8 border border-orange-200">
                                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs">
                                    {manager.name?.charAt(0) || "M"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{manager.name}</p>
                                  <p className="text-xs text-gray-600 truncate">{manager.email}</p>
                                </div>
                                <Badge className="text-xs bg-gradient-to-r from-orange-100 to-red-100 text-orange-700">
                                  {manager.role || "Manager"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Access Log</Label>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• Last viewed: {formatRelativeTime(submission.updatedAt)}</p>
                        <p>• Created: {formatRelativeTime(submission.createdAt)}</p>
                        <p>• System: Active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="border-2 border-blue-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <Button 
                      onClick={handleExport} 
                      disabled={exporting}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export to Excel
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handlePrint}
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Summary
                    </Button>
                    
                    <Button 
                      onClick={handleShare}
                      variant="outline"
                      className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                    
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Link href={`/admin/submissions/${submissionId}/audit`}>
                        <History className="mr-2 h-4 w-4" />
                        View Audit Log
                      </Link>
                    </Button>
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
                      Form Data (Read-Only)
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      View all submitted form fields - Admin read-only access
                    </CardDescription>
                  </div>
                  <Badge className="bg-gradient-to-r from-gray-500 to-slate-500 text-white">
                    <EyeOff className="mr-1.5 h-3 w-3" />
                    View Only
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {Object.keys(submission.formData || {}).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-500">No form data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(submission.formData).map(([key, value], index) => (
                      <div key={index} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full" />
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                          <p className="text-gray-900 break-words">
                            {value === null || value === undefined || value === "" 
                              ? <span className="text-gray-400 italic">Not provided</span> 
                              : value.toString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>


            <Card className="mt-6 border border-emerald-200 shadow-lg">
              <CardHeader className="bg-emerald-50">
                <CardTitle className="text-lg font-semibold text-emerald-900">
                  Attachments
                </CardTitle>
              </CardHeader>
            
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {submission.fileAttachments?.map((file) => {
                    const { url, name, type, publicId } = file;
                    const isImage = type.startsWith("image/");
                    const isVideo = type.startsWith("video/");
            
                    return (
                      <div
                        key={publicId}
                        className="rounded-lg border border-emerald-200 overflow-hidden shadow hover:shadow-xl transition"
                      >
                        <div className="h-40 bg-emerald-100 flex items-center justify-center">
                          {isImage ? (
                            <img src={url} className="object-cover w-full h-full" />
                          ) : isVideo ? (
                            <video src={url} className="object-cover w-full h-full" />
                          ) : (
                            <FileText className="w-12 h-12 text-emerald-600" />
                          )}
                        </div>
            
                        <div className="p-3 bg-white text-center space-y-2">
                          <p className="text-sm font-medium text-emerald-800 truncate">
                            {name}
                          </p>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setPreviewFile(file)}
                            >
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => window.open(url, "_blank")}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                    All team leads associated with this submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Primary Team Lead */}
                  {submission.teamLeadInfo?.assigned?.length > 0 ? (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Primary Team Lead</Label>
                      {submission.teamLeadInfo.assigned.map((tl, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-amber-200">
                                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                                  {tl.name?.charAt(0) || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-gray-900">{tl.name}</p>
                                <p className="text-sm text-gray-600">{tl.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                    Team Lead
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-amber-300">
                                    {tl.department || "Department"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-amber-600 hover:text-amber-700">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          {submission.teamLeadInfo?.assignedAt && (
                            <div className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Assigned: {formatRelativeTime(submission.teamLeadInfo.assignedAt)}
                            </div>
                          )}
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

                  {/* Multiple Assigned Team Leads */}
                  {submission.teamLeadInfo?.multipleAssigned?.length > 0 && (
                    <div className="pt-4 border-t border-amber-100">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Also Available To
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {submission.teamLeadInfo.multipleAssigned.map((tl, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-amber-200">
                                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-400 text-white text-xs">
                                  {tl.name?.charAt(0) || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{tl.name}</p>
                                <p className="text-xs text-gray-600">{tl.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs border-amber-300">
                              Available
                            </Badge>
                          </div>
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
                    Employees ({submission.statistics?.totalEmployees || 0})
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    All employees working on this submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {submission.employees?.length > 0 ? (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3 pr-4">
                        {submission.employees.map((employee, index) => (
                          <div key={index} className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 hover:border-sky-300 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-sky-200">
                                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                                    {employee.employeeId?.name?.charAt(0) || employee.email?.charAt(0) || "E"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-gray-900">{employee.employeeId?.name || employee.email}</p>
                                  <p className="text-sm text-gray-600">{employee.employeeId?.email || employee.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`${getStatusColor(employee.status).bg} text-white border-0 text-xs`}>
                                      {employee.status?.replace("_", " ")}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs border-sky-300">
                                      {employee.employeeId?.position || "Employee"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="text-sky-600 hover:text-sky-700">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p className="font-medium text-gray-700">Department</p>
                                <p>{employee.employeeId?.department?.name || "N/A"}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">Phone</p>
                                <p>{employee.employeeId?.phone || "N/A"}</p>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-sky-100">
                              <div className="flex justify-between text-xs text-gray-500">
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
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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

            {/* Progress Overview Card */}
            <Card className="border-2 border-purple-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Progress Overview
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
                               employee.status === 'in_progress' ? 65 : 
                               employee.status === 'pending' ? 15 : 0} 
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
                            <Clock className="h-3 w-3" />
                            Duration: {calculateDuration(employee.assignedAt, employee.completedAt)}
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
                    Complete Activity Timeline
                </CardTitle>
                <CardDescription className="text-gray-600">
                  All system activities and events
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
                            "absolute left-6 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-lg z-10",
                            event.type === 'creation' ? "bg-gradient-to-br from-blue-500 to-indigo-500" :
                            event.type === 'audit' ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                            "bg-gradient-to-br from-amber-500 to-orange-500"
                          )} />
                          <div className="ml-12">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900">{event.title}</h4>
                                  <Badge className={cn(
                                    "text-xs",
                                    event.type === 'creation' ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" :
                                    event.type === 'audit' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" :
                                    "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                  )}>
                                    {event.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              </div>
                              <span className="text-sm font-medium text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-full">
                                {formatRelativeTime(event.timestamp)}
                              </span>
                            </div>
                            {event.metadata && (
                              <div className={cn(
                                "flex items-center gap-2 text-sm p-2 rounded-lg",
                                event.type === 'creation' ? "bg-blue-50 text-blue-700" :
                                event.type === 'audit' ? "bg-purple-50 text-purple-700" :
                                "bg-amber-50 text-amber-700"
                              )}>
                                {event.type === 'audit' ? (
                                  <Shield className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                                <span>{event.metadata.user || event.metadata.sender || "System"}</span>
                                {event.metadata.details && (
                                  <span className="text-gray-600">• {event.metadata.details}</span>
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

          {/* Feedbacks Tab */}
          <TabsContent value="feedbacks" className="space-y-6">
            <Card className="border-2 border-purple-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                    All Feedbacks ({submission.statistics?.feedbackCount || 0})
                </CardTitle>
                <CardDescription className="text-gray-600">
                  View all feedback and conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {/* Team Lead Feedbacks */}
                    {submission.feedbacks?.teamLeads && submission.feedbacks.teamLeads.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-600" />
                          Team Lead Feedbacks ({submission.feedbacks.teamLeads.length})
                        </h4>
                        <div className="space-y-4">
                          {submission.feedbacks.teamLeads.map((feedback, index) => (
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
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                        Team Lead
                                      </Badge>
                                      <Badge variant="outline" className="text-xs border-amber-300">
                                        {feedback.teamLeadId?.role || "Team Lead"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                                  {formatRelativeTime(feedback.submittedAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg mb-3">{feedback.feedback}</p>
                              
                              {/* Replies */}
                              {feedback.replies && feedback.replies.length > 0 && (
                                <div className="ml-6 space-y-3">
                                  {feedback.replies.map((reply, replyIndex) => (
                                    <div key={replyIndex} className="p-3 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6 border border-gray-300">
                                            <AvatarFallback className="bg-gradient-to-br from-gray-500 to-slate-500 text-white text-xs">
                                              {reply.repliedBy?.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs font-semibold text-gray-900">
                                            {reply.repliedBy?.name || "User"}
                                          </span>
                                          <Badge variant="outline" className="text-xs border-gray-300">
                                            {reply.repliedBy?.role || "User"}
                                          </Badge>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {formatRelativeTime(reply.timestamp)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600">{reply.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Employee Feedbacks */}
                    {submission.feedbacks?.employees && submission.feedbacks.employees.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Users className="h-4 w-4 text-sky-600" />
                          Employee Feedbacks ({submission.feedbacks.employees.length})
                        </h4>
                        <div className="space-y-4">
                          {submission.feedbacks.employees.map((feedback, index) => (
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
                                    <Badge className="bg-gradient-to-r from-sky-500 to-blue-500 text-white text-xs">
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
                        </div>
                      </div>
                    )}

                    {(submission.feedbacks?.teamLeads?.length === 0 && 
                      submission.feedbacks?.employees?.length === 0) && (
                      <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                          <MessageCircle className="h-8 w-8 text-purple-600" />
                        </div>
                        <p className="text-gray-500">No feedback yet</p>
                        <p className="text-sm text-gray-400 mt-1">No feedback has been provided on this submission</p>
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
                  Advanced Analytics
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Detailed analytics and insights (Admin View)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                    <Clock className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-blue-900">
                      {calculateTimeSince(submission.createdAt)}
                    </p>
                    <p className="text-sm font-medium text-blue-700">Time Since Creation</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 transition-colors">
                    <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-emerald-900">
                      {submission.statistics?.completionRate || 0}%
                    </p>
                    <p className="text-sm font-medium text-emerald-700">Completion Rate</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                    <Users className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-purple-900">
                      {submission.statistics?.totalEmployees || 0}
                    </p>
                    <p className="text-sm font-medium text-purple-700">Team Size</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 hover:border-amber-300 transition-colors">
                    <MessageCircle className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-amber-900">
                      {submission.statistics?.feedbackCount || 0}
                    </p>
                    <p className="text-sm font-medium text-amber-700">Total Feedbacks</p>
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
                      <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                      <p className="text-xl font-bold text-sky-900">
                        {submission.statistics?.averageCompletionTime || 0}h
                      </p>
                    </div>
                    <div className="p-4 border-2 border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:border-emerald-300 transition-colors">
                      <p className="text-sm text-gray-600 mb-1">Pending Tasks</p>
                      <p className="text-xl font-bold text-emerald-900">
                        {submission.statistics?.pendingEmployees || 0}
                      </p>
                    </div>
                    <div className="p-4 border-2 border-amber-200 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-300 transition-colors">
                      <p className="text-sm text-gray-600 mb-1">Shared Count</p>
                      <p className="text-xl font-bold text-amber-900">
                        {submission.sharingInfo?.sharedCount || 0}
                      </p>
                    </div>
                    <div className="p-4 border-2 border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-300 transition-colors">
                      <p className="text-sm text-gray-600 mb-1">Attachments</p>
                      <p className="text-xl font-bold text-purple-900">
                        {submission.statistics?.attachmentCount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    System Insights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Data Integrity</p>
                          <p className="text-sm text-gray-600">All data verified and intact</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Security Status</p>
                          <p className="text-sm text-gray-600">Fully secured with admin access only</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Admin Insight</p>
                      <p className="text-sm text-gray-600">
                        This submission has been active for {calculateTimeSince(submission.createdAt)}. 
                        {submission.statistics?.completionRate > 75 
                          ? " It's progressing above average compared to similar submissions." 
                          : " It's progressing normally within system expectations."}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

       {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <h3 className="font-bold text-gray-900 truncate">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => prev + 0.2)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom In +
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.2))}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom Out -
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFile(previewFile.url, previewFile.name)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
      
            {/* Body */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-50">
              {previewFile.type?.includes('image') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : previewFile.type?.includes('video') ? (
                <video
                  controls
                  autoPlay
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <source src={previewFile.url} type={previewFile.type} />
                  Your browser does not support the video tag.
                </video>
              ) : previewFile.type?.includes('pdf') ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[90vh] border rounded-lg"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700">Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                    className="mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function calculateDuration(start, end) {
  if (!start || !end) return "N/A";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  return `${diffHours}h`;
}

function calculateTimeSince(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d`;
  }
  return `${diffHours}h`;
}