"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Search,
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Eye,
    Loader2,
    RefreshCw,
    Users,
    User,
    ChevronRight,
    Filter,
    TrendingUp,
<<<<<<< HEAD
    FilePlus,
    X,
    Play,
=======
     FilePlus,
  X,
  Play,
>>>>>>> d285dcb (set submission backend)
    Award,
    Target,
    BarChart3,
    Download,
    Mail,
    MessageSquare,
    Send,
    ThumbsUp,
    AlertTriangle,
<<<<<<< HEAD
    Video,
    Image,
    File,
    FileSpreadsheet,
    MessageCircle,
    Zap,
    Sparkles,
    Shield,
    Bell,
    Paperclip,
    CheckSquare,
    PlayCircle,
    PauseCircle,
    AlertOctagon,
    TrendingDown,
    PlusCircle,
    MinusCircle,
    Maximize2,
    Minimize2,
    EyeOff,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    Star,
    Award as AwardIcon,
    Timer,
    CalendarDays,
    FileCheck,
    FileX
=======
    Mail,
    Video,
    Image
>>>>>>> d285dcb (set submission backend)
} from "lucide-react";
import axios from "axios";

export default function EmployeeSubtasksPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    
    // States
    const [subtasks, setSubtasks] = useState([]);
    const [filteredSubtasks, setFilteredSubtasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("all");
    
    // Modal
    const [selectedSubtask, setSelectedSubtask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feedback, setFeedback] = useState("");
    
    // Preview
    const [previewFile, setPreviewFile] = useState(null);
    const [zoom, setZoom] = useState(1);
    
    // Stats
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        highPriority: 0,
        overdue: 0,
        efficiency: 0
    });

<<<<<<< HEAD
    // Fetch all subtasks on page load
=======
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

