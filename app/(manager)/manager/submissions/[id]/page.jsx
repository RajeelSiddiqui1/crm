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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    Save
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
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "bg-red-500/10 text-red-700 border-red-200";
            case "medium":
                return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
            case "low":
                return "bg-green-500/10 text-green-700 border-green-200";
            default:
                return "bg-gray-500/10 text-gray-700 border-gray-200";
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "completed":
            case "approved":
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

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
            case "approved":
                return <CheckCircle className="w-4 h-4" />;
            case "in_progress":
                return <Clock className="w-4 h-4" />;
            case "pending":
                return <AlertCircle className="w-4 h-4" />;
            case "rejected":
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
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
                    className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
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
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
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
                            className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility(fieldName)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
                        rows={4}
                    />
                );
            case "select":
                return (
                    <Select 
                        value={fieldValue || ""} 
                        onValueChange={(value) => handleFieldChange(fieldName, value)}
                    >
                        <SelectTrigger className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900">
                            <SelectValue placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
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
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
                    />
                );
            case "checkbox":
                return (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={!!fieldValue}
                            onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                            className="rounded border-gray-300 bg-white w-4 h-4 text-gray-800 focus:ring-gray-800"
                        />
                        <Label className="text-gray-800 font-medium">{fieldConfig.label}</Label>
                    </div>
                );
            case "radio":
                return (
                    <div className="space-y-2">
                        {fieldConfig.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name={fieldName}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                    className="rounded-full border-gray-300 bg-white w-4 h-4 text-gray-800 focus:ring-gray-800"
                                />
                                <Label className="text-gray-800 font-medium">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case "file":
                return (
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => handleFileUploadClick(fieldName)}
                    >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <Input
                            ref={el => fileInputRefs.current[fieldName] = el}
                            type="file"
                            onChange={(e) => handleFileChange(fieldName, e)}
                            className="hidden"
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
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
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
                <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <div className="w-8 h-8 animate-spin rounded-full border-4 border-gray-800 border-t-transparent"></div>
                    <span className="text-gray-800 text-lg font-medium">
                        Loading Submission...
                    </span>
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
                <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h2>
                    <p className="text-gray-700 mb-6">The submission you're looking for doesn't exist.</p>
                    <Button
                        onClick={() => router.push('/manager/submissions')}
                        className="bg-gray-800 hover:bg-gray-900 text-white"
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
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/manager/submissions')}
                        className="rounded-lg border-gray-300 bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Submissions
                    </Button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Edit Submission
                        </h1>
                        <p className="text-gray-700 mt-2 text-base font-medium">
                            {submission.formId?.title || 'Submission Details'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Side - Admin Task Reference & Submission Info */}
                    <div className="space-y-6">
                        {/* Admin Task Reference */}
                        {adminTask && (
                            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-gray-200">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200 p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-gray-900 text-xl font-bold">
                                                Admin Task Reference
                                            </CardTitle>
                                            <CardDescription className="text-gray-700 font-medium">
                                                Original task details
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        {/* Task Basic Info */}
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    {adminTask.title}
                                                </h3>
                                                <p className="text-gray-700 mt-1 text-sm font-medium">
                                                    {adminTask.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Task Details Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-700" />
                                                    <Label className="text-sm font-semibold text-gray-700">Client</Label>
                                                </div>
                                                <p className="text-gray-900 font-bold text-sm">
                                                    {adminTask.clientName || "No client"}
                                                </p>
                                            </div>
                                            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-700" />
                                                    <Label className="text-sm font-semibold text-gray-700">Priority</Label>
                                                </div>
                                                <Badge className={`${getPriorityColor(adminTask.priority)} capitalize text-xs font-bold border-0`}>
                                                    {adminTask.priority}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-700" />
                                                    <Label className="text-sm font-semibold text-gray-700">Due Date</Label>
                                                </div>
                                                <p className="text-gray-900 font-bold text-sm">
                                                    {formatDate(adminTask.endDate)}
                                                </p>
                                            </div>
                                            <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-700" />
                                                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                                                </div>
                                                <Badge className="bg-blue-500/10 text-blue-700 border-0 capitalize text-xs font-bold">
                                                    {adminTask.status || 'assigned'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Audio Instructions */}
                                        {adminTask.audioUrl && (
                                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                                                    <Volume2 className="w-4 h-4" />
                                                    Voice Instructions
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        onClick={() => playAudio(adminTask.audioUrl)}
                                                        variant="outline"
                                                        className={`rounded-lg border-gray-800 bg-white hover:bg-gray-900 hover:text-white ${
                                                            audioPlaying
                                                                ? "text-white bg-gray-900 border-gray-900"
                                                                : "text-gray-800 border-gray-800"
                                                        }`}
                                                    >
                                                        {audioPlaying ? (
                                                            <Pause className="w-4 h-4 mr-2" />
                                                        ) : (
                                                            <Play className="w-4 h-4 mr-2" />
                                                        )}
                                                        {audioPlaying ? "Pause" : "Play"} Audio
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
                                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                                                    <Download className="w-4 h-4" />
                                                    File Attachments
                                                </Label>
                                                <Button
                                                    onClick={() => downloadFile(adminTask.fileAttachments, `task_${adminTask.title}_attachment`)}
                                                    variant="outline"
                                                    className="rounded-lg border-green-600 text-green-700 bg-white hover:bg-green-600 hover:text-white hover:border-green-600 font-medium"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download File
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Submission Information */}
                        <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-gray-200">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200 p-6">
                                <CardTitle className="text-gray-900 text-xl font-bold">
                                    Submission Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-gray-800 font-semibold">Assigned To</Label>
                                        <p className="text-gray-900 font-medium">{submission.assignedTo}</p>
                                    </div>

                                    <div>
                                        <Label className="text-gray-800 font-semibold">Submission Date</Label>
                                        <p className="text-gray-900 font-medium">{formatDate(submission.createdAt)}</p>
                                    </div>

                                    <div>
                                        <Label className="text-gray-800 font-semibold">Status Hierarchy</Label>
                                        <div className="space-y-2 mt-2">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-600" />
                                                <span className="text-gray-700 font-medium">Manager:</span>
                                                <Badge className={`${getStatusVariant(submission.status)} border flex items-center gap-1 px-2 py-1`}>
                                                    {getStatusIcon(submission.status)}
                                                    {submission.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-700 font-medium">Team Lead:</span>
                                                <Badge className={`${getStatusVariant(submission.status2)} border flex items-center gap-1 px-2 py-1`}>
                                                    {getStatusIcon(submission.status2)}
                                                    {submission.status2.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            {submission.assignedEmployees?.map((emp, index) => (
                                                <div key={emp.employeeId} className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-purple-600" />
                                                    <span className="text-gray-700 font-medium">{emp.email}:</span>
                                                    <Badge className={`${getStatusVariant(emp.status)} border flex items-center gap-1 px-2 py-1`}>
                                                        {getStatusIcon(emp.status)}
                                                        {emp.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {submission.completedAt && (
                                        <div>
                                            <Label className="text-gray-800 font-semibold">Completed Date</Label>
                                            <p className="text-gray-900 font-medium">{formatDate(submission.completedAt)}</p>
                                        </div>
                                    )}

                                    {submission.teamLeadFeedback && (
                                        <div>
                                            <Label className="text-gray-800 font-semibold">Team Lead Feedback</Label>
                                            <p className="text-gray-900 font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                {submission.teamLeadFeedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Edit Form */}
                    <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-gray-200">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                                    <Edit className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-gray-900 text-xl font-bold">
                                        Edit Form Data
                                    </CardTitle>
                                    <CardDescription className="text-gray-700 font-medium">
                                        Update submission details and comments
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Form Data Fields */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900">Form Data</h3>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        {submission.formData && Object.entries(submission.formData).map(([fieldName, fieldValue]) => {
                                            const fieldConfig = submission.formId?.fields?.find(f => f.name === fieldName);
                                            const IconComponent = fieldConfig ? getFieldIcon(fieldConfig.type) : FileText;
                                            
                                            return (
                                                <div key={fieldName} className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                            <IconComponent className="w-4 h-4" />
                                                        </div>
                                                        <Label className="text-gray-800 font-semibold text-lg capitalize">
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
                                    <h3 className="text-lg font-bold text-gray-900">Manager Comments</h3>

                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <Label htmlFor="managerComments" className="text-gray-800 font-semibold">
                                                Comments
                                            </Label>
                                            <Textarea
                                                value={submission.managerComments || ""}
                                                onChange={(e) => handleManagerCommentsChange(e.target.value)}
                                                placeholder="Add your comments or feedback..."
                                                className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
                                                rows={6}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-gray-200">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white px-8 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50 flex-1 font-bold"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? "Updating..." : "Update Submission"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleDelete}
                                        className="border-red-600 text-red-700 bg-white hover:bg-red-600 hover:text-white px-6 py-2.5 transition-all duration-200 shadow-sm font-medium"
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
        </div>
    );
}