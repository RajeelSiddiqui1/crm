"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Video,
  Hash,
  Play,
  File,
  Pause,
  Download,
  Volume2,
  ArrowLeft,
  Clock,
  CalendarClock,
  CalendarDays,
  Building,
  User,
  Loader2,
  ChevronRight,
  Check,
  Search,
  Zap,
  AlertCircle,
  Type,
  TextQuote,
  List,
  MapPin,
  CreditCard,
  UserCircle,
  CloudUpload,
  FolderOpen,
  FileCheck,
  Trash2,
  Image, // Added UserCircle icon
} from "lucide-react";
import MediaSection from "@/components/manager/admin-task/MediaSection";
import axios from "axios";

export default function ManagerCreateFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  const [forms, setForms] = useState([]);
  const [adminTask, setAdminTask] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [dragOver, setDragOver] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
   const [dragActive, setDragActive] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: "", // Added clientName field
    assignmentType: "single",
    assignedTo: "",
    multipleTeamLeadAssigned: [],
    teamLeadFeedback: "",
  });

  const [dynamicFormData, setDynamicFormData] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null);


const handleFileUpload = async (files) => {
  // Validate if files were provided
  if (!files || files.length === 0) {
    toast.error("No files selected");
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);
  
  // Convert to array
  const newFiles = Array.from(files);
  
  // Validate file sizes (1GB max per file)
  const maxSize = 1 * 1024 * 1024 * 1024; // 1GB
  const validFiles = newFiles.filter(file => {
    if (file.size > maxSize) {
      toast.error(`File "${file.name}" exceeds 1GB limit (${(file.size / (1024*1024*1024)).toFixed(2)}GB)`);
      return false;
    }
    
    // Check if file already exists
    if (uploadedFiles.some(existingFile => 
      existingFile.name === file.name && 
      existingFile.size === file.size
    )) {
      toast.error(`File "${file.name}" already added`);
      return false;
    }
    
    return true;
  });

  if (validFiles.length === 0) {
    setIsUploading(false);
    return;
  }

  // Simulate upload progress
  const progressInterval = setInterval(() => {
    setUploadProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressInterval);
        return 90;
      }
      return prev + 10;
    });
  }, 100);

  try {
    // Process files (frontend only - actual upload happens in handleSubmit)
    const processedFiles = validFiles.map(file => {
      // Create preview URL for images
      let preview = null;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        preview = URL.createObjectURL(file);
      } else if (file.type.startsWith('audio/')) {
        preview = URL.createObjectURL(file);
      }

      return {
        file, // Actual File object for upload
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        uploadedAt: new Date().toISOString(),
        formattedSize: formatFileSize(file.size)
      };
    });

    // Update state
    setUploadedFiles(prev => [...prev, ...processedFiles]);
    setUploadProgress(100);
    
    // Clear progress
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setIsUploading(false);
    }, 500);

    toast.success(`✅ Added ${validFiles.length} file${validFiles.length !== 1 ? 's' : ''} successfully`);
    
  } catch (error) {
    console.error("Error processing files:", error);
    toast.error("Failed to process files");
    clearInterval(progressInterval);
    setUploadProgress(0);
    setIsUploading(false);
  }
};
  
    const handleRemoveFile = (fileId) => {
  // Find the file to remove
  const fileToRemove = uploadedFiles.find(file => file.id === fileId);
  
  if (!fileToRemove) return;
  
  // Revoke object URL to prevent memory leak
  if (fileToRemove.preview) {
    URL.revokeObjectURL(fileToRemove.preview);
  }
  
  // Remove from state
  setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  
  toast.success(`Removed "${fileToRemove.name}"`);
};
  
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
  if (fileType?.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
  if (fileType?.startsWith('audio/')) return <Volume2 className="w-5 h-5 text-green-500" />;
  if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (fileType?.includes('document') || fileType?.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />;
  if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText className="w-5 h-5 text-green-600" />;
  if (fileType?.includes('presentation') || fileType?.includes('powerpoint')) return <FileText className="w-5 h-5 text-orange-600" />;
  if (fileType?.includes('zip') || fileType?.includes('rar') || fileType?.includes('tar')) return <File className="w-5 h-5 text-yellow-600" />;
  return <File className="w-5 h-5 text-gray-500" />;
};

  // Field icons mapping
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
      creditCard: CreditCard,
    };
    return fieldIcons[fieldType] || Type;
  };
  

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
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
    const initialData = {};
    form.fields.forEach((field) => {
      switch (field.type) {
        case "checkbox":
        case "toggle":
          initialData[field.name] = field.checked || false;
          break;
        case "range":
          initialData[field.name] = field.defaultValue || field.min || 0;
          break;
        case "rating":
          initialData[field.name] = field.defaultRating || 0;
          break;
        case "file":
          initialData[field.name] = null;
          break;
        case "date":
          initialData[field.name] = field.defaultDate || "";
          break;
        case "time":
          initialData[field.name] = field.defaultTime || "";
          break;
        case "datetime":
          initialData[field.name] = field.defaultDateTime || "";
          break;
        default:
          initialData[field.name] = "";
      }
    });
    setDynamicFormData(initialData);
    setFormData({
      clientName: "", // Reset clientName when selecting new form
      assignmentType: "single",
      assignedTo: "",
      multipleTeamLeadAssigned: [],
      teamLeadFeedback: "",
    });
    setShowPasswords({});
    setDragOver({});
  };

  const handleclientNameChange = (value) => {
    setFormData((prev) => ({ ...prev, clientName: value }));
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setDynamicFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleAssignmentTypeChange = (type) => {
    setFormData({
      ...formData,
      assignmentType: type,
      assignedTo: type === "single" ? formData.assignedTo : "",
      multipleTeamLeadAssigned:
        type === "multiple" ? formData.multipleTeamLeadAssigned : [],
    });
  };

  const handleMultipleTeamLeadToggle = (teamLeadId) => {
    console.log("Toggling team lead:", teamLeadId);
    console.log("Current selected:", formData.multipleTeamLeadAssigned);

    setFormData((prev) => {
      const isSelected = prev.multipleTeamLeadAssigned.includes(teamLeadId);
      const updated = isSelected
        ? prev.multipleTeamLeadAssigned.filter((id) => id !== teamLeadId)
        : [...prev.multipleTeamLeadAssigned, teamLeadId];

      console.log("Updated selected:", updated);
      return {
        ...prev,
        multipleTeamLeadAssigned: updated,
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

  const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(true);
};

const handleDragLeave = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileUpload(e.dataTransfer.files);
  }
};

// Handle click on drop area
const handleDropAreaClick = () => {
  if (fileInputRef.current) {
    fileInputRef.current.click();
  }
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
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-gray-900";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <Zap className="w-3 h-3" />;
      case "medium":
        return <AlertCircle className="w-3 h-3" />;
      case "low":
        return <CheckSquare className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Filter forms based on search
  const filteredForms = forms.filter(
    (form) =>
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // ========== VALIDATIONS ==========
  
  // 1. Client Name Validation (Mandatory)
  if (!formData.clientName || formData.clientName.trim() === "") {
    toast.error("Please enter client name");
    setLoading(false);
    return;
  }

  // 2. File Upload Validation (Mandatory - Custom Attachment Section)
  if (uploadedFiles.length === 0) {
    toast.error("Please upload at least one file attachment");
    setLoading(false);
    return;
  }

  // 3. Team Lead Assignment Validation
  if (formData.assignmentType === "single" && !formData.assignedTo) {
    toast.error("Please select a team lead");
    setLoading(false);
    return;
  }

  if (
    formData.assignmentType === "multiple" &&
    formData.multipleTeamLeadAssigned.length === 0
  ) {
    toast.error("Please select at least one team lead");
    setLoading(false);
    return;
  }

  // 4. Dynamic Form Fields Validation
  for (const field of selectedForm.fields) {
    if (field.required) {
      const value = dynamicFormData[field.name];
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        toast.error(`Please fill in ${field.label}`);
        setLoading(false);
        return;
      }
    }
  }

  try {
    // ========== CREATE FORM DATA ==========
    const formDataObj = new FormData();
    
    // 1. Add Basic Form Data
    formDataObj.append("formId", selectedForm._id);
    formDataObj.append("clientName", formData.clientName.trim());
    formDataObj.append("assignmentType", formData.assignmentType);
    
    // 2. Add Assignment Data
    if (formData.assignmentType === "single") {
      formDataObj.append("assignedTo", formData.assignedTo);
    } else {
      formDataObj.append("multipleTeamLeadAssigned", 
        JSON.stringify(formData.multipleTeamLeadAssigned)
      );
    }
    
    // 3. Add Dynamic Form Data (Form Builder Fields)
    formDataObj.append("formData", JSON.stringify(dynamicFormData));
    
    // 4. Add MANDATORY Uploaded Files (Custom Attachment Section)
    uploadedFiles.forEach((fileItem, index) => {
      if (fileItem.file) {
        formDataObj.append("files", fileItem.file);
        console.log(`Adding file ${index + 1}:`, fileItem.name, fileItem.file);
      }
    });

    // 5. Add Form Builder File Fields (Optional)
    selectedForm.fields.forEach((field) => {
      if (field.type === "file") {
        const fieldValue = dynamicFormData[field.name];
        if (fieldValue) {
          if (field.multiple) {
            // Multiple files from form builder
            Array.from(fieldValue).forEach((file, idx) => {
              formDataObj.append("files", file);
              console.log(`Adding form builder file ${idx + 1}:`, file.name);
            });
          } else {
            // Single file from form builder
            formDataObj.append("files", fieldValue);
            console.log(`Adding form builder single file:`, fieldValue.name);
          }
        }
      }
    });

    console.log("Total files to upload:", uploadedFiles.length);
    console.log("Form data prepared:", {
      formId: selectedForm._id,
      clientName: formData.clientName,
      assignmentType: formData.assignmentType,
      filesCount: uploadedFiles.length
    });

    // ========== SEND REQUEST ==========
    const response = await axios.post("/api/manager/forms", formDataObj, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minutes timeout for large files
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
          
          // Show progress toast for large files
          if (percentCompleted < 100 && percentCompleted % 25 === 0) {
            toast.info(`Uploading files... ${percentCompleted}% complete`);
          }
        }
      },
    });

    if (response.status === 201) {
      toast.success("Form submitted successfully with attachments!");
      
      // Cleanup object URLs for previews
      uploadedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      // Navigate after a short delay
      setTimeout(() => {
        router.push("/manager/submissions");
      }, 1500);
    }
  } catch (error) {
    console.error("❌ Submission error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response) {
      // Backend error
      const backendError = error.response.data;
      toast.error(backendError.error || "Submission failed");
      
      if (backendError.details) {
        console.error("Backend details:", backendError.details);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error("Upload timeout. Please try with smaller files.");
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error("Failed to submit form. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  const renderFormField = (field) => {
    const fieldValue = dynamicFormData[field.name] || "";
    const isDragOver = dragOver[field.name] || false;
    const IconComponent = getFieldIcon(field.type);

    switch (field.type) {
      case "text":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="text"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
          </div>
        );
      case "email":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-green-500 transition-colors" />
            <Input
              type="email"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
          </div>
        );
      case "number":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            <Input
              type="number"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
          </div>
        );
      case "tel":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-teal-500 transition-colors" />
            <Input
              type="tel"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
          </div>
        );
      case "url":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="url"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
          </div>
        );
      case "password":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              type={showPasswords[field.name] ? "text" : "password"}
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showPasswords[field.name] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      case "textarea":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
            <Textarea
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
              rows={4}
            />
          </div>
        );
      case "select":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
            <select
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 appearance-none"
              required={field.required}
            >
              <option value="" className="text-gray-500">
                Select {field.label.toLowerCase()}
              </option>
              {field.options?.map((option, index) => (
                <option key={index} value={option} className="text-gray-900">
                  {option}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
            </div>
          </div>
        );
      case "date":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
            <Input
              type="date"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
              min={field.minDate}
              max={field.maxDate}
            />
          </div>
        );
      case "time":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
            <Input
              type="time"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
              step={field.step || 900}
              min={field.minTime}
              max={field.maxTime}
            />
          </div>
        );
      case "datetime":
        return (
          <div className="relative group">
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-500 transition-colors" />
            <Input
              type="datetime-local"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
              min={field.minDateTime}
              max={field.maxDateTime}
            />
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={fieldValue}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, e.target.checked)
                }
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white checked:border-green-500 checked:bg-green-500 focus:ring-2 focus:ring-green-500"
                required={field.required}
              />
              <Check className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </div>
            <Label className="font-medium text-gray-900 cursor-pointer flex items-center gap-2">
              <IconComponent className="w-4 h-4 text-green-500" />
              {field.label}
            </Label>
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
                    onChange={(e) =>
                      handleDynamicFieldChange(field.name, e.target.value)
                    }
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-gray-300 bg-white checked:border-purple-500 checked:bg-purple-500 focus:ring-2 focus:ring-purple-500"
                    required={field.required}
                  />
                  <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <Label className="font-medium text-gray-900 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      case "range":
        return (
          <div className="space-y-2">
            <div className="relative group">
              <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="range"
                min={field.min || 0}
                max={field.max || 100}
                step={field.step || 1}
                value={fieldValue}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, parseInt(e.target.value))
                }
                className="w-full pl-10 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                required={field.required}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-700 px-2">
              <span className="font-medium">{field.min || 0}</span>
              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                {fieldValue}
              </span>
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
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 group ${isDragOver ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
            >
              <IconComponent
                className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? "text-blue-500" : "text-gray-600 group-hover:text-blue-500 transition-colors"}`}
              />
              <p
                className={`text-sm font-semibold ${isDragOver ? "text-blue-700" : "text-gray-800 group-hover:text-blue-700 transition-colors"}`}
              >
                {isDragOver
                  ? "Drop files here"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {field.multiple ? "Multiple files allowed" : "Single file only"}{" "}
                • {field.accept || "Any file type"}
              </p>
            </div>
            {fileCount > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-800 font-semibold flex items-center gap-2">
                  <IconComponent className="w-4 h-4" />
                  Selected {fileCount} file{fileCount !== 1 ? "s" : ""}:
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {Array.from(files).map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-700" />
                        <span className="text-sm text-gray-900 truncate max-w-xs">
                          {file.name}
                        </span>
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
                  className="text-xs border-blue-500 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <IconComponent className="w-3 h-3 mr-1" />
                  Change Files
                </Button>
              </div>
            )}
          </div>
        );
      case "rating":
        return (
          <div className="flex space-x-1 items-center">
            <IconComponent className="w-5 h-5 text-gray-400 mr-3" />
            {Array.from({ length: field.maxRating || 5 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleDynamicFieldChange(field.name, i + 1)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${i < fieldValue ? "text-yellow-500 fill-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {fieldValue}/5
            </span>
          </div>
        );
      case "toggle":
        return (
          <div className="flex items-center space-x-3">
            <IconComponent className="w-4 h-4 text-gray-400" />
            <button
              type="button"
              onClick={() => handleDynamicFieldChange(field.name, !fieldValue)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldValue ? "bg-blue-500" : "bg-gray-300"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${fieldValue ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
            <Label className="font-medium text-gray-900">
              {fieldValue ? (
                <span className="text-green-600 font-semibold">Enabled</span>
              ) : (
                <span className="text-gray-600">Disabled</span>
              )}
            </Label>
          </div>
        );
      case "address":
        return (
          <div className="space-y-3">
            <div className="relative group">
              <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
              <Input
                type="text"
                value={fieldValue?.street || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    street: e.target.value,
                  })
                }
                placeholder="Street address"
                className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                value={fieldValue?.city || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    city: e.target.value,
                  })
                }
                placeholder="City"
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
              <Input
                type="text"
                value={fieldValue?.state || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    state: e.target.value,
                  })
                }
                placeholder="State"
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                value={fieldValue?.zip || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    zip: e.target.value,
                  })
                }
                placeholder="ZIP code"
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
              <Input
                type="text"
                value={fieldValue?.country || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    country: e.target.value,
                  })
                }
                placeholder="Country"
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
            </div>
          </div>
        );
      case "creditCard":
        return (
          <div className="space-y-3">
            <div className="relative group">
              <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                type="text"
                value={fieldValue?.cardNumber || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    cardNumber: e.target.value,
                  })
                }
                placeholder="Card number"
                className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                value={fieldValue?.expiry || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    expiry: e.target.value,
                  })
                }
                placeholder="MM/YY"
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
              <Input
                type="text"
                value={fieldValue?.cvv || ""}
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, {
                    ...fieldValue,
                    cvv: e.target.value,
                  })
                }
                placeholder="CVC"
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                required={field.required}
              />
            </div>
            <Input
              type="text"
              value={fieldValue?.nameOnCard || ""}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, {
                  ...fieldValue,
                  nameOnCard: e.target.value,
                })
              }
              placeholder="Cardholder name"
              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
          </div>
        );
      default:
        return (
          <div className="relative group">
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="text"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
              required={field.required}
            />
          </div>
        );
    }
  };

  const TeamLeadItem = ({ tl }) => {
    const teamLeadId = tl._id || tl.id;
    const isSelected = formData.multipleTeamLeadAssigned.includes(teamLeadId);
    const departmentName =
      tl.depId?.name || tl.departmentName || "No Department";

    const handleClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleMultipleTeamLeadToggle(teamLeadId);
    };

    return (
      <div
        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between group ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
            <AvatarFallback
              className={`font-medium ${isSelected ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"}`}
            >
              {tl.firstName?.charAt(0)?.toUpperCase() ||
                tl.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {tl.firstName} {tl.lastName}
            </div>
            <div className="text-sm text-gray-700 truncate">{tl.email}</div>
            <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
              <Building className="w-3 h-3" />
              {departmentName}
            </div>
          </div>
        </div>
        <div
          className={`ml-3 h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500" : "border-gray-300 group-hover:border-blue-300"}`}
          onClick={handleClick}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
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
            <p className="text-lg font-semibold text-gray-900">
              Loading Forms...
            </p>
            <p className="text-sm text-gray-700">
              Please wait while we fetch your data
            </p>
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
              onClick={() => router.push("/manager/admin-tasks")}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Tasks</span>
            </Button>
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">
              Create Submission
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Create Form Submission
              </h1>
              <p className="text-gray-700 mt-2 max-w-2xl text-lg">
                Fill out a form based on the admin task and assign it to your
                team leads
              </p>
            </div>

            {selectedForm && (
              <Badge className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 hover:bg-gradient-to-r hover:from-blue-200 hover:to-indigo-200 transition-colors font-medium rounded-lg shadow-sm">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {selectedForm.title}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Task Details */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Task Details</CardTitle>
                      <CardDescription className="text-blue-100">
                        Reference information for this submission
                      </CardDescription>
                    </div>
                  </div>
                  {adminTask && (
                    <Badge
                      className={`${getPriorityColor(adminTask.priority)} px-3 py-1.5 backdrop-blur-sm`}
                    >
                      <div className="flex items-center gap-1.5">
                        {getPriorityIcon(adminTask.priority)}
                        <span className="font-semibold">
                          Task #{taskId?.slice(-6)}
                        </span>
                      </div>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {adminTask ? (
                  <div className="space-y-6">
                    {/* Task Overview */}
                    <div className="p-5 bg-gradient-to-r from-white to-blue-50 rounded-xl border border-blue-100 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-xl mb-3">
                            {adminTask.title}
                          </h3>
                          <p className="text-gray-800 text-sm leading-relaxed bg-blue-50/50 p-3 rounded-lg">
                            {adminTask.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">Client</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {adminTask.clientName || "Not specified"}
                        </p>
                      </div>

                      <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Due Date</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {formatDate(adminTask.endDate)}
                        </p>
                      </div>

                      <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Status</span>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-medium">
                          {adminTask.status || "Assigned"}
                        </Badge>
                      </div>

                      <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Created</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {formatDate(adminTask.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Media Attachments */}
                    <MediaSection task={adminTask} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-gray-700 text-lg">
                      No task details available
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Task ID: {taskId || "Not specified"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Forms List - Only shown when no form is selected */}
            {!selectedForm && (
              <Card className="border border-gray-200 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">
                          Available Forms
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                          {forms.length} form{forms.length !== 1 ? "s" : ""}{" "}
                          found in your department
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm font-semibold">
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
                        className="pl-10 text-gray-900 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {filteredForms.map((form, index) => (
                      <div key={form._id} className="group relative">
                        <Card
                          className="border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r from-white to-blue-50/30 overflow-hidden"
                          onClick={() => handleFormSelect(form)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                                    <FileText className="h-7 w-7 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-bold text-gray-900 text-lg truncate">
                                        {form.title}
                                      </h4>
                                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 text-xs font-semibold">
                                        {form.fields.length} fields
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                                      {form.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {form.fields
                                        .slice(0, 3)
                                        .map((field, idx) => {
                                          const FieldIcon = getFieldIcon(
                                            field.type,
                                          );
                                          return (
                                            <Badge
                                              key={idx}
                                              variant="outline"
                                              className="text-xs bg-white/50 text-gray-800 border-gray-300 font-medium flex items-center gap-1"
                                            >
                                              <FieldIcon className="w-3 h-3" />
                                              {field.label}
                                            </Badge>
                                          );
                                        })}
                                      {form.fields.length > 3 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-white/50 text-gray-800 border-gray-300 font-medium"
                                        >
                                          +{form.fields.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Created {formatDate(form.createdAt)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-blue-700 group-hover:gap-2 transition-all duration-300 font-semibold">
                                    <span>Select Form</span>
                                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}

                    {filteredForms.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto mb-6 text-gray-400" />
                        <p className="text-gray-700 text-lg">No forms found</p>
                        <p className="text-sm text-gray-600 mt-2">
                          {searchQuery
                            ? "Try a different search term"
                            : "Contact your administrator to create forms"}
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
                <Card className="border border-gray-200 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <Send className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">
                            Form Submission
                          </CardTitle>
                          <CardDescription className="text-blue-100">
                            Fill out the form and assign to team leads
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedForm(null)}
                        size="sm"
                        className="bg-white/10 text-white hover:bg-white/20 border-white/30 backdrop-blur-sm font-medium"
                      >
                        Change Form
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Client Name Field */}
                      <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 shadow-sm">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <Label
                              htmlFor="clientName"
                              className="text-gray-900 font-semibold text-base flex items-center gap-2"
                            >
                              <UserCircle className="w-4 h-4 text-blue-600" />
                              Client Name *
                            </Label>
                            <div className="relative group">
                              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                              <Input
                                id="clientName"
                                type="text"
                                value={formData.clientName}
                                onChange={(e) =>
                                  handleclientNameChange(e.target.value)
                                }
                                placeholder="Enter client name"
                                className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white border-gray-300"
                                required
                              />
                            </div>
                            <p className="text-xs text-gray-700 italic">
                              This is a required field for all form submissions
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Form Header */}
                      <div className="p-5 bg-gradient-to-r from-white to-blue-50 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <FileText className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-xl">
                              {selectedForm.title}
                            </h3>
                            <p className="text-gray-700 text-sm mt-2">
                              {selectedForm.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                        {selectedForm.fields.map((field, index) => {
                          const IconComponent = getFieldIcon(field.type);
                          return (
                            <div key={field.name} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-gray-900 font-semibold text-base flex items-center gap-2">
                                  <IconComponent className="w-4 h-4" />
                                  {field.label}{" "}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </Label>
                                {field.placeholder && (
                                  <span className="text-xs text-gray-700 italic">
                                    {field.placeholder}
                                  </span>
                                )}
                              </div>
                              <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
                                {renderFormField(field)}
                              </div>
                            </div>
                          );
                        })}
                      </div>


                      
                                  {/* File Upload Card */}
                                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <CloudUpload className="w-6 h-6 text-white" />
                                      </div>
                                      <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Attachments</h2>
                                        <p className="text-gray-600">Upload files related to this task</p>
                                      </div>
                                    </div>
                      
                                    {/* Drag & Drop Area */}
                                    <div
                                      className={`relative border-2 border-dashed ${
                                        dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                                      } rounded-2xl p-8 text-center transition-all duration-300 mb-6`}
                                      onDragOver={handleDragOver}
                                      onDragLeave={handleDragLeave}
                                      onDrop={handleDrop}
                                      onClick={() => fileInputRef.current?.click()}
                                    >
                                      <input
                                        type="file"
                                        ref={fileInputRef}
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                      />
                                      
                                      <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                                          {isUploading ? (
                                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                          ) : (
                                            <Upload className="w-8 h-8 text-purple-600" />
                                          )}
                                        </div>
                                        
                                        <div>
                                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {isUploading ? 'Uploading Files...' : 'Drag & Drop Files Here'}
                                          </h3>
                                          <p className="text-gray-600 mb-4">
                                            or click to browse files. Max size: 1GB per file
                                          </p>
                                          
                                          {isUploading && (
                                            <div className="w-full max-w-md mx-auto">
                                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-2.5 rounded-full transition-all duration-300"
                                                  style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                              </div>
                                              <p className="text-sm text-gray-600 mt-2">
                                                Uploading... {uploadProgress}%
                                              </p>
                                            </div>
                                          )}
                                          
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              fileInputRef.current?.click();
                                            }}
                                          >
                                            <FolderOpen className="w-5 h-5" />
                                            Select Files
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                      
                                    {/* Uploaded Files List */}
                                    {uploadedFiles.length > 0 && (
                                      <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                          <FileCheck className="w-5 h-5 text-green-600" />
                                          Uploaded Files ({uploadedFiles.length})
                                        </h3>
                                        
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                          {uploadedFiles.map((file) => (
                                            <div
                                              key={file.id}
                                              className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
                                            >
                                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {getFileIcon(file.type)}
                                                <div className="min-w-0 flex-1">
                                                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                                  <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                      {formatFileSize(file.size)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">
                                                      {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                {file.preview && (
                                                  <button
                                                    type="button"
                                                    onClick={() => setPreviewFile(file)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                  >
                                                    <Eye className="w-4 h-4" />
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveFile(file.id)}
                                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                      {/* Assignment Section */}
                      <div className="space-y-6 pt-4 border-t border-gray-200">
                        <div>
                          <Label className="text-gray-900 font-semibold text-lg mb-4 block">
                            Assignment Configuration
                          </Label>

                          {/* Assignment Type Selection */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div
                              className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.assignmentType === "single" ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md"}`}
                              onClick={() =>
                                handleAssignmentTypeChange("single")
                              }
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.assignmentType === "single" ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}
                                >
                                  {formData.assignmentType === "single" && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <User className="h-5 w-5 text-gray-700" />
                                    <span className="font-bold text-gray-900 text-lg">
                                      Single Assignment
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    Assign this form to one team lead
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.assignmentType === "multiple" ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md"}`}
                              onClick={() =>
                                handleAssignmentTypeChange("multiple")
                              }
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.assignmentType === "multiple" ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}
                                >
                                  {formData.assignmentType === "multiple" && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-5 w-5 text-gray-700" />
                                    <span className="font-bold text-gray-900 text-lg">
                                      Multiple Assignment
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    Assign this form to multiple team leads
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Team Lead Selection */}
                          <div className="space-y-4">
                            {formData.assignmentType === "single" ? (
                              <div className="space-y-3">
                                <Label className="text-gray-900 font-semibold text-base">
                                  Select Team Lead{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <select
                                  value={formData.assignedTo}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      assignedTo: e.target.value,
                                    })
                                  }
                                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 appearance-none font-semibold"
                                  required
                                >
                                  <option value="" className="text-gray-700">
                                    Choose a team lead...
                                  </option>
                                  {teamLeads.map((tl) => {
                                    const teamLeadId = tl._id || tl.id;
                                    const departmentName =
                                      tl.depId?.name ||
                                      tl.departmentName ||
                                      "No Department";
                                    return (
                                      <option
                                        key={teamLeadId}
                                        value={teamLeadId}
                                        className="text-gray-900"
                                      >
                                        {tl.firstName} {tl.lastName} ({tl.email}
                                        ) - {departmentName}
                                      </option>
                                    );
                                  })}
                                </select>
                                <p className="text-sm text-gray-700">
                                  This form will be assigned to the selected
                                  team lead only.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-gray-900 font-semibold text-base">
                                    Select Team Leads{" "}
                                    <span className="text-red-500">*</span>
                                  </Label>
                                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-semibold">
                                    {formData.multipleTeamLeadAssigned.length}{" "}
                                    selected
                                  </Badge>
                                </div>

                                <div className="space-y-3 max-h-64 overflow-y-auto p-2">
                                  {teamLeads.length > 0 ? (
                                    teamLeads.map((tl) => (
                                      <TeamLeadItem
                                        key={tl._id || tl.id}
                                        tl={tl}
                                      />
                                    ))
                                  ) : (
                                    <div className="text-center py-8 text-gray-700">
                                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                      <p className="font-bold text-lg">
                                        No team leads available
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <p className="text-sm text-gray-700">
                                  Select one or more team leads to assign this
                                  form. Each selected lead will receive the
                                  form.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-300 py-4 px-8 font-bold text-lg rounded-xl"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                Processing Submission...
                              </>
                            ) : (
                              <>
                                <Send className="h-5 w-5 mr-3" />
                                {formData.assignmentType === "multiple"
                                  ? `Assign to ${formData.multipleTeamLeadAssigned.length} Team Lead${formData.multipleTeamLeadAssigned.length !== 1 ? "s" : ""}`
                                  : "Submit Form"}
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/manager/admin-tasks")}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 py-4 px-8 font-semibold text-lg rounded-xl"
                          >
                            Cancel
                          </Button>
                        </div>

                        <p className="text-xs text-gray-700 mt-4 text-center">
                          By submitting, you confirm that all information is
                          accurate and complete.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Placeholder when no form is selected */
              <Card className="border border-gray-200 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">
                        Form Selection Required
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Select a form from the list to begin submission
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                      <FileText className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      No Form Selected
                    </h3>
                    <p className="text-gray-700 mb-8 max-w-md mx-auto text-lg">
                      Choose a form from the list on the left to fill out and
                      submit for this task.
                    </p>
                    <div className="flex items-center justify-center gap-3 text-gray-700 font-semibold text-lg">
                      <ArrowLeft className="h-5 w-5" />
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
