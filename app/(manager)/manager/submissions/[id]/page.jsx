"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
    FileText, 
    User, 
    Calendar, 
    CheckCircle, 
    Clock, 
    XCircle, 
    AlertCircle, 
    Eye, 
    Loader2, 
    Edit, 
    Trash2,
    EyeOff,
    Star,
    Upload,
    MapPin,
    CreditCard,
    Phone,
    Link,
    CheckSquare,
    Radio,
    SlidersHorizontal,
    ToggleLeft,
    Mail,
    Hash,
    List,
    Lock,
    X,
    Download,
    Users,
    Building,
    Volume2,
    Play,
    Pause,
    ArrowLeft,
    Save,
    Shield,
    Target,
    ClipboardCheck,
    MessageSquare,
    BarChart3
} from "lucide-react";
import axios from "axios";

export default function ManagerEditSubmissionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const submissionId = params.id;

    const [submission, setSubmission] = useState(null);
    const [adminTask, setAdminTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showPasswords, setShowPasswords] = useState({});
    const [audioPlaying, setAudioPlaying] = useState(null);
    const fileInputRefs = useRef({});

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Manager") {
            router.push("/manager/login");
            return;
        }

        fetchSubmissionDetails();
    }, [session, status, router, submissionId]);

    const fetchSubmissionDetails = async () => {
        try {
            setFetching(true);
            const response = await axios.get(`/api/manager/submissions/${submissionId}`);
            if (response.status === 200) {
                const submissionData = response.data;
                setSubmission(submissionData);
                
                // Fetch admin task details if adminTaskId exists
                if (submissionData.adminTask) {
                    fetchAdminTask(submissionData.adminTask);
                }
            }
        } catch (error) {
            console.error("Error fetching submission details:", error);
            toast.error("Failed to fetch submission details");
        } finally {
            setFetching(false);
        }
    };

    const fetchAdminTask = async (adminTaskId) => {
        try {
            const response = await axios.get(`/api/manager/admin-tasks/${adminTaskId}`);
            if (response.status === 200) {
                setAdminTask(response.data.task);
            }
        } catch (error) {
            console.error("Error fetching admin task:", error);
            // Don't show error toast as admin task might not exist for all submissions
        }
    };

    // Get employee full name with proper fallbacks
    const getEmployeeFullName = (employee) => {
        if (!employee) return "Unknown Employee";
        
        if (employee.firstName && employee.lastName) {
            return `${employee.firstName} ${employee.lastName}`;
        }
        
        if (employee.name) {
            return employee.name;
        }
        
        // Fallback to email username
        if (employee.email) {
            return employee.email.split('@')[0];
        }
        
        return "Unknown Employee";
    };

    // Get employee initials for avatar
    const getEmployeeInitials = (employee) => {
        if (!employee) return "U";
        
        if (employee.firstName && employee.lastName) {
            return `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
        }
        
        if (employee.name) {
            return employee.name.substring(0, 2).toUpperCase();
        }
        
        if (employee.email) {
            return employee.email.substring(0, 2).toUpperCase();
        }
        
        return "U";
    };

    const handleFieldChange = (fieldName, value) => {
        setSubmission(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [fieldName]: value
            }
        }));
    };

    const handleManagerCommentsChange = (value) => {
        setSubmission(prev => ({
            ...prev,
            managerComments: value
        }));
    };

    const togglePasswordVisibility = (fieldName) => {
        setShowPasswords(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    const handleFileUploadClick = (fieldName) => {
        if (fileInputRefs.current[fieldName]) {
            fileInputRefs.current[fieldName].click();
        }
    };

    const handleFileChange = (fieldName, event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleFieldChange(fieldName, files);
            toast.success(`File selected: ${files[0].name}`);
        }
    };

    const playAudio = (audioUrl) => {
        if (audioPlaying) {
            const audio = document.getElementById("admin-task-audio");
            if (audio) {
                audio.pause();
            }
            setAudioPlaying(null);
        } else {
            const audio = document.getElementById("admin-task-audio");
            if (audio) {
                audio.play();
                audio.onended = () => setAudioPlaying(null);
                setAudioPlaying(true);
            }
        }
    };

    const downloadFile = (fileData, fileName = "attachment") => {
        const link = document.createElement("a");
        link.href = fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20";
            case "medium":
                return "bg-yellow-500/10 text-yellow-700 border-yellow-200 hover:bg-yellow-500/20";
            case "low":
                return "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20";
            default:
                return "bg-gray-500/10 text-gray-700 border-gray-200 hover:bg-gray-500/20";
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "completed":
            case "approved":
                return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
            case "in_progress":
                return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
            case "approved":
                return <CheckCircle className="w-3 h-3" />;
            case "in_progress":
                return <Clock className="w-3 h-3" />;
            case "pending":
                return <AlertCircle className="w-3 h-3" />;
            case "rejected":
                return <XCircle className="w-3 h-3" />;
            default:
                return <AlertCircle className="w-3 h-3" />;
        }
    };

    const getFieldIcon = (fieldType) => {
        const fieldIcons = {
            text: FileText,
            email: Mail,
            number: Hash,
            tel: Phone,
            url: Link,
            password: Lock,
            date: Calendar,
            select: List,
            textarea: FileText,
            checkbox: CheckSquare,
            radio: Radio,
            range: SlidersHorizontal,
            file: Upload,
            rating: Star,
            toggle: ToggleLeft,
            address: MapPin,
            creditCard: CreditCard
        };
        return fieldIcons[fieldType] || FileText;
    };

    const renderEditFormField = (fieldConfig, fieldName, fieldValue) => {
        if (!fieldConfig) {
            return (
                <Input
                    value={fieldValue || ""}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white"
                />
            );
        }

        switch (fieldConfig.type) {
            case "text":
            case "email":
            case "number":
            case "tel":
            case "url":
                return (
                    <Input
                        type={fieldConfig.type}
                        value={fieldValue || ""}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white"
                    />
                );
            case "password":
                return (
                    <div className="relative">
                        <Input
                            type={showPasswords[fieldName] ? "text" : "password"}
                            value={fieldValue || ""}
                            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                            placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility(fieldName)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {showPasswords[fieldName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                );
            case "textarea":
                return (
                    <Textarea
                        value={fieldValue || ""}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white min-h-[100px] resize-vertical"
                        rows={4}
                    />
                );
            case "select":
                return (
                    <Select 
                        value={fieldValue || ""} 
                        onValueChange={(value) => handleFieldChange(fieldName, value)}
                    >
                        <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white">
                            <SelectValue placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {fieldConfig.options?.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "date":
                return (
                    <Input
                        type="date"
                        value={fieldValue || ""}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white"
                    />
                );
            case "checkbox":
                return (
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                        <input
                            type="checkbox"
                            checked={!!fieldValue}
                            onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                            className="rounded border-gray-300 bg-white w-5 h-5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <Label className="text-gray-800 font-medium cursor-pointer">{fieldConfig.label}</Label>
                    </div>
                );
            case "radio":
                return (
                    <div className="space-y-3">
                        {fieldConfig.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <input
                                    type="radio"
                                    name={fieldName}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                    className="rounded-full border-gray-300 bg-white w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                />
                                <Label className="text-gray-800 font-medium cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case "file":
                return (
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-blue-400 transition-all duration-200 group"
                        onClick={() => handleFileUploadClick(fieldName)}
                    >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">{fieldConfig.accept || "Any file type"}</p>
                        <Input
                            ref={el => fileInputRefs.current[fieldName] = el}
                            type="file"
                            onChange={(e) => handleFileChange(fieldName, e)}
                            className="hidden"
                            accept={fieldConfig.accept}
                        />
                        {fieldValue && (
                            <p className="text-sm text-green-600 mt-2 font-medium">
                                {fieldValue.name || 'File selected'}
                            </p>
                        )}
                    </div>
                );
            default:
                return (
                    <Input
                        value={fieldValue || ""}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white"
                    />
                );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.put(`/api/manager/submissions/${submissionId}`, {
                formData: submission.formData,
                managerComments: submission.managerComments
            });

            if (response.status === 200) {
                toast.success("Submission updated successfully!");
                router.push('/manager/submissions');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update submission");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await axios.delete(`/api/manager/submissions/${submissionId}`);

            if (response.status === 200) {
                toast.success("Submission deleted successfully!");
                router.push('/manager/submissions');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete submission");
        }
    };

    if (status === "loading" || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg border border-blue-100">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Submission</h3>
                        <p className="text-gray-600">Preparing your editing workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Manager") {
        return null;
    }

    if (!submission) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h2>
                    <p className="text-gray-700 mb-6">The submission you're looking for doesn't exist or you don't have access to it.</p>
                    <Button
                        onClick={() => router.push('/manager/submissions')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-2.5"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Submissions
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto">
                {/* Enhanced Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/manager/submissions')}
                            className="rounded-xl border-blue-200 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 shadow-sm transition-all duration-200"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Submissions
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-2xl shadow-lg border border-blue-100">
                                <Edit className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                    Edit Submission
                                </h1>
                                <p className="text-gray-700 mt-2 text-lg font-medium">
                                    {submission.formId?.title || 'Submission Details'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push('/manager/dashboard')}
                            variant="outline"
                            className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            onClick={() => router.push(`/group-chat?submissionId=${submissionId}`)}
                            variant="outline"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Group Chat
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Left Side - Admin Task Reference & Submission Info */}
                    <div className="space-y-6">
                        {/* Admin Task Reference */}
                        {adminTask && (
                            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100 hover:shadow-3xl transition-all duration-300">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                                            <Target className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-gray-900 text-xl font-bold">
                                                Admin Task Reference
                                            </CardTitle>
                                            <CardDescription className="text-gray-700 font-medium">
                                                Original task details and requirements
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        {/* Task Basic Info */}
                                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">
                                                {adminTask.title}
                                            </h3>
                                            <p className="text-gray-700 text-sm font-medium">
                                                {adminTask.description}
                                            </p>
                                        </div>

                                        {/* Task Details Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-blue-600" />
                                                    <Label className="text-sm font-semibold text-gray-700">Client</Label>
                                                </div>
                                                <p className="text-gray-900 font-bold text-sm">
                                                    {adminTask.clientName || "No client specified"}
                                                </p>
                                            </div>
                                            <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-yellow-600" />
                                                    <Label className="text-sm font-semibold text-gray-700">Priority</Label>
                                                </div>
                                                <Badge className={`${getPriorityColor(adminTask.priority)} capitalize text-xs font-bold border-0 px-3 py-1`}>
                                                    {adminTask.priority}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-green-600" />
                                                    <Label className="text-sm font-semibold text-gray-700">Due Date</Label>
                                                </div>
                                                <p className="text-gray-900 font-bold text-sm">
                                                    {formatDate(adminTask.endDate)}
                                                </p>
                                            </div>
                                            <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2">
                                                    <ClipboardCheck className="w-4 h-4 text-purple-600" />
                                                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                                                </div>
                                                <Badge className="bg-blue-500/10 text-blue-700 border-0 capitalize text-xs font-bold px-3 py-1">
                                                    {adminTask.status || 'assigned'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Audio Instructions */}
                                        {adminTask.audioUrl && (
                                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                                                    <Volume2 className="w-4 h-4 text-blue-600" />
                                                    Voice Instructions
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        onClick={() => playAudio(adminTask.audioUrl)}
                                                        variant="outline"
                                                        className={`rounded-xl border-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-all duration-200 ${
                                                            audioPlaying
                                                                ? "text-white bg-blue-600 border-blue-600"
                                                                : "text-blue-700 border-blue-600"
                                                        }`}
                                                    >
                                                        {audioPlaying ? (
                                                            <Pause className="w-4 h-4 mr-2" />
                                                        ) : (
                                                            <Play className="w-4 h-4 mr-2" />
                                                        )}
                                                        {audioPlaying ? "Pause Audio" : "Play Instructions"}
                                                    </Button>
                                                    <audio
                                                        id="admin-task-audio"
                                                        src={adminTask.audioUrl}
                                                        onEnded={() => setAudioPlaying(null)}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* File Attachments */}
                                        {adminTask.fileAttachments && (
                                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                                                    <Download className="w-4 h-4 text-green-600" />
                                                    File Attachments
                                                </Label>
                                                <Button
                                                    onClick={() => downloadFile(adminTask.fileAttachments, `task_${adminTask.title}_attachment`)}
                                                    variant="outline"
                                                    className="rounded-xl border-green-600 text-green-700 bg-white hover:bg-green-600 hover:text-white hover:border-green-600 font-medium transition-all duration-200"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Reference Files
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Enhanced Submission Information */}
                        <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100 hover:shadow-3xl transition-all duration-300">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-gray-900 text-xl font-bold">
                                            Submission Information
                                        </CardTitle>
                                        <CardDescription className="text-gray-700 font-medium">
                                            Team hierarchy and submission timeline
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                            <Label className="text-sm font-semibold text-gray-700">Assigned To</Label>
                                            <p className="text-gray-900 font-bold">{submission.assignedTo}</p>
                                        </div>
                                        <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                            <Label className="text-sm font-semibold text-gray-700">Submission Date</Label>
                                            <p className="text-gray-900 font-bold">{formatDate(submission.createdAt)}</p>
                                        </div>
                                    </div>

                                    {/* Status Hierarchy */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-semibold text-gray-700">Status Hierarchy</Label>
                                        <div className="space-y-3">
                                            {/* Manager Status */}
                                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 border-2 border-white shadow-md">
                                                        <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                                                            M
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <span className="text-gray-700 font-medium">Manager</span>
                                                        <p className="text-gray-500 text-xs">You</p>
                                                    </div>
                                                </div>
                                                <Badge className={`${getStatusVariant(submission.status)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                                                    {getStatusIcon(submission.status)}
                                                    {submission.status.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            {/* Team Lead Status */}
                                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 border-2 border-white shadow-md">
                                                        <AvatarFallback className="bg-green-600 text-white text-sm font-bold">
                                                            TL
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <span className="text-gray-700 font-medium">Team Lead</span>
                                                        <p className="text-gray-500 text-xs">Reviewer</p>
                                                    </div>
                                                </div>
                                                <Badge className={`${getStatusVariant(submission.status2)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                                                    {getStatusIcon(submission.status2)}
                                                    {submission.status2.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            {/* Assigned Employees */}
                                            {submission.assignedEmployees?.map((emp, index) => (
                                                <div key={emp.employeeId?._id || index} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8 border-2 border-white shadow-md">
                                                            <AvatarFallback className="bg-purple-600 text-white text-sm font-bold">
                                                                {getEmployeeInitials(emp.employeeId)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <span className="text-gray-700 font-medium">
                                                                {getEmployeeFullName(emp.employeeId)}
                                                            </span>
                                                            <p className="text-gray-500 text-xs">{emp.email}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={`${getStatusVariant(emp.status)} border flex items-center gap-1 px-3 py-1 font-medium`}>
                                                        {getStatusIcon(emp.status)}
                                                        {emp.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="space-y-4">
                                        {submission.completedAt && (
                                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                <Label className="text-sm font-semibold text-gray-700">Completed Date</Label>
                                                <p className="text-gray-900 font-bold">{formatDate(submission.completedAt)}</p>
                                            </div>
                                        )}

                                        {submission.teamLeadFeedback && (
                                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                                <Label className="text-sm font-semibold text-gray-700">Team Lead Feedback</Label>
                                                <p className="text-gray-900 font-medium mt-2 bg-white p-3 rounded-lg border border-yellow-100">
                                                    {submission.teamLeadFeedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Enhanced Edit Form */}
                    <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100 hover:shadow-3xl transition-all duration-300">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                                    <Edit className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-gray-900 text-xl font-bold">
                                        Edit Form Data
                                    </CardTitle>
                                    <CardDescription className="text-gray-700 font-medium">
                                        Update submission details and provide feedback
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Form Data Fields */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Form Data
                                    </h3>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50/50 custom-scrollbar">
                                        {submission.formData && Object.entries(submission.formData).map(([fieldName, fieldValue]) => {
                                            const fieldConfig = submission.formId?.fields?.find(f => f.name === fieldName);
                                            const IconComponent = fieldConfig ? getFieldIcon(fieldConfig.type) : FileText;
                                            
                                            return (
                                                <div key={fieldName} className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors duration-200">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                            <IconComponent className="w-4 h-4" />
                                                        </div>
                                                        <Label className="text-gray-800 font-semibold text-base capitalize">
                                                            {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                                                            {fieldConfig?.required && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                    </div>
                                                    {renderEditFormField(fieldConfig, fieldName, fieldValue)}
                                                    {fieldConfig?.placeholder && (
                                                        <p className="text-xs text-gray-500 mt-2">{fieldConfig.placeholder}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Manager Comments */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-green-600" />
                                        Your Comments & Feedback
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <Label htmlFor="managerComments" className="text-gray-800 font-semibold">
                                                Comments
                                            </Label>
                                            <Textarea
                                                value={submission.managerComments || ""}
                                                onChange={(e) => handleManagerCommentsChange(e.target.value)}
                                                placeholder="Add your comments, feedback, or approval notes for the team..."
                                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white min-h-[120px] resize-vertical"
                                                rows={6}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-gray-200">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-2.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50 flex-1 font-bold"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            "Update Submission"
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleDelete}
                                        className="border-red-600 text-red-700 bg-white hover:bg-red-600 hover:text-white px-6 py-2.5 transition-all duration-200 shadow-sm font-medium hover:scale-105"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}