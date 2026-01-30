"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, ArrowLeft, FileText, CheckCircle, ClipboardList, Users, 
  Calendar, Eye, Clock, AlertCircle, RefreshCw, Target, Filter, 
  Timer, CalendarDays, Upload, X, Paperclip, FileIcon, 
  Download, Search, BarChart3, Shield, Sparkles, Zap,
  ChevronRight, Star, Trophy, TrendingUp, CheckSquare,
  Image, Video, ExternalLink, Copy, Table, File, Play,
  Maximize2, Minimize2, RotateCw, FileSpreadsheet, FileCode,
  Music, Archive, MessageSquare, FileJson, FileArchive
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function EmployeeSubmissionForm() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const subtaskId = params.id;
    const fileInputRef = useRef(null);

    const [availableForms, setAvailableForms] = useState([]);
    const [completedForms, setCompletedForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [formData, setFormData] = useState({});
    const [files, setFiles] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [subtaskDetails, setSubtaskDetails] = useState(null);
    const [existingSubmissions, setExistingSubmissions] = useState([]);
    const [viewMode, setViewMode] = useState(false);
    const [activeTab, setActiveTab] = useState("available");
    const [filter, setFilter] = useState("all");
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState("");
    const [distinctAvailableForms, setDistinctAvailableForms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [showUploadProgress, setShowUploadProgress] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [stats, setStats] = useState({
        totalSubmissions: 0,
        approvalRate: 0,
        avgResponseTime: 0,
        streak: 0
    });
    const [zoom, setZoom] = useState(1);
    const [previewFile, setPreviewFile] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && previewFile) {
                setPreviewFile(null);
                setFullscreen(false);
            }
            if (e.key === 'f' && previewFile && e.ctrlKey) {
                e.preventDefault();
                setFullscreen(!fullscreen);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewFile, fullscreen]);

    useEffect(() => {
        if (status === "loading") return;
        if (!session || session.user.role !== "Employee") {
            router.push("/employeelogin");
            return;
        }
        fetchAllData();
        
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: true 
            }));
        };
        
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [session, status, router, subtaskId]);

    useEffect(() => {
        if (activeTab === "completed") {
            fetchCompletedForms();
        }
    }, [filter, activeTab]);

    useEffect(() => {
        if (availableForms.length > 0) {
            const uniqueFormsMap = new Map();
            availableForms.forEach(form => {
                if (!uniqueFormsMap.has(form._id)) {
                    uniqueFormsMap.set(form._id, form);
                }
            });
            setDistinctAvailableForms(Array.from(uniqueFormsMap.values()));
        } else {
            setDistinctAvailableForms([]);
        }
    }, [availableForms]);

    const fetchAllData = async () => {
        setFetching(true);
        try {
            await Promise.all([
                fetchAvailableForms(),
                fetchCompletedForms(),
                fetchSubtaskDetails(),
                fetchExistingSubmissions(),
                fetchEmployeeStats()
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setFetching(false);
        }
    };

    const fetchAvailableForms = async () => {
        try {
            setError(null);
            const response = await axios.get(`/api/employee/available-forms?subtaskId=${subtaskId}`);
            if (response.status === 200) {
                setAvailableForms(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error("Error fetching available forms:", error);
            setError(error.response?.data?.error || "Failed to load available forms");
            setAvailableForms([]);
        }
    };

 const fetchCompletedForms = async () => {
    try {
        const response = await axios.get(`/api/employee/completed-forms?subtaskId=${subtaskId}&filter=${filter}`);
        console.log("Completed forms API response:", response); // Debug
        
        if (response.status === 200) {
            const forms = Array.isArray(response.data) ? response.data : [];
            console.log("Fetched completed forms:", forms); // Debug log
            
            // Check if forms have fileAttachments
            forms.forEach((form, index) => {
                console.log(`Form ${index}:`, {
                    title: form.title,
                    hasFileAttachments: !!form.fileAttachments,
                    fileCount: form.fileAttachments?.length || 0,
                    fileAttachments: form.fileAttachments
                });
            });
            
            setCompletedForms(forms);
        }
    } catch (error) {
        console.error("Error fetching completed forms:", error);
        setCompletedForms([]);
    }
};

    const fetchSubtaskDetails = async () => {
        try {
            const response = await axios.get(`/api/employee/subtasks/${subtaskId}`);
            if (response.status === 200) {
                setSubtaskDetails(response.data);
            }
        } catch (error) {
            console.error("Error fetching subtask details:", error);
            toast.error("Failed to load task details");
        }
    };

    const fetchExistingSubmissions = async () => {
        try {
            const response = await axios.get(`/api/employee/completed-forms?subtaskId=${subtaskId}&filter=all`);
            if (response.status === 200) {
                setExistingSubmissions(response.data);
            }
        } catch (error) {
            console.error("Error fetching existing submissions:", error);
            setExistingSubmissions([]);
        }
    };

    const fetchEmployeeStats = async () => {
        try {
            const response = await axios.get(`/api/employee/stats?employeeId=${session?.user?.id}`);
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.log("Could not fetch employee stats, using defaults");
        }
    };

    const getProgressInfo = () => {
        if (!subtaskDetails?.lead) return { completed: 0, required: 1, remaining: 1, progress: 0 };
        const required = parseInt(subtaskDetails.lead) || 1;
        const approvedByLead = existingSubmissions.filter(
            submission => submission.teamleadstatus === "approved"
        );
        const completed = approvedByLead.length;
        const remaining = Math.max(0, required - completed);
        const progress = required > 0 ? (completed / required) * 100 : 0;
        return { completed, required, remaining, progress };
    };

const handleFormSelect = (formId, isCompleted = false) => {
    console.log("Selecting form:", { formId, isCompleted, completedForms, availableForms }); // Debug log
    
    let form;
    if (isCompleted) {
        // Look for form by formId (not submissionId)
        form = completedForms.find(f => {
            // Try to match by form _id OR by submissionId
            return f._id === formId || f.submissionId === formId;
        });
        console.log("Found completed form:", form); // Debug log
        
        if (form) {
            setSelectedForm(form);
            setFormData(form.formData || {});
            setFiles([]);
            setSubmitted(false);
            setViewMode(true);
            
            // Debug log for attachments
            console.log("Form attachments:", form.fileAttachments);
            return;
        }
    } else {
        form = distinctAvailableForms.find(f => f._id === formId);
        if (form) {
            setSelectedForm(form);
            setFormData({});
            setFiles([]);
            setSubmitted(false);
            setViewMode(false);
            return;
        }
    }
    
    // If no form found
    console.error("Form not found:", formId);
    toast.error("Form not found or no longer available");
};

    // File Handling
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            handleFiles(droppedFiles);
        }
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
    };

    const handleFiles = (selectedFiles) => {
        const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);
       
        
        const validFiles = selectedFiles.filter(file => {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();
            
            // Check for valid file types
            const validTypes = [
                'image/', 'video/', 'audio/', 'application/pdf',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/', 'application/json', 'application/zip', 'application/x-rar-compressed'
            ];
            
            const isValid = validTypes.some(type => fileType.includes(type)) || 
                          fileName.endsWith('.pdf') || 
                          fileName.endsWith('.doc') || 
                          fileName.endsWith('.docx') ||
                          fileName.endsWith('.xls') || 
                          fileName.endsWith('.xlsx') ||
                          fileName.endsWith('.ppt') || 
                          fileName.endsWith('.pptx');
            
            if (!isValid) {
                toast.error(`File type not supported: ${file.name}`);
            }
            
            return isValid;
        });
        
        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            toast.success(`Added ${validFiles.length} file(s)`);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const downloadFile = (file) => {
        const link = document.createElement('a');
        link.href = file.url || URL.createObjectURL(file);
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType, fileName = '') => {
        const name = fileName.toLowerCase();
        
        if (fileType?.includes('image/')) return <Image className="w-5 h-5 text-green-500" />;
        if (fileType?.includes('video/')) return <Video className="w-5 h-5 text-purple-500" />;
        if (fileType?.includes('audio/') || name.endsWith('.mp3') || name.endsWith('.wav')) 
            return <Music className="w-5 h-5 text-pink-500" />;
        if (fileType?.includes('pdf') || name.endsWith('.pdf')) 
            return <FileText className="w-5 h-5 text-red-500" />;
        if (fileType?.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) 
            return <FileText className="w-5 h-5 text-blue-500" />;
        if (fileType?.includes('excel') || fileType?.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) 
            return <Table className="w-5 h-5 text-green-600" />;
        if (fileType?.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) 
            return <FileSpreadsheet className="w-5 h-5 text-orange-500" />;
        if (fileType?.includes('text/') || name.endsWith('.txt')) 
            return <FileText className="w-5 h-5 text-gray-500" />;
        if (fileType?.includes('json') || name.endsWith('.json')) 
            return <FileJson className="w-5 h-5 text-yellow-500" />;
        if (fileType?.includes('zip') || fileType?.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) 
            return <Archive className="w-5 h-5 text-gray-600" />;
        if (name.endsWith('.csv')) 
            return <Table className="w-5 h-5 text-teal-500" />;
        return <File className="w-5 h-5 text-gray-500" />;
    };

    const getFileTypeColor = (fileType, fileName = '') => {
        const name = fileName.toLowerCase();
        
        if (fileType?.includes('image/')) return 'from-green-100 to-emerald-100 text-green-700';
        if (fileType?.includes('video/')) return 'from-purple-100 to-pink-100 text-purple-700';
        if (fileType?.includes('audio/')) return 'from-pink-100 to-rose-100 text-pink-700';
        if (fileType?.includes('pdf') || name.endsWith('.pdf')) 
            return 'from-red-100 to-orange-100 text-red-700';
        if (fileType?.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) 
            return 'from-blue-100 to-cyan-100 text-blue-700';
        if (fileType?.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) 
            return 'from-green-100 to-lime-100 text-green-700';
        if (fileType?.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) 
            return 'from-orange-100 to-amber-100 text-orange-700';
        if (name.endsWith('.csv')) return 'from-teal-100 to-emerald-100 text-teal-700';
        if (fileType?.includes('json') || name.endsWith('.json')) 
            return 'from-yellow-100 to-amber-100 text-yellow-700';
        if (fileType?.includes('zip') || name.endsWith('.zip') || name.endsWith('.rar')) 
            return 'from-gray-100 to-slate-100 text-gray-700';
        return 'from-blue-100 to-purple-100 text-blue-700';
    };

    const handleInputChange = (fieldName, value) => {
        if (viewMode) return;
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleArrayInputChange = (fieldName, value, isChecked) => {
        if (viewMode) return;
        setFormData(prev => {
            const currentArray = prev[fieldName] || [];
            let newArray;
            if (isChecked) {
                newArray = [...currentArray, value];
            } else {
                newArray = currentArray.filter(item => item !== value);
            }
            return {
                ...prev,
                [fieldName]: newArray
            };
        });
    };

    const validateForm = () => {
        if (!selectedForm) {
            toast.error("Please select a form first");
            return false;
        }
        if (!selectedForm.fields || !Array.isArray(selectedForm.fields)) {
            toast.error("Form configuration error: No fields found");
            return false;
        }
        for (const field of selectedForm.fields) {
            if (field.required) {
                const value = formData[field.name];
                if (value === undefined || value === null || value === "" || 
                    (Array.isArray(value) && value.length === 0)) {
                    toast.error(`Please fill in "${field.label}"`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        const progress = getProgressInfo();
        if (progress.completed >= progress.required) {
            toast.error(`You have already completed ${progress.required} forms. No more submissions allowed.`);
            return;
        }
        
        setSubmitting(true);
        setUploading(true);
        setShowUploadProgress(true);
        
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("formId", selectedForm._id);
            formDataToSend.append("subtaskId", subtaskId);
            formDataToSend.append("formData", JSON.stringify(formData));
            
            // Add files
            files.forEach((file, index) => {
                formDataToSend.append("files", file);
                setUploadProgress(prev => ({
                    ...prev,
                    [index]: 0
                }));
            });
            
            // Simulate upload progress
            const totalFiles = files.length;
            let completedFiles = 0;
            
            const progressInterval = setInterval(() => {
                if (completedFiles < totalFiles) {
                    setUploadProgress(prev => {
                        const newProgress = { ...prev };
                        Object.keys(newProgress).forEach(key => {
                            if (newProgress[key] < 100) {
                                newProgress[key] = Math.min(newProgress[key] + 10, 100);
                                if (newProgress[key] === 100) {
                                    completedFiles++;
                                }
                            }
                        });
                        return newProgress;
                    });
                } else {
                    clearInterval(progressInterval);
                }
            }, 200);
            
            const response = await axios.post("/api/employee/submission", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            
            clearInterval(progressInterval);
            
            if (response.status === 201) {
                toast.success("Form submitted successfully!");
                setSubmitted(true);
                setFiles([]);
                setUploadProgress({});
                setShowUploadProgress(false);
                await fetchAllData();
                
                const newProgress = getProgressInfo();
                if (newProgress.remaining === 0) {
                    toast.success("🎉 Congratulations! You have completed all required forms!");
                }
            }
        } catch (error) {
            console.error("Form submission error:", error.response?.data);
            toast.error(error.response?.data?.error || "Failed to submit form");
        } finally {
            setSubmitting(false);
            setUploading(false);
            setShowUploadProgress(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "rejected":
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-600" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "approved":
                return "Approved";
            case "rejected":
                return "Rejected";
            default:
                return "Pending Review";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200";
            case "rejected":
                return "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200";
            default:
                return "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200";
        }
    };

    const filteredAvailableForms = distinctAvailableForms.filter(form =>
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCompletedForms = completedForms.filter(form =>
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderField = (field) => {
        const fieldValue = formData[field.name] || "";
        const isReadOnly = viewMode;
        
        switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "date":
                return (
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={fieldValue}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            required={field.required}
                            min={field.min}
                            max={field.max}
                            readOnly={isReadOnly}
                            className={`relative mt-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        />
                        {field.type === "date" && (
                            <CalendarDays className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                        )}
                    </div>
                );
            case "time":
                return (
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative">
                            <Input
                                id={field.name}
                                type="time"
                                placeholder={field.placeholder || "Select time"}
                                value={fieldValue}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                required={field.required}
                                readOnly={isReadOnly}
                                className={`bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                            />
                            <Clock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                Current time: <span className="font-bold">{currentTime}</span>
                            </span>
                            {!isReadOnly && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const now = new Date();
                                        const timeString = now.toTimeString().slice(0,5);
                                        handleInputChange(field.name, timeString);
                                    }}
                                    className="border-blue-200 hover:bg-blue-50 text-blue-600"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Use Current
                                </Button>
                            )}
                        </div>
                    </div>
                );
            case "textarea":
                return (
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <Textarea
                            id={field.name}
                            placeholder={field.placeholder}
                            value={fieldValue}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            required={field.required}
                            readOnly={isReadOnly}
                            className={`relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all rounded-xl min-h-[120px] text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        />
                    </div>
                );
            case "select":
                return (
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <Select
                            value={fieldValue}
                            onValueChange={(value) => handleInputChange(field.name, value)}
                            disabled={isReadOnly}
                        >
                            <SelectTrigger className={`relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}>
                                <SelectValue placeholder={`Select ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                                {field.options?.map((option, index) => (
                                    <SelectItem key={index} value={option} className="p-3 hover:bg-blue-50 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            {option}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case "radio":
                return (
                    <RadioGroup
                        value={fieldValue}
                        onValueChange={(value) => handleInputChange(field.name, value)}
                        className="mt-2 space-y-3"
                        disabled={isReadOnly}
                    >
                        {field.options?.map((option, index) => (
                            <div key={index} className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <div className={`relative flex items-center space-x-4 p-4 rounded-xl border-2 ${isReadOnly ? "bg-gray-50 border-gray-300" : "bg-white/90 backdrop-blur-sm border-gray-200 hover:border-blue-300"} transition-all`}>
                                    <RadioGroupItem 
                                        value={option} 
                                        id={`${field.name}-${index}`} 
                                        className="text-blue-600 h-6 w-6 border-2 border-gray-300"
                                        disabled={isReadOnly}
                                    />
                                    <Label htmlFor={`${field.name}-${index}`} className="font-medium text-black text-lg cursor-pointer flex-1">
                                        {option}
                                    </Label>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case "checkbox":
                return (
                    <div className="space-y-3 mt-2">
                        {field.options?.map((option, index) => (
                            <div key={index} className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <div className={`relative flex items-center space-x-4 p-4 rounded-xl border-2 ${isReadOnly ? "bg-gray-50 border-gray-300" : "bg-white/90 backdrop-blur-sm border-gray-200 hover:border-blue-300"} transition-all`}>
                                    <Checkbox
                                        id={`${field.name}-${index}`}
                                        checked={Array.isArray(formData[field.name]) && formData[field.name].includes(option)}
                                        onCheckedChange={(checked) => 
                                            handleArrayInputChange(field.name, option, checked)
                                        }
                                        className="text-blue-600 h-6 w-6 border-2 border-gray-300 data-[state=checked]:bg-blue-600"
                                        disabled={isReadOnly}
                                    />
                                    <Label htmlFor={`${field.name}-${index}`} className="font-medium text-black text-lg cursor-pointer flex-1">
                                        {option}
                                    </Label>
                                    <CheckSquare className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return (
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <Input
                            id={field.name}
                            type="text"
                            placeholder={field.placeholder}
                            value={fieldValue}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            required={field.required}
                            readOnly={isReadOnly}
                            className={`relative mt-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        />
                    </div>
                );
        }
    };

    const renderFileUpload = () => (
        <div className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all shadow-lg hover:shadow-xl">
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`text-center p-8 rounded-xl transition-all duration-300 ${dragActive ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-400' : 'bg-gradient-to-br from-gray-50 to-blue-50/50'}`}
            >
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Upload className="w-10 h-10 text-blue-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-black mb-3">
                    {files.length > 0 ? `${files.length} File(s) Selected` : "Upload Supporting Files"}
                </h3>
                
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Drag & drop files here or click to browse. Max 50MB total.
                    Supports images, documents, PDFs, videos, audio, and archives.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <FileIcon className="w-5 h-5 mr-2" />
                        Browse Files
                    </Button>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={viewMode || uploading}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip,.rar"
                    />
                    
                    {files.length > 0 && !viewMode && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFiles([])}
                            className="border-red-200 text-red-600 hover:bg-red-50 px-8 py-3 rounded-xl"
                        >
                            <X className="w-5 h-5 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>
                
                {showUploadProgress && uploading && (
                    <div className="mt-8 space-y-4">
                        <div className="text-left">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                                <span className="text-sm font-bold text-blue-600">
                                    {Object.values(uploadProgress).filter(p => p === 100).length}/{files.length} complete
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / (files.length * 100)) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
                
                {files.length > 0 && (
                    <div className="mt-8 space-y-3">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all group">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                                        {getFileIcon(file.type, file.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-black truncate">{file.name}</p>
                                        <p className="text-sm text-gray-500">{formatFileSize(file.size)} • {file.type || 'Unknown type'}</p>
                                        {showUploadProgress && uploading && uploadProgress[index] !== undefined && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div 
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress[index]}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!viewMode && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFile(index)}
                                            className="h-10 w-10 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            disabled={uploading}
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => downloadFile(file)}
                                        className="h-10 w-10 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Download className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderAttachments = () => {
        if (!viewMode || !selectedForm?.fileAttachments) return null;
        
        const attachments = selectedForm.fileAttachments;
        console.log("Rendering attachments:", attachments); // Debug log
        
        return (
            <div className="mt-10 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 shadow-xl">
                <h3 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                    <Paperclip className="w-6 h-6 text-blue-600" />
                    Attached Files ({attachments.length})
                </h3>
                
                {attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {attachments.map((file, index) => {
                            const colorClass = getFileTypeColor(file.type, file.name);
                            const icon = getFileIcon(file.type, file.name);
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all bg-gradient-to-br ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} hover:shadow-lg transform hover:-translate-y-1`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                                            {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-black truncate mb-1">{file.name}</p>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-bold ${colorClass.split(' ')[2]}`}>
                                                    {formatFileSize(file.size)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {file.type?.split('/')[1] || 'file'}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                Uploaded: {new Date(file.createdAt || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                            onClick={() => setPreviewFile(file)}
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Preview
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                                            onClick={() => window.open(file.url, '_blank')}
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Open
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => downloadFile(file)}
                                        >
                                            <Download className="w-3 h-3 mr-1" />
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg">No files attached to this submission</p>
                        <p className="text-sm mt-2">Files can be added when submitting the form</p>
                    </div>
                )}
            </div>
        );
    };

    const progressInfo = getProgressInfo();

    if (status === "loading" || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <ClipboardList className="w-12 h-12 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-3">
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                            Preparing Your Workspace
                        </h3>
                        <p className="text-gray-700 max-w-md">Loading forms, task details, and analytics...</p>
                        <div className="flex items-center gap-3 justify-center mt-6">
                            <div className="flex space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <span className="text-blue-600 font-medium">Fetching data</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Employee") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50">
                <div className="text-center p-12 bg-white rounded-3xl shadow-2xl border-2 border-red-200 max-w-md transform hover:scale-[1.02] transition-all">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <Shield className="w-12 h-12 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent mb-4">
                        Access Restricted
                    </h2>
                    <p className="text-gray-700 mb-10 text-lg">Employee authorization required to access this portal.</p>
                    <Link href="/employeelogin">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-lg rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all w-full">
                            <Sparkles className="w-5 h-5 mr-3" />
                            Sign In as Employee
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
            <Toaster position="top-right" richColors />
            
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4 flex-1">
                        <Link href="/employee/subtasks">
                            <Button variant="outline" size="icon" className="rounded-2xl border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all h-14 w-14 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm">
                                <ArrowLeft className="w-7 h-7 text-black" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                                    <ClipboardList className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-black bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">
                                    Submission Portal
                                </h1>
                            </div>
                            <p className="text-gray-700 text-lg flex items-center gap-4">
                                <span className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span className="font-bold text-blue-700">{currentTime}</span>
                                </span>
                                Complete forms for your assigned tasks
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-gray-900 to-black text-white px-6 py-3 rounded-2xl shadow-2xl">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold">{stats.streak} Day Streak</span>
                        </div>
                        
                        <Button 
                            onClick={fetchAllData} 
                            disabled={fetching}
                            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-7 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                        >
                            <RefreshCw className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
                            {fetching ? 'Refreshing...' : 'Refresh Data'}
                        </Button>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white/80 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Submission Progress
                                    </p>
                                    <h3 className="text-3xl font-bold text-black">
                                        {progressInfo.completed}<span className="text-2xl text-gray-500">/{progressInfo.required}</span>
                                    </h3>
                                </div>
                                <div className="relative w-16 h-16">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#E5E7EB"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="url(#gradient)"
                                            strokeWidth="3"
                                            strokeDasharray={`${progressInfo.progress}, 100`}
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-blue-700">
                                        {Math.round(progressInfo.progress)}%
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-green-50/80 rounded-xl border border-green-200">
                                    <div className="text-xl font-bold text-green-700">{progressInfo.completed}</div>
                                    <div className="text-xs text-green-600">Approved</div>
                                </div>
                                <div className="text-center p-3 bg-orange-50/80 rounded-xl border border-orange-200">
                                    <div className="text-xl font-bold text-orange-700">{progressInfo.remaining}</div>
                                    <div className="text-xs text-orange-600">Remaining</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white/80 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-green-800">Performance Stats</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Approval Rate</span>
                                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                                        {stats.approvalRate}%
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Avg Response Time</span>
                                    <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700">
                                        {stats.avgResponseTime}h
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Total Submissions</span>
                                    <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                                        {stats.totalSubmissions}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white/80 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                    <Target className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-bold text-purple-800">Task Overview</h3>
                            </div>
                            {subtaskDetails && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <FileText className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="font-medium text-black truncate">{subtaskDetails.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Users className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="text-gray-700">{session.user.department}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Star className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="text-gray-700">Priority: <span className="font-bold text-purple-700">High</span></span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white/80 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                                    <Timer className="w-6 h-6 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-orange-800">Quick Stats</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Available Forms</span>
                                    <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700">
                                        {distinctAvailableForms.length}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Submitted</span>
                                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                                        {completedForms.length}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Pending Review</span>
                                    <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700">
                                        {completedForms.filter(f => f.status === "pending").length}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white/80 backdrop-blur-sm mb-8 shadow-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-800 text-lg">Failed to Load Forms</h3>
                                    <p className="text-red-700">{error}</p>
                                </div>
                                <Button 
                                    onClick={fetchAllData} 
                                    variant="outline" 
                                    className="border-red-300 text-red-700 hover:bg-red-50 px-6 py-3 rounded-xl"
                                >
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {submitted ? (
                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white/80 backdrop-blur-sm max-w-2xl mx-auto shadow-3xl transform hover:scale-[1.02] transition-all">
                        <CardContent className="p-12 text-center">
                            <div className="w-28 h-28 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                                <CheckCircle className="w-16 h-16 text-green-600" />
                            </div>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-4">
                                Submission Complete!
                            </h2>
                            <p className="text-green-700 mb-6 text-xl">
                                Your form has been successfully submitted
                            </p>
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full mb-10">
                                <Sparkles className="w-5 h-5 text-green-600" />
                                <span className="text-green-700 font-medium">Team Lead notified for review</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Button 
                                    onClick={() => {
                                        setSubmitted(false);
                                        setSelectedForm(null);
                                        setFormData({});
                                        setActiveTab("completed");
                                    }} 
                                    variant="outline" 
                                    className="border-green-300 text-green-700 hover:bg-green-50 px-8 py-4 text-lg rounded-xl"
                                >
                                    <Eye className="w-5 h-5 mr-2" />
                                    View Submissions
                                </Button>
                                <Link href="/employee/subtasks">
                                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl">
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        Back to Tasks
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
                        {/* Sidebar */}
                      <Card className="xl:col-span-1 border-2 border-gray-300 bg-gradient-to-b from-white/90 to-blue-50/30 backdrop-blur-sm shadow-2xl">
    <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-4 text-gray-900 text-2xl">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                <FileText className="w-7 h-7 text-blue-600" />
            </div>
            Forms Library
        </CardTitle>
        <CardDescription className="text-gray-600 text-lg">
            {progressInfo.remaining > 0 
                ? `${progressInfo.remaining} more approval(s) needed` 
                : "🎉 All forms approved!"
            }
        </CardDescription>
        
        {/* Search Bar */}
        <div className="mt-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    type="search"
                    placeholder="Search forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-white/50 border-2 border-gray-200 rounded-xl py-3 text-lg"
                />
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-gray-900 to-black p-1 rounded-2xl">
                <TabsTrigger value="available" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-xl py-4 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Available</span>
                        <Badge className="ml-2 bg-white/20 text-white flex-shrink-0">
                            {filteredAvailableForms.length}
                        </Badge>
                    </div>
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-xl py-4 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Submitted</span>
                        <Badge className="ml-2 bg-white/20 text-white flex-shrink-0">
                            {filteredCompletedForms.length}
                        </Badge>
                    </div>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    </CardHeader>
    
    <CardContent className="overflow-hidden">
        {activeTab === "completed" && (
            <div className="mb-6">
                <Label className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-3">
                    <Filter className="w-5 h-5 flex-shrink-0" />
                    Filter by Status
                </Label>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full bg-gradient-to-r from-gray-900 to-black text-white border-gray-800 rounded-2xl py-6 text-lg">
                        <SelectValue placeholder="All submissions" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-2xl shadow-2xl">
                        <SelectItem value="all" className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">All Submissions</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="pending" className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Pending</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="approved" className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Approved</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="rejected" className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Rejected</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        )}
        
        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {activeTab === "available" ? (
                filteredAvailableForms.length === 0 ? (
                    <div className="text-center py-10 text-gray-600">
                        {progressInfo.remaining > 0 ? (
                            <>
                                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                                <p className="font-bold text-gray-900 text-xl">No forms available</p>
                                <p className="text-gray-600 mt-2">Contact your manager for more forms</p>
                            </>
                        ) : (
                            <>
                                <Trophy className="w-16 h-16 mx-auto mb-4 text-green-500" />
                                <p className="font-bold text-gray-900 text-xl">All forms approved!</p>
                                <p className="text-gray-600 mt-2">No available forms to submit</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredAvailableForms.map((form) => (
                        <button
                            key={form._id}
                            onClick={() => handleFormSelect(form._id)}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                                selectedForm?._id === form._id 
                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-2xl' 
                                : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex-shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 text-lg mb-2 truncate">
                                        {form.title}
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
                                            {form.fields?.length || 0} fields
                                        </span>
                                        <span className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-2 py-1 rounded whitespace-nowrap">
                                            Multiple submissions
                                        </span>
                                    </div>
                                </div>
                                {selectedForm?._id === form._id && (
                                    <div className="flex items-center flex-shrink-0">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))
                )
            ) : (
                filteredCompletedForms.length === 0 ? (
                    <div className="text-center py-10 text-gray-600">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-40" />
                        <p className="font-bold text-gray-900 text-xl">No submissions yet</p>
                        <p className="text-gray-600 mt-2">Submit forms from Available tab</p>
                    </div>
                ) : (
                    filteredCompletedForms.map((form) => (                                                
                        <button
                            key={form.submissionId || form._id}
                            onClick={() => handleFormSelect(form._id, true)}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                                selectedForm?._id === form._id 
                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-2xl' 
                                : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex-shrink-0">
                                    {getStatusIcon(form.status || form.teamleadstatus)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 text-lg mb-2 truncate flex items-center gap-2">
                                        {form.title}
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap ${getStatusColor(form.status || form.teamleadstatus)}`}>
                                            {getStatusText(form.status || form.teamleadstatus)}
                                        </span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(form.submittedAt || form.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {form.description && (
                                        <div className="text-gray-600 text-sm mb-2 truncate">
                                            {form.description}
                                        </div>
                                    )}
                                    {form.fileAttachments?.length > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-blue-600 truncate">
                                            <Paperclip className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{form.fileAttachments.length} file(s)</span>
                                        </div>
                                    )}
                                </div>
                                {selectedForm?._id === form._id && (
                                    <div className="flex items-center flex-shrink-0">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))
                )
            )}
        </div>
    </CardContent>
</Card>

                        {/* Main Content */}
                        <Card className="xl:col-span-3 border-2 border-gray-300 bg-gradient-to-b from-white/90 to-purple-50/30 backdrop-blur-sm shadow-3xl">
                            <CardHeader className="pb-8">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <CardTitle className="text-3xl text-black flex items-center gap-4 mb-4">
                                            {selectedForm ? (
                                                <>
                                                    <div className="w-4 h-12 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                                                    <div className="flex items-center gap-3">
                                                        {selectedForm.title}
                                                        {viewMode && (
                                                            <span className="text-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full flex items-center gap-2">
                                                                <Eye className="w-4 h-4" />
                                                                View Mode
                                                            </span>
                                                        )}
                                                        {!viewMode && (
                                                            <span className="text-lg bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2">
                                                                <Sparkles className="w-4 h-4" />
                                                                Edit Mode
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-12 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full"></div>
                                                    "Select a Form"
                                                </div>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="text-gray-700 text-xl">
                                            {selectedForm 
                                                ? viewMode 
                                                    ? "Viewing your submitted form. This form cannot be edited."
                                                    : "Please fill out all required fields below"
                                                : activeTab === "available" 
                                                    ? `Choose one of ${filteredAvailableForms.length} form(s) to begin your submission`
                                                    : "Select a submitted form to view your submission"
                                            }
                                        </CardDescription>
                                        {selectedForm && !viewMode && (
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <div className="text-sm text-blue-600 bg-blue-50/80 px-4 py-2 rounded-xl border border-blue-200">
                                                    <p className="font-bold flex items-center gap-2">
                                                        <Zap className="w-4 h-4" />
                                                        You can submit this form multiple times
                                                    </p>
                                                </div>
                                                <div className="text-sm text-green-600 bg-green-50/80 px-4 py-2 rounded-xl border border-green-200">
                                                    <p className="font-bold flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Each submission counts toward your {progressInfo.required} required approvals
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {selectedForm && !viewMode && (
                                        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-2xl border-2 border-blue-200">
                                            <span className="text-lg font-bold text-blue-700">
                                                {selectedForm.fields?.filter(f => f.required).length || 0} required fields
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            
                            <CardContent>
                                {selectedForm ? (
                                    <div className="space-y-10 max-w-4xl">
                                        {selectedForm.fields?.map((field, index) => (
                                            <div 
                                                key={field.name || index} 
                                                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <Label htmlFor={field.name} className="text-2xl font-bold text-black flex items-center gap-3">
                                                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-2">*</span>}
                                                    </Label>
                                                    <Badge className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-4 py-2 font-mono">
                                                        {field.type}
                                                    </Badge>
                                                </div>
                                                {renderField(field)}
                                                {field.placeholder && !viewMode && (
                                                    <p className="text-gray-700 mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl text-lg border border-gray-200">
                                                        💡 {field.placeholder}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {/* File Upload Section */}
                                        {!viewMode && renderFileUpload()}

                                        {/* Show attachments in view mode */}
                                        {viewMode && renderAttachments()}

                                        {/* Action Buttons */}
                                        {!viewMode && (
                                            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t-2 border-gray-300">
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={submitting || uploading}
                                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-8 text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 group"
                                                >
                                                    {submitting || uploading ? (
                                                        <div className="flex items-center justify-center">
                                                            <Loader2 className="w-8 h-8 mr-4 animate-spin" />
                                                            <div className="text-left">
                                                                <div className="font-bold">Submitting...</div>
                                                                <div className="text-sm opacity-90">
                                                                    {uploading ? 'Uploading files...' : 'Processing form...'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            <CheckCircle className="w-8 h-8 mr-4 group-hover:scale-110 transition-transform" />
                                                            <div className="text-left">
                                                                <div className="font-bold">Submit Form</div>
                                                                <div className="text-sm opacity-90">
                                                                    {files.length > 0 ? `with ${files.length} file(s)` : 'No files attached'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedForm(null);
                                                        setFormData({});
                                                        setFiles([]);
                                                        setViewMode(false);
                                                    }}
                                                    className="py-8 text-2xl font-bold rounded-2xl border-2 border-gray-300 hover:border-blue-400 transition-colors text-black hover:bg-gray-50"
                                                >
                                                    <ArrowLeft className="w-7 h-7 mr-3" />
                                                    Change Form
                                                </Button>
                                            </div>
                                        )}

                                        {viewMode && (
                                            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t-2 border-gray-300">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedForm(null);
                                                        setFormData({});
                                                        setFiles([]);
                                                        setViewMode(false);
                                                    }}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-8 text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl"
                                                >
                                                    <FileText className="w-7 h-7 mr-3" />
                                                    Select Another Form
                                                </Button>
                                                <Link href="/employee/subtasks">
                                                    <Button variant="outline" className="py-8 text-2xl font-bold rounded-2xl border-2 border-gray-300 text-black hover:bg-gray-50">
                                                        <ArrowLeft className="w-7 h-7 mr-3" />
                                                        Back to Tasks
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-gray-700">
                                        <FileText className="w-40 h-40 mx-auto mb-8 opacity-20" />
                                        <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-6">
                                            {activeTab === "available" ? "No Form Selected" : "No Submitted Form Selected"}
                                        </h3>
                                        <p className="text-gray-700 max-w-2xl mx-auto text-xl mb-10">
                                            {activeTab === "available" 
                                                ? progressInfo.remaining > 0
                                                    ? `Select one of ${filteredAvailableForms.length} form(s) to submit. You can submit the same form multiple times to reach your ${progressInfo.required} required approvals.`
                                                    : "🎉 All required forms have been approved! Great work!"
                                                : "Select a submitted form from the sidebar to view your submission details, status, and attached files."
                                            }
                                        </p>
                                        <div className="flex justify-center gap-6 flex-wrap">
                                            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl border-2 border-blue-200 transform hover:scale-105 transition-all">
                                                <FileText className="w-16 h-16 text-blue-600 mb-4 mx-auto" />
                                                <div className="font-bold text-blue-800 text-xl">Select Form</div>
                                                <div className="text-blue-600 text-sm mt-2">Browse available forms</div>
                                            </div>
                                            <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl border-2 border-green-200 transform hover:scale-105 transition-all">
                                                <ClipboardList className="w-16 h-16 text-green-600 mb-4 mx-auto" />
                                                <div className="font-bold text-green-800 text-xl">Fill Details</div>
                                                <div className="text-green-600 text-sm mt-2">Complete all required fields</div>
                                            </div>
                                            <div className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl border-2 border-purple-200 transform hover:scale-105 transition-all">
                                                <Upload className="w-16 h-16 text-purple-600 mb-4 mx-auto" />
                                                <div className="font-bold text-purple-800 text-xl">Attach Files</div>
                                                <div className="text-purple-600 text-sm mt-2">Add supporting documents</div>
                                            </div>
                                            <div className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl border-2 border-orange-200 transform hover:scale-105 transition-all">
                                                <CheckCircle className="w-16 h-16 text-orange-600 mb-4 mx-auto" />
                                                <div className="font-bold text-orange-800 text-xl">Submit</div>
                                                <div className="text-orange-600 text-sm mt-2">Review and submit form</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Full Page Preview Modal with Zoom */}
            {previewFile && (
                <div className={`fixed inset-0 bg-black/95 z-50 ${fullscreen ? '' : 'p-4'} flex items-center justify-center`}>
                    <div className={`bg-gradient-to-br from-gray-900 to-black ${fullscreen ? 'w-full h-full' : 'rounded-2xl w-full max-w-[95vw] max-h-[95vh]'} overflow-hidden flex flex-col shadow-2xl`}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b-2 border-gray-800 bg-gradient-to-r from-gray-900 to-black text-white">
                            <div className="flex items-center gap-3">
                                {getFileIcon(previewFile.type, previewFile.name)}
                                <div>
                                    <h3 className="font-bold truncate">{previewFile.name}</h3>
                                    <p className="text-sm text-gray-300">
                                        {formatFileSize(previewFile.size)} • {previewFile.type}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                                    <span className="text-sm">Zoom: {Math.round(zoom * 100)}%</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setZoom(prev => Math.min(prev + 0.2, 5))}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        +
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.1))}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        -
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setZoom(1)}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        100%
                                    </Button>
                                </div>
                                {previewFile.type?.includes('image') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <RotateCw className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFullscreen(!fullscreen)}
                                    className="h-8 w-8 text-white hover:bg-white/20"
                                >
                                    {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(previewFile)}
                                    className="bg-white text-black hover:bg-gray-100"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setPreviewFile(null);
                                        setFullscreen(false);
                                        setZoom(1);
                                        setRotation(0);
                                    }}
                                    className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        
                        {/* Body */}
                        <div className="flex-1 overflow-auto flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                            {previewFile.type?.includes('image') ? (
                                <div className="relative">
                                    <img
                                        src={previewFile.url}
                                        alt={previewFile.name}
                                        className="rounded-lg mx-auto shadow-2xl transition-all"
                                        style={{ 
                                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                            maxWidth: fullscreen ? '100vw' : '90vw',
                                            maxHeight: fullscreen ? '100vh' : '90vh'
                                        }}
                                    />
                                </div>
                            ) : previewFile.type?.includes('video') ? (
                                <div className="relative">
                                    <video
                                        controls
                                        autoPlay
                                        className="rounded-lg mx-auto shadow-2xl transition-transform"
                                        style={{ 
                                            transform: `scale(${zoom})`,
                                            maxWidth: fullscreen ? '100vw' : '90vw',
                                            maxHeight: fullscreen ? '100vh' : '90vh'
                                        }}
                                    >
                                        <source src={previewFile.url} type={previewFile.type} />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            ) : previewFile.type?.includes('audio') ? (
                                <div className="w-full max-w-2xl p-8">
                                    <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
                                        <div className="flex items-center gap-4 mb-6">
                                            <Music className="w-12 h-12 text-pink-500" />
                                            <div>
                                                <h4 className="text-xl font-bold text-white">{previewFile.name}</h4>
                                                <p className="text-gray-400">{formatFileSize(previewFile.size)}</p>
                                            </div>
                                        </div>
                                        <audio
                                            controls
                                            autoPlay
                                            className="w-full"
                                            style={{ transform: `scale(${zoom})` }}
                                        >
                                            <source src={previewFile.url} type={previewFile.type} />
                                            Your browser does not support the audio tag.
                                        </audio>
                                    </div>
                                </div>
                            ) : previewFile.type?.includes('pdf') || previewFile.name?.endsWith('.pdf') ? (
                                <div className={`${fullscreen ? 'w-full h-full' : 'w-full h-[80vh]'}`}>
                                    <iframe
                                        src={previewFile.url}
                                        className="w-full h-full border-0"
                                        title={previewFile.name}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <File className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                                    <p className="text-gray-300 text-xl mb-4">Preview not available for this file type</p>
                                    <Button
                                        onClick={() => downloadFile(previewFile)}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Download File
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 border-t-2 border-gray-800 bg-gradient-to-r from-gray-900 to-black text-white">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-300">
                                    Press ESC to close • Ctrl+F to toggle fullscreen • Mouse wheel to zoom
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(previewFile.url, '_blank')}
                                        className="text-gray-900 border-gray-600 hover:bg-gray-700 hover:text-white"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open in new tab
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(previewFile.url);
                                            toast.success('Link copied to clipboard');
                                        }}
                                        className="text-gray-900 border-gray-600 hover:bg-gray-700 hover:text-white"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy link
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}