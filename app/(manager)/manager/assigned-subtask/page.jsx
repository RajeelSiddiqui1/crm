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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    Search,
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    X,
    FilePlus,
    Play,
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
    Award,
    Target,
    BarChart3,
    Zap,
    Sparkles,
    Shield,
    Building,
    Briefcase,
    Download,
    Upload,
    MessageSquare,
    Star,
    Crown,
    CheckSquare,
    FileCheck,
    ClipboardCheck,
    PieChart,
    Activity,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    DownloadCloud,
    UploadCloud,
    Mail,
    Phone,
    MapPin,
    MessageCircle,
    Send,
    ThumbsUp,
    ThumbsDown,
    AlertTriangle,
    Image,
    Video,
    File,
    FileSpreadsheet,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Label } from "@/components/ui/label";

export default function ManagerSubtasksPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [selectedSubtask, setSelectedSubtask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [stats, setStats] = useState({
        completed: 0,
        inProgress: 0,
        pending: 0,
        highPriority: 0,
        overdue: 0,
        efficiency: 0,
        teamPerformance: 0,
        totalLeads: 0,
        leadsCompleted: 0,
        myTasks: 0,
        teamTasks: 0
    });
    const [feedback, setFeedback] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [previewFile, setPreviewFile] = useState(null);

    const downloadFile = (url, name) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
    };

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Manager") {
            router.push("/managerlogin");
            return;
        }

        fetchSubtasks();
    }, [session, status, router]);

    const getFileIcon = (fileType) => {
        if (fileType?.includes('image')) return <Image className="w-5 h-5 text-green-600" />;
        if (fileType?.includes('video')) return <Video className="w-5 h-5 text-blue-600" />;
        if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
        if (fileType?.includes('word') || fileType?.includes('doc')) return <FileText className="w-5 h-5 text-blue-700" />;
        if (fileType?.includes('excel') || fileType?.includes('sheet')) return <FileSpreadsheet className="w-5 h-5 text-green-700" />;
        return <File className="w-5 h-5 text-gray-600" />;
    };

    // Get current manager's feedbacks from a subtask
    const getManagerFeedbacks = (subtask) => {
        if (!subtask || !session?.user?.id) return [];
        
        const currentManagerId = session.user.id;
        
        // Find the current manager in assignedManagers
        const managerAssignment = subtask.assignedManagers?.find(mgr => 
            (mgr.managerId?._id?.toString() || mgr.managerId?.toString()) === currentManagerId
        );
        
        return managerAssignment?.feedbacks || [];
    };

    const fetchSubtasks = async () => {
        try {
            setFetching(true);
            const response = await axios.get('/api/manager/assigned-manager');
            if (response.status === 200) {
                const data = response.data.subtasks || [];
                setSubtasks(data);
                
                const now = new Date();
                const myCompleted = data.filter(s => s.employeeStatus === "completed").length;
                const myInProgress = data.filter(s => s.employeeStatus === "in_progress").length;
                const myPending = data.filter(s => s.employeeStatus === "pending").length;
                const highPriority = data.filter(s => s.priority === "high").length;
                const overdue = data.filter(s => 
                    new Date(s.endDate) < now && 
                    !["completed", "approved"].includes(s.employeeStatus || s.subtaskStatus)
                ).length;
                
                const totalLeads = data.reduce((sum, task) => sum + (parseInt(task.lead) || 0), 0);
                const leadsCompleted = data.reduce((sum, task) => sum + (task.leadsCompleted || 0), 0);
                
                const efficiency = data.length > 0 
                    ? Math.round((myCompleted / data.length) * 100)
                    : 0;

                const teamPerformance = calculateTeamPerformance(data);

                setStats({
                    completed: myCompleted,
                    inProgress: myInProgress,
                    pending: myPending,
                    highPriority,
                    overdue,
                    efficiency,
                    teamPerformance,
                    totalLeads,
                    leadsCompleted,
                    myTasks: data.length,
                    teamTasks: data.reduce((sum, task) => sum + (task.assignedEmployees?.length || 0), 0)
                });
            }
        } catch (error) {
            console.error("Error fetching manager subtasks:", error);
            toast.error("Failed to fetch tasks");
        } finally {
            setFetching(false);
        }
    };

    const calculateTeamPerformance = (tasks) => {
        if (tasks.length === 0) return 0;
        
        let totalPerformance = 0;
        let count = 0;
        
        tasks.forEach(task => {
            task.assignedEmployees?.forEach(emp => {
                if (emp.status === "completed") {
                    totalPerformance += 100;
                } else if (emp.status === "in_progress") {
                    totalPerformance += 50;
                } else if (emp.status === "pending") {
                    totalPerformance += 10;
                }
                count++;
            });
        });
        
        return count > 0 ? Math.round(totalPerformance / count) : 0;
    };

    const openModal = async (subtask) => {
        try {
            const response = await axios.get(`/api/manager/assigned-manager/${subtask._id}`);
            if (response.status === 200) {
                const data = response.data;
                setSelectedSubtask(data);
                
                // Get current manager's latest feedback to pre-fill
                const managerFeedbacks = getManagerFeedbacks(data);
                const latestFeedback = managerFeedbacks.length > 0 
                    ? managerFeedbacks[managerFeedbacks.length - 1].feedback 
                    : "";
                setFeedback(latestFeedback);
                
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching subtask details:", error);
            toast.error("Failed to load task details");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubtask(null);
        setFeedback("");
    };

    const updateSubtaskStatus = async (newStatus) => {
        if (!selectedSubtask) return;
        
        try {
            setLoading(true);
            const response = await axios.put(`/api/manager/assigned-manager/${selectedSubtask._id}`, {
                status: newStatus,
                feedback: feedback
            });

            if (response.status === 200) {
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}`, {
                    icon: "✅",
                });
                
                const updatedResponse = await axios.get(`/api/manager/assigned-manager/${selectedSubtask._id}`);
                if (updatedResponse.status === 200) {
                    setSelectedSubtask(updatedResponse.data);
                    setSubtasks(prev => prev.map(st =>
                        st._id === selectedSubtask._id
                            ? { ...st, ...updatedResponse.data, employeeStatus: newStatus }
                            : st
                    ));
                }
                fetchSubtasks();
            }
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task status");
        } finally {
            setLoading(false);
        }
    };

    const submitFeedbackOnly = async () => {
        if (!selectedSubtask || !feedback.trim()) {
            toast.error("Please enter some feedback first");
            return;
        }

        try {
            setIsSubmittingFeedback(true);
            const response = await axios.put(`/api/manager/assigned-manager/${selectedSubtask._id}`, {
                feedback: feedback,
                status: selectedSubtask.employeeStatus || selectedSubtask.managerInfo?.status
            });

            if (response.status === 200) {
                toast.success("Feedback submitted successfully!", {
                    icon: "💬",
                });
                
                toast.info(`Team Lead ${selectedSubtask.teamLeadId?.firstName || ''} has been notified.`, {
                    description: "Your feedback was sent to the task creator.",
                });

                const updatedResponse = await axios.get(`/api/manager/assigned-manager/${selectedSubtask._id}`);
                if (updatedResponse.status === 200) {
                    setSelectedSubtask(updatedResponse.data);
                    
                    // Get updated feedbacks for current manager
                    const updatedFeedbacks = getManagerFeedbacks(updatedResponse.data);
                    const latestFeedback = updatedFeedbacks.length > 0 
                        ? updatedFeedbacks[updatedFeedbacks.length - 1].feedback 
                        : "";
                    setFeedback(latestFeedback);
                }
                fetchSubtasks();
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast.error("Failed to submit feedback");
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const getMyStatusVariant = (status) => {
        const variants = {
            completed: "bg-green-100 text-green-800 border-green-200",
            in_progress: "bg-blue-100 text-blue-800 border-blue-200",
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            approved: "bg-purple-100 text-purple-800 border-purple-200",
            rejected: "bg-red-100 text-red-800 border-red-200",
        };
        return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getTaskStatusVariant = (status) => {
        const variants = {
            completed: "bg-green-100 text-green-800",
            in_progress: "bg-blue-100 text-blue-800",
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-purple-100 text-purple-800",
            rejected: "bg-red-100 text-red-800",
        };
        return variants[status] || "bg-gray-100 text-gray-800";
    };

    const getPriorityVariant = (priority) => {
        const variants = {
            high: "bg-red-100 text-red-800 border-red-200",
            medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
            low: "bg-green-100 text-green-800 border-green-200",
        };
        return variants[priority] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
            case "approved":
                return <CheckCircle className="w-5 h-5" />;
            case "in_progress":
                return <Clock className="w-5 h-5" />;
            case "pending":
                return <AlertCircle className="w-5 h-5" />;
            case "rejected":
                return <XCircle className="w-5 h-5" />;
            default:
                return <AlertCircle className="w-5 h-5" />;
        }
    };

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.replace('_', ' ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTimeRemaining = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: "Overdue", class: "text-red-600", variant: "destructive" };
        if (diffDays === 0) return { text: "Due today", class: "text-yellow-600", variant: "warning" };
        if (diffDays === 1) return { text: "1 day left", class: "text-yellow-600", variant: "warning" };
        if (diffDays <= 3) return { text: `${diffDays} days left`, class: "text-yellow-600", variant: "warning" };
        return { text: `${diffDays} days left`, class: "text-green-600", variant: "success" };
    };

    const getEmployeeStatusStats = (subtask) => {
        const employees = subtask.assignedEmployees || [];
        const completed = employees.filter(e => e.status === "completed").length;
        const inProgress = employees.filter(e => e.status === "in_progress").length;
        const pending = employees.filter(e => e.status === "pending").length;
        const total = employees.length;
        
        return {
            completed,
            inProgress,
            pending,
            total,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    };

    const filteredSubtasks = subtasks.filter(subtask => {
        const matchesSearch =
            subtask.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subtask.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || subtask.employeeStatus === statusFilter || subtask.subtaskStatus === statusFilter;
        const matchesPriority = priorityFilter === "all" || subtask.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
                    <p className="text-gray-700">Loading Manager Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Manager") {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <Card className="max-w-md w-full border border-gray-200 shadow-lg">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-gray-800" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Manager Access Only</h2>
                            <p className="text-gray-600 mb-6">
                                This dashboard is exclusively for managers. Please log in with your manager credentials.
                            </p>
                            <Button 
                                onClick={() => router.push("/login")}
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
            <div className="min-h-screen bg-white p-4 md:p-6">
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        className: "bg-white border border-gray-200 shadow-lg",
                    }}
                />

                {/* Subtask Detail Modal */}
                {isModalOpen && selectedSubtask && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
                            {/* Modal Header */}
                            <div className="bg-black text-white p-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-white/10 rounded-lg">
                                                <Briefcase className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-2xl font-bold truncate text-white">{selectedSubtask.title}</h2>
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
                            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Status & Feedback Section */}
                                        <Card className="border border-gray-200">
                                            <CardHeader className="bg-gray-50 border-b">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-black rounded-lg">
                                                            <MessageCircle className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-xl font-bold text-gray-900">
                                                                Your Feedback & Status
                                                            </CardTitle>
                                                            <CardDescription className="text-gray-600">
                                                                Team Lead will be notified of your updates
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                                        Official Update
                                                    </Badge>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-6 space-y-6">
                                                {/* Feedback Input */}
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        Add Your Feedback
                                                    </Label>

                                                    {/* ✅ Previous feedbacks for CURRENT MANAGER only */}
                                                    {(() => {
                                                        const currentManagerFeedbacks = getManagerFeedbacks(selectedSubtask);
                                                        return currentManagerFeedbacks?.length > 0 ? (
                                                            <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                                <div className="text-xs font-semibold text-gray-700 mb-2">Your Previous Feedbacks:</div>
                                                                {currentManagerFeedbacks.map((f, index) => (
                                                                    <div key={index} className="p-2 bg-white border border-gray-200 rounded-md shadow-sm">
                                                                        <p className="text-xs text-gray-500">
                                                                            {new Date(f.sentAt || f.createdAt).toLocaleString()}
                                                                        </p>
                                                                        <p className="text-sm text-gray-900">{f.feedback}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : null;
                                                    })()}

                                                    {/* ✅ Feedback textarea */}
                                                    <Textarea
                                                        placeholder="Type your feedback, updates or concerns here..."
                                                        className="min-h-[120px] bg-gray-50 border border-gray-200 focus:border-black focus:ring-black text-gray-900 placeholder:text-gray-400"
                                                       
                                                        onChange={(e) => setFeedback(e.target.value)}
                                                    />

                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                                Feedback is visible to Team Leads and other Managers.
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                onClick={submitFeedbackOnly}
                                                                disabled={isSubmittingFeedback || !feedback.trim()}
                                                                className="bg-black text-white hover:bg-gray-800"
                                                            >
                                                                {isSubmittingFeedback ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                )}
                                                                Send Feedback
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-200 pt-6">
                                                    <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wider block mb-4">
                                                        Update Task Status & Notify Team
                                                    </Label>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {[
                                                            { status: "pending", label: "Pending", icon: <AlertCircle />, color: "yellow" },
                                                            { status: "in_progress", label: "In Progress", icon: <Clock />, color: "blue" },
                                                            { status: "completed", label: "Completed", icon: <CheckCircle />, color: "green" }
                                                        ].map((item) => {
                                                            const isActive = (selectedSubtask.employeeStatus || selectedSubtask.managerInfo?.status) === item.status;

                                                            return (
                                                                <Button
                                                                    key={item.status}
                                                                    disabled={loading || isActive}
                                                                    variant="outline"
                                                                    onClick={() => updateSubtaskStatus(item.status)}
                                                                    className={`h-24 flex flex-col gap-2 font-semibold border-2
                                                                        ${isActive
                                                                            ? `bg-${item.color}-50 text-${item.color}-800 border-${item.color}-200`
                                                                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                                                                        }
                                                                    `}
                                                                >
                                                                    <div className={`text-2xl text-${item.color}-600`}>
                                                                        {item.icon}
                                                                    </div>
                                                                    <span className="capitalize">
                                                                        {item.label}
                                                                    </span>
                                                                    {isActive && (
                                                                        <div className="text-xs bg-black text-white px-2 py-0.5 rounded-full mt-1">
                                                                            Current Status
                                                                        </div>
                                                                    )}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Task Details */}
                                        <Card className="border border-gray-200">
                                            <CardHeader className="bg-gray-50 border-b">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-black rounded-lg">
                                                        <FileText className="w-5 h-5 text-white" />
                                                    </div>
                                                    <CardTitle className="text-xl font-bold text-gray-900">
                                                        Task Details
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-6">
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-gray-900">Description</h4>
                                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        {selectedSubtask.description}
                                                    </p>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-gray-700">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="font-medium">Start Date</span>
                                                        </div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {formatDate(selectedSubtask.startDate)}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-gray-700">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="font-medium">End Date</span>
                                                        </div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {formatDate(selectedSubtask.endDate)}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Target className="w-4 h-4" />
                                                        <span className="font-medium">Leads Target</span>
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        {selectedSubtask.leadsCompleted || 0} / {selectedSubtask.lead || 0} completed
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Attachments */}
                                        <Card className="border border-gray-200">
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
                                                
                                                        let bgColor = "bg-gray-100";
                                                        let Icon = File;
                                                
                                                        if (isImage) bgColor = "bg-green-100";
                                                        else if (isVideo) bgColor = "bg-blue-100";
                                                        else if (isPDF) { bgColor = "bg-red-100"; Icon = FileText; }
                                                        else if (isWord) { bgColor = "bg-blue-100"; Icon = FileText; }
                                                        else if (isExcel) { bgColor = "bg-green-100"; Icon = FileSpreadsheet; }
                                                
                                                        return (
                                                            <div
                                                                key={publicId}
                                                                className={`w-full rounded-lg border border-gray-200 shadow-sm overflow-hidden ${bgColor}`}
                                                            >
                                                                {/* Preview area */}
                                                                <div className="w-full h-40 flex items-center justify-center overflow-hidden">
                                                                    {isImage ? (
                                                                        <img src={url} alt={name} className="object-cover w-full h-full" />
                                                                    ) : isVideo ? (
                                                                        <div className="relative w-full h-full">
                                                                            <video src={url} className="object-cover w-full h-full" />
                                                                            <Play className="absolute w-8 h-8 text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                                        </div>
                                                                    ) : (
                                                                        <Icon className="w-12 h-12" />
                                                                    )}
                                                                </div>
                                                
                                                                {/* Bottom: file name + buttons */}
                                                                <div className="p-3 bg-white border-t border-gray-200 flex flex-col items-center gap-2">
                                                                    <p className="text-sm font-medium truncate w-full text-center text-gray-900">{name}</p>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => setPreviewFile(file)}
                                                                            className="border-gray-300"
                                                                        >
                                                                            Preview
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => window.open(url, "_blank")}
                                                                            className="bg-black text-white hover:bg-gray-800"
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

                                        {/* Team Feedback & Activity */}
                                        <Card className="border border-gray-200">
                                            <CardHeader className="bg-gray-50 border-b">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-black rounded-lg">
                                                        <Activity className="w-5 h-5 text-white" />
                                                    </div>
                                                    <CardTitle className="text-xl font-bold text-gray-900">
                                                        Team Feedback & Activity
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="space-y-6">
                                                    {/* Managers Feedback - Show ALL managers */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                            <Shield className="w-4 h-4" />
                                                            Management Updates
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {selectedSubtask.assignedManagers?.filter(m => m.feedback || m.status !== 'pending').map((mgr, idx) => {
                                                                const isCurrentManager = (mgr.managerId?._id?.toString() || mgr.managerId?.toString()) === session?.user?.id;
                                                                return (
                                                                    <div key={idx} className="flex gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                                                                        <Avatar className="w-10 h-10 border-2 border-white">
                                                                            <AvatarFallback className="bg-gray-200 text-gray-800 font-semibold">
                                                                                {(mgr.managerId?.firstName?.[0] || mgr.name?.[0] || 'M')}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="space-y-2 flex-1">
                                                                            <div className="flex justify-between items-start">
                                                                                <div>
                                                                                    <p className="font-semibold text-gray-900">
                                                                                        {mgr.managerId?.firstName ? `${mgr.managerId.firstName} ${mgr.managerId.lastName}` : (mgr.name || mgr.email)}
                                                                                        {isCurrentManager && <span className="ml-2 text-xs bg-black text-white px-2 py-0.5 rounded-full">You</span>}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-600">Manager</p>
                                                                                </div>
                                                                                <Badge className={`text-xs ${getMyStatusVariant(mgr.status)}`}>
                                                                                    {formatStatus(mgr.status)}
                                                                                </Badge>
                                                                            </div>
                                                                            {mgr.feedback ? (
                                                                                <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700">
                                                                                    "{mgr.feedback}"
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-xs text-gray-500 italic">No feedback provided yet</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {(!selectedSubtask.assignedManagers || selectedSubtask.assignedManagers.length === 0) && (
                                                                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">No other managers assigned</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Team Leads Feedback */}
                                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                            <Crown className="w-4 h-4" />
                                                            Lead Reviews
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {/* Primary Task Owner/Creator */}
                                                            <div className="flex gap-4 p-4 rounded-lg border border-blue-200 bg-blue-50">
                                                                <Avatar className="w-10 h-10 border-2 border-white">
                                                                    <AvatarFallback className="bg-blue-200 text-blue-800 font-semibold">
                                                                        {selectedSubtask.teamLeadId?.firstName?.[0] || 'TL'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="space-y-2 flex-1">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900">
                                                                                {selectedSubtask.teamLeadId?.firstName} {selectedSubtask.teamLeadId?.lastName}
                                                                            </p>
                                                                            <p className="text-xs text-gray-600">Primary Team Lead (Creator)</p>
                                                                        </div>
                                                                        <Badge className={`text-xs ${getTaskStatusVariant(selectedSubtask.subtaskStatus)}`}>
                                                                            {formatStatus(selectedSubtask.subtaskStatus)}
                                                                        </Badge>
                                                                    </div>
                                                                    {selectedSubtask.teamLeadFeedback ? (
                                                                        <div className="bg-white p-3 rounded-lg border border-blue-200 text-sm text-gray-700">
                                                                            "{selectedSubtask.teamLeadFeedback}"
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-blue-600 italic">Expecting creator's review...</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Other Assigned Team Leads */}
                                                            {selectedSubtask.assignedTeamLeads?.map((tl, idx) => (
                                                                <div key={idx} className="flex gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                                                                    <Avatar className="w-10 h-10 border-2 border-white">
                                                                        <AvatarFallback className="bg-gray-200 text-gray-800 font-semibold">
                                                                            {tl.teamLeadId?.firstName?.[0] || tl.name?.[0] || 'L'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="space-y-2 flex-1">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="font-semibold text-gray-900">
                                                                                    {tl.teamLeadId?.firstName ? `${tl.teamLeadId.firstName} ${tl.teamLeadId.lastName}` : (tl.name || tl.email)}
                                                                                </p>
                                                                                <p className="text-xs text-gray-600">Collaborating Lead</p>
                                                                            </div>
                                                                            <Badge className={`text-xs ${getMyStatusVariant(tl.status)}`}>
                                                                                {formatStatus(tl.status)}
                                                                            </Badge>
                                                                        </div>
                                                                        {tl.feedback ? (
                                                                            <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700">
                                                                                "{tl.feedback}"
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-gray-500 italic">No feedback provided yet</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Employees Feedback */}
                                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            Employee Updates
                                                        </h4>
                                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                            {selectedSubtask.assignedEmployees?.filter(e => e.feedback || e.status !== 'pending').map((emp, idx) => (
                                                                <div key={idx} className="flex gap-4 p-4 rounded-lg border border-gray-200 bg-white">
                                                                    <Avatar className="w-9 h-9 border-2 border-white">
                                                                        <AvatarFallback className="bg-gray-200 text-gray-800 text-xs font-semibold">
                                                                            {emp.employeeId?.firstName?.[0] || emp.name?.[0] || 'E'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="space-y-2 flex-1">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="font-semibold text-gray-900 text-sm">
                                                                                    {emp.employeeId?.firstName ? `${emp.employeeId.firstName} ${emp.employeeId.lastName}` : (emp.name || emp.email)}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-600 flex items-center gap-1">
                                                                                    <Mail className="w-2.5 h-2.5" /> {emp.email}
                                                                                </p>
                                                                            </div>
                                                                            <Badge className={`text-[9px] px-1.5 py-0 ${getMyStatusVariant(emp.status)}`}>
                                                                                {formatStatus(emp.status)}
                                                                            </Badge>
                                                                        </div>
                                                                        {emp.feedback ? (
                                                                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-700">
                                                                                "{emp.feedback}"
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[10px] text-gray-500 italic">Progress update only</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!selectedSubtask.assignedEmployees || selectedSubtask.assignedEmployees.length === 0) && (
                                                                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">No employees involved</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Team Performance */}
                                        <Card className="border border-gray-200">
                                            <CardHeader className="bg-gray-50 border-b">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-black rounded-lg">
                                                            <Activity className="w-5 h-5 text-white" />
                                                        </div>
                                                        <CardTitle className="text-xl font-bold text-gray-900">
                                                            Team Performance
                                                        </CardTitle>
                                                    </div>
                                                    <Badge variant="outline" className="border-gray-300 text-gray-800">
                                                        {getEmployeeStatusStats(selectedSubtask).completionRate}% completion
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                                            <div className="text-2xl font-bold text-green-800">
                                                                {getEmployeeStatusStats(selectedSubtask).completed}
                                                            </div>
                                                            <div className="text-sm text-green-700">Completed</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                            <div className="text-2xl font-bold text-blue-800">
                                                                {getEmployeeStatusStats(selectedSubtask).inProgress}
                                                            </div>
                                                            <div className="text-sm text-blue-700">In Progress</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                            <div className="text-2xl font-bold text-yellow-800">
                                                                {getEmployeeStatusStats(selectedSubtask).pending}
                                                            </div>
                                                            <div className="text-sm text-yellow-700">Pending</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm text-gray-900">
                                                            <span>Team Progress</span>
                                                            <span>{getEmployeeStatusStats(selectedSubtask).completionRate}%</span>
                                                        </div>
                                                        <Progress 
                                                            value={getEmployeeStatusStats(selectedSubtask).completionRate} 
                                                            className="h-2 bg-gray-200"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-8">
                                        {/* All Assignees Categories */}
                                        <Tabs defaultValue="employees" className="w-full">
                                            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                                                <TabsTrigger value="employees" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">
                                                    Employees ({selectedSubtask.assignedEmployees?.length || 0})
                                                </TabsTrigger>
                                                <TabsTrigger value="managers" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">
                                                    Managers ({selectedSubtask.assignedManagers?.length || 0})
                                                </TabsTrigger>
                                                <TabsTrigger value="leads" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">
                                                    Team Leads ({(selectedSubtask.assignedTeamLeads?.length || 0) + 1})
                                                </TabsTrigger>
                                            </TabsList>
                                            
                                            <TabsContent value="employees">
                                                <Card className="border border-gray-200">
                                                    <CardContent className="p-4 space-y-3">
                                                        {selectedSubtask.assignedEmployees?.map((emp, index) => {
                                                            const employee = emp.employeeId || emp;
                                                            return (
                                                                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="w-10 h-10 border-2 border-white">
                                                                            <AvatarFallback className="bg-gray-200 text-gray-800 font-medium">
                                                                                {employee.firstName?.[0] || emp.name?.[0] || 'E'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="min-w-0">
                                                                            <div className="font-semibold text-gray-900 text-sm truncate">
                                                                                {employee.firstName ? `${employee.firstName} ${employee.lastName}` : (emp.name || emp.email)}
                                                                            </div>
                                                                            <div className="text-[10px] text-gray-600 truncate flex items-center gap-1">
                                                                                <Mail className="w-2.5 h-2.5" /> {emp.email}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Badge className={`text-[10px] px-2 py-0.5 ${getMyStatusVariant(emp.status)}`}>
                                                                            {formatStatus(emp.status)}
                                                                        </Badge>
                                                                        <div className="text-[9px] text-gray-600 mt-1">Leads: {emp.leadsCompleted || 0}/{emp.leadsAssigned || 0}</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>

                                            <TabsContent value="managers">
                                                <Card className="border border-gray-200">
                                                    <CardContent className="p-4 space-y-3">
                                                        {selectedSubtask.assignedManagers?.map((mgr, index) => {
                                                            const isCurrentManager = (mgr.managerId?._id?.toString() || mgr.managerId?.toString()) === session?.user?.id;
                                                            return (
                                                                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="w-10 h-10 border-2 border-white">
                                                                            <AvatarFallback className="bg-gray-200 text-gray-800 font-medium">
                                                                                {mgr.managerId?.firstName?.[0] || mgr.name?.[0] || 'M'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="min-w-0">
                                                                            <div className="font-semibold text-gray-900 text-sm truncate">
                                                                                {mgr.managerId?.firstName ? `${mgr.managerId.firstName} ${mgr.managerId.lastName}` : (mgr.name || mgr.email)}
                                                                                {isCurrentManager && <span className="ml-1 text-[10px] text-black font-semibold">(YOU)</span>}
                                                                            </div>
                                                                            <div className="text-[10px] text-gray-600 truncate flex items-center gap-1">
                                                                                <Mail className="w-2.5 h-2.5" /> {mgr.email}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Badge className={`text-[10px] px-2 py-0.5 ${getMyStatusVariant(mgr.status)}`}>
                                                                            {formatStatus(mgr.status)}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>

                                            <TabsContent value="leads">
                                                <Card className="border border-gray-200">
                                                    <CardContent className="p-4 space-y-3">
                                                        {/* Creator */}
                                                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <Avatar className="w-10 h-10 border-2 border-white">
                                                                        <AvatarFallback className="bg-blue-200 text-blue-800 font-semibold">
                                                                            {selectedSubtask.teamLeadId?.firstName?.[0] || 'TL'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-white">
                                                                        <Crown className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-gray-900 text-sm truncate">
                                                                        {selectedSubtask.teamLeadId?.firstName} {selectedSubtask.teamLeadId?.lastName}
                                                                    </div>
                                                                    <div className="text-[10px] text-blue-700 font-semibold uppercase">Primary Lead (Creator)</div>
                                                                </div>
                                                            </div>
                                                            <Badge className={`text-[10px] ${getTaskStatusVariant(selectedSubtask.subtaskStatus)}`}>
                                                                {formatStatus(selectedSubtask.subtaskStatus)}
                                                            </Badge>
                                                        </div>

                                                        {/* Collaborators */}
                                                        {selectedSubtask.assignedTeamLeads?.map((tl, index) => (
                                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="w-10 h-10 border-2 border-white">
                                                                        <AvatarFallback className="bg-gray-200 text-gray-800 font-medium">
                                                                            {tl.teamLeadId?.firstName?.[0] || tl.name?.[0] || 'L'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="min-w-0">
                                                                        <div className="font-semibold text-gray-900 text-sm truncate">
                                                                            {tl.teamLeadId?.firstName ? `${tl.teamLeadId.firstName} ${tl.teamLeadId.lastName}` : (tl.name || tl.email)}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-600 truncate">Collaborating Lead</div>
                                                                    </div>
                                                                </div>
                                                                <Badge className={`text-[10px] px-2 py-0.5 ${getMyStatusVariant(tl.status)}`}>
                                                                    {formatStatus(tl.status)}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Page Content */}
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-black rounded-lg">
                                        <Crown className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                            Manager Task Dashboard
                                        </h1>
                                        <p className="text-gray-600 mt-2">
                                            Welcome back, <span className="font-semibold text-black">{session?.user?.name}</span>! Monitor your tasks and team performance
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={fetchSubtasks}
                                    variant="outline"
                                    className="border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                    disabled={fetching}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                                    {fetching ? 'Refreshing...' : 'Refresh'}
                                </Button>
                                <Button
                                    className="bg-black text-white hover:bg-gray-800"
                                    onClick={() => router.push('/manager/analytics')}
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Analytics Dashboard
                                </Button>
                            </div>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.myTasks}</div>
                                            <div className="text-sm text-gray-600 mt-1">My Tasks</div>
                                        </div>
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Briefcase className="w-5 h-5 text-gray-800" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                                            <div className="text-sm text-gray-600 mt-1">My Pending</div>
                                        </div>
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
                                            <div className="text-sm text-gray-600 mt-1">My In Progress</div>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                                            <div className="text-sm text-gray-600 mt-1">My Completed</div>
                                        </div>
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.teamTasks}</div>
                                            <div className="text-sm text-gray-600 mt-1">Team Tasks</div>
                                        </div>
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <Users className="w-5 h-5 text-red-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.teamPerformance}%</div>
                                            <div className="text-sm text-gray-600 mt-1">Team Performance</div>
                                        </div>
                                        <div className="p-2 bg-cyan-100 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-cyan-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <Card className="bg-white border border-gray-200 shadow-sm mb-8">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-4 items-center">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search tasks by title, description or team lead..."
                                        className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="min-w-[180px] border-gray-300">
                                            <Filter className="w-4 h-4 mr-2 text-gray-500" />
                                            <SelectValue placeholder="My Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="pending">My Pending</SelectItem>
                                            <SelectItem value="in_progress">My In Progress</SelectItem>
                                            <SelectItem value="completed">My Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="min-w-[180px] border-gray-300">
                                            <Target className="w-4 h-4 mr-2 text-gray-500" />
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priorities</SelectItem>
                                            <SelectItem value="high">High Priority</SelectItem>
                                            <SelectItem value="medium">Medium Priority</SelectItem>
                                            <SelectItem value="low">Low Priority</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subtasks Table */}
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardHeader className="border-b border-gray-200">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900">
                                        My Assigned Tasks
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        {filteredSubtasks.length} task{filteredSubtasks.length !== 1 ? 's' : ''} found • {stats.overdue} overdue
                                    </CardDescription>
                                </div>
                                
                              
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {fetching ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Tasks</h3>
                                    <p className="text-gray-600">Fetching your assigned tasks...</p>
                                </div>
                            ) : filteredSubtasks.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Briefcase className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        {subtasks.length === 0 ? "No Tasks Assigned Yet" : "No Tasks Found"}
                                    </h3>
                                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                                        {subtasks.length === 0
                                            ? "You don't have any assigned tasks. Tasks will appear here once assigned by your team lead."
                                            : "No tasks match your search criteria. Try adjusting your filters."
                                        }
                                    </p>
                                    {searchTerm || statusFilter !== "all" || priorityFilter !== "all" ? (
                                        <Button
                                            onClick={() => {
                                                setSearchTerm("");
                                                setStatusFilter("all");
                                                setPriorityFilter("all");
                                            }}
                                            variant="outline"
                                            className="border-gray-300"
                                        >
                                            Clear Filters
                                        </Button>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow className="border-b border-gray-200">
                                                <TableHead className="font-semibold text-gray-900 py-6">Task Details</TableHead>
                                                <TableHead className="font-semibold text-gray-900 py-6">My Status</TableHead>
                                                <TableHead className="font-semibold text-gray-900 py-6">Task Status</TableHead>
                                                <TableHead className="font-semibold text-gray-900 py-6">Team Progress</TableHead>
                                                <TableHead className="font-semibold text-gray-900 py-6">Timeline</TableHead>
                                                <TableHead className="font-semibold text-gray-900 py-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSubtasks.map((subtask) => {
                                                const timeRemaining = getTimeRemaining(subtask.endDate);
                                                const teamStats = getEmployeeStatusStats(subtask);
                                                
                                                return (
                                                    <TableRow key={subtask._id} className="hover:bg-gray-50 border-b border-gray-200">
                                                        <TableCell className="py-5">
                                                            <div className="flex items-start gap-4">
                                                                <div className={`p-3 rounded-lg ${
                                                                    subtask.priority === 'high' ? 'bg-red-50' :
                                                                    subtask.priority === 'medium' ? 'bg-yellow-50' :
                                                                    'bg-green-50'
                                                                }`}>
                                                                    <Briefcase className={`w-5 h-5 ${
                                                                        subtask.priority === 'high' ? 'text-red-600' :
                                                                        subtask.priority === 'medium' ? 'text-yellow-600' :
                                                                        'text-green-600'
                                                                    }`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-semibold text-gray-900 text-lg">
                                                                            {subtask.title}
                                                                        </h4>
                                                                        {subtask.attachments?.length > 0 && (
                                                                            <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                                                                                {subtask.attachments.length} file{subtask.attachments.length > 1 ? 's' : ''}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                                                        {subtask.description}
                                                                    </p>
                                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                                        <div className="flex items-center gap-1">
                                                                            <User className="w-3.5 h-3.5" />
                                                                            <span className="truncate max-w-[120px]">
                                                                                {subtask.teamLeadId?.firstName || 'Team'} {subtask.teamLeadId?.lastName || 'Lead'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Users className="w-3.5 h-3.5" />
                                                                            <span>{teamStats.total} team members</span>
                                                                        </div>
                                                                        {subtask.lead && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Target className="w-3.5 h-3.5" />
                                                                                <span>{subtask.lead} leads target</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        
                                                        <TableCell className="py-5">
                                                            <Badge className={`${getMyStatusVariant(subtask.employeeStatus)} flex items-center gap-1.5 px-3 py-1.5 font-medium text-sm`}>
                                                                {getStatusIcon(subtask.employeeStatus)}
                                                                {formatStatus(subtask.employeeStatus)}
                                                            </Badge>
                                                        </TableCell>
                                                        
                                                        <TableCell className="py-5">
                                                            <Badge className={`${getTaskStatusVariant(subtask.subtaskStatus)} px-3 py-1.5 font-medium text-sm`}>
                                                                {getStatusIcon(subtask.subtaskStatus)}
                                                                {formatStatus(subtask.subtaskStatus)}
                                                            </Badge>
                                                        </TableCell>
                                                        
                                                        <TableCell className="py-5">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-gray-700">Progress</span>
                                                                    <span className="font-semibold text-gray-900">{teamStats.completionRate}%</span>
                                                                </div>
                                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full rounded-full bg-green-600"
                                                                        style={{ width: `${teamStats.completionRate}%` }}
                                                                    ></div>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs text-gray-600">
                                                                    <span>C: {teamStats.completed}</span>
                                                                    <span>IP: {teamStats.inProgress}</span>
                                                                    <span>P: {teamStats.pending}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        
                                                        <TableCell className="py-5">
                                                            <div className="space-y-2">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {formatDate(subtask.startDate)} → {formatDate(subtask.endDate)}
                                                                </div>
                                                                <Badge variant="outline" className={`text-xs ${timeRemaining.class}`}>
                                                                    {timeRemaining.text}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        
                                                        <TableCell className="py-5">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-gray-300 hover:bg-gray-50  text-gray-900"
                                                                    onClick={() => openModal(subtask)}
                                                                >
                                                                    <Eye className="w-4 h-4 mr-2 text-gray-900" />
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    onClick={() => router.push(`/manager/subtasks/${subtask._id}`)}
                                                                    size="sm"
                                                                    className="bg-black text-white hover:bg-gray-800"
                                                                >
                                                                    <FileText className="w-4 h-4 mr-2" />
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
                            
                            {!fetching && filteredSubtasks.length > 0 && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="text-gray-600">
                                            Showing <span className="font-semibold text-gray-900">{filteredSubtasks.length}</span> of{' '}
                                            <span className="font-semibold text-gray-900">{subtasks.length}</span> tasks
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                                                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                                                Previous
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Performance Summary */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Activity className="w-5 h-5 text-gray-800" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">My Efficiency</div>
                                        <div className="text-2xl font-bold text-gray-900">{stats.efficiency}%</div>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full bg-gray-800"
                                        style={{ width: `${stats.efficiency}%` }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Users className="w-5 h-5 text-gray-800" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Team Performance</div>
                                        <div className="text-2xl font-bold text-gray-900">{stats.teamPerformance}%</div>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full bg-gray-800"
                                        style={{ width: `${stats.teamPerformance}%` }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Target className="w-5 h-5 text-gray-800" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Leads Progress</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {stats.leadsCompleted}/{stats.totalLeads}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full bg-gray-800"
                                        style={{ 
                                            width: stats.totalLeads > 0 
                                                ? `${(stats.leadsCompleted / stats.totalLeads) * 100}%` 
                                                : '0%' 
                                        }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                {getFileIcon(previewFile.type)}
                                <h3 className="font-semibold text-gray-900 truncate">{previewFile.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setZoom((prev) => prev + 0.2)}
                                    className="border-gray-300"
                                >
                                    Zoom In +
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.2))}
                                    className="border-gray-300"
                                >
                                    Zoom Out -
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                    className="border-gray-300"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPreviewFile(null)}
                                    className="text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
            
                        {/* Body */}
                        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-900">
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
                                    className="w-full h-[70vh] border rounded-lg"
                                    title={previewFile.name}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-white">Preview not available for this file type</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                        className="mt-4 border-gray-300 text-white hover:bg-gray-800"
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
    );
}