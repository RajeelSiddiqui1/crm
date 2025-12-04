"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    Users,
    Calendar,
    Send,
    Eye,
    EyeOff,
    Star,
    Upload,
    Phone,
    Link,
    CheckSquare,
    Radio,
    SlidersHorizontal,
    ToggleLeft,
    Mail,
    Lock,
    Hash,
    Play,
    Pause,
    Download,
    Volume2,
    ArrowLeft,
    Plus,
    Clock,
    Building,
    User,
    Loader2,
    ChevronRight,
    Check,
    Search,
    Filter,
    Zap,
    AlertCircle
} from "lucide-react";
import axios from "axios";

export default function ManagerCreateFormPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('taskId');

    const [forms, setForms] = useState([]);
    const [adminTask, setAdminTask] = useState(null);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [selectedForm, setSelectedForm] = useState(null);
    const [dragOver, setDragOver] = useState({});
    const [showPasswords, setShowPasswords] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        assignmentType: "single",
        assignedTo: "",
        multipleTeamLeadAssigned: [],
        teamLeadFeedback: ""
    });

    const [dynamicFormData, setDynamicFormData] = useState({});
    const [audioPlaying, setAudioPlaying] = useState(null);

    useEffect(() => {
        if (status === "loading") return;
        if (!session || session.user.role !== "Manager") {
            router.push("/manager/login");
            return;
        }
        fetchForms();
        fetchTeamLeads();
        if (taskId) fetchAdminTask();
    }, [session, status, router, taskId]);

    const fetchForms = async () => {
        try {
            setFetching(true);
            const response = await axios.get(`/api/manager/forms`);
            if (response.status === 200) setForms(response.data || []);
        } catch (error) {
            toast.error("Failed to fetch forms");
        } finally {
            setFetching(false);
        }
    };

    const fetchAdminTask = async () => {
        try {
            const response = await axios.get(`/api/manager/admin-tasks/${taskId}`);
            if (response.status === 200) setAdminTask(response.data.task);
        } catch (error) {
            toast.error("Failed to fetch task details");
        }
    };

    const fetchTeamLeads = async () => {
        try {
            const response = await axios.get(`/api/manager/teamlead`);
            if (response.status === 200) {
                const leads = response.data.teamLeads || [];
                console.log("Fetched Team Leads:", leads);
                setTeamLeads(leads);
            }
        } catch (error) {
            toast.error("Failed to fetch team leads");
        }
    };

    const handleFormSelect = (form) => {
        setSelectedForm(form);
        const initialData = {};
        form.fields.forEach(field => {
            switch (field.type) {
                case 'checkbox':
                case 'toggle':
                    initialData[field.name] = field.checked || false;
                    break;
                case 'range':
                    initialData[field.name] = field.defaultValue || field.min || 0;
                    break;
                case 'rating':
                    initialData[field.name] = field.defaultRating || 0;
                    break;
                case 'file':
                    initialData[field.name] = null;
                    break;
                default:
                    initialData[field.name] = "";
            }
        });
        setDynamicFormData(initialData);
        setFormData({
            assignmentType: "single",
            assignedTo: "",
            multipleTeamLeadAssigned: [],
            teamLeadFeedback: ""
        });
        setShowPasswords({});
        setDragOver({});
    };

    const handleDynamicFieldChange = (fieldName, value) => {
        setDynamicFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const togglePasswordVisibility = (fieldName) => {
        setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
    };

    const handleAssignmentTypeChange = (type) => {
        setFormData({
            ...formData,
            assignmentType: type,
            assignedTo: type === "single" ? formData.assignedTo : "",
            multipleTeamLeadAssigned: type === "multiple" ? formData.multipleTeamLeadAssigned : []
        });
    };

    const handleMultipleTeamLeadToggle = (teamLeadId) => {
        console.log("Toggling team lead:", teamLeadId);
        console.log("Current selected:", formData.multipleTeamLeadAssigned);
        
        setFormData(prev => {
            const isSelected = prev.multipleTeamLeadAssigned.includes(teamLeadId);
            const updated = isSelected
                ? prev.multipleTeamLeadAssigned.filter(id => id !== teamLeadId)
                : [...prev.multipleTeamLeadAssigned, teamLeadId];
            
            console.log("Updated selected:", updated);
            return {
                ...prev,
                multipleTeamLeadAssigned: updated
            };
        });
    };

    const handleFileInputClick = (fieldName) => {
        document.getElementById(`file-input-${fieldName}`)?.click();
    };

    const handleFileChange = (fieldName, files) => {
        handleDynamicFieldChange(fieldName, files);
        toast.success(`${files.length} file(s) selected`);
    };

    const handleDragOver = (e, fieldName) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [fieldName]: true }));
    };

    const handleDragLeave = (e, fieldName) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [fieldName]: false }));
    };

    const handleDrop = (e, fieldName) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [fieldName]: false }));
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileChange(fieldName, files);
    };

    const playAudio = (audioUrl) => {
        if (audioPlaying) {
            const audio = document.getElementById("admin-task-audio");
            if (audio) audio.pause();
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
            case "high": return "bg-red-500 text-white";
            case "medium": return "bg-yellow-500 text-gray-900";
            case "low": return "bg-green-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case "high": return <Zap className="w-3 h-3" />;
            case "medium": return <AlertCircle className="w-3 h-3" />;
            case "low": return <CheckSquare className="w-3 h-3" />;
            default: return null;
        }
    };

    // Filter forms based on search
    const filteredForms = forms.filter(form => 
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.assignmentType === "single" && !formData.assignedTo) {
            toast.error("Please select a team lead");
            setLoading(false);
            return;
        }

        if (formData.assignmentType === "multiple" && formData.multipleTeamLeadAssigned.length === 0) {
            toast.error("Please select at least one team lead");
            setLoading(false);
            return;
        }

        for (const field of selectedForm.fields) {
            if (field.required) {
                const value = dynamicFormData[field.name];
                if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                    toast.error(`Please fill in ${field.label}`);
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            const submitData = {
                formId: selectedForm._id,
                adminTaskId: taskId,
                submittedBy: session.user.id,
                assignmentType: formData.assignmentType,
                assignedTo: formData.assignedTo,
                multipleTeamLeadAssigned: formData.multipleTeamLeadAssigned,
                formData: dynamicFormData,
                departmentId: session.user.depId
            };

            const response = await axios.post("/api/manager/forms", submitData);
            if (response.status === 201) {
                toast.success("Form submitted successfully!");
                router.push('/manager/submissions');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to submit form");
        } finally {
            setLoading(false);
        }
    };

    const renderFormField = (field) => {
        const fieldValue = dynamicFormData[field.name] || "";
        const isDragOver = dragOver[field.name] || false;

        switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "tel":
            case "url":
                return (
                    <Input
                        type={field.type}
                        value={fieldValue}
                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                        required={field.required}
                    />
                );
            case "password":
                return (
                    <div className="relative">
                        <Input
                            type={showPasswords[field.name] ? "text" : "password"}
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                            required={field.required}
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field.name)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                        >
                            {showPasswords[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                );
            case "textarea":
                return (
                    <Textarea
                        value={fieldValue}
                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                        required={field.required}
                        rows={4}
                    />
                );
            case "select":
                return (
                    <select
                        value={fieldValue}
                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required={field.required}
                    >
                        <option value="" className="text-gray-500">Select {field.label.toLowerCase()}</option>
                        {field.options?.map((option, index) => (
                            <option key={index} value={option} className="text-gray-900">{option}</option>
                        ))}
                    </select>
                );
            case "date":
                return (
                    <Input
                        type="date"
                        value={fieldValue}
                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                        required={field.required}
                    />
                );
            case "checkbox":
                return (
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={fieldValue}
                                onChange={(e) => handleDynamicFieldChange(field.name, e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white checked:border-blue-500 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
                                required={field.required}
                            />
                            <Check className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                        <Label className="font-medium text-gray-900 cursor-pointer">{field.label}</Label>
                    </div>
                );
            case "radio":
                return (
                    <div className="space-y-3">
                        {field.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                                <div className="relative">
                                    <input
                                        type="radio"
                                        name={field.name}
                                        value={option}
                                        checked={fieldValue === option}
                                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-gray-300 bg-white checked:border-blue-500 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
                                        required={field.required}
                                    />
                                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                </div>
                                <Label className="font-medium text-gray-900 cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case "range":
                return (
                    <div className="space-y-2">
                        <input
                            type="range"
                            min={field.min || 0}
                            max={field.max || 100}
                            step={field.step || 1}
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            required={field.required}
                        />
                        <div className="flex justify-between text-sm text-gray-700">
                            <span className="font-medium">{field.min || 0}</span>
                            <span className="font-bold text-gray-900">{fieldValue}</span>
                            <span className="font-medium">{field.max || 100}</span>
                        </div>
                    </div>
                );
            case "file":
                const files = fieldValue;
                const fileCount = files ? (field.multiple ? files.length : 1) : 0;
                return (
                    <div className="space-y-3">
                        <Input
                            id={`file-input-${field.name}`}
                            type="file"
                            onChange={(e) => handleFileChange(field.name, e.target.files)}
                            className="hidden"
                            multiple={field.multiple}
                            accept={field.accept}
                            required={field.required && !fileCount}
                        />
                        <div
                            onClick={() => handleFileInputClick(field.name)}
                            onDragOver={(e) => handleDragOver(e, field.name)}
                            onDragLeave={(e) => handleDragLeave(e, field.name)}
                            onDrop={(e) => handleDrop(e, field.name)}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${isDragOver ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
                        >
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-600'}`} />
                            <p className={`text-sm font-semibold ${isDragOver ? 'text-blue-700' : 'text-gray-800'}`}>
                                {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {field.multiple ? 'Multiple files allowed' : 'Single file only'} • {field.accept || 'Any file type'}
                            </p>
                        </div>
                        {fileCount > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-800 font-semibold">
                                    Selected {fileCount} file{fileCount !== 1 ? 's' : ''}:
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {Array.from(files).map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="w-4 h-4 text-gray-700" />
                                                <span className="text-sm text-gray-900 truncate max-w-xs">{file.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-700">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleFileInputClick(field.name)} 
                                    className="text-xs border-blue-500 text-blue-700 hover:bg-blue-50"
                                >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Change Files
                                </Button>
                            </div>
                        )}
                    </div>
                );
            case "rating":
                return (
                    <div className="flex space-x-1">
                        {Array.from({ length: field.maxRating || 5 }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleDynamicFieldChange(field.name, i + 1)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-8 h-8 transition-colors ${i < fieldValue ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                                />
                            </button>
                        ))}
                    </div>
                );
            case "toggle":
                return (
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => handleDynamicFieldChange(field.name, !fieldValue)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldValue ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${fieldValue ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <Label className="font-medium text-gray-900">{fieldValue ? 'Enabled' : 'Disabled'}</Label>
                    </div>
                );
            default:
                return (
                    <Input
                        type="text"
                        value={fieldValue}
                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                        required={field.required}
                    />
                );
        }
    };

    const TeamLeadItem = ({ tl }) => {
        const teamLeadId = tl._id || tl.id;
        const isSelected = formData.multipleTeamLeadAssigned.includes(teamLeadId);
        
        const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            handleMultipleTeamLeadToggle(teamLeadId);
        };

        return (
            <div
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                onClick={handleClick}
            >
                <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarFallback className={`font-medium ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            {tl.name?.charAt(0)?.toUpperCase() || tl.email?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                            {tl.name || tl.email}
                        </div>
                        <div className="text-sm text-gray-700 truncate">
                            {tl.email}
                        </div>
                    </div>
                </div>
                <div 
                    className={`ml-3 h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
                    onClick={handleClick}
                >
                    {isSelected && (
                        <Check className="h-3.5 w-3.5 text-white" />
                    )}
                </div>
            </div>
        );
    };

    if (status === "loading" || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-900">Loading Forms...</p>
                        <p className="text-sm text-gray-700">Please wait while we fetch your data</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Manager") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/manager/admin-tasks')}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="font-medium">Back to Tasks</span>
                        </Button>
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 font-medium">Create Submission</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                Create Form Submission
                            </h1>
                            <p className="text-gray-700 mt-2 max-w-2xl">
                                Fill out a form based on the admin task and assign it to your team leads
                            </p>
                        </div>
                        
                        {selectedForm && (
                            <Badge className="px-4 py-2 bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 font-medium">
                                <FileText className="h-3.5 w-3.5 mr-1.5" />
                                {selectedForm.title}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Task Details */}
                    <div className="space-y-6">
                        <Card className="border border-gray-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                            <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-gray-900">Task Details</CardTitle>
                                            <CardDescription className="text-gray-700">
                                                Reference information for this submission
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {adminTask && (
                                        <Badge className={`${getPriorityColor(adminTask.priority)} px-3 py-1`}>
                                            <div className="flex items-center gap-1.5">
                                                {getPriorityIcon(adminTask.priority)}
                                                <span>Task #{taskId?.slice(-6)}</span>
                                            </div>
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {adminTask ? (
                                    <div className="space-y-6">
                                        {/* Task Overview */}
                                        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl border border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                                                        {adminTask.title}
                                                    </h3>
                                                    <p className="text-gray-800 text-sm leading-relaxed">
                                                        {adminTask.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Building className="h-4 w-4" />
                                                    <span className="font-medium">Client</span>
                                                </div>
                                                <p className="font-semibold text-gray-900">
                                                    {adminTask.clientName || "Not specified"}
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Calendar className="h-4 w-4" />
                                                    <span className="font-medium">Due Date</span>
                                                </div>
                                                <p className="font-semibold text-gray-900">
                                                    {formatDate(adminTask.endDate)}
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-medium">Status</span>
                                                </div>
                                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
                                                    {adminTask.status || 'Assigned'}
                                                </Badge>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="font-medium">Created</span>
                                                </div>
                                                <p className="font-semibold text-gray-900">
                                                    {formatDate(adminTask.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Media Attachments */}
                                        {(adminTask.audioUrl || adminTask.fileAttachments) && (
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-gray-900 text-sm">Attachments</h4>
                                                
                                                {adminTask.audioUrl && (
                                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                                    <Volume2 className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-sm">Voice Instructions</p>
                                                                    <p className="text-xs text-gray-700">Audio recording</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                onClick={() => playAudio(adminTask.audioUrl)}
                                                                variant="outline"
                                                                size="sm"
                                                                className={`gap-2 font-medium ${audioPlaying ? 'bg-purple-50 text-purple-800 border-purple-300' : 'border-gray-300 text-gray-700'}`}
                                                            >
                                                                {audioPlaying ? (
                                                                    <>
                                                                        <Pause className="h-3.5 w-3.5" />
                                                                        Pause
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Play className="h-3.5 w-3.5" />
                                                                        Play
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <audio
                                                            id="admin-task-audio"
                                                            src={adminTask.audioUrl}
                                                            onEnded={() => setAudioPlaying(null)}
                                                            className="hidden"
                                                        />
                                                    </div>
                                                )}
                                                
                                                {adminTask.fileAttachments && (
                                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                                                    <Download className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-sm">File Attachment</p>
                                                                    <p className="text-xs text-gray-700">Supporting document</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                onClick={() => downloadFile(adminTask.fileAttachments, `task_${adminTask.title}_attachment`)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-2 border-green-300 text-green-800 hover:bg-green-50 font-medium"
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-gray-700">No task details available</p>
                                        <p className="text-sm text-gray-600 mt-1">Task ID: {taskId || 'Not specified'}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Forms List - Only shown when no form is selected */}
                        {!selectedForm && (
                            <Card className="border border-gray-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-gray-900">Available Forms</CardTitle>
                                                <CardDescription className="text-gray-700">
                                                    {forms.length} form{forms.length !== 1 ? 's' : ''} found in your department
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-gray-100 text-gray-800 border-gray-300 font-medium">
                                            Select One
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {/* Search Bar */}
                                    <div className="mb-6">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                            <Input
                                                type="text"
                                                placeholder="Search forms by title or description..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 text-gray-900 bg-white border-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {filteredForms.map((form, index) => (
                                            <div
                                                key={form._id}
                                                className="group relative"
                                            >
                                                <Card 
                                                    className="border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white overflow-hidden"
                                                    onClick={() => handleFormSelect(form)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                                                        <FileText className="h-5 w-5 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="font-bold text-gray-900 truncate">
                                                                                {form.title}
                                                                            </h4>
                                                                            <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-xs font-medium">
                                                                                {form.fields.length} fields
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                                                                            {form.description}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {form.fields.slice(0, 3).map((field, idx) => (
                                                                                <Badge 
                                                                                    key={idx} 
                                                                                    variant="outline" 
                                                                                    className="text-xs bg-gray-50 text-gray-800 border-gray-300 font-medium"
                                                                                >
                                                                                    {field.label}
                                                                                </Badge>
                                                                            ))}
                                                                            {form.fields.length > 3 && (
                                                                                <Badge 
                                                                                    variant="outline" 
                                                                                    className="text-xs bg-gray-50 text-gray-800 border-gray-300 font-medium"
                                                                                >
                                                                                    +{form.fields.length - 3} more
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <div className="flex items-center gap-1.5 text-gray-700">
                                                                        <Calendar className="h-3.5 w-3.5" />
                                                                        Created {formatDate(form.createdAt)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-blue-700 group-hover:gap-2 transition-all duration-200 font-medium">
                                                                        <span>Select Form</span>
                                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ))}
                                        
                                        {filteredForms.length === 0 && (
                                            <div className="text-center py-8">
                                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                                <p className="text-gray-700">No forms found</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {searchQuery ? "Try a different search term" : "Contact your administrator to create forms"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Form & Assignment */}
                    <div className="space-y-6">
                        {/* Selected Form */}
                        {selectedForm ? (
                            <>
                                <Card className="border border-gray-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                                    <Send className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-gray-900">Form Submission</CardTitle>
                                                    <CardDescription className="text-gray-700">
                                                        Fill out the form and assign to team leads
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setSelectedForm(null)}
                                                size="sm"
                                                className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                                            >
                                                Change Form
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Form Header */}
                                            <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                        <FileText className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg">{selectedForm.title}</h3>
                                                        <p className="text-gray-700 text-sm mt-1">{selectedForm.description}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Fields */}
                                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                                                {selectedForm.fields.map((field, index) => (
                                                    <div key={field.name} className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-gray-900 font-semibold text-sm">
                                                                {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                                                            </Label>
                                                            {field.placeholder && (
                                                                <span className="text-xs text-gray-700 italic">
                                                                    {field.placeholder}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow transition-shadow duration-200">
                                                            {renderFormField(field)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Assignment Section */}
                                            <div className="space-y-6 pt-4 border-t border-gray-200">
                                                <div>
                                                    <Label className="text-gray-900 font-semibold text-sm mb-3 block">
                                                        Assignment Configuration
                                                    </Label>
                                                    
                                                    {/* Assignment Type Selection */}
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div
                                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.assignmentType === 'single' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                                                            onClick={() => handleAssignmentTypeChange('single')}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.assignmentType === 'single' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                                                    {formData.assignmentType === 'single' && (
                                                                        <div className="h-2 w-2 rounded-full bg-white"></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <User className="h-4 w-4 text-gray-700" />
                                                                        <span className="font-semibold text-gray-900">Single Assignment</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-700">
                                                                        Assign this form to one team lead
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div
                                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.assignmentType === 'multiple' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                                                            onClick={() => handleAssignmentTypeChange('multiple')}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.assignmentType === 'multiple' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                                                    {formData.assignmentType === 'multiple' && (
                                                                        <div className="h-2 w-2 rounded-full bg-white"></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Users className="h-4 w-4 text-gray-700" />
                                                                        <span className="font-semibold text-gray-900">Multiple Assignment</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-700">
                                                                        Assign this form to multiple team leads
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Team Lead Selection */}
                                                    <div className="space-y-4">
                                                        {formData.assignmentType === 'single' ? (
                                                            <div className="space-y-3">
                                                                <Label className="text-gray-900 font-semibold text-sm">
                                                                    Select Team Lead <span className="text-red-500">*</span>
                                                                </Label>
                                                                <select
                                                                    value={formData.assignedTo}
                                                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                                                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 appearance-none font-medium"
                                                                    required
                                                                >
                                                                    <option value="" className="text-gray-700">Choose a team lead...</option>
                                                                    {teamLeads.map((tl) => {
                                                                        const teamLeadId = tl._id || tl.id;
                                                                        return (
                                                                            <option key={teamLeadId} value={teamLeadId} className="text-gray-900">
                                                                                {tl.name || tl.email} ({tl.email})
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </select>
                                                                <p className="text-xs text-gray-700">
                                                                    This form will be assigned to the selected team lead only.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-gray-900 font-semibold text-sm">
                                                                        Select Team Leads <span className="text-red-500">*</span>
                                                                    </Label>
                                                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
                                                                        {formData.multipleTeamLeadAssigned.length} selected
                                                                    </Badge>
                                                                </div>
                                                                
                                                                <div className="space-y-3 max-h-64 overflow-y-auto p-2">
                                                                    {teamLeads.length > 0 ? (
                                                                        teamLeads.map((tl) => (
                                                                            <TeamLeadItem key={tl._id || tl.id} tl={tl} />
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-center py-4 text-gray-700">
                                                                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                                            <p className="font-medium">No team leads available</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                <p className="text-xs text-gray-700">
                                                                    Select one or more team leads to assign this form. Each selected lead will receive the form.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Submit Button */}
                                            <div className="pt-6 border-t border-gray-200">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <Button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 py-3 px-6 font-semibold"
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Processing Submission...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="h-4 w-4 mr-2" />
                                                                {formData.assignmentType === 'multiple' 
                                                                    ? `Assign to ${formData.multipleTeamLeadAssigned.length} Team Lead${formData.multipleTeamLeadAssigned.length !== 1 ? 's' : ''}` 
                                                                    : 'Submit Form'
                                                                }
                                                            </>
                                                        )}
                                                    </Button>
                                                    
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => router.push('/manager/admin-tasks')}
                                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6 font-medium"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                                
                                                <p className="text-xs text-gray-700 mt-3 text-center">
                                                    By submitting, you confirm that all information is accurate and complete.
                                                </p>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            /* Placeholder when no form is selected */
                            <Card className="border border-gray-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
                                            <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-gray-900">Form Selection Required</CardTitle>
                                            <CardDescription className="text-gray-700">
                                                Select a form from the list to begin submission
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="text-center py-8">
                                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Form Selected</h3>
                                        <p className="text-gray-700 mb-6 max-w-md mx-auto">
                                            Choose a form from the list on the left to fill out and submit for this task.
                                        </p>
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-700 font-medium">
                                            <ArrowLeft className="h-4 w-4" />
                                            <span>Select a form from the list</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}