"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  CheckCircle,
  Clock4,
  AlertTriangle,
  Upload,
  File,
  FileText,
  Image,
  Video,
  Trash2,
  Eye,
  Download,
  CloudUpload,
  FileCheck,
  FileX,
  Shield,
  Users2,
  CalendarDays,
  Workflow,
  Target,
  Send,
  Package,
  Zap,
  Bell,
  Mail,
  MessageSquare,
  FolderOpen,
  BarChart3,
  Layers,
  Sparkles,
  FileAudio,
  Paperclip,
  FolderPlus,
  Check,
  AlertOctagon,
  Grid,
  List,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileVideo,
  FileImage,
  FileType,
  Search,
  Filter,
  Play
} from "lucide-react";
import { toast } from "sonner";

export default function EditEmployeeTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [task, setTask] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showTeamLeadDropdown, setShowTeamLeadDropdown] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileHoverId, setFileHoverId] = useState(null);
  const [teamLeadSearch, setTeamLeadSearch] = useState("");
  const [managerSearch, setManagerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  const fileInputRef = useRef(null);
  const teamLeadDropdownRef = useRef(null);
  const managerDropdownRef = useRef(null);
  const employeeDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    status: "pending",
  });

  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: "pending", label: "Pending", icon: AlertCircle, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { value: "in_progress", label: "In Progress", icon: Clock4, color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "completed", label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200" },
    { value: "approved", label: "Approved", icon: CheckCircle, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { value: "rejected", label: "Rejected", icon: AlertTriangle, color: "bg-red-100 text-red-800 border-red-200" },
  ];

  const fileTypeFilters = [
    { value: "all", label: "All Files", icon: File, color: "text-gray-600" },
    { value: "image", label: "Images", icon: Image, color: "text-blue-600" },
    { value: "video", label: "Videos", icon: Video, color: "text-purple-600" },
    { value: "document", label: "Documents", icon: FileText, color: "text-red-600" },
    { value: "pdf", label: "PDFs", icon: FileType, color: "text-red-500" },
    { value: "audio", label: "Audio", icon: FileAudio, color: "text-green-600" },
  ];

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchAllData();
    }
  }, [taskId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (teamLeadDropdownRef.current && !teamLeadDropdownRef.current.contains(event.target)) {
        setShowTeamLeadDropdown(false);
      }
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target)) {
        setShowManagerDropdown(false);
      }
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (previewFile) setPreviewFile(null);
        if (isFullscreen) setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewFile, isFullscreen]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/employee/assigned-subtasks/${taskId}`);
      
      if (response.data) {
        const taskData = response.data;
        setTask(taskData);
        
        setFormData({
          title: taskData.title || "",
          description: taskData.description || "",
          startDate: taskData.startDate ? new Date(taskData.startDate).toISOString().split('T')[0] : "",
          endDate: taskData.endDate ? new Date(taskData.endDate).toISOString().split('T')[0] : "",
          startTime: taskData.startTime || "",
          endTime: taskData.endTime || "",
          status: taskData.status || "pending",
        });

        // Extract and set selected team leads
        const teamLeads = taskData.assignedTeamLead?.map(item => ({
          _id: item.teamLeadId?._id || item.teamLeadId,
          firstName: item.teamLeadId?.firstName || "Unknown",
          lastName: item.teamLeadId?.lastName || "",
          email: item.teamLeadId?.email || "",
          depId: item.teamLeadId?.depId || {}
        })) || [];
        setSelectedTeamLeads(teamLeads);

        // Extract and set selected managers
        const managers = taskData.assignedManager?.map(item => ({
          _id: item.managerId?._id || item.managerId,
          firstName: item.managerId?.firstName || "Unknown",
          lastName: item.managerId?.lastName || "",
          email: item.managerId?.email || "",
          departments: item.managerId?.departments || []
        })) || [];
        setSelectedManagers(managers);

        // Extract and set selected employees
        const employees = taskData.assignedEmployee?.map(item => ({
          _id: item.employeeId?._id || item.employeeId,
          firstName: item.employeeId?.firstName || "Unknown",
          lastName: item.employeeId?.lastName || "",
          email: item.employeeId?.email || "",
          depId: item.employeeId?.depId || {}
        })) || [];
        setSelectedEmployees(employees);

        setExistingFiles(taskData.fileAttachments || []);
      } else {
        toast.error("Task not found");
        router.push("/employee/my-tasks");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task");
      router.push("/employee/my-tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      
      const [teamLeadsRes, managersRes, employeesRes] = await Promise.all([
        axios.get("/api/employee/teamleads"),
        axios.get("/api/employee/managers"),
        axios.get("/api/employee/employees")
      ]);

      if (teamLeadsRes.data.success) setTeamLeads(teamLeadsRes.data.employees || []);
      if (managersRes.data.success) setManagers(managersRes.data.employees || []);
      if (employeesRes.status === 200) setEmployees(employeesRes.data || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setFetchingData(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }


    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const maxSize = 1 * 1024 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 1GB limit`);
        return false;
      }
      return true;
    });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
    }, 100);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const processedFiles = validFiles.map(file => ({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        uploadedAt: new Date().toISOString(),
        isNew: true
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

  const handleRemoveExistingFile = (fileId) => {
    if (confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      const fileToDelete = existingFiles.find(f => f._id === fileId || f.publicId === fileId);
      if (fileToDelete) {
        setFilesToDelete(prev => [...prev, fileToDelete.publicId || fileToDelete._id]);
        setExistingFiles(prev => prev.filter(f => f._id !== fileId && f.publicId !== fileId));
        toast.success("File marked for deletion");
      }
    }
  };

  const handleRemoveNewFile = (fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success("File removed");
  };

  const restoreDeletedFile = (publicId) => {
    const restoredFile = task?.fileAttachments?.find(f => f.publicId === publicId || f._id === publicId);
    if (restoredFile) {
      setExistingFiles(prev => [...prev, restoredFile]);
      setFilesToDelete(prev => prev.filter(id => id !== publicId));
      toast.success("File restored");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType?.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType?.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-green-500" />;
    if (fileType?.includes('pdf')) return <FileType className="w-5 h-5 text-red-500" />;
    if (fileType?.includes('document') || fileType?.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (fileType?.includes('zip') || fileType?.includes('rar')) return <FileArchive className="w-5 h-5 text-yellow-600" />;
    if (fileType?.includes('code') || fileType?.includes('json') || fileType?.includes('javascript')) return <FileCode className="w-5 h-5 text-indigo-600" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeCategory = (fileType) => {
    if (fileType?.startsWith('image/')) return 'image';
    if (fileType?.startsWith('video/')) return 'video';
    if (fileType?.startsWith('audio/')) return 'audio';
    if (fileType?.includes('pdf')) return 'pdf';
    if (fileType?.includes('document') || fileType?.includes('word') || fileType?.includes('excel') || fileType?.includes('sheet')) return 'document';
    return 'other';
  };

  // Team Lead Functions
  const addTeamLead = (teamLead) => {
    if (!selectedTeamLeads.find((tl) => tl._id === teamLead._id)) {
      setSelectedTeamLeads([...selectedTeamLeads, teamLead]);
      toast.success(`${teamLead.firstName} ${teamLead.lastName} added as Team Lead`);
      setTeamLeadSearch("");
    }
  };

  const removeTeamLead = (teamLeadId) => {
    const tl = selectedTeamLeads.find(tl => tl._id === teamLeadId);
    setSelectedTeamLeads(selectedTeamLeads.filter((tl) => tl._id !== teamLeadId));
    toast.info(`${tl?.firstName} ${tl?.lastName} removed from Team Leads`);
  };

  // Manager Functions
  const addManager = (manager) => {
    if (!selectedManagers.find((mgr) => mgr._id === manager._id)) {
      setSelectedManagers([...selectedManagers, manager]);
      toast.success(`${manager.firstName} ${manager.lastName} added as Manager`);
      setManagerSearch("");
    }
  };

  const removeManager = (managerId) => {
    const mgr = selectedManagers.find(mgr => mgr._id === managerId);
    setSelectedManagers(selectedManagers.filter((mgr) => mgr._id !== managerId));
    toast.info(`${mgr?.firstName} ${mgr?.lastName} removed from Managers`);
  };

  // Employee Functions
  const addEmployee = (employee) => {
    if (!selectedEmployees.find((emp) => emp._id === employee._id)) {
      setSelectedEmployees([...selectedEmployees, employee]);
      toast.success(`${employee.firstName} ${employee.lastName} added as Employee`);
      setEmployeeSearch("");
    }
  };

  const removeEmployee = (employeeId) => {
    const emp = selectedEmployees.find(emp => emp._id === employeeId);
    setSelectedEmployees(selectedEmployees.filter((emp) => emp._id !== employeeId));
    toast.info(`${emp?.firstName} ${emp?.lastName} removed from Employees`);
  };

  // Available members (excluding already selected)
  const availableTeamLeads = teamLeads.filter(tl => 
    !selectedTeamLeads.find(selected => selected._id === tl._id)
  ).filter(tl =>
    tl.firstName?.toLowerCase().includes(teamLeadSearch.toLowerCase()) ||
    tl.lastName?.toLowerCase().includes(teamLeadSearch.toLowerCase()) ||
    tl.email?.toLowerCase().includes(teamLeadSearch.toLowerCase())
  );

  const availableManagers = managers.filter(mgr => 
    !selectedManagers.find(selected => selected._id === mgr._id)
  ).filter(mgr =>
    mgr.firstName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
    mgr.lastName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
    mgr.email?.toLowerCase().includes(managerSearch.toLowerCase())
  );

  const availableEmployees = employees.filter(emp => 
    !selectedEmployees.find(selected => selected._id === emp._id)
  ).filter(emp =>
    emp.firstName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredExistingFiles = existingFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || getFileTypeCategory(file.type) === filterType;
    return matchesSearch && matchesType;
  });

  const filteredUploadedFiles = uploadedFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || getFileTypeCategory(file.type) === filterType;
    return matchesSearch && matchesType;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setUpdating(true);
      const formDataToSend = new FormData();
      
      // Basic fields
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("startTime", formData.startTime);
      formDataToSend.append("endTime", formData.endTime);
      formDataToSend.append("status", formData.status);
      
      // Assignees
      formDataToSend.append("assignedTeamLead", JSON.stringify(
        selectedTeamLeads.map(tl => tl._id)
      ));
      formDataToSend.append("assignedManager", JSON.stringify(
        selectedManagers.map(mgr => mgr._id)
      ));
      formDataToSend.append("assignedEmployee", JSON.stringify(
        selectedEmployees.map(emp => emp._id)
      ));
      
      // Files to delete
      formDataToSend.append("filesToDelete", JSON.stringify(filesToDelete));
      
      // New files
      uploadedFiles.forEach(file => {
        formDataToSend.append("files", file.file);
      });

      const response = await axios.put(`/api/employee/assigned-subtasks/${taskId}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.status === 200) {
        toast.success("Task updated successfully!");
        setUploadedFiles([]);
        setFilesToDelete([]);
        fetchTask();
        setTimeout(() => router.push(`/employee/my-tasks/detail${taskId}`), 1500);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.error || "Failed to update task");
    } finally {
      setUpdating(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const clearAllAssignees = () => {
    if (confirm("Are you sure you want to remove all assignees?")) {
      setSelectedTeamLeads([]);
      setSelectedManagers([]);
      setSelectedEmployees([]);
      toast.info("All assignees removed");
    }
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

  const handleDownloadAll = async () => {
    try {
      // Create a zip of all files
      toast.info("Preparing download...");
      // Implementation for downloading all files
    } catch (error) {
      toast.error("Failed to prepare download");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-48 bg-gradient-to-r from-blue-100 to-indigo-200 rounded-2xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-white rounded-2xl"></div>
                <div className="h-96 bg-white rounded-2xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-white rounded-2xl"></div>
                <div className="h-48 bg-white rounded-2xl"></div>
                <div className="h-48 bg-white rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/employee/my-tasks/detail/${taskId}`)}
              className="inline-flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-white hover:border-gray-300 rounded-xl group transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Task</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-4 h-4" />
                Preview Changes
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
                  Edit Task
                </h1>
                <p className="text-blue-100 text-lg">
                  Update task details, assignees, and attachments
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <Package className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">
                      Task ID: {taskId?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <CalendarDays className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">
                      Created: {task?.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <Users2 className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">
                      Assignees: {selectedTeamLeads.length + selectedManagers.length + selectedEmployees.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
                <Save className="w-8 h-8 text-white" />
                <div className="text-xs text-white/80 mt-1 text-center">
                  Edit Mode
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  <p className="text-gray-600">Update basic task information</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter task title"
                    className={`w-full px-4 py-3.5 bg-gray-50 border ${
                      errors.title ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-500`}
                  />
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
                    placeholder="Describe the task in detail..."
                    className={`w-full px-4 py-3.5 bg-gray-50 border ${
                      errors.description ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all resize-none text-gray-900 placeholder-gray-500`}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Status *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({...formData, status: option.value})}
                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          formData.status === option.value 
                            ? `${option.color} border-current scale-[1.02] shadow-sm` 
                            : ' text-gray-900 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <option.icon className={`w-5 h-5 ${
                          formData.status === option.value ? 'opacity-100' : 'opacity-60'
                        }`} />
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Calendar className="inline-block w-4 h-4 mr-2 text-blue-600" />
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Calendar className="inline-block w-4 h-4 mr-2 text-blue-600" />
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
                </div>

                {/* Time Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Clock className="inline-block w-4 h-4 mr-2 text-blue-600" />
                      Start Time
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Clock className="inline-block w-4 h-4 mr-2 text-blue-600" />
                      End Time
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* File Management Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CloudUpload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attachments</h2>
                    <p className="text-gray-600">Manage files with individual control</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-gray-100 shadow" : "hover:bg-gray-100"}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${viewMode === "list" ? "bg-gray-100 shadow" : "hover:bg-gray-100"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {fileTypeFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setFilterType(filter.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        filterType === filter.value 
                          ? "bg-purple-100 text-purple-700 border-purple-300" 
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <filter.icon className={`w-4 h-4 ${filter.color}`} />
                      <span className="text-sm">{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed ${
                  dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                } rounded-2xl p-8 text-center transition-all duration-300 mb-8`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    {isUploading ? <Loader2 className="w-8 h-8 text-purple-600 animate-spin" /> : <Upload className="w-8 h-8 text-purple-600" />}
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
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      <FolderOpen className="w-5 h-5" />
                      Select Files
                    </button>
                  </div>
                </div>
              </div>

              {/* New Files Section */}
              {uploadedFiles.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      New Files ({uploadedFiles.length})
                    </h3>
                    <button
                      onClick={() => setUploadedFiles([])}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  </div>
                  
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredUploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="relative group bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 transition-all hover:shadow-lg"
                          onMouseEnter={() => setFileHoverId(file.id)}
                          onMouseLeave={() => setFileHoverId(null)}
                        >
                          {/* File Preview */}
                          <div className="mb-3">
                            <div className="h-32 rounded-lg bg-white border border-green-100 flex items-center justify-center overflow-hidden">
                              {file.type.startsWith('image/') && file.preview ? (
                                <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="p-4">
                                  {getFileIcon(file.type)}
                                  <p className="text-xs text-gray-600 mt-2 text-center truncate">{file.name}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* File Info */}
                          <div className="space-y-2">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{formatFileSize(file.size)}</span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">NEW</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className={`absolute right-3 top-3 transition-all ${
                            fileHoverId === file.id ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:shadow-md"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleRemoveNewFile(file.id)}
                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:shadow-md"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{file.type}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveNewFile(file.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Existing Files Section */}
              {existingFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <File className="w-5 h-5 text-blue-600" />
                      Existing Files ({existingFiles.length})
                    </h3>
                    <button
                      onClick={handleDownloadAll}
                      className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                  </div>
                  
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredExistingFiles.map((file) => (
                        <div
                          key={file._id || file.publicId}
                          className="relative group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 transition-all hover:shadow-lg"
                          onMouseEnter={() => setFileHoverId(file._id || file.publicId)}
                          onMouseLeave={() => setFileHoverId(null)}
                        >
                          {/* File Preview */}
                          <div className="mb-3">
                            <div 
                              className="h-32 rounded-lg bg-white border border-blue-100 flex items-center justify-center overflow-hidden cursor-pointer"
                              onClick={() => setPreviewFile(file)}
                            >
                              {file.type?.startsWith('image/') ? (
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                              ) : file.type?.startsWith('video/') ? (
                                <div className="relative w-full h-full">
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white" />
                                  </div>
                                  <video className="w-full h-full object-cover opacity-80">
                                    <source src={file.url} type={file.type} />
                                  </video>
                                </div>
                              ) : (
                                <div className="p-4">
                                  {getFileIcon(file.type)}
                                  <p className="text-xs text-gray-600 mt-2 text-center truncate">{file.name}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* File Info */}
                          <div className="space-y-2">
                            <p className="font-medium text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{formatFileSize(file.size)}</span>
                              <span className="text-xs capitalize">{getFileTypeCategory(file.type)}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className={`absolute right-3 top-3 transition-all ${
                            fileHoverId === (file._id || file.publicId) ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:shadow-md"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => window.open(file.url, '_blank')}
                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:shadow-md"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleRemoveExistingFile(file._id || file.publicId)}
                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow hover:shadow-md"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredExistingFiles.map((file) => (
                        <div key={file._id || file.publicId} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{file.type}</span>
                                <span>•</span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {getFileTypeCategory(file.type)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveExistingFile(file._id || file.publicId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Files to Delete Section */}
              {filesToDelete.length > 0 && (
                <div className="mt-8 pt-8 border-t border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileX className="w-5 h-5 text-red-600" />
                      Files to be Deleted ({filesToDelete.length})
                    </h3>
                    <button
                      onClick={() => setFilesToDelete([])}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <RotateCw className="w-4 h-4" />
                      Restore All
                    </button>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {filesToDelete.map((publicId, index) => {
                        const file = task?.fileAttachments?.find(f => f.publicId === publicId || f._id === publicId);
                        return (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white border border-red-300 rounded-lg">
                            {getFileIcon(file?.type)}
                            <span className="text-sm text-gray-700 truncate max-w-[200px]">
                              {file?.name || `File ${index + 1}`}
                            </span>
                            <button
                              onClick={() => restoreDeletedFile(publicId)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      These files will be permanently deleted when you update the task.
                    </p>
                  </div>
                </div>
              )}

              {/* No Files Message */}
              {existingFiles.length === 0 && uploadedFiles.length === 0 && (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No files attached to this task</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload files using the upload button above
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Assignees & Actions */}
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
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeamLeads.map((tl) => (
                        <div
                          key={tl._id}
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
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative" ref={teamLeadDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowTeamLeadDropdown(!showTeamLeadDropdown)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-green-400 focus:ring-3 focus:ring-green-500/30 focus:border-green-500 outline-none transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-green-800">TL</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Team Leads</p>
                        <p className="text-sm text-gray-500">
                          {availableTeamLeads.length} available
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : showTeamLeadDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showTeamLeadDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search team leads..."
                            value={teamLeadSearch}
                            onChange={(e) => setTeamLeadSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto">
                        {availableTeamLeads.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="font-medium">
                              {teamLeadSearch ? "No team leads found" : "All team leads selected"}
                            </p>
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
                                <div className="w-8 h-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-green-800">
                                    {tl.firstName?.[0]}{tl.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {tl.firstName} {tl.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">{tl.email}</p>
                                  {tl.depId?.name && (
                                    <p className="text-xs text-green-600 mt-0.5">
                                      {tl.depId.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-green-600" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedManagers.map((mgr) => (
                        <div
                          key={mgr._id}
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
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative" ref={managerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-purple-400 focus:ring-3 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-200 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-purple-800">MG</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Managers</p>
                        <p className="text-sm text-gray-500">
                          {availableManagers.length} available
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : showManagerDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showManagerDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search managers..."
                            value={managerSearch}
                            onChange={(e) => setManagerSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto">
                        {availableManagers.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="font-medium">
                              {managerSearch ? "No managers found" : "All managers selected"}
                            </p>
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
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-purple-800">
                                    {mgr.firstName?.[0]}{mgr.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {mgr.firstName} {mgr.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">{mgr.email}</p>
                                  {mgr.departments?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      {mgr.departments.slice(0, 2).map((dept, idx) => (
                                        <span key={idx} className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                                          {dept.name}
                                        </span>
                                      ))}
                                      {mgr.departments.length > 2 && (
                                        <span className="text-xs text-gray-500">+{mgr.departments.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-purple-600" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployees.map((emp) => (
                        <div
                          key={emp._id}
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
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative" ref={employeeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-amber-400 focus:ring-3 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-amber-800">EM</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Employees</p>
                        <p className="text-sm text-gray-500">
                          {availableEmployees.length} available
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : showEmployeeDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showEmployeeDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search employees..."
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto">
                        {availableEmployees.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="font-medium">
                              {employeeSearch ? "No employees found" : "All employees selected"}
                            </p>
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
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-amber-800">
                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {emp.firstName} {emp.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">{emp.email}</p>
                                  {emp.depId?.name && (
                                    <p className="text-xs text-amber-600 mt-0.5">
                                      {emp.depId.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-amber-600" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Update Summary
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600">Total Assignees</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {selectedTeamLeads.length + selectedManagers.length + selectedEmployees.length}
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formData.startDate && formData.endDate ? 
                        `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days` : 
                        'Not set'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-gray-600 mb-2">Files Management</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{existingFiles.length}</p>
                      <p className="text-xs text-gray-500">Existing</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{uploadedFiles.length}</p>
                      <p className="text-xs text-gray-500">New</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{filesToDelete.length}</p>
                      <p className="text-xs text-gray-500">To Delete</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-gray-600 mb-2">Current Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      formData.status === 'completed' || formData.status === 'approved' ? 'bg-green-500' :
                      formData.status === 'in_progress' ? 'bg-blue-500' :
                      formData.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium text-gray-900 capitalize">
                      {formData.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleSubmit}
                disabled={updating || isUploading}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating Task...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Update Task</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push(`/employee/my-tasks/detail/${taskId}`)}
                  className="px-4 py-3 text-gray-700 hover:bg-gray-100 border-2 border-gray-200 rounded-xl font-medium transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
                      axios.delete(`/api/employee/assigned-subtasks/${taskId}`)
                        .then(() => {
                          toast.success("Task deleted successfully!");
                          router.push("/employee/my-tasks");
                        })
                        .catch(error => {
                          toast.error("Failed to delete task");
                          console.error(error);
                        });
                    }
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white font-medium rounded-xl hover:from-red-700 hover:to-rose-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              </div>

              <button
                type="button"
                onClick={clearAllAssignees}
                className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-2 border-gray-200 rounded-xl font-medium transition-all duration-200 hover:border-gray-300"
              >
                Clear All Assignees
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-700">Files marked for deletion will be permanently removed</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">Assignees will be notified of changes</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Email notifications will be sent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced File Preview Modal */}
      {previewFile && (
        <div className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'p-4'} flex items-center justify-center`}>
          <div className={`bg-white ${isFullscreen ? 'w-full h-full' : 'rounded-2xl max-w-[95vw] max-h-[95vh]'} overflow-hidden flex flex-col shadow-2xl`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(previewFile.type)}
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{previewFile.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{formatFileSize(previewFile.size)}</span>
                    <span>•</span>
                    <span>{previewFile.type}</span>
                    <span>•</span>
                    <span className="capitalize">{getFileTypeCategory(previewFile.type)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setZoom(prev => Math.max(0.2, prev - 0.2))}
                    className="p-2 hover:bg-gray-200 rounded"
                    disabled={zoom <= 0.2}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-sm text-gray-700 w-16 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(prev => prev + 0.2)}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                
                {/* Download Button */}
                <button
                  onClick={() => previewFile.url ? window.open(previewFile.url, '_blank') : toast.error('No download URL available')}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    setPreviewFile(null);
                    setIsFullscreen(false);
                    setZoom(1);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4">
              {previewFile.type?.startsWith('image/') ? (
                <div className="relative">
                  <img
                    src={previewFile.url || previewFile.preview}
                    alt={previewFile.name}
                    className="transition-transform duration-200 rounded-lg shadow-xl"
                    style={{ transform: `scale(${zoom})` }}
                  />
                  {zoom !== 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                      Zoom: {Math.round(zoom * 100)}%
                    </div>
                  )}
                </div>
              ) : previewFile.type?.startsWith('video/') ? (
                <div className="w-full max-w-4xl">
                  <video
                    controls
                    autoPlay
                    className="w-full rounded-lg shadow-xl"
                    style={{ transform: `scale(${zoom})` }}
                  >
                    <source src={previewFile.url} type={previewFile.type} />
                  </video>
                </div>
              ) : previewFile.type?.includes('pdf') ? (
                <div className="w-full h-full">
                  <iframe
                    src={previewFile.url}
                    className="w-full h-full border-0"
                    title={previewFile.name}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg mb-4">Preview not available for this file type</p>
                  {previewFile.url && (
                    <button
                      onClick={() => window.open(previewFile.url, '_blank')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Open in New Tab
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Changes Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">Preview Changes</h3>
                  <p className="text-gray-600">Review before updating</p>
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
                <p className="text-gray-800 bg-gray-50 p-4 rounded-xl">{formData.title}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Status Change</h4>
                <p className="text-gray-800 bg-gray-50 p-4 rounded-xl capitalize">
                  {task?.status} → {formData.status}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Assignees Summary</h4>
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
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Files Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Existing</p>
                    <p className="font-medium text-gray-900">{existingFiles.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">New</p>
                    <p className="font-medium text-gray-900">{uploadedFiles.length}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">To Delete</p>
                    <p className="font-medium text-gray-900">{filesToDelete.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}