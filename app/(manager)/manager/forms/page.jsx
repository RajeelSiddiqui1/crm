"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus,
    Search,
    FileText,
    Users,
    Calendar,
    User,
    X,
    Loader2,
    Building,
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
    Clock,
    CalendarClock,
    CalendarDays,
    Type,
    TextQuote,
    UserCircle,
    File,
    Trash2,
    Paperclip,
    CheckCircle,
    FileImage,
    FileVideo,
    Music,
    FileSpreadsheet,
    FileType,
    FileArchive,
    FileCode,
    Download,
    CloudUpload,
    FolderPlus,
    FileSearch,
    FolderArchive,
    HardDrive,
    FolderTree,
    FileCog,
    FileDigit,
    FileSignature,
    Shield,
    LockKeyhole,
    EyeIcon,
    ArrowLeft,
    Printer,
    Share2,
    ArrowRight,
    Rocket,
    FileUp,
    CalendarFold,
    Check,
    ChevronRight,
    ChevronLeft,
    AlertCircle
} from "lucide-react";
import axios from "axios";

export default function ManagerFormsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [forms, setForms] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({}); 
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("form");

    // Main form data
    const [formData, setFormData] = useState({
        clientName: "",
        assignmentType: "single",
        assignedTo: "",
        multipleTeamLeadAssigned: [],
        teamLeadFeedback: "",
        priority: "medium",
        dueDate: "",
        notes: ""
    });

    // Dynamic form fields data
    const [dynamicFormData, setDynamicFormData] = useState({});
    
    // Attachments section
    const [attachments, setAttachments] = useState({
        files: [],
        folders: [],
        notes: "",
        isEncrypted: false,
        shareWithClient: false,
        printCopy: false
    });

    const [showPasswords, setShowPasswords] = useState({});
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isDragging, setIsDragging] = useState(false);
    const [selectedAttachmentType, setSelectedAttachmentType] = useState("all");

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Manager") {
            router.push("/managerlogin");
            return;
        }

        fetchForms();
        fetchTeamLeads();
    }, [session, status, router]);

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

    const fetchTeamLeads = async () => {
        try {
            const response = await axios.get(`/api/manager/teamleads-list`);
            if (response.status === 200) {
                setTeamLeads(response.data.teamleads || []);
            }
        } catch (error) {
            console.error("Error fetching team leads:", error);
            toast.error("Failed to fetch team leads");
        }
    };

    const handleFormSelect = (form) => {
        setSelectedForm(form);
        setShowForm(true);
        setActiveTab("form");
        
        // Initialize dynamic form data
        const initialData = {};
        form.fields?.forEach(field => {
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
                case 'date':
                    initialData[field.name] = field.defaultDate || '';
                    break;
                case 'time':
                    initialData[field.name] = field.defaultTime || '';
                    break;
                case 'datetime':
                    initialData[field.name] = field.defaultDateTime || '';
                    break;
                default:
                    initialData[field.name] = "";
            }
        });
        
        setDynamicFormData(initialData);
        
        // Reset attachments
        setAttachments({
            files: [],
            folders: [],
            notes: "",
            isEncrypted: false,
            shareWithClient: false,
            printCopy: false
        });
        
        setFormData({
            clientName: "",
            assignmentType: "single",
            assignedTo: "",
            multipleTeamLeadAssigned: [],
            teamLeadFeedback: "",
            priority: "medium",
            dueDate: "",
            notes: ""
        });
        
        setShowPasswords({});
        setDragOver(false);
        setUploadProgress({});
        setIsDragging(false);
    };

    const handleDynamicFieldChange = (fieldName, value) => {
        setDynamicFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleFileUpload = (files) => {
        const fileArray = Array.from(files);
        
        const newFiles = fileArray.map(file => ({
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            status: 'pending',
            progress: 0
        }));

        setAttachments(prev => ({
            ...prev,
            files: [...prev.files, ...newFiles]
        }));

        // Simulate upload progress
        newFiles.forEach((fileObj) => {
            simulateUpload(fileObj.id);
        });

        toast.success(`${fileArray.length} file(s) added`);
    };

    const simulateUpload = (fileId) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setAttachments(prev => ({
                ...prev,
                files: prev.files.map(f => 
                    f.id === fileId 
                        ? { ...f, progress: progress, status: progress >= 100 ? 'completed' : 'uploading' }
                        : f
                )
            }));

            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 200);
    };

    const handleRemoveFile = (fileId) => {
        setAttachments(prev => ({
            ...prev,
            files: prev.files.filter(f => f.id !== fileId)
        }));
        toast.info("File removed");
    };

    const handleCreateFolder = () => {
        const folderName = prompt("Enter folder name:");
        if (folderName && folderName.trim()) {
            setAttachments(prev => ({
                ...prev,
                folders: [...prev.folders, {
                    id: Date.now(),
                    name: folderName.trim(),
                    createdAt: new Date(),
                    fileCount: 0
                }]
            }));
            toast.success(`Folder "${folderName}" created`);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        setDragOver(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const handleAttachmentTypeFilter = (type) => {
        setSelectedAttachmentType(type);
    };

    const filteredAttachments = () => {
        if (selectedAttachmentType === "all") return attachments.files;
        return attachments.files.filter(file => {
            if (selectedAttachmentType === "images") return file.type.startsWith('image/');
            if (selectedAttachmentType === "documents") return file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text');
            if (selectedAttachmentType === "spreadsheets") return file.type.includes('spreadsheet') || file.type.includes('excel');
            if (selectedAttachmentType === "media") return file.type.startsWith('video/') || file.type.startsWith('audio/');
            return true;
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return <FileImage className="w-5 h-5 text-rose-500" />;
        if (fileType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-violet-500" />;
        if (fileType.startsWith('audio/')) return <Music className="w-5 h-5 text-emerald-500" />;
        if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
        if (fileType.includes('word') || fileType.includes('document')) return <FileType className="w-5 h-5 text-blue-500" />;
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
        if (fileType.includes('zip') || fileType.includes('compressed')) return <FileArchive className="w-5 h-5 text-amber-500" />;
        return <File className="w-5 h-5 text-gray-500" />;
    };

    const handleAssignmentTypeChange = (type) => {
        setFormData({
            ...formData,
            assignmentType: type,
            assignedTo: type === "single" ? formData.assignedTo : "",
            multipleTeamLeadAssigned: type === "multiple" ? formData.multipleTeamLeadAssigned : []
        });
    };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Validate client name
    if (!formData.clientName || formData.clientName.trim() === "") {
      toast.error("Please enter client name");
      setLoading(false);
      return;
    }

    // Validate assignments
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

    // Prepare FormData
    const formDataToSend = new FormData();
    
    console.log("Submitting form data:", {
      formId: selectedForm._id,
      clinetName: formData.clientName,
      assignmentType: formData.assignmentType,
      assignedTo: formData.assignedTo,
      multipleTeamLeadAssigned: formData.multipleTeamLeadAssigned
    });
    
    // Add basic form data (NOTICE: backend expects "clinetName" not "clientName")
    formDataToSend.append("formId", selectedForm._id);
    formDataToSend.append("clinetName", formData.clientName.trim()); // ✅ IMPORTANT: "clinetName" not "clientName"
    formDataToSend.append("assignmentType", formData.assignmentType);
    
    // Add assignment data based on type
    if (formData.assignmentType === "single" && formData.assignedTo) {
      formDataToSend.append("assignedTo", formData.assignedTo);
    }
    
    if (formData.assignmentType === "multiple" && formData.multipleTeamLeadAssigned.length > 0) {
      formDataToSend.append("multipleTeamLeadAssigned", JSON.stringify(formData.multipleTeamLeadAssigned));
    }
    
    // Add form fields data
    const dynamicFormDataObj = {};
    selectedForm.fields?.forEach(field => {
      const value = dynamicFormData[field.name];
      if (value !== undefined && value !== null) {
        dynamicFormDataObj[field.name] = value;
      }
    });
    
    console.log("Dynamic form data:", dynamicFormDataObj);
    formDataToSend.append("formData", JSON.stringify(dynamicFormDataObj));
    
    // Add attachment files
    attachments.files.forEach((fileObj) => {
      if (fileObj.file) {
        formDataToSend.append("files", fileObj.file);
      }
    });

    // Debug: Check what's being sent
    console.log("FormData contents:");
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }

    // Submit to backend
    const response = await axios.post("/api/manager/forms", formDataToSend, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total 
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        setUploadProgress({ isUploading: true, progress });
      }
    });

    if (response.status === 201) {
      toast.success("Form submitted successfully!");
      resetForm();
      fetchForms();
      setTimeout(() => {
        router.push("/manager/submissions");
      }, 1500);
    }
  } catch (error) {
    console.error("Submission error:", error);
    console.error("Error response:", error.response?.data);
    toast.error(error.response?.data?.error || "Failed to submit form");
    
    // Specific error messages
    if (error.response?.data?.details?.includes("formId")) {
      toast.error("Form ID is missing. Please try again.");
    }
    if (error.response?.data?.details?.includes("client")) {
      toast.error("Client name is required.");
    }
  } finally {
    setLoading(false);
    setUploadProgress({});
  }
};

    const getFieldIcon = (fieldType) => {
        const fieldIcons = {
            text: Type,
            email: Mail,
            number: Hash,
            tel: Phone,
            url: Link,
            password: Lock,
            date: CalendarDays,
            time: Clock,
            datetime: CalendarClock,
            select: List,
            textarea: TextQuote,
            checkbox: CheckSquare,
            radio: Radio,
            range: SlidersHorizontal,
            file: Upload,
            rating: Star,
            toggle: ToggleLeft,
            address: MapPin,
            creditCard: CreditCard
        };
        return fieldIcons[fieldType] || Type;
    };

    const togglePasswordVisibility = (fieldName) => {
        setShowPasswords(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    const renderFormField = (field) => {
        const fieldValue = dynamicFormData[field.name] || "";
        const IconComponent = getFieldIcon(field.type);

        switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "tel":
            case "url":
                return (
                    <div className="relative">
                        <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            type={field.type}
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800 h-11"
                            required={field.required}
                        />
                    </div>
                );
            case "password":
                return (
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            type={showPasswords[field.name] ? "text" : "password"}
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800 h-11"
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
                    <div className="relative">
                        <TextQuote className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                        <Textarea
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800 min-h-[100px]"
                            required={field.required}
                        />
                    </div>
                );
            case "select":
                return (
                    <div className="relative">
                        <List className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                        <Select
                            value={fieldValue}
                            onValueChange={(value) => handleDynamicFieldChange(field.name, value)}
                        >
                            <SelectTrigger className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800 h-11">
                                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                                {field.options?.map((option, index) => (
                                    <SelectItem key={index} value={option} className="text-gray-900 hover:bg-gray-100">
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case "date":
                return (
                    <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            type="date"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800 h-11"
                            required={field.required}
                        />
                    </div>
                );
            case "checkbox":
                return (
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.checked)}
                            className="w-4 h-4 text-gray-800 bg-gray-100 border-gray-300 rounded focus:ring-gray-800 focus:ring-2"
                            required={field.required}
                        />
                        <Label className="text-gray-900 cursor-pointer">{field.label}</Label>
                    </div>
                );
            case "radio":
                return (
                    <div className="space-y-3">
                        {field.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name={field.name}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                                    className="w-4 h-4 text-gray-800 bg-gray-100 border-gray-300 focus:ring-gray-800"
                                    required={field.required}
                                />
                                <Label className="text-gray-900 cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case "range":
                return (
                    <div className="space-y-3">
                        <div className="relative">
                            <SlidersHorizontal className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="range"
                                min={field.min || 0}
                                max={field.max || 100}
                                step={field.step || 1}
                                value={fieldValue}
                                onChange={(e) => handleDynamicFieldChange(field.name, parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider pl-6"
                                required={field.required}
                            />
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{field.min || 0}</span>
                            <span className="font-semibold text-gray-900">{fieldValue}</span>
                            <span>{field.max || 100}</span>
                        </div>
                    </div>
                );
            case "rating":
                return (
                    <div className="flex space-x-1 items-center">
                        <Star className="w-4 h-4 text-gray-500 mr-2" />
                        {Array.from({ length: field.maxRating || 5 }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleDynamicFieldChange(field.name, i + 1)}
                                className="focus:outline-none"
                            >
                                <Star
                                    className={`w-6 h-6 transition-colors ${i < fieldValue
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-gray-300 hover:text-amber-300'
                                        }`}
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
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fieldValue ? 'bg-gray-800' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${fieldValue ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <Label className="text-gray-900">{fieldValue ? 'On' : 'Off'}</Label>
                    </div>
                );
            default:
                return (
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            type="text"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800 h-11"
                            required={field.required}
                        />
                    </div>
                );
        }
    };

    const resetForm = () => {
        setFormData({
            clientName: "",
            assignmentType: "single",
            assignedTo: "",
            multipleTeamLeadAssigned: [],
            teamLeadFeedback: "",
            priority: "medium",
            dueDate: "",
            notes: ""
        });
        setDynamicFormData({});
        setAttachments({
            files: [],
            folders: [],
            notes: "",
            isEncrypted: false,
            shareWithClient: false,
            printCopy: false
        });
        setSelectedForm(null);
        setShowForm(false);
        setActiveTab("form");
        setShowPasswords({});
        setDragOver(false);
        setIsDragging(false);
        setUploadProgress({});
    };

    const filteredForms = forms.filter(form =>
        form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-800" />
                    <span className="text-gray-900 font-medium">Loading...</span>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Manager") {
        return null;
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-6">
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div className="text-center lg:text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-gray-900 shadow-lg">
                                <FileCog className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Form Management
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Assign forms with attachments to team leads
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                                <FolderArchive className="w-3 h-3 mr-1" />
                                Auto-attachments
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                                <HardDrive className="w-3 h-3 mr-1" />
                                Secure Storage
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="relative w-full lg:w-96">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <Input
                                placeholder="Search forms..."
                                className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800 h-12 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Forms</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{forms.length}</h3>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-100">
                                    <FileText className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Team Leads</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{teamLeads.length}</h3>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-100">
                                    <Users className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-100">
                                    <Send className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Forms Table */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="border-b border-gray-200">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FolderTree className="w-5 h-5 text-gray-700" />
                                    Available Forms
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                    Select a form to assign with attachments
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {fetching ? (
                            <div className="flex justify-center items-center py-16">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-800" />
                                    <span className="text-gray-700">Loading forms...</span>
                                </div>
                            </div>
                        ) : filteredForms.length === 0 ? (
                            <div className="text-center py-16">
                                <FileSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {forms.length === 0 ? "No forms available" : "No matches found"}
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    {forms.length === 0
                                        ? "No forms have been created for your department yet."
                                        : "Try adjusting your search terms."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-semibold text-gray-900 py-4">Form Details</TableHead>
                                            <TableHead className="font-semibold text-gray-900 py-4">Fields</TableHead>
                                            <TableHead className="font-semibold text-gray-900 py-4">Created</TableHead>
                                            <TableHead className="font-semibold text-gray-900 py-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredForms.map((form) => (
                                            <TableRow
                                                key={form._id}
                                                className="hover:bg-gray-50"
                                            >
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="border border-gray-200">
                                                            <AvatarFallback className="bg-gray-100 text-gray-800 font-semibold">
                                                                {form.title?.charAt(0) || 'F'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {form.title}
                                                            </div>
                                                            <div className="text-sm text-gray-600 mt-1">
                                                                {form.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {form.fields?.slice(0, 4).map((field, idx) => {
                                                            const IconComponent = getFieldIcon(field.type);
                                                            return (
                                                                <Badge key={idx} variant="outline" className="text-xs border-gray-200 text-gray-700">
                                                                    <IconComponent className="w-3 h-3 mr-1" />
                                                                    {field.label}
                                                                </Badge>
                                                            );
                                                        })}
                                                        {form.fields?.length > 4 && (
                                                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                                                +{form.fields.length - 4} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <span>{formatDate(form.createdAt)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Button
                                                        onClick={() => handleFormSelect(form)}
                                                        className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                                                    >
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Assign Form
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Form Submission Modal */}
                {showForm && selectedForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="border border-gray-200 shadow-2xl bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden">
                            <CardHeader className="bg-gray-900 text-white sticky top-0 z-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-white/10">
                                            <FileSignature className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white">
                                                Assign: {selectedForm.title}
                                            </CardTitle>
                                            <CardDescription className="text-gray-300">
                                                Fill form and add attachments
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={resetForm}
                                        className="h-8 w-8 text-white hover:bg-white/10"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                {/* Tabs */}
                                <div className="flex border-b border-white/20 mt-4">
                                    <button
                                        onClick={() => setActiveTab("form")}
                                        className={`px-4 py-2 font-medium text-sm transition-all ${activeTab === "form" 
                                            ? "text-white border-b-2 border-white" 
                                            : "text-gray-300 hover:text-white"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Form Details
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("attachments")}
                                        className={`px-4 py-2 font-medium text-sm transition-all ${activeTab === "attachments" 
                                            ? "text-white border-b-2 border-white" 
                                            : "text-gray-300 hover:text-white"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="w-4 h-4" />
                                            Attachments
                                            {attachments.files.length > 0 && (
                                                <Badge className="ml-1 bg-white text-gray-900 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center text-xs">
                                                    {attachments.files.length}
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("assignment")}
                                        className={`px-4 py-2 font-medium text-sm transition-all ${activeTab === "assignment" 
                                            ? "text-white border-b-2 border-white" 
                                            : "text-gray-300 hover:text-white"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Assignment
                                        </div>
                                    </button>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
                                <form onSubmit={handleSubmit}>
                                    {/* Form Tab */}
                                    {activeTab === "form" && (
                                        <div className="space-y-6">
                                            {/* Client Name */}
                                            <div className="space-y-4 p-5 border border-gray-200 rounded-lg bg-white">
                                                <Label className="text-gray-900 font-semibold flex items-center gap-2">
                                                    <UserCircle className="w-5 h-5 text-gray-700" />
                                                    Client Information *
                                                </Label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-700">Client Name *</Label>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                            <Input
                                                                value={formData.clientName}
                                                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                                                placeholder="Enter client name"
                                                                className="pl-10 h-11 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-700">Priority</Label>
                                                        <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                                                            <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800">
                                                                <SelectValue placeholder="Select priority" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border-gray-200">
                                                                <SelectItem value="low" className="text-gray-900">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                        Low Priority
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="medium" className="text-gray-900">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                                        Medium Priority
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="high" className="text-gray-900">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                        High Priority
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700">Notes (Optional)</Label>
                                                    <Textarea
                                                        value={formData.notes}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                        placeholder="Additional notes about this assignment..."
                                                        className="min-h-[100px] bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800"
                                                    />
                                                </div>
                                            </div>

                                            {/* Form Fields */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2">
                                                    <FileDigit className="w-5 h-5 text-gray-700" />
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Form Fields
                                                    </h3>
                                                </div>
                                                {selectedForm.fields?.map((field, index) => (
                                                    <div key={field.name} className="space-y-3 p-5 border border-gray-200 rounded-lg bg-white">
                                                        <Label className="text-gray-900 font-semibold flex items-center gap-2">
                                                            {getFieldIcon(field.type) && React.createElement(getFieldIcon(field.type), { className: "w-4 h-4 text-gray-700" })}
                                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                                        </Label>
                                                        {field.description && (
                                                            <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                                                        )}
                                                        {renderFormField(field)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Attachments Tab */}
                                    {activeTab === "attachments" && (
                                        <div className="space-y-6">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                        <FolderArchive className="w-5 h-5 text-gray-700" />
                                                        Attachments Section
                                                    </h3>
                                                    <p className="text-gray-600 mt-1">
                                                        Add files, documents, or images related to this form
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline" className="border-gray-200 text-gray-700">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Secure
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Upload Area */}
                                            <div
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => document.getElementById('file-upload').click()}
                                                className={`
                                                    border-2 border-dashed rounded-lg p-8 text-center bg-white
                                                    cursor-pointer transition-all
                                                    ${isDragging 
                                                        ? 'border-gray-800 bg-gray-50' 
                                                        : 'border-gray-300 hover:border-gray-400'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => handleFileUpload(e.target.files)}
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip"
                                                />
                                                
                                                <div>
                                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                                                        ${isDragging 
                                                            ? 'bg-gray-900' 
                                                            : 'bg-gray-100'
                                                        }`}
                                                    >
                                                        {isDragging ? (
                                                            <CloudUpload className="w-8 h-8 text-white" />
                                                        ) : (
                                                            <FileUp className="w-8 h-8 text-gray-700" />
                                                        )}
                                                    </div>
                                                    
                                                    <p className={`font-semibold mb-2
                                                        ${isDragging ? 'text-gray-900' : 'text-gray-800'}`}
                                                    >
                                                        {isDragging ? 'Drop files here!' : 'Click or drag & drop to upload'}
                                                    </p>
                                                    
                                                    <p className="text-gray-600 mb-4 text-sm">
                                                        Support PDF, Word, Excel, Images, Videos, and more
                                                    </p>
                                                    
                                                    {attachments.files.length > 0 && (
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
                                                            <CheckCircle className="w-4 h-4 text-gray-700" />
                                                            <span className="font-medium text-gray-800">
                                                                {attachments.files.length} file{attachments.files.length !== 1 ? 's' : ''} ready
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* File Type Filter */}
                                            {attachments.files.length > 0 && (
                                                <div className="space-y-3">
                                                    <Label className="text-gray-700 font-medium">Filter by type:</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            variant={selectedAttachmentType === "all" ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleAttachmentTypeFilter("all")}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <File className="w-3 h-3" />
                                                            All Files
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={selectedAttachmentType === "images" ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleAttachmentTypeFilter("images")}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FileImage className="w-3 h-3" />
                                                            Images
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={selectedAttachmentType === "documents" ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleAttachmentTypeFilter("documents")}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            Documents
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Files List */}
                                            {filteredAttachments().length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                            <Paperclip className="w-5 h-5" />
                                                            Uploaded Files ({filteredAttachments().length})
                                                        </h4>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleCreateFolder}
                                                            className="flex items-center gap-1 border-gray-300"
                                                        >
                                                            <FolderPlus className="w-4 h-4" />
                                                            New Folder
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {filteredAttachments().map((fileObj) => (
                                                            <div
                                                                key={fileObj.id}
                                                                className="group relative p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                                                            >
                                                                {fileObj.status === 'uploading' && (
                                                                    <div className="absolute top-2 right-2">
                                                                        <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
                                                                    </div>
                                                                )}
                                                                {fileObj.status === 'completed' && (
                                                                    <div className="absolute top-2 right-2">
                                                                        <CheckCircle className="w-4 h-4 text-gray-700" />
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="flex items-start gap-3">
                                                                    <div className="p-3 rounded-lg bg-gray-100">
                                                                        {getFileIcon(fileObj.type)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-gray-900 truncate">
                                                                            {fileObj.name}
                                                                        </p>
                                                                        <div className="flex items-center justify-between mt-2">
                                                                            <span className="text-xs text-gray-500">
                                                                                {formatFileSize(fileObj.size)}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {new Date(fileObj.uploadedAt).toLocaleTimeString()}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {fileObj.status === 'uploading' && (
                                                                            <div className="mt-2">
                                                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                                    <div 
                                                                                        className="bg-gray-800 h-1.5 rounded-full transition-all"
                                                                                        style={{ width: `${fileObj.progress}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                                <span className="text-xs text-gray-700 mt-1">
                                                                                    {fileObj.progress}% uploaded
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="flex-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                                                    >
                                                                        <EyeIcon className="w-3 h-3 mr-1" />
                                                                        Preview
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveFile(fileObj.id);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Security Options */}
                                            <div className="space-y-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
                                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Shield className="w-5 h-5" />
                                                    Security & Sharing Options
                                                </h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="encrypt"
                                                            checked={attachments.isEncrypted}
                                                            onCheckedChange={(checked) => 
                                                                setAttachments({...attachments, isEncrypted: checked})
                                                            }
                                                            className="border-gray-300"
                                                        />
                                                        <Label htmlFor="encrypt" className="flex items-center gap-2 cursor-pointer text-gray-900">
                                                            <LockKeyhole className="w-4 h-4" />
                                                            <span>Encrypt files</span>
                                                        </Label>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="share-client"
                                                            checked={attachments.shareWithClient}
                                                            onCheckedChange={(checked) => 
                                                                setAttachments({...attachments, shareWithClient: checked})
                                                            }
                                                            className="border-gray-300"
                                                        />
                                                        <Label htmlFor="share-client" className="flex items-center gap-2 cursor-pointer text-gray-900">
                                                            <Share2 className="w-4 h-4" />
                                                            <span>Share with client</span>
                                                        </Label>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="print-copy"
                                                            checked={attachments.printCopy}
                                                            onCheckedChange={(checked) => 
                                                                setAttachments({...attachments, printCopy: checked})
                                                            }
                                                            className="border-gray-300"
                                                        />
                                                        <Label htmlFor="print-copy" className="flex items-center gap-2 cursor-pointer text-gray-900">
                                                            <Printer className="w-4 h-4" />
                                                            <span>Print copy</span>
                                                        </Label>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label htmlFor="attachment-notes" className="text-gray-700">Attachment Notes</Label>
                                                    <Textarea
                                                        id="attachment-notes"
                                                        value={attachments.notes}
                                                        onChange={(e) => setAttachments({...attachments, notes: e.target.value})}
                                                        placeholder="Add notes about these attachments..."
                                                        className="min-h-[80px] bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignment Tab */}
                                    {activeTab === "assignment" && (
                                        <div className="space-y-6">
                                            {/* Assignment Type */}
                                            <div className="space-y-4 p-5 border border-gray-200 rounded-lg bg-white">
                                                <Label className="text-gray-900 font-semibold">
                                                    Assignment Configuration
                                                </Label>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div
                                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.assignmentType === 'single'
                                                            ? 'border-gray-800 bg-gray-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => handleAssignmentTypeChange('single')}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.assignmentType === 'single'
                                                                ? 'border-gray-800'
                                                                : 'border-gray-300'
                                                                }`}>
                                                                {formData.assignmentType === 'single' && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <User className="w-5 h-5 text-gray-700" />
                                                                    <span className="font-semibold text-gray-900">Single Team Lead</span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Assign to one primary team lead
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div
                                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.assignmentType === 'multiple'
                                                            ? 'border-gray-800 bg-gray-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => handleAssignmentTypeChange('multiple')}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.assignmentType === 'multiple'
                                                                ? 'border-gray-800'
                                                                : 'border-gray-300'
                                                                }`}>
                                                                {formData.assignmentType === 'multiple' && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-5 h-5 text-gray-700" />
                                                                    <span className="font-semibold text-gray-900">Multiple Team Leads</span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Assign to multiple team leads
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Single Assignment */}
                                            {formData.assignmentType === 'single' && (
                                                <div className="space-y-4 p-5 border border-gray-200 rounded-lg bg-white">
                                                    <Label className="text-gray-900 font-semibold flex items-center gap-2">
                                                        <User className="w-5 h-5" />
                                                        Select Team Lead *
                                                    </Label>
                                                    <div className="relative">
                                                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                                                        <select
                                                            value={formData.assignedTo}
                                                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-gray-800 focus:ring-gray-800 bg-white text-gray-900 h-11 appearance-none"
                                                            required
                                                        >
                                                            <option value="" className="text-gray-500">Select a team lead...</option>
                                                            {teamLeads.map((tl) => (
                                                                <option key={tl._id} value={tl._id} className="text-gray-900">
                                                                    {tl.name || tl.email} • {tl.depId?.name || 'No Department'}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Multiple Assignment */}
                                            {formData.assignmentType === 'multiple' && (
                                                <div className="space-y-4 p-5 border border-gray-200 rounded-lg bg-white">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-gray-900 font-semibold flex items-center gap-2">
                                                            <Users className="w-5 h-5" />
                                                            Select Team Leads *
                                                        </Label>
                                                        <Badge variant="outline" className="text-gray-700 border-gray-300">
                                                            {formData.multipleTeamLeadAssigned.length} selected
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                                                        {teamLeads.map((tl) => {
                                                            const isSelected = formData.multipleTeamLeadAssigned.includes(tl._id);
                                                            return (
                                                                <div
                                                                    key={tl._id}
                                                                    className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${isSelected
                                                                        ? 'border-gray-800 bg-gray-100'
                                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                                                                        }`}
                                                                    onClick={() => {
                                                                        setFormData(prev => {
                                                                            const isSelected = prev.multipleTeamLeadAssigned.includes(tl._id);
                                                                            return {
                                                                                ...prev,
                                                                                multipleTeamLeadAssigned: isSelected
                                                                                    ? prev.multipleTeamLeadAssigned.filter(id => id !== tl._id)
                                                                                    : [...prev.multipleTeamLeadAssigned, tl._id]
                                                                            };
                                                                        });
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarFallback className={`${isSelected ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                                                                {tl.name?.charAt(0) || tl.email?.charAt(0) || 'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">{tl.name || 'No Name'}</div>
                                                                            <div className="text-xs text-gray-600">{tl.email}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-5 h-5 border rounded flex items-center justify-center ${isSelected
                                                                        ? 'bg-gray-800 border-gray-800'
                                                                        : 'border-gray-300'
                                                                        }`}>
                                                                        {isSelected && (
                                                                            <Check className="w-3 h-3 text-white" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Due Date */}
                                            <div className="space-y-4 p-5 border border-gray-200 rounded-lg bg-white">
                                                <Label className="text-gray-900 font-semibold flex items-center gap-2">
                                                    <CalendarFold className="w-5 h-5" />
                                                    Due Date (Optional)
                                                </Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                                                    <Input
                                                        type="date"
                                                        value={formData.dueDate}
                                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                        className="pl-10 h-11 bg-white border-gray-300 text-gray-900 focus:border-gray-800 focus:ring-gray-800"
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                            </div>

                                            {/* Summary Card */}
                                            <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                    Assignment Summary
                                                </h4>
                                                <div className="space-y-2 text-sm text-gray-700">
                                                    <div className="flex justify-between">
                                                        <span>Form:</span>
                                                        <span className="font-semibold text-gray-900">{selectedForm.title}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Client:</span>
                                                        <span className="font-semibold text-gray-900">{formData.clientName || 'Not set'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Attachments:</span>
                                                        <span className="font-semibold text-gray-900">{attachments.files.length} files</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Assignment Type:</span>
                                                        <span className="font-semibold text-gray-900 capitalize">{formData.assignmentType}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Team Leads:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {formData.assignmentType === 'single' 
                                                                ? (teamLeads.find(tl => tl._id === formData.assignedTo)?.name || 'Not selected')
                                                                : `${formData.multipleTeamLeadAssigned.length} selected`
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Priority:</span>
                                                        <Badge variant="outline" className={
                                                            formData.priority === 'high' ? 'bg-red-50 text-red-800 border-red-200' :
                                                            formData.priority === 'medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                            'bg-green-50 text-green-800 border-green-200'
                                                        }>
                                                            {formData.priority}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                            
                            {/* Footer with Navigation and Submit */}
                            <CardFooter className="bg-gray-50 border-t border-gray-200 p-6 sticky bottom-0">
                                <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                                    {/* Navigation */}
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                if (activeTab === "attachments") setActiveTab("form");
                                                else if (activeTab === "assignment") setActiveTab("attachments");
                                            }}
                                            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:text-gray-900"
                                            disabled={activeTab === "form"}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${activeTab === "form" ? "bg-gray-800" : "bg-gray-300"}`}></div>
                                            <div className={`w-2 h-2 rounded-full ${activeTab === "attachments" ? "bg-gray-800" : "bg-gray-300"}`}></div>
                                            <div className={`w-2 h-2 rounded-full ${activeTab === "assignment" ? "bg-gray-800" : "bg-gray-300"}`}></div>
                                        </div>
                                        
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                if (activeTab === "form") setActiveTab("attachments");
                                                else if (activeTab === "attachments") setActiveTab("assignment");
                                            }}
                                            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:text-gray-900"
                                            disabled={activeTab === "assignment"}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    
                                    {/* Submit Button */}
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                            className="px-6 border-gray-300 text-gray-700 hover:text-gray-900"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading || uploadProgress.isUploading}
                                            onClick={handleSubmit}
                                            className="bg-gray-900 hover:bg-gray-800 text-white px-8 shadow-sm"
                                        >
                                            {loading || uploadProgress.isUploading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    {uploadProgress.isUploading ? 'Uploading...' : 'Submitting...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket className="w-4 h-4 mr-2" />
                                                    Submit Assignment
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Progress Bar for Upload */}
                                {uploadProgress.isUploading && (
                                    <div className="w-full mt-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">
                                                Uploading attachments...
                                            </span>
                                            <span className="text-sm font-medium text-gray-700">
                                                {Math.round(uploadProgress.progress)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-gray-800 h-2 rounded-full transition-all"
                                                style={{ width: `${uploadProgress.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}