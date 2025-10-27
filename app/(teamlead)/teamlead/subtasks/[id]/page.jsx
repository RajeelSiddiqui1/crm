"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    FileText,
    User,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Users,
    Flag,
    MessageSquare,
    Paperclip,
    MapPin,
    Edit,
    Download,
    Mail,
    Phone,
    RefreshCcw,
    Eye
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { Label } from "@/components/ui/label";

export default function SubtaskDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const subtaskId = params.id;

    const [subtask, setSubtask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "TeamLead") {
            router.push("/login");
            return;
        }

        fetchSubtaskDetail();
    }, [session, status, router, subtaskId]);

    const fetchSubtaskDetail = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/teamlead/subtasks/${subtaskId}`);
            if (response.status === 200) {
                setSubtask(response.data);
            }
        } catch (error) {
            console.error("Error fetching subtask details:", error);
            toast.error("Failed to fetch subtask details");
            router.push("/teamlead/subtasks");
        } finally {
            setLoading(false);
        }
    };

    const updateSubtaskStatus = async (newStatus) => {
        try {
            setUpdating(true);
            const response = await axios.put(`/api/teamlead/subtasks/${subtaskId}`, {
                status: newStatus
            });
            
            if (response.status === 200) {
                setSubtask(response.data);
                toast.success(`Subtask marked as ${newStatus.replace('_', ' ')}`);
            }
        } catch (error) {
            console.error("Error updating subtask:", error);
            toast.error("Failed to update subtask");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusVariant = (status) => {
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

    const getPriorityVariant = (priority) => {
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
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateProgress = () => {
        if (!subtask?.assignedEmployees?.length) return 0;
        
        const completed = subtask.assignedEmployees.filter(emp => 
            emp.status === 'completed'
        ).length;
        
        return (completed / subtask.assignedEmployees.length) * 100;
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-black text-lg">Loading subtask details...</span>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "TeamLead") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
                    <p className="text-gray-700">You need to be logged in as TeamLead to access this page.</p>
                </div>
            </div>
        );
    }

    if (!subtask) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-black mb-2">Subtask Not Found</h2>
                    <p className="text-gray-700 mb-4">The subtask you're looking for doesn't exist.</p>
                    <Link href="/teamlead/subtasks">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Subtasks
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/teamlead/subtasks">
                            <Button variant="outline" size="icon" className="border-gray-300">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-black">{subtask.title}</h1>
                            <p className="text-gray-700 mt-2">{subtask.description}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={fetchSubtaskDetail}
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            disabled={loading}
                        >
                            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Subtask
                        </Button>
                    </div>
                </div>

                {/* Progress Bar */}
                <Card className="mb-8 border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-black">Overall Progress</span>
                            <span className="text-sm font-bold text-blue-600">{Math.round(calculateProgress())}%</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-3" />
                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                            <span>{subtask.assignedEmployees?.filter(emp => emp.status === 'completed').length || 0} completed</span>
                            <span>{subtask.assignedEmployees?.length || 0} total employees</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Actions */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-black">
                                    <Flag className="w-5 h-5 text-blue-600" />
                                    Update Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {['pending', 'in_progress', 'completed', 'rejected'].map((status) => (
                                        <Button
                                            key={status}
                                            variant={subtask.status === status ? "default" : "outline"}
                                            className={`flex flex-col h-16 ${
                                                subtask.status === status 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'border-gray-300 text-black hover:bg-gray-50'
                                            }`}
                                            onClick={() => updateSubtaskStatus(status)}
                                            disabled={updating}
                                        >
                                            {getStatusIcon(status)}
                                            <span className="text-xs mt-1 capitalize">
                                                {status.replace('_', ' ')}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assigned Employees */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-black">
                                    <Users className="w-5 h-5 text-purple-600" />
                                    Assigned Employees
                                    <Badge variant="secondary" className="ml-2 bg-gray-100 text-black">
                                        {subtask.assignedEmployees?.length || 0}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {subtask.assignedEmployees && subtask.assignedEmployees.length > 0 ? (
                                        subtask.assignedEmployees.map((emp, index) => (
                                            <div key={emp.employeeId._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                                            {emp.employeeId.firstName?.[0]}{emp.employeeId.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-black">
                                                            {emp.employeeId.firstName} {emp.employeeId.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-700">{emp.email}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Mail className="w-3 h-3 text-gray-500" />
                                                            <Phone className="w-3 h-3 text-gray-500" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className={getStatusVariant(emp.status)}>
                                                        {emp.status.replace('_', ' ')}
                                                    </Badge>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Assigned: {formatDateTime(emp.assignedAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-700">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            No employees assigned to this subtask
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline Details */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-black">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                    Timeline & Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-black">Start Date & Time</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-4 h-4 text-green-500" />
                                                <span className="text-black">{formatDate(subtask.startDate)}</span>
                                                <span className="text-black">{subtask.title}</span>
                                                <span className="text-black">{subtask.description}</span>
                                                <span className="text-gray-700">at {subtask.startTime}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-black">End Date & Time</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-4 h-4 text-red-500" />
                                                <span className="text-black">{formatDate(subtask.endDate)}</span>
                                                <span className="text-gray-700">at {subtask.endTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-black">Priority</Label>
                                            <div className="mt-1">
                                                <Badge className={`${getPriorityVariant(subtask.priority)} border flex items-center gap-1 px-3 py-1.5 font-medium w-fit`}>
                                                    <Flag className="w-3 h-3" />
                                                    {subtask.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-black">Current Status</Label>
                                            <div className="mt-1">
                                                <Badge className={`${getStatusVariant(subtask.status)} border flex items-center gap-1 px-3 py-1.5 font-medium w-fit`}>
                                                    {getStatusIcon(subtask.status)}
                                                    {subtask.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Parent Submission */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-black">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    Parent Submission
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-black">Title</Label>
                                        <p className="text-black font-semibold mt-1">
                                            {subtask.submissionId?.title || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-black">Description</Label>
                                        <p className="text-gray-700 text-sm mt-1">
                                            {subtask.submissionId?.description || 'No description available'}
                                        </p>
                                    </div>
                                    <Link href={`/teamlead/submissions/${subtask.submissionId?._id}`}>
                                        <Button variant="outline" className="w-full border-gray-300 text-black">
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Submission
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-black">
                                    <MessageSquare className="w-5 h-5 text-orange-600" />
                                    Additional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {subtask.teamLeadFeedback && (
                                    <div>
                                        <Label className="text-sm font-medium text-black">Team Lead Feedback</Label>
                                        <p className="text-sm text-gray-700 mt-1 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                            {subtask.teamLeadFeedback}
                                        </p>
                                    </div>
                                )}

                                {subtask.attachments && subtask.attachments.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium text-black flex items-center gap-2">
                                            <Paperclip className="w-4 h-4" />
                                            Attachments ({subtask.attachments.length})
                                        </Label>
                                        <div className="space-y-2 mt-2">
                                            {subtask.attachments.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm text-black truncate max-w-[150px]">
                                                            {file.originalName}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="w-6 h-6">
                                                        <Download className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {subtask.completedAt && (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <Label className="text-sm font-medium text-green-800">Completed At</Label>
                                        <p className="text-sm text-green-700 mt-1">
                                            {formatDateTime(subtask.completedAt)}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <Label className="text-gray-600">Created</Label>
                                            <p className="text-black font-medium">{formatDateTime(subtask.createdAt)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-600">Last Updated</Label>
                                            <p className="text-black font-medium">{formatDateTime(subtask.updatedAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-black">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start border-gray-300 text-black">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Send Message to Team
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-gray-300 text-black">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Update Progress
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-gray-300 text-black">
                                    <Paperclip className="w-4 h-4 mr-2" />
                                    Add Attachment
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Subtask
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}