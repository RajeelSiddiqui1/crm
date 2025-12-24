// app/teamlead/tasks/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ShareTaskDialog from "@/components/teamlead/ShareTaskDialog";
import FeedbackSystem from "@/components/teamlead/FeedbackSystem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  Mail,
  Phone,
  Briefcase,
  Loader2,
  Send,
  RefreshCw,
  MessageSquare,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Building,
  Eye,
  MoreVertical,
  Download,
  Copy,
  Bell,
  Star,
  BarChart3,
  FolderOpen,
  Shield,
  Activity,
  Target,
  Award,
  Zap,
  ThumbsUp,
  AlertTriangle,
  Info,
  HelpCircle,
  Menu,
  Globe,
  Share2,
  Users2,
  UserPlus,
  FileSpreadsheet,
  History,
  ClipboardCheck,
  TrendingUp,
  PieChart,
  Filter,
  SortAsc,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  CreditCard,
  FileCode,
  Tag,
  Hash,
  Lock,
  Unlock,
  Sparkles,
  MessageCircle,
  Reply,
  Edit,
} from "lucide-react";
import axios from "axios";

export default function TeamLeadTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [managerDetails, setManagerDetails] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);
  const [currentTeamLead, setCurrentTeamLead] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showTeamLeadsModal, setShowTeamLeadsModal] = useState(false);
  const [employeeFeedback, setEmployeeFeedback] = useState({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [selectedEmployeeForFeedback, setSelectedEmployeeForFeedback] =
    useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }
    fetchTaskDetails();
    fetchAllEmployees();
  }, [session, status, router, taskId]);

  useEffect(() => {
    if (task) {
      calculateProgress();
      calculateStats();
    }
  }, [task]);

  const calculateProgress = () => {
    if (!task?.assignedEmployees?.length) {
      setProgress(0);
      return;
    }
    const completed = task.assignedEmployees.filter(
      (emp) => emp.status === "completed"
    ).length;
    const total = task.assignedEmployees.length;
    setProgress(Math.round((completed / total) * 100));
  };

  const calculateStats = () => {
    if (!task?.assignedEmployees) return;

    const stats = {
      totalEmployees: task.assignedEmployees.length,
      completed: task.assignedEmployees.filter((e) => e.status === "completed")
        .length,
      inProgress: task.assignedEmployees.filter(
        (e) => e.status === "in_progress"
      ).length,
      pending: task.assignedEmployees.filter((e) => e.status === "pending")
        .length,
      rejected: task.assignedEmployees.filter((e) => e.status === "rejected")
        .length,
    };

    setStats(stats);
  };

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/teamlead/tasks/${taskId}`);
      if (response.status === 200) {
        setTask(response.data.task);
        setManagerDetails(response.data.managerDetails);
        setTeamLeads(response.data.teamLeads || []);
        setCurrentTeamLead(response.data.currentTeamLead);
        setNewStatus(response.data.task.status2);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
        router.push("/login");
      } else if (error.response?.status === 403) {
        toast.error("Access denied");
        router.push("/teamlead/tasks");
      } else if (error.response?.status === 404) {
        toast.error("Task not found");
        router.push("/teamlead/tasks");
      } else {
        toast.error(error.response?.data?.error || "Failed to load task");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await axios.get("/api/teamlead/employees");
      if (response.status === 200) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await axios.post(
        `/api/teamlead/tasks/${taskId}/feedback`,
        { feedback: newFeedback }
      );

      if (response.status === 201) {
        toast.success("Feedback added successfully!");
        setNewFeedback("");
        setShowFeedbackModal(false);
        fetchTaskDetails(); // Refresh task data
      }
    } catch (error) {
      console.error("Add feedback error:", error);
      toast.error(error.response?.data?.error || "Failed to add feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!task || !newStatus) return;
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        teamLeadFeedback: feedback || `Status changed to ${newStatus}`,
      };
      const response = await axios.put(
        `/api/teamlead/tasks/${taskId}`,
        updateData
      );
      if (response.status === 200) {
        toast.success("✅ Task status updated successfully!");
        setTask(response.data.task);
        setFeedback("");
        setTimeout(() => {
          toast.info("📧 Notifications sent to Manager & Employees");
        }, 500);
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignEmployees = async () => {
    if (!task || selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }
    setAssigning(true);
    try {
      const updateData = {
        assignedEmployees: selectedEmployees,
      };
      const response = await axios.put(
        `/api/teamlead/tasks/${taskId}`,
        updateData
      );
      if (response.status === 200) {
        toast.success(
          `🎯 Assigned ${selectedEmployees.length} employee(s) successfully!`
        );
        setTask(response.data.task);
        setSelectedEmployees([]);
        setShowAssignDialog(false);
        setTimeout(() => {
          toast.info("📨 Assignment emails sent to employees");
        }, 500);
      }
    } catch (error) {
      console.error("Assign employees error:", error);
      toast.error(error.response?.data?.error || "Failed to assign employees");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove) return;
    setRemoving(true);
    try {
      const response = await axios.put(`/api/teamlead/tasks/${taskId}`, {
        removeEmployeeId: employeeToRemove._id,
      });
      if (response.status === 200) {
        toast.success(`✅ Employee removed successfully!`);
        setTask(response.data.task);
        setEmployeeToRemove(null);
        setShowRemoveDialog(false);
        setTimeout(() => {
          toast.info("📧 Removal notification sent to employee");
        }, 500);
      }
    } catch (error) {
      console.error("Remove employee error:", error);
      toast.error(error.response?.data?.error || "Failed to remove employee");
    } finally {
      setRemoving(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-gradient-to-r from-emerald-500 to-green-600 text-white";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-600 text-white";
      case "pending":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      case "rejected":
        return "bg-gradient-to-r from-rose-500 to-red-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />;
      case "in_progress":
        return <Clock className="w-4 h-4 md:w-5 md:h-5" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />;
      case "rejected":
        return <XCircle className="w-4 h-4 md:w-5 md:h-5" />;
      default:
        return <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />;
    }
  };

  const getEmployeeStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAvailableEmployees = () => {
    if (!task || !Array.isArray(employees)) return employees;
    const assignedEmployeeIds =
      task.assignedEmployees?.map(
        (emp) => emp.employeeId?._id?.toString() || emp.employeeId.toString()
      ) || [];
    return employees.filter(
      (emp) => !assignedEmployeeIds.includes(emp._id.toString())
    );
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

  const formatRelativeDate = (dateString) => {
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
      return formatDate(dateString);
    }
  };

  const copyTaskId = () => {
    navigator.clipboard.writeText(task?._id || "");
    toast.success("Task ID copied to clipboard!");
  };

  const getTaskPriority = () => {
    if (!task?.assignedEmployees?.length) return "Low";
    const pendingCount = task.assignedEmployees.filter(
      (emp) => emp.status === "pending"
    ).length;
    if (pendingCount > 3) return "High";
    if (pendingCount > 1) return "Medium";
    return "Low";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-500";
      case "Medium":
        return "bg-amber-500";
      case "Low":
        return "bg-emerald-500";
      default:
        return "bg-gray-500";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mx-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 md:w-20 md:h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-gray-800">
            Loading Task Details
          </h3>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Fetching the latest information...
          </p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return null;
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-rose-100 mb-4">
                <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-rose-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Task Not Found
              </h2>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                The requested task could not be found or you don't have access
                to it.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/teamlead/tasks")}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg text-sm md:text-base"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Tasks Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchTaskDetails}
                  className="w-full text-sm md:text-base"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredEmployees = getAvailableEmployees().filter(
    (emp) =>
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-white text-gray-900 border border-gray-200 shadow-lg",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/teamlead/tasks")}
                className="hover:bg-gray-100 md:flex hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-base md:text-lg font-semibold text-gray-900">
                  Task Management
                </h1>
                <p className="text-xs md:text-sm text-gray-500">
                  Team Lead Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTaskDetails}
                      className="gap-2 text-gray-900 bg-white hidden sm:flex"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                      />
                      <span className="hidden md:inline">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh task data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-gray-300 bg-white text-gray-900 font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">Add Feedback</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignDialog(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-gray-300 bg-white text-gray-900 font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
              >
                <UserPlus className="w-4 h-4 text-orange-600" />
                <span className="hidden md:inline">Assign Employee</span>
              </Button>

              {/* Share Team Lead Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                disabled={
                  !task?.assignedTo?.some(
                    (tl) => tl._id === currentTeamLead?._id
                  )
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-gray-300 bg-white text-gray-900 font-medium shadow-sm transition-all duration-200 
      ${
        task?.assignedTo?.some((tl) => tl._id === currentTeamLead?._id)
          ? "hover:shadow-md hover:bg-gray-50"
          : "opacity-50 cursor-not-allowed"
      }`}
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">Share Team Lead</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-gray-900 bg-white"
                  >
                    <MoreVertical className="w-4 h-4" />
                    <span className="hidden md:inline">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white text-gray-900 shadow-xl"
                >
                  <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={copyTaskId}
                    className="cursor-pointer"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Task ID
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowManagerModal(true)}
                    className="cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Manager Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowTeamLeadsModal(true)}
                    className="cursor-pointer"
                  >
                    <Users2 className="w-4 h-4 mr-2" />
                    View Team Leads
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 md:gap-2 mb-4 md:mb-6 text-xs md:text-sm overflow-x-auto pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/teamlead/dashboard")}
            className="text-gray-600 hover:text-gray-900 whitespace-nowrap text-xs md:text-sm"
          >
            Dashboard
          </Button>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/teamlead/tasks")}
            className="text-gray-900 bg-white whitespace-nowrap text-xs md:text-sm"
          >
            Tasks
          </Button>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate max-w-[120px] md:max-w-xs text-xs md:text-sm">
            {task.formId?.title || "Task Details"}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Task Header Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge
                        className={`${getStatusVariant(
                          task.status2
                        )} font-semibold px-2 py-1 md:px-3 text-xs md:text-sm`}
                      >
                        {getStatusIcon(task.status2)}
                        <span className="ml-1">
                          {task.status2.replace("_", " ")}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs md:text-sm"
                      >
                        <Target className="w-3 h-3 mr-1" />
                        {getTaskPriority()} Priority
                      </Badge>
                      {task.depId && (
                        <Badge variant="outline" className="text-xs md:text-sm">
                          <Building className="w-3 h-3 mr-1" />
                          {task.depId.name}
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
                      Client:{" "}
                      <span className="text-blue-600">
                        {task.clinetName || "No Client"}
                      </span>
                    </h1>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-3">
                      {task.formId?.title || "Untitled Form"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-1 md:gap-2 text-gray-500">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        Created: {formatDate(task.createdAt)}
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 text-gray-500">
                        <User className="w-3 h-3 md:w-4 md:h-4" />
                        By: {task.submittedBy?.firstName}{" "}
                        {task.submittedBy?.lastName}
                      </div>
                      {task.completedAt && (
                        <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                          Completed: {formatDate(task.completedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyTaskId}
                            className="border-gray-300 hover:bg-gray-100 text-gray-900 bg-white"
                          >
                            <Copy className="w-4 h-4 md:w-5 md:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy Task ID</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManagerModal(true)}
                      className="text-gray-900 bg-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Manager
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
         <TabsList className="grid grid-cols-5 p-1 rounded-lg bg-gray-100 gap-1">
    {/* Overview Tab */}
    <TabsTrigger
      value="overview"
      className={`
        rounded-md 
        text-gray-600 
        text-xs md:text-sm 
        font-medium
        transition-all duration-200
        hover:bg-gray-200
        data-[state=active]:bg-blue-500
        data-[state=active]:text-white
        data-[state=active]:shadow-md
        px-3 py-2
        flex items-center justify-center gap-1 md:gap-2
        whitespace-nowrap
      `}
    >
      <BarChart3 className="w-3 h-3 md:w-4 md:h-4 data-[state=active]:text-white text-gray-700" />
      <span className="truncate">Overview</span>
    </TabsTrigger>

    {/* Team Tab */}
    <TabsTrigger
      value="team"
      className={`
        rounded-md 
        text-gray-600 
        text-xs md:text-sm 
        font-medium
        transition-all duration-200
        hover:bg-gray-200
        data-[state=active]:bg-green-500
        data-[state=active]:text-white
        data-[state=active]:shadow-md
        px-3 py-2
        flex items-center justify-center gap-1 md:gap-2
        whitespace-nowrap
      `}
    >
      <Users className="w-3 h-3 md:w-4 md:h-4 data-[state=active]:text-white text-gray-700" />
      <span className="truncate">
        Team ({task.assignedEmployees?.length || 0})
      </span>
    </TabsTrigger>

    {/* Details Tab */}
    <TabsTrigger
      value="details"
      className={`
        rounded-md 
        text-gray-600 
        text-xs md:text-sm 
        font-medium
        transition-all duration-200
        hover:bg-gray-200
        data-[state=active]:bg-purple-500
        data-[state=active]:text-white
        data-[state=active]:shadow-md
        px-3 py-2
        flex items-center justify-center gap-1 md:gap-2
        whitespace-nowrap
      `}
    >
      <FileText className="w-3 h-3 md:w-4 md:h-4 data-[state=active]:text-white text-gray-700" />
      <span className="truncate">Details</span>
    </TabsTrigger>

    {/* Updates Tab */}
    <TabsTrigger
      value="updates"
      className={`
        rounded-md 
        text-gray-600 
        text-xs md:text-sm 
        font-medium
        transition-all duration-200
        hover:bg-gray-200
        data-[state=active]:bg-yellow-500
        data-[state=active]:text-white
        data-[state=active]:shadow-md
        px-3 py-2
        flex items-center justify-center gap-1 md:gap-2
        whitespace-nowrap
      `}
    >
      <Activity className="w-3 h-3 md:w-4 md:h-4 data-[state=active]:text-white text-gray-700" />
      <span className="truncate">Updates</span>
    </TabsTrigger>

    {/* Feedback Tab */}
    <TabsTrigger
      value="feedback"
      className={`
        rounded-md 
        text-gray-600 
        text-xs md:text-sm 
        font-medium
        transition-all duration-200
        hover:bg-gray-200
        data-[state=active]:bg-indigo-500
        data-[state=active]:text-white
        data-[state=active]:shadow-md
        px-3 py-2
        flex items-center justify-center gap-1 md:gap-2
        whitespace-nowrap
      `}
    >
      <MessageSquare className="w-3 h-3 md:w-4 md:h-4 data-[state=active]:text-white text-gray-700" />
      <span className="truncate">
        Feedback ({task.teamLeadFeedbacks?.length || 0})
      </span>
    </TabsTrigger>
  </TabsList>

              {/* Overview Tab */}
              <TabsContent
                value="overview"
                className="space-y-4 md:space-y-6 pt-4 md:pt-6"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-700">
                            Completed
                          </p>
                          <p className="text-2xl md:text-3xl font-bold text-emerald-900 mt-1">
                            {stats.completed}
                          </p>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">
                            In Progress
                          </p>
                          <p className="text-2xl md:text-3xl font-bold text-blue-900 mt-1">
                            {stats.inProgress}
                          </p>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-amber-700">
                            Pending
                          </p>
                          <p className="text-2xl md:text-3xl font-bold text-amber-900 mt-1">
                            {stats.pending}
                          </p>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-red-50">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-rose-700">
                            Rejected
                          </p>
                          <p className="text-2xl md:text-3xl font-bold text-rose-900 mt-1">
                            {stats.rejected}
                          </p>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rose-100 flex items-center justify-center">
                          <XCircle className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Section */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-900">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Overall Completion
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {progress}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">
                            Team Performance
                          </h4>
                          <div className="space-y-2">
                            {[
                              "completed",
                              "in_progress",
                              "pending",
                              "rejected",
                            ].map((status) => {
                              const count = stats[status] || 0;
                              const percentage =
                                stats.totalEmployees > 0
                                  ? Math.round(
                                      (count / stats.totalEmployees) * 100
                                    )
                                  : 0;

                              return (
                                <div
                                  key={status}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        status === "completed"
                                          ? "bg-emerald-500"
                                          : status === "in_progress"
                                          ? "bg-blue-500"
                                          : status === "pending"
                                          ? "bg-amber-500"
                                          : "bg-rose-500"
                                      }`}
                                    ></div>
                                    <span className="text-sm text-gray-600 capitalize">
                                      {status.replace("_", " ")}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">
                            Task Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Total Employees
                              </span>
                              <span className="font-medium text-blue-900">
                                {stats.totalEmployees}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Department</span>
                              <span className="font-medium text-blue-900">
                                {task.depId?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Form Type</span>
                              <span className="font-medium text-blue-900">
                                {task.formId?.title || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Last Updated
                              </span>
                              <span className="font-medium text-blue-900">
                                {formatRelativeDate(task.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg text-gray-900">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4 gap-2"
                        onClick={() => setShowAssignDialog(true)}
                      >
                        <UserPlus className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm text-gray-900">
                          Assign Employee
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4 gap-2"
                        onClick={() => setShowFeedbackModal(true)}
                      >
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-900">
                          Add Feedback
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4 gap-2"
                        onClick={() => setActiveTab("updates")}
                      >
                        <Send className="w-5 h-5 text-amber-600" />
                        <span className="text-sm text-gray-900">
                          Update Status
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4 gap-2"
                        onClick={() => setShowTeamLeadsModal(true)}
                      >
                        <Users2 className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-gray-900">
                          Team Leads
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent
                value="team"
                className="space-y-4 md:space-y-6 pt-4 md:pt-6"
              >
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-900">
                          <Users className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                          Assigned Team Members
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-sm md:text-base">
                          {task.assignedEmployees?.length || 0} team member
                          {task.assignedEmployees?.length !== 1 ? "s" : ""}{" "}
                          currently assigned
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowAssignDialog(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-sm md:text-base"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Team Member
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {task.assignedEmployees?.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {task.assignedEmployees.map((assignment) => {
                            const employee = assignment.employeeId;

                            return (
                              <Card
                                key={assignment._id}
                                className="border hover:shadow-md transition-all"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <Avatar className="w-10 h-10 border">
                                        <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                                          {employee?.firstName?.[0]}
                                          {employee?.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="font-semibold text-gray-900 truncate">
                                            {employee?.firstName}{" "}
                                            {employee?.lastName}
                                          </p>
                                          <DropdownMenu className="bg-white">
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                              >
                                                <MoreVertical className="w-4 h-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setEmployeeToRemove(employee);
                                                  setShowRemoveDialog(true);
                                                }}
                                                className="text-rose-600"
                                              >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Remove
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate mb-2">
                                          {employee?.email}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          <Badge
                                            className={`${getEmployeeStatusColor(
                                              assignment.status
                                            )} text-xs`}
                                          >
                                            {assignment.status.replace(
                                              "_",
                                              " "
                                            )}
                                          </Badge>
                                          {employee?.department && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {employee.department}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-500">
                                        Assigned:
                                      </span>
                                      <span className="font-medium text-green-900">
                                        {formatRelativeDate(
                                          assignment.assignedAt
                                        )}
                                      </span>
                                    </div>
                                    {assignment.completedAt && (
                                      <div className="flex items-center justify-between text-sm mt-1">
                                        <span className="text-emerald-600">
                                          Completed:
                                        </span>
                                        <span className="font-medium text-gray-900">
                                          {formatRelativeDate(
                                            assignment.completedAt
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                          <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Team Members Assigned
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Add employees to this task so work can begin.
                        </p>
                        <Button
                          onClick={() => setShowAssignDialog(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Assign Team Member
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent
                value="details"
                className="space-y-4 md:space-y-6 pt-4 md:pt-6"
              >
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-900">
                      <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                      Form Submission Data
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm md:text-base">
                      All information submitted by the manager
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-gray-900 bg-gray-50 p-4 md:p-6 rounded-lg border-white border">
                      {task.formData ? (
                        Object.entries(task.formData).map(([key, value]) => (
                          <div
                            key={key}
                            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <Label className="text-gray-700 font-medium block mb-2">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </Label>
                            <div className="mt-1">
                              {typeof value === "object" &&
                              !Array.isArray(value) ? (
                                <pre className="text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-2">
                                  {value.map((item, index) => (
                                    <Badge key={index} variant="secondary">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-gray-50 border rounded px-3 py-2">
                                  {value?.toString() || "Not provided"}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No form data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg text-gray-900">
                      Employee Feedback
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Feedback submitted by employees
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {task.employeeFeedbacks?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {task.employeeFeedbacks.map((fb) => (
                          <div
                            key={fb._id}
                            className="border rounded-lg p-4 bg-gray-50 hover:shadow-sm transition"
                          >
                            {/* Employee Info */}
                            <p className="font-medium text-gray-800">
                              {fb.employeeId?.firstName}{" "}
                              {fb.employeeId?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {fb.employeeId?.email}
                            </p>

                            {/* Feedback text */}
                            <div className="mt-3 bg-white border rounded p-3 text-sm text-gray-700">
                              {fb.feedback || "No feedback provided"}
                            </div>

                            {/* Date */}
                            <p className="text-xs text-gray-400 mt-2">
                              Submitted on{" "}
                              {new Date(fb.submittedAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No employee feedback available
                      </div>
                    )}
                  </CardContent>
                </Card>
                {task.managerComments && (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-base md:text-lg text-gray-900">
                        Manager Comment
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Comment added by manager
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="bg-gray-50 border rounded-lg p-4 text-gray-800 text-sm">
                        {task.managerComments}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Updates Tab */}
              <TabsContent
                value="updates"
                className="space-y-4 md:space-y-6 pt-4 md:pt-6"
              >
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-900">
                      <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      Update Task Status
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm md:text-base">
                      Update status and notify all stakeholders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 md:space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                        {[
                          "pending",
                          "in_progress",
                          "completed",
                          "approved",
                          "rejected",
                        ].map((statusOption) => (
                          <Button
                            key={statusOption}
                            variant={
                              newStatus === statusOption ? "default" : "outline"
                            }
                            onClick={() => setNewStatus(statusOption)}
                            className={`justify-start h-auto py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm ${
                              newStatus === statusOption
                                ? getStatusVariant(statusOption)
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-1 md:gap-2">
                              {getStatusIcon(statusOption)}
                              <span className="capitalize truncate">
                                {statusOption.replace("_", " ")}
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        <Label className="text-gray-700 font-medium text-sm md:text-base">
                          Add Feedback / Comments
                        </Label>
                        <Textarea
                          placeholder="Enter your feedback, instructions, or comments here..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                          className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-700 text-sm md:text-base min-h-[100px]"
                        />
                        <p className="text-xs md:text-sm text-gray-500">
                          This feedback will be sent to the manager and all
                          assigned employees.
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900 text-sm md:text-base">
                            Notifications
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-blue-700">
                          When you update the status, notifications will be sent
                          to:
                        </p>
                        <ul className="mt-2 space-y-1 text-xs md:text-sm text-blue-700">
                          <li className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            Manager: {task.submittedBy?.firstName}{" "}
                            {task.submittedBy?.lastName}
                          </li>
                          <li className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            All assigned employees (
                            {task.assignedEmployees?.length || 0})
                          </li>
                          {teamLeads.length > 0 && (
                            <li className="flex items-center gap-2">
                              <Users2 className="w-3 h-3" />
                              Other Team Leads ({teamLeads.length - 1})
                            </li>
                          )}
                        </ul>
                      </div>

                      <Button
                        onClick={handleStatusUpdate}
                        disabled={updating || newStatus === task.status2}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
                        size="lg"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating Status...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Update Task Status & Notify Everyone
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                {task.teamLeadFeedbacks?.length > 0 && (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-900">
                        <History className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        Recent Feedback Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {task.teamLeadFeedbacks.slice(0, 3).map((fb) => {
                          const teamLead = teamLeads.find(
                            (tl) => tl._id === fb.teamLeadId
                          );
                          return (
                            <div key={fb._id} className="flex items-start gap-3">
                              <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow">
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm">
                                  {teamLead?.firstName?.[0]}
                                  {teamLead?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                                  <span className="font-semibold text-gray-900 text-sm md:text-base truncate">
                                    {teamLead?.firstName} {teamLead?.lastName}
                                  </span>
                                  <span className="text-xs md:text-sm text-gray-500">
                                    {formatRelativeDate(fb.submittedAt)}
                                  </span>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                                  <p className="text-gray-800 text-sm md:text-base">
                                    {fb.feedback}
                                  </p>
                                </div>
                                {fb.replies?.length > 0 && (
                                  <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">
                                      {fb.replies.length} replies
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent
                value="feedback"
                className="space-y-4 md:space-y-6 pt-4 md:pt-6"
              >
                {/* Feedback System Component */}
                <FeedbackSystem
                  taskId={taskId}
                  feedbacks={task.teamLeadFeedbacks || []}
                  teamLeads={teamLeads}
                  currentTeamLead={currentTeamLead}
                  onFeedbackAdded={fetchTaskDetails}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Current TeamLead Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 md:w-14 md:h-14 border-2 border-white shadow-lg">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-lg">
                      {currentTeamLead?.firstName?.[0]}
                      {currentTeamLead?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm md:text-base truncate">
                      {currentTeamLead?.firstName} {currentTeamLead?.lastName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">
                      {currentTeamLead?.email}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      Team Lead
                    </p>
                    {currentTeamLead?.department && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Building className="w-3 h-3" />
                        <span className="truncate">
                          {currentTeamLead.department.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Role:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      Team Lead
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tasks Assigned:</span>
                    <span className="font-semibold text-gray-900">
                      {teamLeads.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Access Level:</span>
                    <Badge variant="outline" className="text-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Full Access
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Info Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base md:text-lg text-gray-900">
                  Task Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Task ID</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono bg-blue-900 text-blue-900">
                      {task._id.slice(-8)}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Priority</span>
                    <Badge
                      className={`${getPriorityColor(
                        getTaskPriority()
                      )} text-white text-xs `}
                    >
                      {getTaskPriority()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Department</span>
                    <span className="font-medium text-sm text-blue-900">
                      {task.depId?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Form Type</span>
                    <span className="font-medium text-sm truncate max-w-[120px] text-blue-900">
                      {task.formId?.title || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Created</span>
                    <span className="font-medium text-sm text-blue-900">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Last Updated</span>
                    <span className="font-medium text-sm text-blue-900">
                      {formatRelativeDate(task.updatedAt)}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-gray-700 hover:text-gray-900 text-sm"
                    onClick={() => setActiveTab("updates")}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-gray-700 hover:text-gray-900 text-sm"
                    onClick={() => setShowFeedbackModal(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manager Preview Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  Submitted By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-white shadow">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                      {task.submittedBy?.firstName?.[0]}
                      {task.submittedBy?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                      {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">
                      {task.submittedBy?.email}
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      Manager
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-gray-600 hover:text-gray-900"
                  onClick={() => setShowManagerModal(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Details
                </Button>
              </CardContent>
            </Card>

            {/* Team Leads Preview Card */}
            {teamLeads.length > 0 && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                    <Users2 className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                    Team Leads ({teamLeads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamLeads.slice(0, 3).map((teamLead) => (
                      <div
                        key={teamLead._id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs">
                            {teamLead.firstName?.[0]}
                            {teamLead.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {teamLead.firstName} {teamLead.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {teamLead.email}
                          </p>
                        </div>
                      </div>
                    ))}
                    {teamLeads.length > 3 && (
                      <div className="text-center pt-2 border-t">
                        <p className="text-sm text-gray-500">
                          +{teamLeads.length - 3} more team leads
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-gray-600 hover:text-gray-900"
                    onClick={() => setShowTeamLeadsModal(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View All Team Leads
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Feedback Stats Card */}
            {task.teamLeadFeedbacks?.length > 0 && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                    Feedback Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Feedback</span>
                      <Badge className="bg-indigo-100 text-indigo-800">
                        {task.teamLeadFeedbacks.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Replies</span>
                      <Badge className="bg-green-100 text-green-800">
                        {task.teamLeadFeedbacks.reduce(
                          (acc, fb) => acc + (fb.replies?.length || 0),
                          0
                        )}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Your Feedback</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {
                          task.teamLeadFeedbacks.filter(
                            (fb) => fb.teamLeadId === currentTeamLead?._id
                          ).length
                        }
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-gray-600 hover:text-gray-900"
                    onClick={() => setActiveTab("feedback")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    View All Feedback
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modals and Dialogs */}

      {/* Add Feedback Dialog */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-2xl bg-white text-gray-900 border-0 shadow-2xl mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              Add Team Lead Feedback
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              Your feedback will be visible to the manager and all assigned employees.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Your Feedback</Label>
              <Textarea
                placeholder="Enter your feedback, comments, or suggestions here..."
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                rows={6}
                className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[150px] text-gray-700"
              />
              <p className="text-xs text-gray-500">
                This feedback will be saved and notifications will be sent to relevant stakeholders.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Notifications</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Notifications will be sent to:
                  </p>
                  <ul className="mt-1 text-sm text-blue-700 space-y-1">
                    <li>• Manager: {task.submittedBy?.firstName} {task.submittedBy?.lastName}</li>
                    <li>• All assigned employees ({task.assignedEmployees?.length || 0})</li>
                    <li>• Other team leads with access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 md:gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackModal(false);
                setNewFeedback("");
              }}
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white w-full sm:w-auto sm:flex-1 text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFeedback}
              disabled={submittingFeedback || !newFeedback.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto sm:flex-1 text-sm md:text-base"
            >
              {submittingFeedback ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employees Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl bg-white text-gray-900 border-0 shadow-2xl mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              Assign Employees to Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              Select employees to work on "{task?.formId?.title}". They'll
              receive email notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <Input
                placeholder="Search employees by name, email, or department..."
                className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-gray-700 font-semibold text-sm md:text-base">
                  Available Employees ({filteredEmployees.length})
                </Label>
                {selectedEmployees.length > 0 && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs md:text-sm">
                    {selectedEmployees.length} selected
                  </Badge>
                )}
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="text-center py-6 md:py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Users className="w-8 h-8 md:w-12 md:h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm md:text-base">
                    {searchTerm
                      ? "No employees found matching your search"
                      : "No available employees"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 max-h-[300px] md:max-h-96 overflow-y-auto p-1">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee._id}
                      className={`border rounded-lg md:rounded-xl p-3 md:p-4 cursor-pointer transition-all duration-200 ${
                        selectedEmployees.includes(employee._id)
                          ? "border-green-500 bg-green-50 ring-1 md:ring-2 ring-green-200"
                          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (selectedEmployees.includes(employee._id)) {
                          setSelectedEmployees(
                            selectedEmployees.filter(
                              (id) => id !== employee._id
                            )
                          );
                        } else {
                          setSelectedEmployees([
                            ...selectedEmployees,
                            employee._id,
                          ]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <Avatar className="w-8 h-8 md:w-10 md:h-10">
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
                              {employee.firstName?.[0]}
                              {employee.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 truncate">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                        {selectedEmployees.includes(employee._id) ? (
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      {employee.department && (
                        <div className="mt-2 flex items-center gap-1 text-xs md:text-sm text-gray-600">
                          <Building className="w-3 h-3" />
                          <span className="truncate">
                            {employee.department}
                          </span>
                        </div>
                      )}
                      {employee.position && (
                        <div className="mt-1 flex items-center gap-1 text-xs md:text-sm text-gray-600">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{employee.position}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEmployees.length > 0 && (
              <div className="space-y-2 md:space-y-3">
                <Label className="text-gray-700 font-semibold text-sm md:text-base">
                  Selected Team
                </Label>
                <div className="flex flex-wrap gap-2 p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg md:rounded-xl border border-green-200">
                  {selectedEmployees.map((empId) => {
                    const employee = employees.find((e) => e._id === empId);
                    if (!employee) return null;

                    return (
                      <Badge
                        key={empId}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 text-xs md:text-sm"
                      >
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[80px] md:max-w-none">
                          {employee.firstName} {employee.lastName}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 md:h-5 md:w-5 ml-1 hover:bg-green-600 hover:text-white p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployees(
                              selectedEmployees.filter((id) => id !== empId)
                            );
                          }}
                        >
                          <X className="w-2 h-2 md:w-3 md:h-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 text-sm md:text-base">
                    Notifications
                  </p>
                  <p className="text-xs md:text-sm text-blue-700 mt-1">
                    Selected employees will receive an email notification with
                    task details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 md:gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setSelectedEmployees([]);
              }}
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white w-full sm:w-auto sm:flex-1 text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignEmployees}
              disabled={assigning || selectedEmployees.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg w-full sm:w-auto sm:flex-1 text-sm md:text-base"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Assign {selectedEmployees.length} Employee
                  {selectedEmployees.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Employee Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-md bg-white text-gray-900 border-0 shadow-2xl mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
              Remove Employee from Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              This action cannot be undone. The employee will be notified via
              email.
            </DialogDescription>
          </DialogHeader>

          {employeeToRemove && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-3 p-3 md:p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                    {employeeToRemove.firstName} {employeeToRemove.lastName}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 truncate">
                    {employeeToRemove.email}
                  </p>
                  {employeeToRemove.department && (
                    <p className="text-xs text-gray-500 truncate">
                      {employeeToRemove.department}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 text-sm md:text-base">
                      Important Notice
                    </p>
                    <ul className="mt-1 text-xs md:text-sm text-amber-700 space-y-1">
                      <li>
                        • Employee will be removed from this task immediately
                      </li>
                      <li>• Removal notification email will be sent</li>
                      <li>• Task progress will be recalculated</li>
                      <li>• Employee can be reassigned later if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 md:gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false);
                setEmployeeToRemove(null);
              }}
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white w-full sm:w-auto sm:flex-1 text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveEmployee}
              disabled={removing}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg w-full sm:w-auto sm:flex-1 text-sm md:text-base"
            >
              {removing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Details Modal */}
      <Dialog open={showManagerModal} onOpenChange={setShowManagerModal}>
        <DialogContent className="max-w-lg bg-white text-gray-900 border-0 shadow-2xl mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              Manager Details
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              Complete information about the manager who submitted this task
            </DialogDescription>
          </DialogHeader>

          {managerDetails && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col items-center text-center mb-4">
                <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-white shadow-xl mb-4">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-2xl">
                    {managerDetails.firstName?.[0]}
                    {managerDetails.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                    {managerDetails.firstName} {managerDetails.lastName}
                  </h3>
                  <p className="text-purple-600 font-medium">Manager</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-600 text-sm">Email</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {managerDetails.email}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-600 text-sm">Phone</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {managerDetails.phone || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-600 text-sm">Department</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {managerDetails.departments?.length > 0
                        ? managerDetails.departments
                            .map((dep) => dep.name)
                            .join(", ")
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-600 text-sm">
                    Task Submitted
                  </Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {formatDate(task?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowManagerModal(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg text-sm md:text-base"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Leads Modal */}
      <Dialog open={showTeamLeadsModal} onOpenChange={setShowTeamLeadsModal}>
        <DialogContent
          className="max-w-2xl bg-white text-gray-900 border-0 shadow-2xl
    mx-4 md:mx-auto max-h-[85vh] flex flex-col"
        >
          {/* HEADER */}
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Users2 className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              All Team Leads ({teamLeads.length})
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              Team leads who have access to this task
            </DialogDescription>
          </DialogHeader>

          {/* BODY (SCROLL HERE) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {teamLeads.map((teamLead) => (
                <Card
                  key={teamLead._id}
                  className="border hover:shadow-md transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-white shadow">
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                          {teamLead.firstName?.[0]}
                          {teamLead.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-gray-900 truncate">
                            {teamLead.firstName} {teamLead.lastName}
                          </p>
                          {teamLead._id === currentTeamLead?._id && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              You
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 truncate">
                          {teamLead.email}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-900 text-white"
                          >
                            Team Lead
                          </Badge>
                          {teamLead.department && (
                            <Badge variant="outline" className="text-xs">
                              {teamLead.depId.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm md:text-xs">
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium">
                            Phone
                          </span>
                          <p className="mt-1 font-semibold text-gray-900">
                            {teamLead.phone || "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium">
                            Access
                          </span>
                          <p className="mt-1 font-semibold text-green-600">
                            Full
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* INFO BOX */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">
                    Team Lead Access
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    All team leads listed here can view, update, and manage this
                    task.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER (STICKY FEEL) */}
          <DialogFooter className="pt-3">
            <Button
              onClick={() => setShowTeamLeadsModal(false)}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600
        hover:from-orange-700 hover:to-amber-700 text-white shadow-lg"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareTaskDialog
        taskId={taskId}
        taskTitle={task?.formId?.title || task?.clinetName || "Untitled"}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onSuccess={() => {
          fetchTaskDetails();
          toast.success("Task shared successfully!");
        }}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowFeedbackModal(true)}
                size="lg"
                className="rounded-full w-12 h-12 md:w-14 md:h-14 shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Add Feedback</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowAssignDialog(true)}
                size="lg"
                className="rounded-full w-12 h-12 md:w-14 md:h-14 shadow-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Assign Employees</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}