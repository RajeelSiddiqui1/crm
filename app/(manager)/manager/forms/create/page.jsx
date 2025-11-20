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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    MapPin,
    CreditCard,
    Phone,
    Link,
    CheckSquare,
    Radio,
    SlidersHorizontal,
    ToggleLeft,
    Mail,
    Lock,
    Hash,
    List,
    Play,
    Pause,
    Download,
    Volume2,
    ArrowLeft,
    Plus,
    Clock,
    Building,
    User
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

    const [formData, setFormData] = useState({
        assignedTo: "",
    });

    const [dynamicFormData, setDynamicFormData] = useState({});
    const [showPasswords, setShowPasswords] = useState({});
    const [audioPlaying, setAudioPlaying] = useState(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Manager") {
            router.push("/manager/login");
            return;
        }

        fetchForms();
        fetchTeamLeads();
        if (taskId) {
            fetchAdminTask();
        }
    }, [session, status, router, taskId]);

    const fetchForms = async () => {
        try {
            setFetching(true);
            const response = await axios.get(`/api/manager/forms`);
            if (response.status === 200) {
                setForms(response.data || []);
            }
        } catch (error) {
            console.error("Error fetching forms:", error);
            toast.error("Failed to fetch forms");
        } finally {
            setFetching(false);
        }
    };

    const fetchAdminTask = async () => {
        try {
            const response = await axios.get(`/api/manager/admin-tasks/${taskId}`);
            if (response.status === 200) {
                setAdminTask(response.data.task);
            }
        } catch (error) {
            console.error("Error fetching admin task:", error);
            toast.error("Failed to fetch task details");
        }
    };

    const fetchTeamLeads = async () => {
        try {
            const response = await axios.get(`/api/manager/teamlead`);
            if (response.status === 200) {
                setTeamLeads(response.data.teamLeads || []);
            }
        } catch (error) {
            console.error("Error fetching team leads:", error);
            toast.error("Failed to fetch team leads");
        }
    };

    const handleFormSelect = (form) => {
        setSelectedForm(form);
        // Initialize dynamic form data
        const initialData = {};
        form.fields.forEach(field => {
            switch (field.type) {
                case 'checkbox':
                    initialData[field.name] = field.checked || false;
                    break;
                case 'toggle':
                    initialData[field.name] = field.checked || false;
                    break;
                case 'range':
                    initialData[field.name] = field.defaultValue || field.min || 0;
                    break;
                case 'rating':
                    initialData[field.name] = field.defaultRating || 0;
                    break;
                default:
                    initialData[field.name] = "";
            }
        });
        setDynamicFormData(initialData);
        setShowPasswords({});
    };

    const handleDynamicFieldChange = (fieldName, value) => {
        setDynamicFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const togglePasswordVisibility = (fieldName) => {
        setShowPasswords(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.assignedTo) {
            toast.error("Please select a team lead");
            setLoading(false);
            return;
        }

        // Validate required fields
        for (const field of selectedForm.fields) {
            if (field.required) {
                const value = dynamicFormData[field.name];
                if (value === undefined || value === null || value === "" ||
                    (Array.isArray(value) && value.length === 0)) {
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
                assignedTo: formData.assignedTo,
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
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
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
                            className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900 pr-10"
                            required={field.required}
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field.name)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
                        required={field.required}
                        rows={4}
                    />
                );
            case "select":
                return (
                    <Select
                        value={fieldValue}
                        onValueChange={(value) => handleDynamicFieldChange(field.name, value)}
                    >
                        <SelectTrigger className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900">
                            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option, index) => (
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
                        value={fieldValue}
                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
                        required={field.required}
                    />
                );
            case "checkbox":
                return (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.checked)}
                            className="rounded border-gray-300 bg-white w-4 h-4 text-gray-800 focus:ring-gray-800"
                            required={field.required}
                        />
                        <Label className="text-gray-800 font-medium">{field.label}</Label>
                    </div>
                );
            case "radio":
                return (
                    <div className="space-y-2">
                        {field.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name={field.name}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                                    className="rounded-full border-gray-300 bg-white w-4 h-4 text-gray-800 focus:ring-gray-800"
                                    required={field.required}
                                />
                                <Label className="text-gray-800 font-medium">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            default:
                return (
                    <Input
                        type="text"
                        value={fieldValue}
                        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="focus:border-gray-800 focus:ring-2 focus:ring-gray-200 border-gray-300 text-gray-900"
                        required={field.required}
                    />
                );
        }
    };

    if (status === "loading" || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <div className="w-8 h-8 animate-spin rounded-full border-4 border-gray-800 border-t-transparent"></div>
                    <span className="text-gray-800 text-lg font-medium">
                        Loading...
                    </span>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Manager") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/manager/admin-tasks')}
                        className="rounded-lg border-gray-300 bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Tasks
                    </Button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Create Form Submission
                        </h1>
                        <p className="text-gray-700 mt-2 text-base font-medium">
                            Select a form and submit based on Admin Task
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Side - Admin Task Details */}
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
                                        Task details for this form submission
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {adminTask ? (
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
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-700 font-medium">No admin task reference found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Side - Form Selection and Submission */}
                    <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-gray-200">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                                    {selectedForm ? <Send className="w-5 h-5 text-white" /> : <List className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                    <CardTitle className="text-gray-900 text-xl font-bold">
                                        {selectedForm ? 'Submit Form' : 'Select Form'}
                                    </CardTitle>
                                    <CardDescription className="text-gray-700 font-medium">
                                        {selectedForm 
                                            ? 'Fill out the form and assign to a team lead'
                                            : 'Choose a form to submit for this task'
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!selectedForm ? (
                                // Form Selection
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900">Available Forms</h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {forms.map((form) => (
                                            <Card 
                                                key={form._id} 
                                                className="cursor-pointer bg-white border-gray-200 hover:border-gray-800 hover:shadow-lg transition-all duration-200 group shadow-sm"
                                                onClick={() => handleFormSelect(form)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                                                    <FileText className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                                                                        {form.title}
                                                                    </h4>
                                                                    <p className="text-gray-700 text-sm mt-1 line-clamp-2 font-medium">
                                                                        {form.description}
                                                                    </p>
                                                                    <div className="flex gap-2 mt-2">
                                                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300 font-medium">
                                                                            {form.fields.length} fields
                                                                        </Badge>
                                                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 font-medium">
                                                                            Active
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Plus className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform duration-200" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // Form Submission
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Form Header */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{selectedForm.title}</h3>
                                                <p className="text-gray-700 text-sm font-medium">{selectedForm.description}</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setSelectedForm(null)}
                                            className="border-gray-800 text-gray-800 bg-white hover:bg-gray-800 hover:text-white font-medium"
                                        >
                                            Change Form
                                        </Button>
                                    </div>

                                    {/* Dynamic Form Fields */}
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {selectedForm.fields.map((field, index) => (
                                            <div key={field.name} className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white">
                                                <Label htmlFor={field.name} className="text-gray-900 font-bold flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                                                    {field.label} {field.required && <span className="text-red-600">*</span>}
                                                </Label>
                                                {renderFormField(field)}
                                                {field.placeholder && (
                                                    <p className="text-xs text-gray-600 mt-1 font-medium">{field.placeholder}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Team Lead Assignment */}
                                    <div className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white">
                                        <Label htmlFor="assignedTo" className="text-gray-900 font-bold flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-700" />
                                            Assign to Team Lead *
                                        </Label>
                                        <div className="relative">
                                            <select
                                                id="assignedTo"
                                                value={formData.assignedTo}
                                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-gray-800 focus:ring-2 focus:ring-gray-200 bg-white text-gray-900 transition-all duration-200 shadow-sm appearance-none font-medium"
                                                required
                                            >
                                                <option value="" className="text-gray-500">Select a team lead</option>
                                                {teamLeads.map((tl) => (
                                                    <option key={tl.id} value={tl.id} className="text-gray-900">
                                                        {tl.name} - {tl.email}
                                                    </option>
                                                ))}
                                            </select>
                                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-200 pt-6">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white px-8 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50 flex-1 font-bold"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            {loading ? "Submitting..." : "Submit Form"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push('/manager/admin-tasks')}
                                            className="border-gray-800 text-gray-800 bg-white hover:bg-gray-800 hover:text-white px-6 py-2.5 transition-all duration-200 shadow-sm font-medium"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}