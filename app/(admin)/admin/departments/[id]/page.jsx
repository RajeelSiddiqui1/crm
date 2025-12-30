"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Building2,
  FileText,
  Users,
  FolderOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Shield,
  Sparkles,
  Rocket,
  Bell,
  ClipboardCheck,
  ChevronRight,
  ExternalLink,
  MoreVertical,
  Search,
  ChevronDown,
  X,
  MessageCircle,
  UserCheck,
  UserX,
  Zap,
  Crown,
  Share2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Hash,
  Link,
  Lock,
  Star,
  Upload,
  SlidersHorizontal,
  CheckSquare,
  Radio,
  ToggleLeft,
  List,
  PieChart,
  ArrowLeft,
  Activity,
  Check,
  AlertTriangle,
  DownloadCloud,
  Printer,
  FileSpreadsheet,
  FilePieChart,
  Layers,
  Grid,
  ListTodo,
  ShieldCheck,
  Users2,
  TrendingDown,
  Circle,
  CircleCheck,
  CircleDot,
  CircleX,
  CircleAlert,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  GanttChartSquare,
  Kanban,
  CalendarDays,
  UserCog,
  Settings,
  FileBarChart,
  LineChart,
  Code,
  ViewIcon,
  User,
} from "lucide-react";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import UserTaskStats from "@/components/admin/UserTaskStats";