>>>>>>> d285dcb (set submission backend)
    useEffect(() => {
        if (sessionStatus === "loading") return;
        
        if (!session || session.user.role !== "Employee") {
            router.push("/employeelogin");
            return;
        }
        
        fetchSubtasks();
    }, [session, sessionStatus, router]);

    // Filter subtasks whenever filters change
    useEffect(() => {
        if (subtasks.length === 0) return;
        
        const filtered = subtasks.filter(subtask => {
            // Search filter
            const matchesSearch = searchTerm === "" || 
                subtask.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subtask.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            const employeeStatus = getEmployeeStatus(subtask);
            const matchesStatus = statusFilter === "all" || employeeStatus === statusFilter;
            
            // Priority filter
            const matchesPriority = priorityFilter === "all" || subtask.priority === priorityFilter;
            
            // Tab filter
            let matchesTab = true;
            if (activeTab === "active") {
                matchesTab = employeeStatus === "in_progress" || employeeStatus === "pending";
            } else if (activeTab === "pending") {
                matchesTab = employeeStatus === "pending";
            } else if (activeTab === "completed") {
                matchesTab = employeeStatus === "completed";
            }
            
            return matchesSearch && matchesStatus && matchesPriority && matchesTab;
        });
        
        setFilteredSubtasks(filtered);
    }, [subtasks, searchTerm, statusFilter, priorityFilter, activeTab]);

    // Calculate stats whenever subtasks change
    useEffect(() => {
        if (subtasks.length === 0) return;
        
        const now = new Date();
        const completed = subtasks.filter(s => getEmployeeStatus(s) === "completed").length;
        const inProgress = subtasks.filter(s => getEmployeeStatus(s) === "in_progress").length;
        const pending = subtasks.filter(s => getEmployeeStatus(s) === "pending").length;
        const highPriority = subtasks.filter(s => s.priority === "high").length;
        const overdue = subtasks.filter(s => {
            if (!s.endDate) return false;
            const endDate = new Date(s.endDate);
            const status = getEmployeeStatus(s);
            return endDate < now && status !== "completed";
        }).length;
        
        const efficiency = subtasks.length > 0 
            ? Math.round((completed / subtasks.length) * 100)
            : 0;
        
        setStats({
            total: subtasks.length,
            completed,
            inProgress,
            pending,
            highPriority,
            overdue,
            efficiency
        });
    }, [subtasks]);

    // Fetch subtasks from API
    const fetchSubtasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/employee/subtasks');
            
            if (response.data.success) {
                setSubtasks(response.data.subtasks || []);
            } else {
                toast.error(response.data.error || "Failed to fetch tasks");
            }
        } catch (error) {
            console.error("Error fetching subtasks:", error);
            toast.error(error.response?.data?.error || "Failed to fetch tasks");
        } finally {
            setLoading(false);
        }
    };

    // Open subtask details modal
    const openSubtaskDetails = async (subtaskId) => {
        try {
            setUpdating(true);
            const response = await axios.get(`/api/employee/subtasks/${subtaskId}`);
            
            if (response.data) {
                setSelectedSubtask(response.data);
                setIsModalOpen(true);
            } else {
                toast.error("Failed to load task details");
            }
        } catch (error) {
            console.error("Error fetching subtask details:", error);
            toast.error(error.response?.data?.error || "Failed to load task details");
        } finally {
            setUpdating(false);
        }
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubtask(null);
        setFeedback("");
        setZoom(1);
    };

    // Update subtask status
    const updateStatus = async (status) => {
        if (!selectedSubtask) return;
        
        try {
            setUpdating(true);
            const response = await axios.put(`/api/employee/subtasks/${selectedSubtask._id}`, {
                status,
                feedback: feedback.trim()
            });
            
            if (response.data.success) {
                // Update subtasks list
                setSubtasks(prev => prev.map(st => 
                    st._id === selectedSubtask._id 
                        ? { ...st, ...response.data.subtask } 
                        : st
                ));
                
                // Update selected subtask in modal
                setSelectedSubtask(prev => ({
                    ...prev,
                    ...response.data.subtask
                }));
                
                toast.success(`Status updated to ${formatStatus(status)}`, {
                    icon: "✅",
                    duration: 3000
                });
                
                setFeedback(""); // Clear feedback after status update
                fetchSubtasks(); // Refresh the list
            } else {
                toast.error(response.data.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(error.response?.data?.error || "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    // Submit feedback only
    const submitFeedback = async () => {
        if (!selectedSubtask || !feedback.trim()) {
            toast.error("Please enter feedback");
            return;
        }
        
        try {
            setSubmittingFeedback(true);
            const response = await axios.put(`/api/employee/subtasks/${selectedSubtask._id}`, {
                feedback: feedback.trim()
            });
            
            if (response.data.success) {
                // Update selected subtask in modal
                setSelectedSubtask(prev => ({
                    ...prev,
                    employeeFeedbacks: response.data.subtask.employeeFeedbacks,
                    feedbackUpdatedAt: response.data.subtask.feedbackUpdatedAt
                }));
                
                toast.success("Feedback submitted successfully", {
                    icon: "💬",
                    duration: 3000
                });
                
                setFeedback(""); // Clear input
            } else {
                toast.error(response.data.error || "Failed to submit feedback");
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast.error(error.response?.data?.error || "Failed to submit feedback");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    // Download file
    const downloadFile = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Get file icon based on type
    const getFileIcon = (fileType) => {
        if (fileType?.includes('image')) return <Image className="w-5 h-5 text-green-600" />;
        if (fileType?.includes('video')) return <Video className="w-5 h-5 text-blue-600" />;
        if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
        if (fileType?.includes('word') || fileType?.includes('doc')) return <FileText className="w-5 h-5 text-blue-700" />;
        if (fileType?.includes('excel') || fileType?.includes('sheet')) return <FileSpreadsheet className="w-5 h-5 text-green-700" />;
        return <File className="w-5 h-5 text-gray-600" />;
    };

    // Get status badge style
    const getStatusBadge = (status) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800 border-green-200";
            case "in_progress":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Get priority badge style
    const getPriorityBadge = (priority) => {
        switch (priority) {
            case "high":
                return "bg-red-100 text-red-800 border-red-200";
            case "medium":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "low":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Get employee status from subtask
    const getEmployeeStatus = (subtask) => {
        if (!subtask.assignedEmployees || !session?.user?.id) return "pending";
        
        const employee = subtask.assignedEmployees.find(
            emp => emp.employeeId?._id?.toString() === session.user.id
        );
        
        return employee?.status || "pending";
    };

    // Get employee feedbacks from subtask
    const getEmployeeFeedbacks = (subtask) => {
        if (!subtask.assignedEmployees || !session?.user?.id) return [];
        
        const employee = subtask.assignedEmployees.find(
            emp => emp.employeeId?._id?.toString() === session.user.id
        );
        
        return employee?.feedbacks || [];
    };

    // Format status for display
    const formatStatus = (status) => {
        if (!status) return "Unknown";
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format time
    const formatTime = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate time remaining
    const getTimeRemaining = (endDate) => {
        if (!endDate) return { text: "No deadline", color: "text-gray-600" };
        
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: "Overdue", color: "text-red-600 font-semibold" };
        if (diffDays === 0) return { text: "Due today", color: "text-yellow-600 font-semibold" };
        if (diffDays <= 3) return { text: `${diffDays} days left`, color: "text-yellow-600" };
        return { text: `${diffDays} days left`, color: "text-green-600" };
    };

    // Calculate progress percentage
    const calculateProgress = (subtask) => {
        const status = getEmployeeStatus(subtask);
        switch (status) {
            case "completed": return 100;
            case "in_progress": return 50;
            case "pending": return 10;
            default: return 0;
        }
    };

    // Loading state
    if (sessionStatus === "loading") {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
                    <p className="text-gray-700">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Unauthenticated state
    if (!session || session.user.role !== "Employee") {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-gray-200 shadow-lg">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-gray-800" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                            <p className="text-gray-600 mb-6">
                                Please log in with your employee credentials to access this page.
                            </p>
                            <Button 
                                onClick={() => router.push("/employeelogin")}
                                className="w-full bg-black text-white hover:bg-gray-800"
                            >
                                Go to Login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
<<<<<<< HEAD
            <div className="min-h-screen bg-white p-4 md:p-6">
                <Toaster position="top-right" />
                
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-black rounded-lg">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        My Tasks Dashboard
                                    </h1>
                                    <p className="text-gray-600 mt-2">
                                        Welcome back, <span className="font-semibold text-black">{session.user.name}</span>!
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={fetchSubtasks}
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                onClick={() => router.push('/employee/performance')}
                                className="bg-black text-white hover:bg-gray-800"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Performance
                            </Button>
                        </div>
                    </div>
=======
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30 p-4 md:p-6">
            <Toaster 
                position="top-right"
                toastOptions={{
                    className: "bg-white border border-gray-200 shadow-xl rounded-xl",
                }}
            />
>>>>>>> d285dcb (set submission backend)

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Tasks</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-gray-800" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Pending</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                    </div>
                                    <div className="p-2 bg-yellow-50 rounded-lg">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">In Progress</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <PlayCircle className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Completed</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                                    </div>
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">High Priority</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
                                    </div>
                                    <div className="p-2 bg-red-50 rounded-lg">
                                        <AlertOctagon className="w-5 h-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Efficiency</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.efficiency}%</p>
                                    </div>
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-gray-800" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters Section */}
                    <Card className="bg-white border border-gray-200 shadow-sm mb-8">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-4 items-center">
                                {/* Search */}
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                                    />
                                </div>
                                
                                {/* Status Filter */}
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full lg:w-[180px] border-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-gray-500" />
                                            <span>Status</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                {/* Priority Filter */}
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="w-full lg:w-[180px] border-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-gray-500" />
                                            <span>Priority</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Tasks Table */}
                <div className="max-w-7xl mx-auto">
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardHeader className="border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900">My Tasks</CardTitle>
                                    <CardDescription className="text-gray-900 dark:text-gray-900">
                                        {filteredSubtasks.length} task{filteredSubtasks.length !== 1 ? 's' : ''} found
                                        {stats.overdue > 0 && ` • ${stats.overdue} overdue`}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
                                    <p className="text-gray-600">Loading your tasks...</p>
                                </div>
                            ) : filteredSubtasks.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FileText className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                                            ? "No tasks match your filters" 
                                            : "No tasks assigned yet"}
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                                            ? "Try adjusting your search or filters to find tasks."
                                            : "Tasks will appear here once assigned by your team lead."}
                                    </p>
                                    {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setStatusFilter("all");
                                                setPriorityFilter("all");
                                            }}
                                            className="border-gray-300"
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="font-semibold text-gray-900">Task Details</TableHead>
                                                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                                                <TableHead className="font-semibold text-gray-900">Priority</TableHead>
                                                <TableHead className="font-semibold text-gray-900">Deadline</TableHead>
                                                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSubtasks.map((subtask) => {
                                                const employeeStatus = getEmployeeStatus(subtask);
                                                const timeRemaining = getTimeRemaining(subtask.endDate);
                                                const progress = calculateProgress(subtask);
                                                
                                                return (
                                                    <TableRow key={subtask._id} className="hover:bg-gray-50 border-gray-200">
                                                        <TableCell>
                                                            <div className="space-y-2">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`p-2 rounded-lg ${
                                                                        subtask.priority === 'high' ? 'bg-red-50' :
                                                                        subtask.priority === 'medium' ? 'bg-yellow-50' :
                                                                        'bg-green-50'
                                                                    }`}>
                                                                        <FileText className={`w-5 h-5 ${
                                                                            subtask.priority === 'high' ? 'text-red-600' :
                                                                            subtask.priority === 'medium' ? 'text-yellow-600' :
                                                                            'text-green-600'
                                                                        }`} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                                            {subtask.title}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                                            {subtask.description}
                                                                        </p>
                                                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                                            <div className="flex items-center gap-1">
                                                                                <Users className="w-3 h-3" />
                                                                                <span>{subtask.assignedEmployees?.length || 0} members</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="w-3 h-3" />
                                                                                <span>{subtask.teamLeadId?.firstName || "Team Lead"}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Progress value={progress} className="h-2 bg-gray-200" />
                                                            </div>
                                                        </TableCell>
                                                        
                                                        <TableCell>
                                                            <Badge className={`${getStatusBadge(employeeStatus)} font-medium`}>
                                                                {formatStatus(employeeStatus)}
                                                            </Badge>
                                                        </TableCell>
                                                        
                                                        <TableCell>
                                                            <Badge className={`${getPriorityBadge(subtask.priority)} font-medium`}>
                                                                {subtask.priority || "Medium"}
                                                            </Badge>
                                                        </TableCell>
                                                        
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="text-sm text-gray-900">
                                                                    {formatDate(subtask.endDate)}
                                                                </div>
                                                                <div className={`text-xs ${timeRemaining.color}`}>
                                                                    {timeRemaining.text}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => openSubtaskDetails(subtask._id)}
                                                                    className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-900 dark:text-gray-900"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-1" />
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => router.push(`/employee/subtasks/${subtask._id}`)}
                                                                    className="bg-black text-white hover:bg-gray-800"
                                                                >
                                                                    <FileCheck className="w-4 h-4 mr-1" />
                                                                    Submit
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Subtask Details Modal */}
            {isModalOpen && selectedSubtask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-black text-white p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-bold truncate">{selectedSubtask.title}</h2>
                                    </div>
                                    <p className="text-gray-300 line-clamp-2">{selectedSubtask.description}</p>
                                </div>
                                <Button
                                    onClick={closeModal}
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 rounded-full"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column - Task Details & Actions */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Status Update Section */}
                                    <Card className="border-gray-200">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                                <TrendingUp className="w-5 h-5" />
                                                Update Task Status
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                {[
                                                    { status: "pending", label: "Pending", icon: <Clock />, bgColor: "bg-yellow-50", hoverColor: "hover:bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-200" },
                                                    { status: "in_progress", label: "In Progress", icon: <PlayCircle />, bgColor: "bg-blue-50", hoverColor: "hover:bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-200" },
                                                    { status: "completed", label: "Completed", icon: <CheckCircle />, bgColor: "bg-green-50", hoverColor: "hover:bg-green-100", textColor: "text-green-800", borderColor: "border-green-200" }
                                                ].map((item) => {
                                                    const isActive = selectedSubtask.employeeStatus === item.status;
                                                    return (
                                                        <Button
                                                            key={item.status}
                                                            disabled={updating || isActive}
                                                            onClick={() => updateStatus(item.status)}
                                                            className={`h-24 flex flex-col gap-2 font-semibold transition-all ${
                                                                isActive 
                                                                    ? `${item.bgColor} ${item.textColor} ${item.borderColor} border-2` 
                                                                    : `bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 ${item.hoverColor}`
                                                            }`}
                                                        >
                                                            <div className="text-2xl">{item.icon}</div>
                                                            <span>{item.label}</span>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
<<<<<<< HEAD
=======

                                          
>>>>>>> d285dcb (set submission backend)
                                        </CardContent>
                                    </Card>

                                    {/* Task Details */}
                                    <Card className="border-gray-200">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                                <FileText className="w-5 h-5" />
                                                Task Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                                                    {selectedSubtask.description}
                                                </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Start Date</h4>
                                                    <p className="text-gray-900">{formatDate(selectedSubtask.startDate)}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">End Date</h4>
                                                    <p className="text-gray-900">{formatDate(selectedSubtask.endDate)}</p>
                                                </div>
                                            </div>
                                            
                                            {selectedSubtask.startTime && selectedSubtask.endTime && (
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Working Hours</h4>
                                                    <p className="text-gray-900">
                                                        {selectedSubtask.startTime} - {selectedSubtask.endTime}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

<<<<<<< HEAD
                                    {/* Attachments */}
                                    {selectedSubtask.fileAttachments?.length > 0 && (
                                        <Card className="border-gray-200">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-gray-900">
                                                    <Paperclip className="w-5 h-5" />
                                                    Attachments ({selectedSubtask.fileAttachments.length})
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedSubtask.fileAttachments.map((file, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                {getFileIcon(file.type)}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {Math.round(file.size / 1024)} KB
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setPreviewFile(file)}
                                                                    className="flex-1 border-gray-300"
                                                                >
                                                                    Preview
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => downloadFile(file.url, file.name)}
                                                                    className="flex-1 bg-black text-white hover:bg-gray-800"
                                                                >
                                                                    <Download className="w-4 h-4 mr-2" />
                                                                    Download
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
=======
                                     <Card className="mt-4">
                                                                                            <CardHeader>
                                                                                              <CardTitle className="text-lg font-semibold text-gray-900">Attachments</CardTitle>
                                                                                            </CardHeader>
                                                                                            <CardContent>
                                                                                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                                                {selectedSubtask.fileAttachments?.map((file) => {
                                                                                                  const { url, name, type, publicId } = file;
                                                                                          
                                                                                                  const isImage = type.startsWith("image/");
                                                                                                  const isVideo = type.startsWith("video/");
                                                                                                  const isPDF = type.includes("pdf");
                                                                                                  const isWord = type.includes("word") || type.includes("doc");
                                                                                                  const isExcel = type.includes("excel") || type.includes("sheet") || type.includes("xlsx");
                                                                                          
                                                                                                  // Color and icon for file type
                                                                                                  let bgColor = "bg-purple-100 text-purple-800";
                                                                                                  let Icon = FilePlus;
                                                                                          
                                                                                                  if (isImage) bgColor = "bg-green-100 text-green-800";
                                                                                                  else if (isVideo) bgColor = "bg-blue-100 text-blue-800";
                                                                                                  else if (isPDF) { bgColor = "bg-red-100 text-red-800"; Icon = FileText; }
                                                                                                  else if (isWord) { bgColor = "bg-blue-100 text-blue-800"; Icon = FileText; }
                                                                                                  else if (isExcel) { bgColor = "bg-green-100 text-green-800"; Icon = FileSpreadsheet; }
                                                                                          
                                                                                                  return (
                                                                                                    <div
                                                                                                      key={publicId}
                                                                                                      className={`w-full rounded shadow flex flex-col overflow-hidden ${bgColor}`}
                                                                                                    >
                                                                                                      {/* Preview area */}
                                                                                                      <div className="flex-1 w-full h-40 flex items-center justify-center overflow-hidden">
                                                                                                        {isImage ? (
                                                                                                          <img src={url} alt={name} className="object-cover w-full h-full" />
                                                                                                        ) : isVideo ? (
                                                                                                          <div className="relative w-full h-full">
                                                                                                            <video src={url} className="object-cover w-full h-full opacity-80" />
                                                                                                            <Play className="absolute w-8 h-8 text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                                                                          </div>
                                                                                                        ) : (
                                                                                                          <Icon className="w-12 h-12" />
                                                                                                        )}
                                                                                                      </div>
                                                                                          
                                                                                                      {/* Bottom: file name + buttons */}
                                                                                                      <div className="p-2 bg-white flex flex-col items-center gap-2">
                                                                                                        <p className="text-sm font-medium truncate w-full text-center">{name}</p>
                                                                                                        <div className="flex gap-2">
                                                                                                          <Button
                                                                                                            size="sm"
                                                                                                            variant="outline"
                                                                                                            onClick={() => setPreviewFile(file)}
                                                                                                          >
                                                                                                            Preview
                                                                                                          </Button>
                                                                                                          <Button
                                                                                                            size="sm"
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


                                                                                            {/* Feedback Section */}
                                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                                    <h4 className="font-bold text-gray-900">Add Feedback / Comments</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    <textarea
  value={feedback}
  onChange={(e) => setFeedback(e.target.value)}
  placeholder="Share your progress, challenges, or any feedback about this task..."
  className="w-full min-h-[100px] p-3 border-2 border-gray-300 rounded-lg 
             text-gray-900 placeholder-gray-400
             focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
             resize-none"
  rows={4}
/>

                                                    <div className="flex gap-3">
                                                        <Button
                                                            onClick={submitFeedbackOnly}
                                                            disabled={!feedback.trim() || isSubmittingFeedback}
                                                            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white flex-1"
                                                        >
                                                            {isSubmittingFeedback ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <Send className="w-4 h-4 mr-2" />
                                                            )}
                                                            Send Feedback Only
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setFeedback("")}
                                                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                                            disabled={!feedback.trim()}
                                                        >
                                                            Clear
                                                        </Button>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                            <span>Your feedback will be sent to the team lead along with status updates</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ThumbsUp className="w-4 h-4 text-emerald-500" />
                                                            <span>Team lead will be notified immediately</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                                      
>>>>>>> d285dcb (set submission backend)
                                </div>

                                {/* Right Column - Team Info & Feedback */}
                                <div className="space-y-6">
                                    {/* Team Lead Info */}
                                    <Card className="border-gray-200">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                                <User className="w-5 h-5" />
                                                Team Lead
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback className="bg-gray-100 text-gray-800 font-semibold">
                                                        {selectedSubtask.teamLeadId?.firstName?.[0] || "T"}
                                                        {selectedSubtask.teamLeadId?.lastName?.[0] || "L"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {selectedSubtask.teamLeadId?.firstName} {selectedSubtask.teamLeadId?.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{selectedSubtask.teamLeadId?.email}</p>
                                                    <Badge variant="outline" className="mt-2 border-gray-300 text-gray-700">
                                                        <Bell className="w-3 h-3 mr-1" />
                                                        Will be notified
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Previous Feedbacks */}
                                    {selectedSubtask.employeeFeedbacks?.length > 0 && (
                                        <Card className="border-gray-200">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-gray-900">
                                                    <MessageSquare className="w-5 h-5" />
                                                    Previous Feedbacks ({selectedSubtask.employeeFeedbacks.length})
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                                    {selectedSubtask.employeeFeedbacks
                                                        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                                                        .map((feedbackItem, index) => (
                                                            <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        Feedback #{selectedSubtask.employeeFeedbacks.length - index}
                                                                    </span>
                                                                    <span className="text-xs text-gray-600">
                                                                        {formatDate(feedbackItem.sentAt)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700 text-sm">{feedbackItem.feedback}</p>
                                                            </div>
                                                        ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* New Feedback */}
                                    <Card className="border-gray-200">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                                <Send className="w-5 h-5" />
                                                Add Feedback
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <Textarea
                                                    placeholder="Share your progress, challenges, or any feedback..."
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    rows={4}
                                                    className="resize-none border-gray-300 focus:border-black focus:ring-black text-gray-900 dark:text-gray-900"

                                                />
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={submitFeedback}
                                                        disabled={!feedback.trim() || submittingFeedback}
                                                        className="flex-1 bg-black text-white hover:bg-gray-800"
                                                    >
                                                        {submittingFeedback ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4 mr-2" />
                                                        )}
                                                        Send Feedback
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setFeedback("")}
                                                        disabled={!feedback.trim()}
                                                        className="border-gray-300"
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                                    <Bell className="w-4 h-4" />
                                                    Team lead will be notified of your feedback
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                {getFileIcon(previewFile.type)}
                                <h3 className="font-semibold text-gray-900">{previewFile.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
                                    className="border-gray-300"
                                >
                                    <PlusCircle className="w-4 h-4 mr-1" />
                                    Zoom In
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.2))}
                                    className="border-gray-300"
                                >
                                    <MinusCircle className="w-4 h-4 mr-1" />
                                    Zoom Out
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                    className="border-gray-300"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setPreviewFile(null);
                                        setZoom(1);
                                    }}
                                    className="text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 bg-gray-900 flex items-center justify-center">
                            {previewFile.type?.includes('image') ? (
                                <img
                                    src={previewFile.url}
                                    alt={previewFile.name}
                                    className="rounded-lg max-w-full max-h-full object-contain"
                                    style={{ transform: `scale(${zoom})` }}
                                />
                            ) : previewFile.type?.includes('video') ? (
                                <video
                                    controls
                                    className="rounded-lg max-w-full max-h-full"
                                    style={{ transform: `scale(${zoom})` }}
                                >
                                    <source src={previewFile.url} type={previewFile.type} />
                                    Your browser does not support the video tag.
                                </video>
                            ) : previewFile.type?.includes('pdf') ? (
                                <iframe
                                    src={previewFile.url}
                                    className="w-full h-[70vh] border-0 rounded-lg"
                                    title={previewFile.name}
                                />
                            ) : (
                                <div className="text-center text-white">
                                    <File className="w-16 h-16 mx-auto mb-4" />
                                    <p>Preview not available for this file type</p>
                                    <Button
                                        onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                        className="mt-4 bg-white text-black hover:bg-gray-100"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download File
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
<<<<<<< HEAD
            )}
        </>
=======
            </div>
        </div>

          {/* Full Page Preview Modal with Zoom */}
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
            </>
>>>>>>> d285dcb (set submission backend)
    );
}