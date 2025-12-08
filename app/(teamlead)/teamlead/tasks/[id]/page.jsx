"use client";
import { useState, useEffect } from "react";
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
  MapPin,
  Eye,
  MoreVertical,
  Download,
  Share2,
  Copy,
  Bell,
  Star,
  TrendingUp,
  BarChart3,
  FolderOpen,
  Shield,
  Activity,
  Target,
  Award,
  Flag,
  Zap,
  Lightbulb,
  ThumbsUp,
  AlertTriangle,
  Info,
  HelpCircle,
  Menu,
} from "lucide-react";
import axios from "axios";

export default function TeamLeadTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
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
  const [activeTab, setActiveTab] = useState("details");
  const [progress, setProgress] = useState(0);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "TeamLead") {
      router.push("/login");
      return;
    }
    fetchTask();
    fetchAllEmployees();
  }, [session, status, router, taskId]);

  useEffect(() => {
    if (task) {
      calculateProgress();
    }
  }, [task]);

  const calculateProgress = () => {
    if (!task?.assignedEmployees?.length) {
      setProgress(0);
      return;
    }
    const completed = task.assignedEmployees.filter(
      emp => emp.status === "completed"
    ).length;
    const total = task.assignedEmployees.length;
    setProgress(Math.round((completed / total) * 100));
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/teamlead/tasks/${taskId}`);
      if (response.status === 200) {
        setTask(response.data.task);
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

  const handleStatusUpdate = async () => {
    if (!task || !newStatus) return;
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        teamLeadFeedback: feedback || `Status changed to ${newStatus}`
      };
      const response = await axios.put(`/api/teamlead/tasks/${taskId}`, updateData);
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
        assignedEmployees: selectedEmployees
      };
      const response = await axios.put(`/api/teamlead/tasks/${taskId}`, updateData);
      if (response.status === 200) {
        toast.success(`🎯 Assigned ${selectedEmployees.length} employee(s) successfully!`);
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
        removeEmployeeId: employeeToRemove._id
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
    const assignedEmployeeIds = task.assignedEmployees?.map(emp => 
      emp.employeeId?._id?.toString() || emp.employeeId.toString()
    ) || [];
    return employees.filter(emp => !assignedEmployeeIds.includes(emp._id.toString()));
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
      emp => emp.status === "pending"
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
          <h3 className="mt-6 text-lg font-semibold text-gray-800">Loading Task Details</h3>
          <p className="text-gray-500 mt-2 text-sm md:text-base">Fetching the latest information...</p>
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Task Not Found</h2>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                The requested task could not be found or you don't have access to it.
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
                  onClick={fetchTask}
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

  const filteredEmployees = getAvailableEmployees().filter(emp =>
    emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
        }}
      />

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
                <h1 className="text-base md:text-lg font-semibold text-gray-900">Task Management</h1>
                <p className="text-xs md:text-sm text-gray-500">Team Lead Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTask}
                      className="gap-2 text-gray-900 bg-white hidden sm:flex"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
                onClick={fetchTask}
                className="gap-2 text-gray-900 bg-white sm:hidden"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-gray-900 bg-white">
                    <MoreVertical className="w-4 h-4" />
                    <span className="hidden md:inline">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white text-gray-900 shadow-xl">
                  <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={copyTaskId} className="cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Task ID
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowAssignDialog(true)}
                    className="cursor-pointer"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign Employees
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
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
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={`${getStatusVariant(task.status2)} font-semibold px-2 py-1 md:px-3 text-xs md:text-sm`}>
                        {getStatusIcon(task.status2)}
                        <span className="ml-1">{task.status2.replace("_", " ")}</span>
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs md:text-sm">
                        <Target className="w-3 h-3 mr-1" />
                        {getTaskPriority()} Priority
                      </Badge>
                    </div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
                      {task.formId?.title || "Untitled Task"}
                    </h1>
                    <p className="text-gray-600 mb-4 text-sm md:text-base">
                      {task.formId?.description || "No description available"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-1 md:gap-2 text-gray-500">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Created:</span> {formatDate(task.createdAt)}
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 text-gray-500">
                        <User className="w-3 h-3 md:w-4 md:h-4" />
                        By: {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                      </div>
                      {task.completedAt && (
                        <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Completed:</span> {formatDate(task.completedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="details" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-gray-900 text-xs md:text-sm"
                >
                  <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="truncate">Form Details</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="team" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-gray-900 text-xs md:text-sm"
                >
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="truncate">Team ({task.assignedEmployees?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="updates" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-gray-900 text-xs md:text-sm"
                >
                  <Activity className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="truncate">Updates</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 md:space-y-6 pt-4 md:pt-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Task Completion</span>
                          <span className="text-sm font-semibold text-gray-900">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 md:gap-4">
                        <div className="text-center p-3 md:p-4 bg-emerald-50 rounded-lg">
                          <div className="text-lg md:text-2xl font-bold text-emerald-700">
                            {task.assignedEmployees?.filter(e => e.status === "completed").length || 0}
                          </div>
                          <div className="text-xs md:text-sm text-emerald-600">Completed</div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
                          <div className="text-lg md:text-2xl font-bold text-blue-700">
                            {task.assignedEmployees?.filter(e => e.status === "in_progress").length || 0}
                          </div>
                          <div className="text-xs md:text-sm text-blue-600">In Progress</div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-amber-50 rounded-lg">
                          <div className="text-lg md:text-2xl font-bold text-amber-700">
                            {task.assignedEmployees?.filter(e => e.status === "pending").length || 0}
                          </div>
                          <div className="text-xs md:text-sm text-amber-600">Pending</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <FolderOpen className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                      Form Submission Data
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm md:text-base">
                      All information submitted by the manager
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {task.formData && Object.entries(task.formData).map(([key, value]) => (
                        <div key={key} className="border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-5 bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2 md:mb-3">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500"></div>
                            <Label className="text-gray-700 font-bold text-sm md:text-base break-words">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </Label>
                          </div>
                          <div className="text-gray-800">
                            {typeof value === "object" && !Array.isArray(value) ? (
                              <pre className="text-xs md:text-sm overflow-x-auto whitespace-pre-wrap bg-gray-50 p-3 md:p-4 rounded-lg">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-2">
                                {value.map((item, index) => (
                                  <Badge 
                                    key={index} 
                                    className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-0 shadow-sm text-xs md:text-sm"
                                  >
                                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 md:px-4 md:py-3 text-gray-800 text-sm md:text-base break-words">
                                {value?.toString() || "Not provided"}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4 md:space-y-6 pt-4 md:pt-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                          <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                          Assigned Team
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-sm md:text-base">
                          {task.assignedEmployees?.length || 0} employees working on this task
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowAssignDialog(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg text-sm md:text-base"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Assign More
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {task.assignedEmployees && task.assignedEmployees.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {task.assignedEmployees.map((assignment) => {
                          const employee = assignment.employeeId;
                          return (
                            <div 
                              key={assignment._id} 
                              className="border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 bg-white hover:shadow-lg transition-all duration-300 group relative"
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 md:w-8 md:h-8"
                                  >
                                    <MoreVertical className="w-3 h-3 md:w-4 md:h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 md:w-48">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEmployeeToRemove(employee);
                                      setShowRemoveDialog(true);
                                    }}
                                    className="text-rose-600 cursor-pointer text-sm"
                                  >
                                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                    Remove from Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-white shadow-lg">
                                    <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm">
                                      {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-bold text-gray-900 text-sm md:text-base truncate">
                                      {employee?.firstName} {employee?.lastName}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-500 truncate">{employee?.email}</p>
                                    {employee?.department && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Building className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600 truncate">{employee.department}</span>
                                      </div>
                                    )}
                                    {employee?.position && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Briefcase className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600 truncate">{employee.position}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge className={`${getEmployeeStatusColor(assignment.status)} font-medium text-xs md:text-sm`}>
                                  {assignment.status.replace("_", " ")}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                                <div className="flex items-center justify-between text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                    Assigned:
                                  </span>
                                  <span className="font-medium">{formatRelativeDate(assignment.assignedAt)}</span>
                                </div>
                                {assignment.completedAt && (
                                  <div className="flex items-center justify-between text-emerald-600">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                      Completed:
                                    </span>
                                    <span className="font-medium">{formatRelativeDate(assignment.completedAt)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 md:py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 mb-4">
                          <Users className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No Team Assigned</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm md:text-base">
                          Assign employees to start working on this task.
                        </p>
                        <Button
                          onClick={() => setShowAssignDialog(true)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg text-sm md:text-base"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Assign First Employee
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates" className="space-y-4 md:space-y-6 pt-4 md:pt-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
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
                        {["pending", "in_progress", "completed", "approved", "rejected"].map((statusOption) => (
                          <Button
                            key={statusOption}
                            variant={newStatus === statusOption ? "default" : "outline"}
                            onClick={() => setNewStatus(statusOption)}
                            className={`justify-start h-auto py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm ${
                              newStatus === statusOption 
                                ? getStatusVariant(statusOption)
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-1 md:gap-2">
                              {getStatusIcon(statusOption)}
                              <span className="capitalize truncate">{statusOption.replace("_", " ")}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      <div className="space-y-2 md:space-y-3">
                        <Label className="text-gray-700 font-medium text-sm md:text-base">Add Feedback / Comments</Label>
                        <Textarea
                          placeholder="Enter your feedback, instructions, or comments here..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                          className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-700 text-sm md:text-base min-h-[100px]"
                        />
                        <p className="text-xs md:text-sm text-gray-500">
                          This feedback will be sent to the manager and all assigned employees.
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900 text-sm md:text-base">Notifications</span>
                        </div>
                        <p className="text-xs md:text-sm text-blue-700">
                          When you update the status, notifications will be sent to:
                        </p>
                        <ul className="mt-2 space-y-1 text-xs md:text-sm text-blue-700">
                          <li className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            Manager: {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                          </li>
                          <li className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            All assigned employees ({task.assignedEmployees?.length || 0})
                          </li>
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

                {task.teamLeadFeedback && (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow">
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm">
                                {session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                              <span className="font-semibold text-gray-900 text-sm md:text-base truncate">
                                {session?.user?.firstName} {session?.user?.lastName}
                              </span>
                              <span className="text-xs md:text-sm text-gray-500">{formatRelativeDate(task.updatedAt)}</span>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                              <p className="text-gray-800 text-sm md:text-base">{task.teamLeadFeedback}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs md:text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Team Lead
                              </span>
                              <Badge className={`${getStatusVariant(task.status2)} text-xs`}>
                                Status: {task.status2}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4 md:space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base md:text-lg text-gray-900">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm md:text-base">Task ID</span>
                    <code className="text-xs md:text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">
                      {task._id.slice(-8)}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm md:text-base">Priority</span>
                    <Badge className={`${getPriorityColor(getTaskPriority())} text-white text-xs md:text-sm`}>
                      {getTaskPriority()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm md:text-base">Last Updated</span>
                    <span className="font-medium text-gray-900 text-sm md:text-base">{formatRelativeDate(task.updatedAt)}</span>
                  </div>
                </div>
                <Separator />
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    className="w-full text-gray-700 hover:text-gray-900 text-sm md:text-base"
                    onClick={() => setActiveTab("updates")}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  Submitted By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-white shadow">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm">
                      {task.submittedBy?.firstName?.[0]}{task.submittedBy?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                      {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{task.submittedBy?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Manager</p>
                  </div>
                </div>
                <div className="mt-3 md:mt-4 space-y-1 md:space-y-2">
                  {task.submittedBy?.phone && (
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <Phone className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="truncate">{task.submittedBy.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                    Submitted: {formatDate(task.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {task.assignedEmployees && task.assignedEmployees.length > 0 && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 md:space-y-3">
                    {["completed", "in_progress", "pending", "rejected"].map((status) => {
                      const count = task.assignedEmployees.filter(
                        emp => emp.status === status
                      ).length;
                      if (count === 0) return null;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                              status === "completed" ? "bg-emerald-500" :
                              status === "in_progress" ? "bg-blue-500" :
                              status === "pending" ? "bg-amber-500" : "bg-rose-500"
                            }`}></div>
                            <span className="text-sm text-gray-600 capitalize">
                              {status.replace("_", " ")}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Assigned</span>
                      <span className="font-bold text-gray-900">
                        {task.assignedEmployees.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-4 md:pt-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 mb-3">
                    <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Need Help?</h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-4">
                    Having issues with this task?
                  </p>
                  <Button variant="outline" className="w-full text-gray-700 hover:text-gray-900 text-sm md:text-base">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl bg-white text-gray-900 border-0 shadow-2xl mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              Assign Employees to Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              Select employees to work on "{task?.formId?.title}". They'll receive email notifications.
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
                    {searchTerm ? "No employees found matching your search" : "No available employees"}
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
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee._id));
                        } else {
                          setSelectedEmployees([...selectedEmployees, employee._id]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <Avatar className="w-8 h-8 md:w-10 md:h-10">
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
                              {employee.firstName?.[0]}{employee.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 truncate">{employee.email}</p>
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
                          <span className="truncate">{employee.department}</span>
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
                <Label className="text-gray-700 font-semibold text-sm md:text-base">Selected Team</Label>
                <div className="flex flex-wrap gap-2 p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg md:rounded-xl border border-green-200">
                  {selectedEmployees.map((empId) => {
                    const employee = employees.find(e => e._id === empId);
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
                            setSelectedEmployees(selectedEmployees.filter(id => id !== empId));
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
                  <p className="font-medium text-blue-900 text-sm md:text-base">Notifications</p>
                  <p className="text-xs md:text-sm text-blue-700 mt-1">
                    Selected employees will receive an email notification with task details.
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
                  Assign {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-md bg-white text-gray-900 border-0 shadow-2xl mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
              Remove Employee from Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              This action cannot be undone. The employee will be notified via email.
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
                  <p className="text-xs md:text-sm text-gray-600 truncate">{employeeToRemove.email}</p>
                  {employeeToRemove.department && (
                    <p className="text-xs text-gray-500 truncate">{employeeToRemove.department}</p>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 text-sm md:text-base">Important Notice</p>
                    <ul className="mt-1 text-xs md:text-sm text-amber-700 space-y-1">
                      <li>• Employee will be removed from this task immediately</li>
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

      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
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