export default function DepartmentTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id;

  const [activeTab, setActiveTab] = useState("adminTasks");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
  const [departmentData, setDepartmentData] = useState(null);
  const [tasksData, setTasksData] = useState({
    adminTasks: [],
    subtasks: [],
    submissions: [],
    counts: {
      adminTasks: 0,
      subtasks: 0,
      submissions: 0,
    },
    stats: {
      submissionStatuses: {},
      sharingStats: {},
      completionRate: 0,
    },
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [feedback, setFeedback] = useState("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [data, setData] = useState({
    managers: [],
    teamLeads: [],
    employees: [],
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }

    fetchDepartmentData();
    fetchTasksData();
    taskData();
  }, [session, status, router, departmentId]);

  useEffect(() => {
    // Update active filters based on current selections
    const filters = [];
    if (statusFilter !== "all") filters.push(`Status: ${statusFilter}`);
    if (priorityFilter !== "all") filters.push(`Priority: ${priorityFilter}`);
    if (dateFilter !== "all") filters.push(`Date: ${dateFilter}`);
    if (searchTerm) filters.push(`Search: "${searchTerm}"`);
    setActiveFilters(filters);
  }, [statusFilter, priorityFilter, dateFilter, searchTerm]);

  const fetchDepartmentData = async () => {
    try {
      const response = await axios.get(`/api/admin/department/${departmentId}`);
      if (response.data.success) {
        setDepartmentData(response.data.data);
      } else {
        toast.error(
          response.data.message || "Failed to load department details"
        );
      }
    } catch (error) {
      console.error("Error fetching department:", error);
      toast.error(
        error.response?.data?.message || "Failed to load department details"
      );
    }
  };

 const taskData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/department/${departmentId}/user-tasks`
      );
      if (res.data) {
        setData(res.data);
      } else {
        toast.error("No data returned from API");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load department tasks");
    } finally {
      setLoading(false);
    }
  };

const renderStats = (user, stats, type) => {
  // Define colors based on type
  let gradientBg;
  switch (type) {
    case "manager":
      gradientBg = "from-blue-400 to-cyan-400";
      break;
    case "teamLead":
      gradientBg = "from-green-400 to-emerald-400";
      break;
    case "employee":
      gradientBg = "from-purple-400 to-pink-400";
      break;
    default:
      gradientBg = "from-gray-400 to-gray-500";
  }

  return (
    <div
      key={user._id}
      className="bg-white p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow duration-300"
    >
      {/* Header with gradient accent */}
      <div className={`w-full h-2 rounded-t-lg mb-3 bg-gradient-to-r ${gradientBg}`}></div>

      <div className="flex flex-col gap-2">
        <h3 className="text-gray-800 font-semibold text-lg">
          {user.firstName} {user.lastName}
        </h3>
        <p className="text-gray-500 text-sm">
          Pending: <span className="font-medium text-orange-500">{stats.pending}</span> |{" "}
          In Progress: <span className="font-medium text-blue-500">{stats.inProgress}</span> |{" "}
          Completed: <span className="font-medium text-green-500">{stats.completed}</span>
        </p>
      </div>

      {/* Footer badges (optional) */}
      <div className="mt-3 flex gap-2">
        {stats.pending > 0 && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Pending</span>
        )}
        {stats.inProgress > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">In Progress</span>
        )}
        {stats.completed > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
        )}
      </div>
    </div>
  );
};



  const fetchTasksData = async () => {
    try {
      setFetching(true);
      const response = await axios.get(
        `/api/admin/department/${departmentId}/tasks`
      );
      if (response.data.success) {
        setTasksData(response.data);
        toast.success("Data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load department tasks");
    } finally {
      setFetching(false);
    }
  };

  const getStatusVariant = (status, type = "default") => {
    if (!status || typeof status !== "string") {
      return type === "badge"
        ? "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
        : "text-gray-700";
    }

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "completed":
      case "approved":
        return type === "badge"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "text-emerald-600";
      case "in_progress":
      case "in-progress":
        return type === "badge"
          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          : "text-amber-600";
      case "pending":
        return type === "badge"
          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          : "text-blue-600";
      case "rejected":
      case "overdue":
        return type === "badge"
          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
          : "text-rose-600";
      default:
        return type === "badge"
          ? "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
          : "text-gray-600";
    }
  };

  const getStatusIcon = (status, size = "w-4 h-4") => {
    if (!status || typeof status !== "string") {
      return <AlertCircle className={size} />;
    }

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "completed":
      case "approved":
        return <CheckCircle className={`${size} text-emerald-600`} />;
      case "in_progress":
      case "in-progress":
        return <Clock className={`${size} text-amber-600`} />;
      case "pending":
        return <AlertCircle className={`${size} text-blue-600`} />;
      case "rejected":
      case "overdue":
        return <XCircle className={`${size} text-rose-600`} />;
      default:
        return <AlertCircle className={`${size} text-gray-600`} />;
    }
  };

  const getPriorityVariant = (priority) => {
    if (!priority || typeof priority !== "string") {
      return "bg-gray-100 text-gray-800 border border-gray-200";
    }

    const priorityLower = priority.toLowerCase();
    switch (priorityLower) {
      case "high":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getPriorityIcon = (priority) => {
    if (!priority || typeof priority !== "string") {
      return <Zap className="w-4 h-4 text-gray-500" />;
    }

    const priorityLower = priority.toLowerCase();
    switch (priorityLower) {
      case "high":
        return <Zap className="w-4 h-4 text-rose-600" />;
      case "medium":
        return <Zap className="w-4 h-4 text-amber-600" />;
      case "low":
        return <Zap className="w-4 h-4 text-emerald-600" />;
      default:
        return <Zap className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInitials = (firstName = "", lastName = "") => {
    return (
      `${firstName?.charAt(0) || ""}${
        lastName?.charAt(0) || ""
      }`.toUpperCase() || "U"
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(dateString);
  };

  const handleViewDetails = (type, item) => {
    setSelectedTask({ type, ...item });
    setShowDetails(true);
  };

  const handleBulkAction = (action) => {
    if (selectedItems.length === 0) {
      toast.warning("Please select items first");
      return;
    }

    switch (action) {
      case "export":
        setShowExportDialog(true);
        break;
      case "delete":
        toast.info("Bulk delete feature coming soon");
        break;
      case "status":
        toast.info("Bulk status update feature coming soon");
        break;
      default:
        break;
    }
  };

  const handleExport = () => {
    toast.success(
      `Exporting ${selectedItems.length} items as ${exportFormat.toUpperCase()}`
    );
    setShowExportDialog(false);
    setSelectedItems([]);
  };

  const handleStatusUpdate = async (submissionId, newStatus, type) => {
    try {
      setLoading(true);
      const endpoint =
        type === "manager"
          ? "manager"
          : type === "teamlead"
          ? "teamlead"
          : "admin";

      const response = await axios.put(
        `/api/submissions/${submissionId}/status`,
        {
          status: newStatus,
          type: endpoint,
          feedback: feedback || undefined,
        }
      );

      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchTasksData();
        setShowFeedbackDialog(false);
        setFeedback("");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status, type = "default") => {
    const statusText = status || "Unknown";
    const badgeText = String(statusText).replace("_", " ").toLowerCase();

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${getStatusVariant(
                status,
                "badge"
              )} px-3 py-1.5 rounded-full gap-2 transition-all duration-200 hover:scale-105`}
            >
              {getStatusIcon(status)}
              <span className="font-medium capitalize text-sm tracking-wide">
                {badgeText}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {type === "manager"
                ? "Manager Status"
                : type === "teamlead"
                ? "Team Lead Status"
                : type === "admin"
                ? "Admin Status"
                : "Overall Status"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderPriorityBadge = (priority) => {
    const priorityText = priority || "Unknown";
    return (
      <Badge
        className={`${getPriorityVariant(
          priority
        )} px-3 py-1.5 rounded-full gap-2 transition-all duration-200 hover:scale-105`}
      >
        {getPriorityIcon(priority)}
        <span className="font-medium text-sm uppercase tracking-wide">
          {String(priorityText)}
        </span>
      </Badge>
    );
  };

  const renderUserAvatar = (user) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer group">
          <Avatar className="h-10 w-10 border-2 border-gray-200 group-hover:border-blue-500 transition-all duration-200">
            <AvatarImage src={user?.profilePic} alt={user?.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold shadow-md">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate max-w-[140px] group-hover:text-blue-600 transition-colors">
              {user?.name || `${user?.firstName} ${user?.lastName}`}
            </div>
            {user?.email && (
              <div className="text-xs text-gray-500 truncate max-w-[140px]">
                {user.email}
              </div>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-white border border-gray-200 shadow-xl">
        <div className="flex justify-between space-x-4">
          <Avatar className="h-16 w-16 border-2 border-blue-100">
            <AvatarImage src={user?.profilePic} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-semibold">{user?.name}</h4>
            <p className="text-xs text-gray-600">{user?.email}</p>
            <div className="flex items-center pt-2">
              <Mail className="mr-2 h-3 w-3 opacity-70" />
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );

  const renderStatusIndicator = (status, label) => {
    const getStatusColor = (status) => {
      const statusLower = status?.toLowerCase();
      switch (statusLower) {
        case "completed":
        case "approved":
          return "bg-emerald-500";
        case "in_progress":
        case "in-progress":
          return "bg-amber-500";
        case "pending":
          return "bg-blue-500";
        case "rejected":
          return "bg-rose-500";
        default:
          return "bg-gray-500";
      }
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
        <span className="text-sm text-gray-600">{label}:</span>
        <span className="text-sm font-medium capitalize">
          {String(status || "Not set").replace("_", " ")}
        </span>
      </div>
    );
  };

  // Filter functions
  const filteredAdminTasks = (tasksData.data?.adminTasks || []).filter(
    (task) => {
      const title = task?.title || "";
      const clientName = task?.clientName || "";
      const description = task?.description || "";
      const status = task?.status || "";
      const priority = task?.priority || "";
      const createdAt = task?.createdAt || "";

      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || priority === priorityFilter;

      const matchesDate = () => {
        if (dateFilter === "all") return true;
        const taskDate = new Date(createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - taskDate) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case "today":
            return diffDays === 0;
          case "week":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          default:
            return true;
        }
      };

      return matchesSearch && matchesStatus && matchesPriority && matchesDate();
    }
  );

  const filteredSubtasks = (tasksData.data?.subtasks || []).filter(
    (subtask) => {
      const title = subtask?.title || "";
      const description = subtask?.description || "";
      const status = subtask?.status || "";
      const priority = subtask?.priority || "";
      const createdAt = subtask?.createdAt || "";

      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || priority === priorityFilter;

      const matchesDate = () => {
        if (dateFilter === "all") return true;
        const taskDate = new Date(createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - taskDate) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case "today":
            return diffDays === 0;
          case "week":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          default:
            return true;
        }
      };

      return matchesSearch && matchesStatus && matchesPriority && matchesDate();
    }
  );

  const filteredSubmissions = (tasksData.data?.submissions || []).filter(
    (submission) => {
      const clientName = submission?.clinetName || "";
      const formTitle = submission?.form?.title || "";
      const overallStatus = submission?.statusHierarchy?.overallStatus || "";
      const managerStatus = submission?.status || "";
      const teamLeadStatus = submission?.status2 || "";
      const adminStatus = submission?.adminStatus || "";
      const createdAt = submission?.timestamps?.createdAt || "";

      const matchesSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        overallStatus.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        overallStatus === statusFilter ||
        managerStatus === statusFilter ||
        teamLeadStatus === statusFilter ||
        adminStatus === statusFilter;

      const matchesDate = () => {
        if (dateFilter === "all") return true;
        const taskDate = new Date(createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - taskDate) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case "today":
            return diffDays === 0;
          case "week":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          default:
            return true;
        }
      };

      return matchesSearch && matchesStatus && matchesDate();
    }
  );

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateFilter("all");
  };

  const renderTaskCard = (task, type) => {
    const isAdminTask = type === "adminTask";
    const isSubtask = type === "subtask";
    const isSubmission = type === "submission";

    return (
      <Card className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  isAdminTask
                    ? "bg-blue-100"
                    : isSubtask
                    ? "bg-emerald-100"
                    : "bg-purple-100"
                }`}
              >
                {isAdminTask && (
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                )}
                {isSubtask && <FileText className="w-5 h-5 text-emerald-600" />}
                {isSubmission && <Users className="w-5 h-5 text-purple-600" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {task.title || task.clinetName || "Untitled"}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {task.description || task.form?.title || "No description"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Status and Priority */}
            <div className="flex flex-wrap gap-2">
              {isSubmission ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Status Hierarchy
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {renderStatusBadge(task.status, "manager")}
                    {renderStatusBadge(task.status2, "teamlead")}
                    {renderStatusBadge(task.adminStatus, "admin")}
                  </div>
                </div>
              ) : (
                <>
                  {renderStatusBadge(task.status)}
                  {task.priority && renderPriorityBadge(task.priority)}
                </>
              )}
            </div>

            {/* Assigned Users */}
            {(task.managers || task.teamLead || task.submittedBy) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users2 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Assigned To</span>
                </div>
                <div className="flex -space-x-2">
                  {isAdminTask &&
                    task.managers?.slice(0, 3).map((manager, idx) => (
                      <Avatar
                        key={idx}
                        className="border-2 border-white h-8 w-8"
                      >
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                          {getInitials(manager.firstName, manager.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  {isSubtask && task.teamLeadId && (
                    <Avatar className="border-2 border-white h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                        {getInitials(
                          task.teamLeadId.firstName,
                          task.teamLeadId.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {isSubmission && task.submittedBy && (
                    <Avatar className="border-2 border-white h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        {getInitials(
                          task.submittedBy.firstName,
                          task.submittedBy.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Created</span>
                </div>
                <span className="font-medium text-gray-900">
                  {getTimeAgo(task.createdAt || task.timestamps?.createdAt)}
                </span>
              </div>
              {task.endDate && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Due Date</span>
                  </div>
                  <span
                    className={`font-medium ${
                      new Date(task.endDate) < new Date()
                        ? "text-rose-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatDate(task.endDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              onClick={() => handleViewDetails(type, task)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGridView = (items, type) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            {type === "adminTask" && (
              <FolderOpen className="w-12 h-12 text-gray-400" />
            )}
            {type === "subtask" && (
              <FileText className="w-12 h-12 text-gray-400" />
            )}
            {type === "submission" && (
              <Users className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No items found
          </h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-900">
        {items.map((item) => renderTaskCard(item, type))}
      </div>
    );
  };

  if (status === "loading" || fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>

          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" richColors expand={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/admin/departments")}
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 rounded-xl border border-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Return to departments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {departmentData?.name || "Department"} Dashboard
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-white border-blue-200 text-blue-700"
                  >
                    <Activity className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Monitor tasks, submissions, and performance analytics for{" "}
                  {departmentData?.name || "the department"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={fetchTasksData}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-xl"
                    disabled={fetching}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        fetching ? "animate-spin" : ""
                      }`}
                    />
                    {fetching ? "Refreshing..." : "Refresh"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh dashboard data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Admin Tasks Card */}
          <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {tasksData.counts?.adminTasks || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Admin Tasks
                  </div>
                  <div className="text-xs text-blue-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Active monitoring</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FolderOpen className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      (filteredAdminTasks.filter(
                        (t) => t.status === "completed"
                      ).length /
                        filteredAdminTasks.length) *
                        100
                    ) || 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (filteredAdminTasks.filter((t) => t.status === "completed")
                      .length /
                      filteredAdminTasks.length) *
                      100 || 0
                  }
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Subtasks Card */}
          <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {tasksData.counts?.subtasks || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Subtasks
                  </div>
                  <div className="text-xs text-emerald-500 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>Team execution</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      (filteredSubtasks.filter(
                        (t) => t.status === "in_progress"
                      ).length /
                        filteredSubtasks.length) *
                        100
                    ) || 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (filteredSubtasks.filter((t) => t.status === "in_progress")
                      .length /
                      filteredSubtasks.length) *
                      100 || 0
                  }
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submissions Card */}
          <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {tasksData.counts?.submissions || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Submissions
                  </div>
                  <div className="text-xs text-purple-500 flex items-center gap-1">
                    <ClipboardCheck className="w-3 h-3" />
                    <span>
                      {tasksData.stats?.completionRate || 0}% completion
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Approval Rate</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      ((tasksData.stats?.submissionStatuses?.approved || 0) /
                        (tasksData.counts?.submissions || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    ((tasksData.stats?.submissionStatuses?.approved || 0) /
                      (tasksData.counts?.submissions || 1)) *
                    100
                  }
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    {tasksData.stats?.submissionStatuses?.approved || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Approved
                  </div>
                  <div className="text-xs text-amber-500 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Quality assurance</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rejection Rate</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      ((tasksData.stats?.submissionStatuses?.rejected || 0) /
                        (tasksData.counts?.submissions || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    ((tasksData.stats?.submissionStatuses?.rejected || 0) /
                      (tasksData.counts?.submissions || 1)) *
                    100
                  }
                  className="h-2 mt-2 bg-rose-100 [&>div]:bg-rose-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <Card className="bg-white border border-gray-200 mb-8 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Department Task Management
                  </h2>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Monitor and manage all tasks, subtasks, and submissions with
                  advanced filtering and search capabilities
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <TooltipProvider className="text-gray-900">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "table" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("table")}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-xl"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Table View</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider className="text-gray-900">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-xl"
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Grid View</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Separator orientation="vertical" className="h-8" />
              </div>
            </div>

            {/* Search and Filters Row */}
            <div className="mt-6  gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks, clients, or descriptions..."
                  className="pl-10 border-gray-300 focus:border-blue-500 text-gray-900 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Priority" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Date Range" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select> */}
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="text-sm text-gray-500 font-medium">
                  Active Filters:
                </div>
                {activeFilters.map((filter, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {filter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2 hover:bg-blue-100"
                      onClick={() => {
                        if (filter.includes("Status:")) setStatusFilter("all");
                        else if (filter.includes("Priority:"))
                          setPriorityFilter("all");
                        else if (filter.includes("Date:")) setDateFilter("all");
                        else if (filter.includes("Search:")) setSearchTerm("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear all
                  <X className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-gray-200 px-6 py-4">
                <TabsList className="grid grid-cols-3 bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="adminTasks"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg rounded-lg px-6 py-3 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <span className="text-gray-900">Admin Tasks</span>
                      <Badge className="ml-2 bg-blue-100 text-blue-700">
                        {tasksData.counts?.adminTasks || 0}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="subtasks"
                    className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg rounded-lg px-6 py-3 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-gray-900">Subtasks</span>
                      <Badge className="ml-2 bg-emerald-100 text-emerald-700">
                        {tasksData.counts?.subtasks || 0}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="submissions"
                    className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-lg px-6 py-3 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-gray-900">Submissions</span>
                      <Badge className="ml-2 bg-purple-100 text-purple-700">
                        {tasksData.counts?.submissions || 0}
                      </Badge>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                {/* Bulk Actions Panel */}
                {showBulkActions && (
                  <Card className="mb-6 border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {selectedItems.length} items selected
                            </h3>
                            <p className="text-sm text-gray-600">
                              Perform actions on multiple items at once
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("export")}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("status")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Update Status
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("delete")}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowBulkActions(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Tasks Tab Content */}
                <TabsContent value="adminTasks" className="mt-0">
                  {viewMode === "table" ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                          <TableRow>
                            <TableHead className="font-bold text-blue-900 py-4">
                              <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" />
                                Task Details
                              </div>
                            </TableHead>
                            <TableHead className="font-bold text-blue-900">
                              Client
                            </TableHead>
                            <TableHead className="font-bold text-blue-900">
                              Managers
                            </TableHead>
                            <TableHead className="font-bold text-blue-900">
                              Priority
                            </TableHead>
                            <TableHead className="font-bold text-blue-900">
                              Status
                            </TableHead>
                            <TableHead className="font-bold text-blue-900">
                              Timeline
                            </TableHead>
                            <TableHead className="font-bold text-blue-900">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAdminTasks.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-12"
                              >
                                <div className="flex flex-col items-center gap-4 text-gray-500">
                                  <div className="p-4 bg-blue-50 rounded-full">
                                    <FolderOpen className="w-12 h-12 text-blue-400" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                      No admin tasks found
                                    </h3>
                                    <p>Try adjusting your search or filters</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={clearAllFilters}
                                    className="mt-2"
                                  >
                                    Clear Filters
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAdminTasks.map((task) => (
                              <TableRow
                                key={task._id}
                                className="hover:bg-blue-50/50 transition-colors group"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <Avatar className="border-2 border-blue-100">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-bold">
                                          <FolderOpen className="w-4 h-4" />
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                        {task.title}
                                      </div>
                                      <div className="text-sm text-gray-500 truncate">
                                        {task.description}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-gray-900">
                                    {task.clientName || "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-2">
                                    {task.managers
                                      ?.slice(0, 2)
                                      .map((manager, idx) => (
                                        <div key={idx}>
                                          {renderUserAvatar(manager)}
                                        </div>
                                      ))}
                                    {task.managers?.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-gray-50"
                                      >
                                        +{task.managers.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {renderPriorityBadge(task.priority)}
                                </TableCell>
                                <TableCell>
                                  {renderStatusBadge(task.status)}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm space-y-1">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        Due:{" "}
                                        {task.endDate
                                          ? formatDate(task.endDate)
                                          : "Not set"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Created: {getTimeAgo(task.createdAt)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              handleViewDetails(
                                                "adminTask",
                                                task
                                              )
                                            }
                                            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View Details</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                                          >
                                            <Share2 className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Share Task</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-gray-700 hover:text-amber-600 hover:bg-amber-50"
                                          >
                                            <MessageCircle className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Add Comment</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    renderGridView(filteredAdminTasks, "adminTask")
                  )}
                </TabsContent>

                {/* Subtasks Tab Content */}
                <TabsContent value="subtasks" className="mt-0">
                  {viewMode === "table" ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100">
                          <TableRow>
                            <TableHead className="font-bold text-emerald-900 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Task Details
                              </div>
                            </TableHead>
                            <TableHead className="font-bold text-emerald-900">
                              Team Lead
                            </TableHead>
                            <TableHead className="font-bold text-emerald-900">
                              Assigned Employees
                            </TableHead>
                            <TableHead className="font-bold text-emerald-900">
                              Priority
                            </TableHead>
                            <TableHead className="font-bold text-emerald-900">
                              Status
                            </TableHead>
                            <TableHead className="font-bold text-emerald-900">
                              Timeline
                            </TableHead>
                            <TableHead className="font-bold text-emerald-900">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSubtasks.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-12"
                              >
                                <div className="flex flex-col items-center gap-4 text-gray-500">
                                  <div className="p-4 bg-emerald-50 rounded-full">
                                    <FileText className="w-12 h-12 text-emerald-400" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                      No subtasks found
                                    </h3>
                                    <p>Try adjusting your search or filters</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={clearAllFilters}
                                    className="mt-2"
                                  >
                                    Clear Filters
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredSubtasks.map((subtask) => (
                              <TableRow
                                key={subtask._id}
                                className="hover:bg-emerald-50/50 transition-colors group"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <Avatar className="border-2 border-emerald-100">
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold">
                                          <FileText className="w-4 h-4" />
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                                        {subtask.title}
                                      </div>
                                      <div className="text-sm text-gray-500 truncate">
                                        {subtask.description}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {subtask.teamLeadId ? (
                                    renderUserAvatar(subtask.teamLeadId)
                                  ) : (
                                    <div className="text-gray-400 text-sm">
                                      Not assigned
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-2">
                                    {subtask.assignedEmployees
                                      ?.slice(0, 2)
                                      .map((emp, idx) => (
                                        <div key={idx}>
                                          {emp.employeeId ? (
                                            renderUserAvatar(emp.employeeId)
                                          ) : (
                                            <div className="text-gray-400 text-sm">
                                              Not assigned
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    {subtask.assignedEmployees?.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-gray-50"
                                      >
                                        +{subtask.assignedEmployees.length - 2}{" "}
                                        more
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {renderPriorityBadge(subtask.priority)}
                                </TableCell>
                                <TableCell>
                                  {renderStatusBadge(subtask.status)}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm space-y-1">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        Due:{" "}
                                        {subtask.endDate
                                          ? formatDate(subtask.endDate)
                                          : "Not set"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Created: {getTimeAgo(subtask.createdAt)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              handleViewDetails(
                                                "subtask",
                                                subtask
                                              )
                                            }
                                            className="text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View Details</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                                          >
                                            <Users className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Assign Employee</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    renderGridView(filteredSubtasks, "subtask")
                  )}
                </TabsContent>

                {/* Submissions Tab Content */}
                <TabsContent value="submissions" className="mt-0">
                  {viewMode === "table" ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                          <TableRow>
                            <TableHead className="font-bold text-purple-900 py-4">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Submission Details
                              </div>
                            </TableHead>
                            <TableHead className="font-bold text-purple-900">
                              Submitted By
                            </TableHead>
                            <TableHead className="font-bold text-purple-900">
                              Manager Status
                            </TableHead>
                            <TableHead className="font-bold text-purple-900">
                              Team Lead Status
                            </TableHead>
                            <TableHead className="font-bold text-purple-900">
                              Admin Status
                            </TableHead>
                            <TableHead className="font-bold text-purple-900">
                              Overall Status
                            </TableHead>
                            <TableHead className="font-bold text-purple-900">
                              Timeline
                            </TableHead>
                            <TableHead className="font-bold text-purple-900">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSubmissions.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="text-center py-12"
                              >
                                <div className="flex flex-col items-center gap-4 text-gray-500">
                                  <div className="p-4 bg-purple-50 rounded-full">
                                    <Users className="w-12 h-12 text-purple-400" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                      No submissions found
                                    </h3>
                                    <p>Try adjusting your search or filters</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={clearAllFilters}
                                    className="mt-2"
                                  >
                                    Clear Filters
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredSubmissions.map((submission) => (
                              <TableRow
                                key={submission._id}
                                className="hover:bg-purple-50/50 transition-colors group"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <Avatar className="border-2 border-purple-100">
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                                          <Users className="w-4 h-4" />
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                        {submission.clinetName || "No Client"}
                                      </div>
                                      <div className="text-sm text-gray-500 truncate">
                                        {submission.form?.title}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {submission.submittedBy ? (
                                    renderUserAvatar(submission.submittedBy)
                                  ) : (
                                    <div className="text-gray-400 text-sm">
                                      Unknown
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {renderStatusBadge(
                                    submission.status,
                                    "manager"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {renderStatusBadge(
                                    submission.status2,
                                    "teamlead"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {renderStatusBadge(
                                    submission.adminStatus,
                                    "admin"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {renderStatusBadge(
                                    submission.statusHierarchy?.overallStatus,
                                    "overall"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm space-y-1">
                                    <div className="text-gray-600">
                                      Created:{" "}
                                      {getTimeAgo(
                                        submission?.timestamps?.createdAt
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Updated:{" "}
                                      {getTimeAgo(
                                        submission?.timestamps?.updatedAt
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              handleViewDetails(
                                                "submission",
                                                submission
                                              )
                                            }
                                            className="text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View Details</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    {session.user.role === "Admin" && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                setSelectedTask(submission);
                                                setShowFeedbackDialog(true);
                                              }}
                                              className="text-gray-700 hover:text-amber-600 hover:bg-amber-50"
                                            >
                                              <CheckCircle className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Update Status</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    renderGridView(filteredSubmissions, "submission")
                  )}
                </TabsContent>
              </div>
            </CardContent>
          </Card>
        </Tabs>

        {/* Analytics Panel */}
        <Card className="mt-8 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Performance Analytics
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Last 30 Days
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Today</DropdownMenuItem>
                  <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
                  <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                  <DropdownMenuItem>Last Quarter</DropdownMenuItem>
                  <DropdownMenuItem>Custom Range</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Distribution */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Submission Status Distribution
                </h3>
                <div className="space-y-4">
                  {Object.entries(
                    tasksData.stats?.submissionStatuses || {}
                  ).map(([status, count]) => {
                    const percentage = tasksData.counts?.submissions
                      ? Math.round((count / tasksData.counts.submissions) * 100)
                      : 0;

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                getStatusVariant(status).split(" ")[0]
                              }`}
                            />
                            <div>
                              <span className="text-sm font-medium capitalize text-gray-900">
                                {status.replace("_", " ")}
                              </span>
                              <div className="text-xs text-gray-500">
                                {count} submissions
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {percentage}%
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Key Performance Indicators
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {tasksData.stats?.completionRate || 0}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Completion Rate
                          </div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {Math.round(
                              ((tasksData.stats?.submissionStatuses?.approved ||
                                0) /
                                (tasksData.counts?.submissions || 1)) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-sm text-gray-600">
                            Approval Rate
                          </div>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-amber-600">
                            {Math.round(
                              (filteredAdminTasks.filter(
                                (t) => t.status === "in_progress"
                              ).length /
                                filteredAdminTasks.length) *
                                100
                            ) || 0}
                            %
                          </div>
                          <div className="text-sm text-gray-600">
                            In Progress Tasks
                          </div>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg">
                          <Activity className="w-5 h-5 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {filteredSubmissions.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Active Submissions
                          </div>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-4xl bg-white text-gray-900 border border-gray-200 shadow-2xl rounded-2xl">
          {selectedTask && (
            <>
              <DialogHeader className="pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {selectedTask.type === "adminTask" && (
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                        <FolderOpen className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    {selectedTask.type === "subtask" && (
                      <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                    {selectedTask.type === "submission" && (
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                    )}
                    <div className="max-w-2xl">
                      <DialogTitle className="text-2xl font-bold text-gray-900">
                        {selectedTask.title || selectedTask.clinetName}
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 mt-1">
                        {selectedTask.type === "submission"
                          ? selectedTask.form?.title
                          : selectedTask.description ||
                            `Details for ${selectedTask.type}`}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {renderStatusBadge(
                      selectedTask.status ||
                        selectedTask.statusHierarchy?.overallStatus
                    )}
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="py-6 space-y-8">
                  {/* Status Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Status Overview
                        </h3>
                        <div className="space-y-4">
                          {selectedTask.type === "submission" ? (
                            <>
                              {renderStatusIndicator(
                                selectedTask.status,
                                "Manager Status"
                              )}
                              {renderStatusIndicator(
                                selectedTask.status2,
                                "Team Lead Status"
                              )}
                              {renderStatusIndicator(
                                selectedTask.adminStatus,
                                "Admin Status"
                              )}
                              {renderStatusIndicator(
                                selectedTask.statusHierarchy?.overallStatus,
                                "Overall Status"
                              )}
                            </>
                          ) : (
                            <>
                              {renderStatusIndicator(
                                selectedTask.status,
                                "Status"
                              )}
                              {selectedTask.priority && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      selectedTask.priority === "high"
                                        ? "bg-rose-500"
                                        : selectedTask.priority === "medium"
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                  />
                                  <span className="text-sm text-gray-600">
                                    Priority:
                                  </span>
                                  <span className="text-sm font-medium uppercase">
                                    {selectedTask.priority}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timeline Information */}
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Timeline
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Created
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatDateTime(
                                selectedTask.createdAt ||
                                  selectedTask.timestamps?.createdAt
                              )}
                            </span>
                          </div>
                          {selectedTask.endDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Due Date
                              </span>
                              <span
                                className={`font-medium ${
                                  new Date(selectedTask.endDate) < new Date()
                                    ? "text-rose-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {formatDateTime(selectedTask.endDate)}
                              </span>
                            </div>
                          )}
                          {selectedTask.completedAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Completed
                              </span>
                              <span className="font-medium text-emerald-600">
                                {formatDateTime(selectedTask.completedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Submission Specific Details */}
                  {selectedTask.type === "submission" && (
                    <div className="space-y-6">
                      {/* Status Hierarchy */}
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-600" />
                            Status Hierarchy
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-lg">
                                  <UserCheck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    Manager
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Approval Level
                                  </div>
                                </div>
                              </div>
                              {renderStatusBadge(
                                selectedTask.status,
                                "manager"
                              )}
                            </div>
                            <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-lg">
                                  <Crown className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    Team Lead
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Review Level
                                  </div>
                                </div>
                              </div>
                              {renderStatusBadge(
                                selectedTask.status2,
                                "teamlead"
                              )}
                            </div>
                            <div className="p-4 border border-purple-200 rounded-xl bg-purple-50">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-lg">
                                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    Admin
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Final Approval
                                  </div>
                                </div>
                              </div>
                              {renderStatusBadge(
                                selectedTask.adminStatus,
                                "admin"
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Additional Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border border-gray-200">
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">
                              Form Information
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm text-gray-600">
                                  Form Title
                                </Label>
                                <div className="font-medium text-gray-900">
                                  {selectedTask.form?.title || "N/A"}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-600">
                                  Department
                                </Label>
                                <div className="font-medium text-gray-900">
                                  {selectedTask.form?.department?.name || "N/A"}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">
                              Submission Details
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm text-gray-600">
                                  Client Name
                                </Label>
                                <div className="font-medium text-gray-900">
                                  {selectedTask.clinetName || "N/A"}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-600">
                                  Submitted By
                                </Label>
                                <div className="font-medium text-gray-900">
                                  {selectedTask.submittedBy?.name || "N/A"}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Assigned Users Section */}
                  {(selectedTask.managers ||
                    selectedTask.teamLeadId ||
                    selectedTask.submittedBy) && (
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users2 className="w-5 h-5 text-blue-600" />
                          Assigned Personnel
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedTask.managers &&
                            selectedTask.managers.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">
                                  Managers
                                </h4>
                                <div className="space-y-3">
                                  {selectedTask.managers.map((manager, idx) => (
                                    <div key={idx}>
                                      {renderUserAvatar(manager)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          {selectedTask.teamLeadId && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Team Lead
                              </h4>
                              {renderUserAvatar(selectedTask.teamLeadId)}
                            </div>
                          )}
                          {selectedTask.submittedBy && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Submitted By
                              </h4>
                              {renderUserAvatar(selectedTask.submittedBy)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="pt-6 border-t border-gray-200 gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/admin/manager-tasks/${selectedTask._id}`)
                  }
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  <ViewIcon className="w-4 h-4 mr-2 text-purple-600 " />
                  Full details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="border-purple-300 text-purple-700 hover:bg-gray-50 rounded-xl "
                >
                  view
                </Button>
                {selectedTask.type === "submission" &&
                  session.user.role === "Admin" && (
                    <Button
                      onClick={() => {
                        setShowDetails(false);
                        setShowFeedbackDialog(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Status
                    </Button>
                  )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Update Submission Status
            </DialogTitle>
            <DialogDescription>
              Update the status for{" "}
              {selectedTask?.clinetName || "selected submission"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Select Status</Label>
              <Select defaultValue={selectedTask?.adminStatus || "pending"}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Feedback/Comments</Label>
              <Textarea
                placeholder="Add any feedback or comments..."
                className="mt-2 min-h-[100px]"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedTask) {
                  handleStatusUpdate(selectedTask._id, "approved", "admin");
                }
              }}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Export Data
            </DialogTitle>
            <DialogDescription>
              Export selected items in your preferred format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV (Excel)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Export Range</Label>
              <Select defaultValue="selected">
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected">
                    Selected Items ({selectedItems.length})
                  </SelectItem>
                  <SelectItem value="current">Current View</SelectItem>
                  <SelectItem value="all">All Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 <div className="p-6 space-y-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl p-6 shadow-2xl shadow-purple-500/20 mb-8">
        
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-white/30 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Members</p>
              <p className="text-white text-xl font-bold">
                {(data?.managers?.length || 0) + (data?.teamLeads?.length || 0) + (data?.employees?.length || 0)}
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-white/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Active Tasks</p>
              <p className="text-white text-xl font-bold">
                {data?.totalTasks || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Managers Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Managers
              </h2>
              <p className="text-gray-600">Leadership team overview</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200 px-4 py-1">
            {data?.managers?.length || 0} Managers
          </Badge>
        </div>
        
        {data?.managers?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.managers.map(({ manager, stats }) => renderStats(manager, stats, 'manager'))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 text-blue-300">
              <Crown className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-blue-800 mb-2">No Managers Found</h3>
            <p className="text-blue-600">Add managers to see their performance metrics</p>
          </div>
        )}
      </section>

      {/* Team Leads Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Team Leads
              </h2>
              <p className="text-gray-600">Team leadership performance</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-4 py-1">
            {data?.teamLeads?.length || 0} Team Leads
          </Badge>
        </div>
        
        {data?.teamLeads?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.teamLeads.map(({ teamLead, stats }) => renderStats(teamLead, stats, 'teamLead'))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-dashed border-green-200 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 text-green-300">
              <Users className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">No Team Leads Found</h3>
            <p className="text-green-600">Add team leads to see their performance metrics</p>
          </div>
        )}
      </section>

      {/* Employees Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Employees
              </h2>
              <p className="text-gray-600">Individual contributor performance</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 px-4 py-1">
            {data?.employees?.length || 0} Employees
          </Badge>
        </div>
        
        {data?.employees?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.employees.map(({ employee, stats }) => renderStats(employee, stats, 'employee'))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-200 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 text-purple-300">
              <User className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-purple-800 mb-2">No Employees Found</h3>
            <p className="text-purple-600">Add employees to see their performance metrics</p>
          </div>
        )}
      </section>
    </div>
    </div>
  );
}
