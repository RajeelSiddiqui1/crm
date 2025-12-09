"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    Edit,
    Calendar,
    Clock,
    Loader2,
    AlertCircle,
    Users,
    UserRound,
    Target,
    CheckCircle,
    XCircle,
    AlertTriangle,
    BarChart3,
    FileText,
    Mail,
    User,
    Phone,
    MapPin,
    Briefcase,
    Eye,
    Copy,
    Share2,
    Download,
    Printer
} from "lucide-react";
import axios from "axios";
import { format, formatDistance, formatRelative } from "date-fns";

export default function ViewSubtaskPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const subtaskId = params.id;

    const [loading, setLoading] = useState(true);
    const [subtask, setSubtask] = useState(null);

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
            }
        } catch (error) {
            console.error("Error fetching subtask:", error);
            toast.error("Failed to load subtask details");
            router.push('/teamlead/subtasks');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500 text-white';
            case 'medium': return 'bg-yellow-500 text-gray-900';
            case 'low': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-600 text-white';
            case 'in_progress': return 'bg-blue-600 text-white';
            case 'pending': return 'bg-amber-500 text-gray-900';
            case 'overdue': return 'bg-rose-600 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 mr-1" />;
            case 'in_progress': return <Loader2 className="w-4 h-4 mr-1 animate-spin" />;
            case 'pending': return <Clock className="w-4 h-4 mr-1" />;
            case 'overdue': return <AlertTriangle className="w-4 h-4 mr-1" />;
            default: return <Clock className="w-4 h-4 mr-1" />;
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/teamlead/subtasks/view/${subtaskId}`);
        toast.success("Link copied to clipboard!");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        toast.info("PDF export feature coming soon!");
        // Implement PDF export functionality here
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
                        <h3 className="text-lg font-semibold text-gray-900">Loading Subtask Details</h3>
                        <p className="text-gray-600 text-sm mt-1">Please wait while we fetch the information</p>
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
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h2>
                            <p className="text-gray-700 mb-6">You need to be logged in as a Team Lead to view this page.</p>
                            <Button 
                                onClick={() => router.push('/login')}
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
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Subtask Not Found</h2>
                            <p className="text-gray-700 mb-6">The subtask you're looking for doesn't exist or has been removed.</p>
                            <Button 
                                onClick={() => router.push('/teamlead/subtasks')}
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

    const progressPercentage = subtask.totalLeadsRequired ? 
        Math.round(((subtask.leadsCompleted || 0) / subtask.totalLeadsRequired) * 100) : 0;

    const isOverdue = new Date() > new Date(subtask.endDate);
    const timeRemaining = formatDistance(new Date(), new Date(subtask.endDate), { addSuffix: true });
    const duration = formatDistance(new Date(subtask.endDate), new Date(subtask.startDate));

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
                        <Button
                            onClick={() => router.push(`/teamlead/subtask-employee/${subtaskId}`)}
                            className="border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium shadow-sm"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Subtask
                        </Button>
                        <Button
                            onClick={() => router.push('/teamlead/subtasks')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View All Subtasks
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
                                    </CardTitle>
                                    <CardDescription className="text-slate-300 mt-2">
                                        Created by {subtask.teamLeadName || session.user.name} • {format(new Date(subtask.createdAt), 'MMMM dd, yyyy')}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className={`${getPriorityColor(subtask.priority)} px-3 py-1 font-medium`}>
                                        {subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1)} Priority
                                    </Badge>
                                    <Badge className={`${getStatusColor(subtask.status)} px-3 py-1 font-medium flex items-center`}>
                                        {getStatusIcon(subtask.status)}
                                        {subtask.status?.replace('_', ' ') || 'pending'}
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
                                        <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                                    </div>
                                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-6">
                                        <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                                            {subtask.description || "No description provided for this subtask."}
                                        </p>
                                    </div>
                                </div>

                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Timeline Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-indigo-100 rounded-lg">
                                                <Calendar className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center pb-3 border-b border-indigo-100">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-gray-700">Start Date & Time</span>
                                                    </div>
                                                    <span className="font-semibold text-gray-900">
                                                        {format(new Date(subtask.startDate), 'MMM dd, yyyy')} • {subtask.startTime}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pb-3 border-b border-indigo-100">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-gray-700">End Date & Time</span>
                                                    </div>
                                                    <span className="font-semibold text-gray-900">
                                                        {format(new Date(subtask.endDate), 'MMM dd, yyyy')} • {subtask.endTime}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-gray-700">Duration</span>
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lead Targets Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Target className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Lead Targets</h3>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-5">
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-gray-700">Overall Progress</span>
                                                        <span className="font-bold text-gray-900">
                                                            {subtask.leadsCompleted || 0} / {subtask.totalLeadsRequired || 0}
                                                        </span>
                                                    </div>
                                                    <Progress 
                                                        value={progressPercentage} 
                                                        className="h-3 bg-purple-100"
                                                    />
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm text-gray-600">Completion</span>
                                                        <span className="text-sm font-semibold text-purple-700">
                                                            {progressPercentage}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-purple-100">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-emerald-600">
                                                                {subtask.leadsCompleted || 0}
                                                            </div>
                                                            <div className="text-xs text-gray-600 font-medium mt-1">
                                                                Completed
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-gray-900">
                                                                {(subtask.totalLeadsRequired || 0) - (subtask.leadsCompleted || 0)}
                                                            </div>
                                                            <div className="text-xs text-gray-600 font-medium mt-1">
                                                                Remaining
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee Progress Card */}
                    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="border-b border-slate-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-gray-900">
                                            Team Progress
                                        </CardTitle>
                                        <CardDescription className="text-gray-700">
                                            Individual performance metrics of assigned employees
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-medium">
                                    {subtask.assignedEmployees?.length || 0} Members
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {subtask.assignedEmployees && subtask.assignedEmployees.length > 0 ? (
                                <div className="space-y-4">
                                    {subtask.assignedEmployees.map((assignment, index) => {
                                        const employee = assignment.employeeId;
                                        const employeeProgress = assignment.leadsCompleted || 0;
                                        const employeeTarget = assignment.leadsAssigned || 0;
                                        const employeePercentage = employeeTarget > 0 ? 
                                            Math.round((employeeProgress / employeeTarget) * 100) : 0;
                                        
                                        return (
                                            <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 rounded-xl bg-gradient-to-r from-slate-50/50 to-white hover:bg-slate-50/80 transition-all duration-200">
                                                <div className="flex items-center gap-4 mb-4 md:mb-0">
                                                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                                            {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold text-gray-900">
                                                                {employee?.firstName} {employee?.lastName}
                                                            </p>
                                                            <Badge className={`
                                                                ${assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                                                                assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                                                                'bg-amber-100 text-amber-800 border-amber-200'} 
                                                                text-xs font-medium
                                                            `}>
                                                                {assignment.status?.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {employee?.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col md:items-end gap-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">{employeeProgress}</div>
                                                            <div className="text-xs text-gray-600 font-medium">Completed</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">{employeeTarget}</div>
                                                            <div className="text-xs text-gray-600 font-medium">Target</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">{employeePercentage}%</div>
                                                            <div className="text-xs text-gray-600 font-medium">Progress</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="w-48">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span>Progress</span>
                                                            <span>{employeePercentage}%</span>
                                                        </div>
                                                        <Progress 
                                                            value={employeePercentage} 
                                                            className="h-2 bg-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
                                        <Users className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employees Assigned</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        This subtask doesn't have any employees assigned yet. Add team members to start tracking progress.
                                    </p>
                                    <Button
                                        onClick={() => router.push(`/teamlead/subtasks/edit/${subtaskId}`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Assign Employees
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats Card */}
                    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="border-b border-slate-200 p-6">
                            <CardTitle className="text-lg font-bold text-gray-900">
                                Performance Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-5">
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Users className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 font-medium">Team Size</div>
                                            <div className="text-xl font-bold text-gray-900">{subtask.assignedEmployees?.length || 0}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Target className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 font-medium">Total Leads</div>
                                            <div className="text-xl font-bold text-gray-900">{subtask.totalLeadsRequired || 0}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 font-medium">Completed</div>
                                            <div className="text-xl font-bold text-gray-900">{subtask.leadsCompleted || 0}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <BarChart3 className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-700 font-medium">Progress Rate</div>
                                            <div className="text-xl font-bold text-gray-900">{progressPercentage}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                                    <div className="text-sm text-gray-600 font-medium">Created On</div>
                                    <div className="text-gray-900 font-semibold">
                                        {format(new Date(subtask.createdAt), 'PPP')}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-600 font-medium">Last Updated</div>
                                    <div className="text-gray-900 font-semibold">
                                        {subtask.updatedAt ? 
                                            formatRelative(new Date(subtask.updatedAt), new Date()) : 
                                            'Never updated'}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-600 font-medium">Time Remaining</div>
                                    <div className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {isOverdue ? (
                                            <span className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Overdue by {formatDistance(new Date(subtask.endDate), new Date())}
                                            </span>
                                        ) : timeRemaining}
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="text-sm text-gray-600 font-medium mb-2">Subtask ID</div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg font-mono">
                                            {subtask._id}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                navigator.clipboard.writeText(subtask._id);
                                                toast.success("ID copied!");
                                            }}
                                            className="h-8 px-2"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="border-b border-slate-200 p-6">
                            <CardTitle className="text-lg font-bold text-gray-900">
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <Button
                                    onClick={() => router.push(`/teamlead/subtask-employee/${subtaskId}`)}
                                    className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg"
                                >
                                    <Edit className="w-4 h-4 mr-3" />
                                    Edit Subtask Details
                                </Button>
                                
                                <Button
                                    onClick={handleCopyLink}
                                    className="w-full justify-start border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium py-3 px-4 rounded-lg"
                                >
                                    <Share2 className="w-4 h-4 mr-3" />
                                    Share Subtask
                                </Button>
                                
                                <Button
                                    onClick={handleExportPDF}
                                    className="w-full justify-start border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium py-3 px-4 rounded-lg"
                                >
                                    <Download className="w-4 h-4 mr-3" />
                                    Export as PDF
                                </Button>
                                
                                <Button
                                    onClick={handlePrint}
                                    className="w-full justify-start border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium py-3 px-4 rounded-lg"
                                >
                                    <Printer className="w-4 h-4 mr-3" />
                                    Print Details
                                </Button>
                                
                                <Button
                                    onClick={() => router.push('/teamlead/subtasks')}
                                    className="w-full justify-start border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium py-3 px-4 rounded-lg mt-4"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-3" />
                                    Back to All Subtasks
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Subtask Summary Footer */}
            <div className="max-w-7xl mx-auto mt-8">
                <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Subtask Summary</h3>
                                <p className="text-slate-300 text-sm">
                                    {subtask.title} • {format(new Date(subtask.createdAt), 'MMMM dd, yyyy')}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">{progressPercentage}%</div>
                                    <div className="text-xs text-slate-300">Progress</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                        {subtask.leadsCompleted || 0}/{subtask.totalLeadsRequired || 0}
                                    </div>
                                    <div className="text-xs text-slate-300">Leads</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">{subtask.assignedEmployees?.length || 0}</div>
                                    <div className="text-xs text-slate-300">Team</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}