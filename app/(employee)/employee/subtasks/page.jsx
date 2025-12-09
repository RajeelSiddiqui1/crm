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
    Award,
    Target,
    BarChart3,
    MoreVertical,
    Download,
    Upload,
    MessageSquare,
    Star,
    Shield,
    Zap,
    Sparkles
} from "lucide-react";
import axios from "axios";

// Color Palette
const COLORS = {
    primary: {
        gradient: "from-purple-600 via-blue-600 to-indigo-600",
        light: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-200"
    },
    secondary: {
        gradient: "from-emerald-500 to-teal-600",
        light: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200"
    },
    accent: {
        gradient: "from-amber-500 to-orange-500",
        light: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200"
    }
};

export default function EmployeeSubtasksPage() {
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
        efficiency: 85
    });

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Employee") {
            router.push("/employeelogin");
            return;
        }

        fetchSubtasks();
    }, [session, status, router]);

    const fetchSubtasks = async () => {
        try {
            setFetching(true);
            const response = await axios.get('/api/employee/subtasks');
            if (response.status === 200) {
                const data = response.data.subtasks || [];
                setSubtasks(data);
                
                // Calculate stats
                const now = new Date();
                const completed = data.filter(s => s.status === "completed").length;
                const inProgress = data.filter(s => s.status === "in_progress").length;
                const pending = data.filter(s => s.status === "pending").length;
                const highPriority = data.filter(s => s.priority === "high").length;
                const overdue = data.filter(s => 
                    new Date(s.endDate) < now && s.status !== "completed"
                ).length;
                
                const efficiency = data.length > 0 
                    ? Math.round((completed / data.length) * 100)
                    : 0;

                setStats({
                    completed,
                    inProgress,
                    pending,
                    highPriority,
                    overdue,
                    efficiency
                });
            }
        } catch (error) {
            console.error("Error fetching subtasks:", error);
            toast.error("Failed to fetch subtasks");
        } finally {
            setFetching(false);
        }
    };

    const openModal = async (subtask) => {
        try {
            const response = await axios.get(`/api/employee/subtasks/${subtask._id}`);
            if (response.status === 200) {
                setSelectedSubtask(response.data);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching subtask details:", error);
            toast.error("Failed to load subtask details");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubtask(null);
    };

    const updateSubtaskStatus = async (newStatus) => {
        if (!selectedSubtask) return;
        
        try {
            setLoading(true);
            const response = await axios.put(`/api/employee/subtasks/${selectedSubtask._id}`, {
                status: newStatus
            });

            if (response.status === 200) {
                setSelectedSubtask(response.data);
                setSubtasks(prev => prev.map(st =>
                    st._id === selectedSubtask._id
                        ? { ...st, ...response.data }
                        : st
                ));
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}`, {
                    icon: "🎯",
                });
                fetchSubtasks(); // Refresh stats
            }
        } catch (error) {
            console.error("Error updating subtask:", error);
            toast.error("Failed to update subtask status");
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status) => {
        const variants = {
            completed: "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400",
            in_progress: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400",
            pending: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400",
            rejected: "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400",
        };
        return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getPriorityVariant = (priority) => {
        const variants = {
            high: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
            medium: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
            low: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white",
        };
        return variants[priority] || "bg-gray-100 text-gray-800";
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
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
        
        if (diffDays < 0) return { text: "Overdue", class: "text-rose-700" };
        if (diffDays === 0) return { text: "Due today", class: "text-amber-700" };
        if (diffDays === 1) return { text: "1 day left", class: "text-amber-700" };
        if (diffDays <= 3) return { text: `${diffDays} days left`, class: "text-amber-700" };
        return { text: `${diffDays} days left`, class: "text-emerald-700" };
    };

    const filteredSubtasks = subtasks.filter(subtask => {
        const matchesSearch =
            subtask.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subtask.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || subtask.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || subtask.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900">Loading Dashboard</h3>
                        <p className="text-gray-700 mt-2">Preparing your task management workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Employee") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-red-50">
                <div className="text-center max-w-md p-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Shield className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Restricted</h2>
                    <p className="text-gray-800 text-lg mb-6">
                        This workspace is exclusively for employees. Please log in with your employee credentials.
                    </p>
                    <Button
                        onClick={() => router.push("/login")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:opacity-90 px-8 py-6 text-lg rounded-xl shadow-lg"
                    >
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30 p-4 md:p-6">
            <Toaster 
                position="top-right"
                toastOptions={{
                    className: "bg-white border border-gray-200 shadow-xl rounded-xl",
                }}
            />

            {/* Subtask Detail Modal */}
            {isModalOpen && selectedSubtask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50">
                        {/* Modal Header */}
                        <div className={`relative bg-gradient-to-r ${COLORS.primary.gradient} p-8 text-white overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-3xl font-bold truncate text-white drop-shadow-lg">
                                                {selectedSubtask.title}
                                            </h2>
                                        </div>
                                        <p className="text-blue-100/90 text-base line-clamp-2 max-w-3xl">
                                            {selectedSubtask.description}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={closeModal}
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20 rounded-full transition-all duration-300"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </Button>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 mt-6">
                                    <Badge className={`${getStatusVariant(selectedSubtask.status)} px-4 py-2 font-semibold text-sm`}>
                                        {getStatusIcon(selectedSubtask.status)}
                                        {selectedSubtask.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge className={`${getPriorityVariant(selectedSubtask.priority)} px-4 py-2 font-semibold text-sm`}>
                                        <Target className="w-3.5 h-3.5 mr-1.5" />
                                        {selectedSubtask.priority} Priority
                                    </Badge>
                                    <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 font-semibold text-sm border border-white/30">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        Due: {formatDate(selectedSubtask.endDate)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Status Update Section */}
                                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                                                    <TrendingUp className="w-5 h-5 text-white" />
                                                </div>
                                                <CardTitle className="text-xl font-bold text-gray-900">
                                                    Update Task Status
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    { status: "pending", label: "Pending", icon: <AlertCircle /> },
                                                    { status: "in_progress", label: "In Progress", icon: <Clock /> },
                                                    { status: "completed", label: "Completed", icon: <CheckCircle /> }
                                                ].map((item) => (
                                                    <Button
                                                        key={item.status}
                                                        disabled={loading || selectedSubtask.status === item.status}
                                                        variant={selectedSubtask.status === item.status ? "default" : "outline"}
                                                        className={`h-24 flex flex-col gap-2 transition-all duration-300 ${selectedSubtask.status === item.status
                                                            ? `bg-gradient-to-r ${item.status === 'completed' ? 'from-emerald-500 to-green-600' : item.status === 'in_progress' ? 'from-blue-500 to-cyan-600' : 'from-amber-500 to-orange-600'} text-white border-0 shadow-lg`
                                                            : 'border-2 hover:scale-105 hover:shadow-lg'
                                                            }`}
                                                        onClick={() => updateSubtaskStatus(item.status)}
                                                    >
                                                        <div className="text-2xl">{item.icon}</div>
                                                        <span className="font-semibold capitalize">
                                                            {item.label}
                                                        </span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Task Details */}
                                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
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
                                                <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-medium">Working Hours</span>
                                                </div>
                                                <div className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                                                    {selectedSubtask.startTime} - {selectedSubtask.endTime}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-8">
                                    {/* Team Lead Info */}
                                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                <CardTitle className="text-xl font-bold text-gray-900">
                                                    Team Lead
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                                <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                                                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold">
                                                        {selectedSubtask.teamLeadId?.firstName?.[0]}{selectedSubtask.teamLeadId?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 text-lg">
                                                        {selectedSubtask.teamLeadId?.firstName} {selectedSubtask.teamLeadId?.lastName}
                                                    </h4>
                                                    <p className="text-gray-800 text-sm mt-1">{selectedSubtask.teamLeadId?.email}</p>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="mt-3 text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                                                    >
                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                        Send Message
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Team Members */}
                                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                                                        <Users className="w-5 h-5 text-white" />
                                                    </div>
                                                    <CardTitle className="text-xl font-bold text-gray-900">
                                                        Team Members
                                                    </CardTitle>
                                                </div>
                                                <Badge variant="outline" className="border-blue-200 text-blue-800">
                                                    {selectedSubtask.assignedEmployees?.length || 0} members
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {selectedSubtask.assignedEmployees?.slice(0, 4).map((emp, index) => (
                                                    <div key={emp.employeeId._id} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                                    <AvatarFallback className={`text-sm font-medium ${
                                                                        index % 3 === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                                                        index % 3 === 1 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                                                        'bg-gradient-to-r from-purple-500 to-pink-500'
                                                                    } text-white`}>
                                                                        {emp.employeeId.firstName?.[0]}{emp.employeeId.lastName?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                {emp.status === 'completed' && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 text-sm">
                                                                    {emp.employeeId.firstName} {emp.employeeId.lastName}
                                                                </div>
                                                                <div className="text-xs text-gray-800">{emp.email}</div>
                                                            </div>
                                                        </div>
                                                        <Badge className={`text-xs px-2 py-1 ${getStatusVariant(emp.status)}`}>
                                                            {emp.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                ))}
                                                
                                                {selectedSubtask.assignedEmployees?.length > 4 && (
                                                    <div className="text-center pt-4 border-t border-gray-100">
                                                        <Button variant="ghost" size="sm" className="text-gray-800 hover:text-gray-900">
                                                            View all {selectedSubtask.assignedEmployees.length} members
                                                            <ChevronRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Quick Actions */}
                                    <Card className="border border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg">
                                                    <Zap className="w-5 h-5 text-white" />
                                                </div>
                                                <CardTitle className="text-xl font-bold text-gray-900">
                                                    Quick Actions
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-3">
                                                <Button
                                                    onClick={() => {
                                                        closeModal();
                                                        router.push(`/employee/subtasks/${selectedSubtask._id}`);
                                                    }}
                                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white shadow-lg"
                                                >
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Submit Task Form
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-300"
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Upload Attachment
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-gray-200 text-gray-800 hover:bg-gray-50"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Resources
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
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
                                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg">
                                    <Target className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        My Task Dashboard
                                    </h1>
                                    <p className="text-gray-800 mt-2 text-lg">
                                        Welcome back, <span className="font-semibold text-gray-900">{session?.user?.name}</span>! Track and manage your assigned tasks
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={fetchSubtasks}
                                variant="outline"
                                className="border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-300 px-6 shadow-sm"
                                disabled={fetching}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                                {fetching ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white shadow-lg px-6"
                                onClick={() => router.push('/employee/performance')}
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                View Performance
                            </Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                        <Card className="bg-gradient-to-br from-white to-blue-50/50 border border-blue-100/50 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-gray-900">{subtasks.length}</div>
                                        <div className="text-sm text-gray-800 mt-1">Total Tasks</div>
                                    </div>
                                    <div className="p-3 bg-blue-100/50 rounded-xl">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-white to-amber-50/50 border border-amber-100/50 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-amber-800">{stats.pending}</div>
                                        <div className="text-sm text-gray-800 mt-1">Pending</div>
                                    </div>
                                    <div className="p-3 bg-amber-100/50 rounded-xl">
                                        <AlertCircle className="w-6 h-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-white to-cyan-50/50 border border-cyan-100/50 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-cyan-800">{stats.inProgress}</div>
                                        <div className="text-sm text-gray-800 mt-1">In Progress</div>
                                    </div>
                                    <div className="p-3 bg-cyan-100/50 rounded-xl">
                                        <Clock className="w-6 h-6 text-cyan-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100/50 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-emerald-800">{stats.completed}</div>
                                        <div className="text-sm text-gray-800 mt-1">Completed</div>
                                    </div>
                                    <div className="p-3 bg-emerald-100/50 rounded-xl">
                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-white to-rose-50/50 border border-rose-100/50 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-rose-800">{stats.highPriority}</div>
                                        <div className="text-sm text-gray-800 mt-1">High Priority</div>
                                    </div>
                                    <div className="p-3 bg-rose-100/50 rounded-xl">
                                        <Award className="w-6 h-6 text-rose-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-white to-violet-50/50 border border-violet-100/50 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-violet-800">{stats.efficiency}%</div>
                                        <div className="text-sm text-gray-800 mt-1">Efficiency</div>
                                    </div>
                                    <div className="p-3 bg-violet-100/50 rounded-xl">
                                        <TrendingUp className="w-6 h-6 text-violet-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Filters and Search */}
                <Card className="bg-white border border-gray-200/50 shadow-xl rounded-2xl mb-8 overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full lg:w-auto lg:flex-1 max-w-2xl">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    placeholder="Search tasks by title or description..."
                                    className="pl-12 pr-4 py-6 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm bg-white text-gray-900 placeholder-gray-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="min-w-[180px] py-6 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white">
                                        <Filter className="w-4 h-4 mr-2 text-gray-600" />
                                        <SelectValue placeholder="Filter by Status" className="text-gray-900" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-gray-200 bg-white">
                                        <SelectItem value="all" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="pending" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="in_progress" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="completed" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            Completed
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="min-w-[180px] py-6 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white">
                                        <Target className="w-4 h-4 mr-2 text-gray-600" />
                                        <SelectValue placeholder="Filter by Priority" className="text-gray-900" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-gray-200 bg-white">
                                        <SelectItem value="all" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            All Priorities
                                        </SelectItem>
                                        <SelectItem value="high" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            High Priority
                                        </SelectItem>
                                        <SelectItem value="medium" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            Medium Priority
                                        </SelectItem>
                                        <SelectItem value="low" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">
                                            Low Priority
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subtasks Table */}
                <Card className="bg-white border border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 border-b border-gray-100">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    My Tasks
                                </CardTitle>
                                <CardDescription className="text-gray-800">
                                    {filteredSubtasks.length} task{filteredSubtasks.length !== 1 ? 's' : ''} found • {stats.overdue} overdue
                                </CardDescription>
                            </div>
                            
                            <Tabs defaultValue="all" className="w-full lg:w-auto" onValueChange={setActiveTab}>
                                <TabsList className="grid w-full lg:w-auto grid-cols-4 bg-gray-100/50 p-1 rounded-xl">
                                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-700 data-[state=active]:text-gray-900">
                                        All
                                    </TabsTrigger>
                                    <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-700 data-[state=active]:text-gray-900">
                                        Active
                                    </TabsTrigger>
                                    <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-700 data-[state=active]:text-gray-900">
                                        Pending
                                    </TabsTrigger>
                                    <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-700 data-[state=active]:text-gray-900">
                                        Completed
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {fetching ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Tasks</h3>
                                <p className="text-gray-700">Fetching your assigned tasks...</p>
                            </div>
                        ) : filteredSubtasks.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-12 h-12 text-gray-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {subtasks.length === 0 ? "No Tasks Assigned Yet" : "No Tasks Found"}
                                </h3>
                                <p className="text-gray-800 max-w-md mx-auto mb-8">
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
                                        className="border-blue-200 text-blue-800 hover:bg-blue-50"
                                    >
                                        Clear Filters
                                    </Button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30">
                                        <TableRow className="hover:bg-transparent border-b border-gray-100">
                                            <TableHead className="font-semibold text-gray-900 py-6 text-left">Task Details</TableHead>
                                            <TableHead className="font-semibold text-gray-900 py-6">Status</TableHead>
                                            <TableHead className="font-semibold text-gray-900 py-6">Priority</TableHead>
                                            <TableHead className="font-semibold text-gray-900 py-6">Timeline</TableHead>
                                            <TableHead className="font-semibold text-gray-900 py-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSubtasks.map((subtask) => {
                                            const timeRemaining = getTimeRemaining(subtask.endDate);
                                            
                                            return (
                                                <TableRow
                                                    key={subtask._id}
                                                    className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-300 border-b border-gray-100/50"
                                                >
                                                    <TableCell className="py-5">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`p-3 rounded-xl shadow-sm ${
                                                                subtask.priority === 'high' ? 'bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100' :
                                                                subtask.priority === 'medium' ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100' :
                                                                'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100'
                                                            }`}>
                                                                <FileText className={`w-5 h-5 ${
                                                                    subtask.priority === 'high' ? 'text-rose-600' :
                                                                    subtask.priority === 'medium' ? 'text-amber-600' :
                                                                    'text-emerald-600'
                                                                }`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-800 transition-colors">
                                                                        {subtask.title}
                                                                    </h4>
                                                                    {subtask.attachments?.length > 0 && (
                                                                        <Badge variant="outline" className="border-blue-200 text-blue-800 text-xs">
                                                                            {subtask.attachments.length} file{subtask.attachments.length > 1 ? 's' : ''}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-gray-800 text-sm line-clamp-2 mb-2">
                                                                    {subtask.description}
                                                                </p>
                                                                <div className="flex items-center gap-4 text-xs text-gray-700">
                                                                    <div className="flex items-center gap-1">
                                                                        <Users className="w-3.5 h-3.5" />
                                                                        <span>{subtask.assignedEmployees?.length || 0} members</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <User className="w-3.5 h-3.5" />
                                                                        <span className="truncate max-w-[120px] text-gray-900">
                                                                            {subtask.teamLeadId?.firstName} {subtask.teamLeadId?.lastName}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    
                                                    <TableCell className="py-5">
                                                        <Badge className={`${getStatusVariant(subtask.status)} flex items-center gap-1.5 px-3 py-1.5 font-semibold text-sm rounded-full`}>
                                                            {getStatusIcon(subtask.status)}
                                                            {subtask.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    
                                                    <TableCell className="py-5">
                                                        <Badge className={`${getPriorityVariant(subtask.priority)} px-3 py-1.5 font-semibold text-sm rounded-full`}>
                                                            {subtask.priority}
                                                        </Badge>
                                                    </TableCell>
                                                    
                                                    <TableCell className="py-5">
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {formatDate(subtask.startDate)} → {formatDate(subtask.endDate)}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full ${
                                                                            subtask.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                                            subtask.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                                                            'bg-gradient-to-r from-amber-500 to-orange-500'
                                                                        }`}
                                                                        style={{ width: subtask.status === 'completed' ? '100%' : subtask.status === 'in_progress' ? '60%' : '30%' }}
                                                                    ></div>
                                                                </div>
                                                                <span className={`text-xs font-semibold ${timeRemaining.class}`}>
                                                                    {timeRemaining.text}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    
                                                    <TableCell className="py-5">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm rounded-lg"
                                                                onClick={() => openModal(subtask)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                onClick={() => router.push(`/employee/subtasks/${subtask._id}`)}
                                                                size="sm"
                                                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white shadow-sm rounded-lg"
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
                            <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-white/50">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-gray-800">
                                        Showing <span className="font-semibold text-gray-900">{filteredSubtasks.length}</span> of{' '}
                                        <span className="font-semibold text-gray-900">{subtasks.length}</span> tasks
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" className="text-gray-800 hover:text-gray-900">
                                            <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                                            Previous
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-gray-800 hover:text-gray-900">
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Stats */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50 rounded-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-800">Task Efficiency</div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.efficiency}%</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100/50 rounded-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-800">Completion Rate</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {subtasks.length > 0 ? Math.round((stats.completed / subtasks.length) * 100) : 0}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-white to-amber-50/30 border border-amber-100/50 rounded-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-800">Avg. Time to Complete</div>
                                    <div className="text-2xl font-bold text-gray-900">3.2 days</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}