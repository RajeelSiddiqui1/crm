"use client";

<<<<<<< HEAD
import { useState, useEffect, useRef } from "react";
=======
import { useState, useEffect } from "react";
>>>>>>> d285dcb (set submission backend)
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Briefcase,
<<<<<<< HEAD
  Upload,
  File,
  FileText,
  Image,
  Video,
  FileAudio,
  Trash2,
  Eye,
  Download,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Target,
  Send,
  FolderPlus,
  CloudUpload,
  FileCheck,
  FileX,
  Shield,
  Users2,
  CalendarDays,
  Clock4,
  MessageSquare,
  Bell,
  Mail,
  Zap,
  FolderOpen,
  Package,
  Layers,
  Workflow,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

export default function CreateEmployeeTaskPage() {
=======
} from "lucide-react";

export default function CreateTaskPage() {
>>>>>>> d285dcb (set submission backend)
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamLeads, setTeamLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [showTeamLeadDropdown, setShowTeamLeadDropdown] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
<<<<<<< HEAD
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
=======
>>>>>>> d285dcb (set submission backend)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  const [errors, setErrors] = useState({});
<<<<<<< HEAD
  const [showPreview, setShowPreview] = useState(false);
  const [taskSummary, setTaskSummary] = useState({
    totalAssignees: 0,
    departments: new Set(),
    duration: 0
  });

  useEffect(() => {
    fetchAllData();
   
  }, []);

  useEffect(() => {
    const totalAssignees = selectedTeamLeads.length + selectedManagers.length + selectedEmployees.length;
    const departments = new Set([
      ...selectedTeamLeads.map(tl => tl.depId?.name).filter(Boolean),
      ...selectedManagers.flatMap(mgr => mgr.departments?.map(d => d.name)).filter(Boolean),
      ...selectedEmployees.map(emp => emp.depId?.name).filter(Boolean)
    ]);
    
    let duration = 0;
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }

    setTaskSummary({
      totalAssignees,
      departments: Array.from(departments),
      duration
    });
  }, [selectedTeamLeads, selectedManagers, selectedEmployees, formData.startDate, formData.endDate]);

  useEffect(() => {
=======

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
>>>>>>> d285dcb (set submission backend)
    const handleClickOutside = (event) => {
      const dropdowns = [
        'team-lead-dropdown',
        'manager-dropdown', 
        'employee-dropdown',
        'team-lead-selector',
        'manager-selector',
        'employee-selector'
      ];
      
      const clickedInside = dropdowns.some(className => 
        event.target.closest(`.${className}`)
      );
      
      if (!clickedInside) {
        setShowTeamLeadDropdown(false);
        setShowManagerDropdown(false);
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      
<<<<<<< HEAD
=======
      // Sab data ek saath fetch karo
>>>>>>> d285dcb (set submission backend)
      const [teamLeadsRes, managersRes, employeesRes] = await Promise.all([
        axios.get("/api/employee/teamleads"),
        axios.get("/api/employee/managers"),
        axios.get("/api/employee/employees")
      ]);

      if (teamLeadsRes.data.success) {
        setTeamLeads(teamLeadsRes.data.employees || []);
      }

      if (managersRes.data.success) {
        setManagers(managersRes.data.employees || []);
      }

      if (employeesRes.status === 200) {
        setEmployees(employeesRes.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
<<<<<<< HEAD
      toast.error("Failed to load data. Please try again.");
=======
      alert("Failed to load data. Please try again.");
>>>>>>> d285dcb (set submission backend)
    } finally {
      setFetchingData(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
<<<<<<< HEAD
    } 

    

=======
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
>>>>>>> d285dcb (set submission backend)

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        newErrors.endDate = "End date must be after start date";
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (end < today) {
        newErrors.endDate = "End date cannot be in the past";
      }
    }

    if (selectedTeamLeads.length === 0 && selectedManagers.length === 0 && selectedEmployees.length === 0) {
      newErrors.assignees = "Please assign at least one team lead, manager, or employee";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

<<<<<<< HEAD
  const handleFileUpload = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const maxSize = 1 * 1024 * 1024 * 1024; // 1GB
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 1GB limit`);
        return false;
      }
      return true;
    });

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
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const processedFiles = validFiles.map(file => ({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        uploadedAt: new Date().toISOString()
      }));

      setUploadedFiles(prev => [...prev, ...processedFiles]);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);

      toast.success(`${validFiles.length} file(s) added successfully`);
    } catch (error) {
      console.error("Error processing files:", error);
      toast.error("Failed to process files");
      clearInterval(progressInterval);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success("File removed");
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType?.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType?.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-green-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType?.includes('document') || fileType?.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

=======
>>>>>>> d285dcb (set submission backend)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    try {
      setLoading(true);

<<<<<<< HEAD
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("startTime", formData.startTime);
      formDataToSend.append("endTime", formData.endTime);
      
      // Add assignees as JSON strings
      formDataToSend.append("assignedTeamLead", JSON.stringify(selectedTeamLeads.map(tl => tl._id)));
      formDataToSend.append("assignedManager", JSON.stringify(selectedManagers.map(mgr => mgr._id)));
      formDataToSend.append("assignedEmployee", JSON.stringify(selectedEmployees.map(emp => emp._id)));
      
      // Add files
      uploadedFiles.forEach(file => {
        formDataToSend.append("files", file.file);
      });

      const response = await axios.post("/api/employee/assigned-subtasks", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.status === 201) {
        toast.success("Task created successfully! Notifications have been sent to all assignees.");
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
        });
        setSelectedTeamLeads([]);
        setSelectedManagers([]);
        setSelectedEmployees([]);
        setUploadedFiles([]);
        
        // Redirect after delay
        setTimeout(() => {
          router.push("/employee/my-tasks");
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to create task. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
=======
      const payload = {
        ...formData,
        assignedTeamLead: selectedTeamLeads.map((tl) => tl._id),
        assignedManager: selectedManagers.map((mgr) => mgr._id),
        assignedEmployee: selectedEmployees.map((emp) => emp._id),
      };

      const response = await axios.post("/api/employee/assigned-subtasks", payload);

      if (response.status === 201) {
        alert("Task created successfully!");
        router.push("/employee/my-tasks");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
>>>>>>> d285dcb (set submission backend)
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Team Lead Functions
  const addTeamLead = (teamLead) => {
    if (!selectedTeamLeads.find((tl) => tl._id === teamLead._id)) {
      setSelectedTeamLeads([...selectedTeamLeads, teamLead]);
<<<<<<< HEAD
      toast.success(`${teamLead.firstName} ${teamLead.lastName} added as Team Lead`);
=======
>>>>>>> d285dcb (set submission backend)
    }
  };

  const removeTeamLead = (teamLeadId) => {
<<<<<<< HEAD
    const tl = selectedTeamLeads.find(tl => tl._id === teamLeadId);
=======
>>>>>>> d285dcb (set submission backend)
    setSelectedTeamLeads(selectedTeamLeads.filter((tl) => tl._id !== teamLeadId));
    if (errors.assignees) {
      setErrors(prev => ({ ...prev, assignees: "" }));
    }
<<<<<<< HEAD
    if (tl) {
      toast.info(`${tl.firstName} ${tl.lastName} removed from Team Leads`);
    }
=======
>>>>>>> d285dcb (set submission backend)
  };

  // Manager Functions
  const addManager = (manager) => {
    if (!selectedManagers.find((mgr) => mgr._id === manager._id)) {
      setSelectedManagers([...selectedManagers, manager]);
<<<<<<< HEAD
      toast.success(`${manager.firstName} ${manager.lastName} added as Manager`);
=======
>>>>>>> d285dcb (set submission backend)
    }
  };

  const removeManager = (managerId) => {
<<<<<<< HEAD
    const mgr = selectedManagers.find(mgr => mgr._id === managerId);
=======
>>>>>>> d285dcb (set submission backend)
    setSelectedManagers(selectedManagers.filter((mgr) => mgr._id !== managerId));
    if (errors.assignees) {
      setErrors(prev => ({ ...prev, assignees: "" }));
    }
<<<<<<< HEAD
    if (mgr) {
      toast.info(`${mgr.firstName} ${mgr.lastName} removed from Managers`);
    }
=======
>>>>>>> d285dcb (set submission backend)
  };

  // Employee Functions
  const addEmployee = (employee) => {
    if (!selectedEmployees.find((emp) => emp._id === employee._id)) {
      setSelectedEmployees([...selectedEmployees, employee]);
<<<<<<< HEAD
      toast.success(`${employee.firstName} ${employee.lastName} added as Employee`);
=======
>>>>>>> d285dcb (set submission backend)
    }
  };

  const removeEmployee = (employeeId) => {
<<<<<<< HEAD
    const emp = selectedEmployees.find(emp => emp._id === employeeId);
=======
>>>>>>> d285dcb (set submission backend)
    setSelectedEmployees(selectedEmployees.filter((emp) => emp._id !== employeeId));
    if (errors.assignees) {
      setErrors(prev => ({ ...prev, assignees: "" }));
    }
<<<<<<< HEAD
    if (emp) {
      toast.info(`${emp.firstName} ${emp.lastName} removed from Employees`);
    }
  };

  // Available members (excluding already selected)
=======
  };

  // Already selected members ko filter out karo
>>>>>>> d285dcb (set submission backend)
  const availableTeamLeads = teamLeads.filter(tl => 
    !selectedTeamLeads.find(selected => selected._id === tl._id)
  );

  const availableManagers = managers.filter(mgr => 
    !selectedManagers.find(selected => selected._id === mgr._id)
  );

  const availableEmployees = employees.filter(emp => 
    !selectedEmployees.find(selected => selected._id === emp._id)
  );

<<<<<<< HEAD
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      {/* Toaster for notifications */}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/employee/my-tasks")}
              className="inline-flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-white hover:border-gray-300 rounded-xl group transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Tasks</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-4 h-4" />
                Preview Task
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Workflow className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl border border-blue-400/20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Create New Task
                </h1>
                <p className="text-blue-100 text-lg">
                  Assign tasks with files to team leads, managers, and employees
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <Package className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">
                      Multi-assignee support
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <CloudUpload className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">
                      File uploads
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <Bell className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">
                      Instant notifications
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
                <CalendarDays className="w-8 h-8 text-white" />
                <div className="text-xs text-white/80 mt-1 text-center">
                  Task Creator
                </div>
=======
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      startDate: prev.startDate || today,
      endDate: prev.endDate || nextWeekStr
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/employee/my-tasks")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Tasks</span>
          </button>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Create New Task
                </h1>
                <p className="text-gray-600">
                  Fill in the details and assign to team members
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
>>>>>>> d285dcb (set submission backend)
              </div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Task Details Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
                  <p className="text-gray-600">Fill in the task information</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Task Title *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a clear and concise task title"
                      className={`w-full px-4 py-3.5 bg-gray-50 border ${
                        errors.title ? "border-red-300" : "border-gray-200"
                      } rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-500`}
                    />
                    {errors.title && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe the task in detail. Include objectives, requirements, and any specific instructions..."
                    className={`w-full px-4 py-3.5 bg-gray-50 border ${
                      errors.description ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all resize-none text-gray-900 placeholder-gray-500`}
                  />
                  <div className="flex justify-between mt-2">
                    {errors.description ? (
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Be specific to avoid misunderstandings
                      </p>
                    )}
                    <span className={`text-sm ${
                      formData.description.length < 10 ? "text-red-500" : 
                      formData.description.length < 50 ? "text-yellow-500" : 
                      "text-green-500"
                    }`}>
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>

                {/* Date and Time Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3.5 bg-gray-50 border ${
                        errors.startDate ? "border-red-300" : "border-gray-200"
                      } rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-gray-900`}
                    />
                    {errors.startDate && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3.5 bg-gray-50 border ${
                        errors.endDate ? "border-red-300" : "border-gray-200"
                      } rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-gray-900`}
                    />
                    {errors.endDate && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.endDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock4 className="w-4 h-4 text-blue-600" />
                      Start Time (Optional)
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock4 className="w-4 h-4 text-blue-600" />
                      End Time (Optional)
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-gray-900"
                    />
                  </div>
=======
        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Task Details Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                  Task Details
                </h2>
                <p className="text-gray-500 text-sm mt-1">Provide basic information about the task</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
  type="text"
  name="title"
  value={formData.title}
  onChange={handleInputChange}
  placeholder="Enter task title"
  className={`w-full px-4 py-3 bg-gray-50 border ${
    errors.title ? "border-red-300" : "border-gray-200"
  } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900`}
/>

                {errors.title && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.title}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe the task in detail..."
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.description ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-900`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.description}</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Be as detailed as possible to ensure clarity
                    </p>
                  )}
                  <span className="text-gray-400 text-sm">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.startDate ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900`}
                  />
                  {errors.startDate && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.startDate}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.endDate ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900`}
                  />
                  {errors.endDate && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.endDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    Start Time (Optional)
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                  />
>>>>>>> d285dcb (set submission backend)
                </div>
              </div>
            </div>

<<<<<<< HEAD
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
          </div>

          {/* Right Column - Assignees & Submit */}
          <div className="space-y-8">
            {/* Assign Team Leads Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Assign Team Leads</h2>
                  <p className="text-gray-600 text-sm">Your department leads</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedTeamLeads.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Selected ({selectedTeamLeads.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedTeamLeads([])}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
=======
            {/* Assign Team Leads Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-green-600 rounded-full"></div>
                  Assign Team Leads
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Department Specific
                  </span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Team leads from your department</p>
              </div>

              <div className="space-y-4">
                {/* Selected Team Leads */}
                {selectedTeamLeads.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Team Leads ({selectedTeamLeads.length})
                    </p>
>>>>>>> d285dcb (set submission backend)
                    <div className="flex flex-wrap gap-2">
                      {selectedTeamLeads.map((tl) => (
                        <div
                          key={tl._id}
<<<<<<< HEAD
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-lg"
                        >
                          <User className="w-3 h-3" />
                          <span className="text-sm font-medium">
                            {tl.firstName} {tl.lastName}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTeamLead(tl._id)}
                            className="ml-1 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
=======
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-xl shadow-sm"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">
                            {tl.firstName} {tl.lastName}
                          </span>
                          {tl.depId && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {tl.depId.name}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeTeamLead(tl._id)}
                            className="ml-2 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
>>>>>>> d285dcb (set submission backend)
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

<<<<<<< HEAD
=======
                {/* Team Leads Dropdown Selector */}
>>>>>>> d285dcb (set submission backend)
                <div className="relative team-lead-selector">
                  <button
                    type="button"
                    onClick={() => setShowTeamLeadDropdown(!showTeamLeadDropdown)}
<<<<<<< HEAD
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-green-400 focus:ring-3 focus:ring-green-500/30 focus:border-green-500 outline-none transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-green-800">
                          TL
                        </span>
=======
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <User className="w-5 h-5" />
>>>>>>> d285dcb (set submission backend)
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Team Leads</p>
                        <p className="text-sm text-gray-500">
<<<<<<< HEAD
                          {availableTeamLeads.length} available
=======
                          {availableTeamLeads.length} team leads available
>>>>>>> d285dcb (set submission backend)
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
<<<<<<< HEAD
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : showTeamLeadDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showTeamLeadDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto team-lead-dropdown">
                      {availableTeamLeads.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All team leads selected</p>
=======
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : showTeamLeadDropdown ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    )}
                  </button>

                  {/* Team Leads Dropdown */}
                  {showTeamLeadDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto team-lead-dropdown">
                      {availableTeamLeads.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All team leads selected</p>
                          <p className="text-sm mt-1">No more team leads available</p>
>>>>>>> d285dcb (set submission backend)
                        </div>
                      ) : (
                        availableTeamLeads.map((tl) => (
                          <button
                            key={tl._id}
                            type="button"
                            onClick={() => addTeamLead(tl)}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
<<<<<<< HEAD
                              <div className="w-8 h-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-green-800">
=======
                              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-green-800">
>>>>>>> d285dcb (set submission backend)
                                  {tl.firstName?.[0]}{tl.lastName?.[0]}
                                </span>
                              </div>
                              <div>
<<<<<<< HEAD
                                <p className="font-medium text-gray-900 text-sm">
                                  {tl.firstName} {tl.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{tl.email}</p>
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-green-600" />
=======
                                <p className="font-medium text-gray-900">
                                  {tl.firstName} {tl.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{tl.email}</p>
                                {tl.depId && (
                                  <p className="text-xs text-green-600 mt-0.5">
                                    Department: {tl.depId.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-green-600" />
>>>>>>> d285dcb (set submission backend)
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

<<<<<<< HEAD
            {/* Assign Managers Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Assign Managers</h2>
                  <p className="text-gray-600 text-sm">Across departments</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedManagers.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Selected ({selectedManagers.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedManagers([])}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
=======
            {/* Assign Managers Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                  Assign Managers
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Multiple Departments
                  </span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Managers from any department</p>
              </div>

              <div className="space-y-4">
                {/* Selected Managers */}
                {selectedManagers.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Managers ({selectedManagers.length})
                    </p>
>>>>>>> d285dcb (set submission backend)
                    <div className="flex flex-wrap gap-2">
                      {selectedManagers.map((mgr) => (
                        <div
                          key={mgr._id}
<<<<<<< HEAD
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 text-purple-800 rounded-lg"
                        >
                          <Users className="w-3 h-3" />
                          <span className="text-sm font-medium">
                            {mgr.firstName} {mgr.lastName}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeManager(mgr._id)}
                            className="ml-1 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
=======
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 text-purple-800 rounded-xl shadow-sm"
                        >
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium">
                            {mgr.firstName} {mgr.lastName}
                          </span>
                          {Array.isArray(mgr.departments) && mgr.departments.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {mgr.departments.slice(0, 2).map(d => d.name).join(', ')}
                              {mgr.departments.length > 2 && '...'}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeManager(mgr._id)}
                            className="ml-2 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
>>>>>>> d285dcb (set submission backend)
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

<<<<<<< HEAD
=======
                {/* Managers Dropdown Selector */}
>>>>>>> d285dcb (set submission backend)
                <div className="relative manager-selector">
                  <button
                    type="button"
                    onClick={() => setShowManagerDropdown(!showManagerDropdown)}
<<<<<<< HEAD
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-purple-400 focus:ring-3 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-200 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-purple-800">
                          MG
                        </span>
=======
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <Users className="w-5 h-5" />
>>>>>>> d285dcb (set submission backend)
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Managers</p>
                        <p className="text-sm text-gray-500">
<<<<<<< HEAD
                          {availableManagers.length} available
=======
                          {availableManagers.length} managers available
>>>>>>> d285dcb (set submission backend)
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
<<<<<<< HEAD
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : showManagerDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showManagerDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto manager-dropdown">
                      {availableManagers.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All managers selected</p>
=======
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : showManagerDropdown ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    )}
                  </button>

                  {/* Managers Dropdown */}
                  {showManagerDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto manager-dropdown">
                      {availableManagers.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All managers selected</p>
                          <p className="text-sm mt-1">No more managers available</p>
>>>>>>> d285dcb (set submission backend)
                        </div>
                      ) : (
                        availableManagers.map((mgr) => (
                          <button
                            key={mgr._id}
                            type="button"
                            onClick={() => addManager(mgr)}
                            className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
<<<<<<< HEAD
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-purple-800">
=======
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-200 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-purple-800">
>>>>>>> d285dcb (set submission backend)
                                  {mgr.firstName?.[0]}{mgr.lastName?.[0]}
                                </span>
                              </div>
                              <div>
<<<<<<< HEAD
                                <p className="font-medium text-gray-900 text-sm">
                                  {mgr.firstName} {mgr.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{mgr.email}</p>
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-purple-600" />
=======
                                <p className="font-medium text-gray-900">
                                  {mgr.firstName} {mgr.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{mgr.email}</p>
                                {Array.isArray(mgr.departments) && mgr.departments.length > 0 && (
                                  <p className="text-xs text-purple-600 mt-0.5">
                                    Departments: {mgr.departments.map(d => d.name).join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-purple-600" />
>>>>>>> d285dcb (set submission backend)
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

<<<<<<< HEAD
            {/* Assign Employees Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Assign Employees</h2>
                  <p className="text-gray-600 text-sm">Regular team members</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedEmployees.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Selected ({selectedEmployees.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedEmployees([])}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
=======
            {/* Assign Employees Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-amber-600 rounded-full"></div>
                  Assign Employees
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    All Departments
                  </span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Regular employees from any department</p>
              </div>

              <div className="space-y-4">
                {/* Selected Employees */}
                {selectedEmployees.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Employees ({selectedEmployees.length})
                    </p>
>>>>>>> d285dcb (set submission backend)
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployees.map((emp) => (
                        <div
                          key={emp._id}
<<<<<<< HEAD
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-lg"
                        >
                          <User className="w-3 h-3" />
                          <span className="text-sm font-medium">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEmployee(emp._id)}
                            className="ml-1 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
=======
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-xl shadow-sm"
                        >
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </span>
                          {emp.depId && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              {emp.depId.name}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeEmployee(emp._id)}
                            className="ml-2 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
>>>>>>> d285dcb (set submission backend)
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

<<<<<<< HEAD
=======
                {/* Employees Dropdown Selector */}
>>>>>>> d285dcb (set submission backend)
                <div className="relative employee-selector">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
<<<<<<< HEAD
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-amber-400 focus:ring-3 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-amber-800">
                          EM
                        </span>
=======
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-amber-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <Briefcase className="w-5 h-5" />
>>>>>>> d285dcb (set submission backend)
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Employees</p>
                        <p className="text-sm text-gray-500">
<<<<<<< HEAD
                          {availableEmployees.length} available
=======
                          {availableEmployees.length} employees available
>>>>>>> d285dcb (set submission backend)
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
<<<<<<< HEAD
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : showEmployeeDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showEmployeeDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto employee-dropdown">
                      {availableEmployees.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All employees selected</p>
=======
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : showEmployeeDropdown ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    )}
                  </button>

                  {/* Employees Dropdown */}
                  {showEmployeeDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto employee-dropdown">
                      {availableEmployees.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All employees selected</p>
                          <p className="text-sm mt-1">No more employees available</p>
>>>>>>> d285dcb (set submission backend)
                        </div>
                      ) : (
                        availableEmployees.map((emp) => (
                          <button
                            key={emp._id}
                            type="button"
                            onClick={() => addEmployee(emp)}
                            className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
<<<<<<< HEAD
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-amber-800">
=======
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-amber-800">
>>>>>>> d285dcb (set submission backend)
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </span>
                              </div>
                              <div>
<<<<<<< HEAD
                                <p className="font-medium text-gray-900 text-sm">
                                  {emp.firstName} {emp.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{emp.email}</p>
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-amber-600" />
=======
                                <p className="font-medium text-gray-900">
                                  {emp.firstName} {emp.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{emp.email}</p>
                                {emp.depId && (
                                  <p className="text-xs text-amber-600 mt-0.5">
                                    Department: {emp.depId.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-amber-600" />
>>>>>>> d285dcb (set submission backend)
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

<<<<<<< HEAD
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Task Summary
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600">Total Assignees</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {taskSummary.totalAssignees}
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {taskSummary.duration} days
                    </p>
                  </div>
                </div>
                
                {taskSummary.departments.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600 mb-2">Departments Involved</p>
                    <div className="flex flex-wrap gap-2">
                      {taskSummary.departments.map((dept, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-gray-600 mb-2">Files Attached</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {uploadedFiles.length}
=======
            {/* Assignees Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assignees Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Team Leads</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <p className="font-semibold text-gray-900">
                          {selectedTeamLeads.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {teamLeads.length} total
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Managers</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <p className="font-semibold text-gray-900">
                          {selectedManagers.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {managers.length} total
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Employees</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <p className="font-semibold text-gray-900">
                          {selectedEmployees.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {employees.length} total
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Total Assignees</p>
                  <p className="font-semibold text-gray-900 text-2xl mt-2">
                    {selectedTeamLeads.length + selectedManagers.length + selectedEmployees.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    across {new Set([
                      ...selectedTeamLeads.map(tl => tl.depId?._id),
                      ...selectedManagers.flatMap(mgr => mgr.departments?.map(d => d._id)),
                      ...selectedEmployees.map(emp => emp.depId?._id)
                    ].filter(Boolean)).size} departments
>>>>>>> d285dcb (set submission backend)
                  </p>
                </div>
              </div>
              
              {errors.assignees && (
<<<<<<< HEAD
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">{errors.assignees}</p>
                  </div>
=======
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{errors.assignees}</span>
>>>>>>> d285dcb (set submission backend)
                </div>
              )}
            </div>

<<<<<<< HEAD
            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || isUploading || fetchingData}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Task...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Create Task & Notify Assignees</span>
                </>
              )}
            </button>
            
            <div className="text-center text-gray-600 text-sm">
              <p className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Task will be visible to all assigned members instantly
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Need help?</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Emails will be sent to assignees</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">Real-time notifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {getFileIcon(previewFile.type)}
                <div>
                  <h3 className="font-bold text-gray-900">{previewFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(previewFile.size)} • {previewFile.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              {previewFile.type?.startsWith('image/') && previewFile.preview ? (
                <img
                  src={previewFile.preview}
                  alt={previewFile.name}
                  className="max-w-full h-auto rounded-lg mx-auto"
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 mb-4">Preview not available for this file type</p>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewFile.preview || '#';
                      link.download = previewFile.name;
                      link.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">Task Preview</h3>
                  <p className="text-gray-600">Review before submission</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)] space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Task Title</h4>
                <p className="text-gray-800 bg-gray-50 p-4 rounded-xl">{formData.title || "Not set"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-800 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap">{formData.description || "Not set"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-xl">
                    {formData.startDate} to {formData.endDate}
                    {formData.startTime && formData.endTime && (
                      <span className="block text-gray-600 text-sm mt-1">
                        {formData.startTime} - {formData.endTime}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Files</h4>
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-xl">
                    {uploadedFiles.length} file(s) attached
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Assignees</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Team Leads</p>
                    <p className="font-medium text-gray-900">{selectedTeamLeads.length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Managers</p>
                    <p className="font-medium text-gray-900">{selectedManagers.length}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Employees</p>
                    <p className="font-medium text-gray-900">{selectedEmployees.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
=======
            {/* Task Duration Summary */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Task Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Not set'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Not set'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.startDate && formData.endDate ? 
                      `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days` : 
                      'Not set'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/employee/my-tasks")}
                  className="px-8 py-3.5 text-gray-700 hover:bg-gray-100 border-2 border-gray-200 rounded-xl font-semibold transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || fetchingData}
                  className="flex-1 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
              <p className="text-center text-gray-500 text-sm mt-4">
                Task will be visible to all assigned members
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Briefcase className="w-4 h-4" />
            You can assign tasks to team leads, managers, and employees
          </p>
        </div>
      </div>
>>>>>>> d285dcb (set submission backend)
    </div>
  );
}