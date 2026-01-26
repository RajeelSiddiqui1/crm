"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
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
  File,
  FileText,
  FileVideo,
  Image,
  Video,
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
  BarChart3,
  Users2,
  RefreshCw,
  Info,
  CheckCheck,
  AlertTriangle,
  UserCircle,
  Plus,
  Minus,
  Type,
  TextQuote,
  FileImage,
  Music,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Search,
  Grid,
  List as ListIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  Rocket,
  CloudUpload,
  FileUp,
  CalendarDays,
  CalendarClock,
  FileCog,
  Paperclip,
  FolderArchive,
  FolderPlus,
  FileSearch,
  FolderTree,
  Copy,
  Move,
  HardDrive,
  Cpu,
  Server,
  Monitor,
  Smartphone,
  Globe,
  Check
} from "lucide-react";
import axios from "axios";

export default function ManagerEditSubmissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;

  const [submission, setSubmission] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);
  const [availableTeamLeads, setAvailableTeamLeads] = useState([]);
  const [adminTask, setAdminTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [updatingTeamLead, setUpdatingTeamLead] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null);
  const [selectedTeamLead, setSelectedTeamLead] = useState("");
  const [allTeamLeadsAssigned, setAllTeamLeadsAssigned] = useState(false);
  const [previouslyAssignedTeamLeads, setPreviouslyAssignedTeamLeads] = useState([]);
  const [clinetName, setClinetName] = useState("");
  const [zoom, setZoom] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileToUpload, setFileToUpload] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [fileNames, setFileNames] = useState({});
  
  // Dynamic form state
  const [dynamicFormData, setDynamicFormData] = useState({});
  const [viewMode, setViewMode] = useState("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  
  // File upload handler
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFileToUpload(prev => [...prev, ...files]);
  };

  // File remove handler
  const handleRemoveFile = (fileId) => {
    if (fileId.startsWith('existing-')) {
      // Existing file - mark for removal
      const actualFileId = fileId.replace('existing-', '');
      setFilesToRemove(prev => [...prev, actualFileId]);
    } else {
      // New file - remove from upload list
      setFileToUpload(prev => prev.filter(file => file.name !== fileId));
    }
  };

  // Update file name handler
  const handleFileNameChange = (fileId, newName) => {
    setFileNames(prev => ({
      ...prev,
      [fileId]: newName
    }));
  };

  const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-rose-500" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-violet-500" />;
    if (fileType?.includes('audio')) return <Music className="w-5 h-5 text-emerald-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <File className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (fileType?.includes('zip') || fileType?.includes('compressed')) return <FileArchive className="w-5 h-5 text-amber-500" />;
    if (fileType?.includes('code') || fileType?.includes('text/plain')) return <FileCode className="w-5 h-5 text-indigo-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchSubmissionDetails();
    fetchTeamLeads();
  }, [session, status, router, submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      setFetching(true);
      const response = await axios.get(
        `/api/manager/submissions/${submissionId}`
      );
      if (response.status === 200) {
        const submissionData = response.data;
        setSubmission(submissionData);
        setSelectedTeamLead(submissionData.assignedTo?._id || "");
        setClinetName(submissionData.clinetName || "");

        // Initialize dynamic form data from submission
        const formFields = submissionData.formId?.fields || [];
        const initialDynamicData = {};
        
        formFields.forEach(field => {
          if (submissionData.formData && submissionData.formData[field.name] !== undefined) {
            initialDynamicData[field.name] = submissionData.formData[field.name];
          } else {
            // Set default values based on field type
            switch (field.type) {
              case "checkbox":
              case "toggle":
                initialDynamicData[field.name] = field.checked || false;
                break;
              case "range":
                initialDynamicData[field.name] = field.defaultValue || field.min || 0;
                break;
              case "rating":
                initialDynamicData[field.name] = field.defaultRating || 0;
                break;
              case "date":
                initialDynamicData[field.name] = field.defaultDate || "";
                break;
              case "time":
                initialDynamicData[field.name] = field.defaultTime || "";
                break;
              case "datetime":
                initialDynamicData[field.name] = field.defaultDateTime || "";
                break;
              default:
                initialDynamicData[field.name] = "";
            }
          }
        });
        
        setDynamicFormData(initialDynamicData);

        // Get previously assigned team leads
        if (submissionData.multipleTeamLeadAssigned) {
          const prevAssigned = submissionData.multipleTeamLeadAssigned
            .filter(tl => tl._id)
            .map(tl => ({
              id: tl._id,
              name: `${tl.firstName} ${tl.lastName}`,
              initials: `${tl.firstName[0]}${tl.lastName[0]}`,
              email: tl.email
            }));
          setPreviouslyAssignedTeamLeads(prevAssigned);
        }

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

  const fetchTeamLeads = async () => {
    try {
      const response = await axios.get("/api/manager/teamlead");
      if (response.status === 200) {
        const data = response.data;
        const leads = Array.isArray(data) ? data : data.teamLeads || [];
        setTeamLeads(leads);
        checkAllTeamLeadsAssigned(leads);
      }
    } catch (error) {
      console.error("Error fetching team leads:", error);
      toast.error("Failed to load team leads");
    }
  };

  const checkAllTeamLeadsAssigned = (allLeads) => {
    if (!submission || !allLeads.length) return;

    const allLeadIds = allLeads.map(tl => tl._id);
    const assignedLeadIds = [
      submission.assignedTo?._id,
      ...(submission.multipleTeamLeadAssigned?.map(tl => tl._id) || [])
    ].filter(Boolean);

    const allAssigned = allLeadIds.every(leadId => 
      assignedLeadIds.some(assignedId => assignedId === leadId)
    );

    setAllTeamLeadsAssigned(allAssigned);

    const available = allLeads.filter(lead => 
      !assignedLeadIds.includes(lead._id)
    );
    setAvailableTeamLeads(available);
  };

  useEffect(() => {
    if (teamLeads.length > 0 && submission) {
      checkAllTeamLeadsAssigned(teamLeads);
    }
  }, [teamLeads, submission]);

  const fetchAdminTask = async (adminTaskId) => {
    try {
      const response = await axios.get(`/api/admin/tasks/${adminTaskId}`);
      if (response.status === 200) {
        setAdminTask(response.data);
      }
    } catch (error) {
      console.error("Error fetching admin task:", error);
    }
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setDynamicFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
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
      creditCard: CreditCard,
    };
    return fieldIcons[fieldType] || Type;
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
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-11 rounded-lg"
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
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-11 rounded-lg"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
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
          <div className="relative">
            <TextQuote className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <Textarea
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[100px] rounded-lg"
            />
          </div>
        );
      case "select":
        return (
          <div className="relative">
            <List className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
            <Select
              value={fieldValue}
              onValueChange={(value) =>
                handleDynamicFieldChange(field.name, value)
              }
            >
              <SelectTrigger className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-11 rounded-lg">
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                {field.options?.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={option}
                    className="text-gray-900 hover:bg-blue-50 rounded-md"
                  >
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
            <input
              type="date"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
        );
      case "time":
        return (
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="time"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
        );
      case "datetime":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={fieldValue.split("T")[0] || ""}
                onChange={(e) => {
                  const date = e.target.value;
                  const time = fieldValue.split("T")[1] || "";
                  handleDynamicFieldChange(field.name, time ? `${date}T${time}` : date);
                }}
                className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="time"
                value={fieldValue.split("T")[1] || ""}
                onChange={(e) => {
                  const date = fieldValue.split("T")[0] || "";
                  const time = e.target.value;
                  handleDynamicFieldChange(field.name, date ? `${date}T${time}` : time);
                }}
                className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={fieldValue}
              onCheckedChange={(checked) =>
                handleDynamicFieldChange(field.name, checked)
              }
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <Label className="text-gray-900 cursor-pointer">
              {field.label}
            </Label>
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
                  onChange={(e) =>
                    handleDynamicFieldChange(field.name, e.target.value)
                  }
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
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
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider pl-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{field.min || 0}</span>
              <span className="font-semibold text-blue-600">{fieldValue}</span>
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
                className="focus:outline-none transform hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-6 h-6 transition-all ${
                    i < fieldValue
                      ? "text-amber-500 fill-amber-500"
                      : "text-gray-300 hover:text-amber-300"
                  }`}
                />
              </button>
            ))}
          </div>
        );
      case "toggle":
        return (
          <div className="flex items-center space-x-3">
            <Switch
              checked={fieldValue}
              onCheckedChange={(checked) =>
                handleDynamicFieldChange(field.name, checked)
              }
              className="data-[state=checked]:bg-blue-600"
            />
            <Label className="text-gray-900">{fieldValue ? "On" : "Off"}</Label>
          </div>
        );
      default:
        return (
          <div className="relative">
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              value={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-11 rounded-lg"
            />
          </div>
        );
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
    const files = Array.from(e.dataTransfer.files);
    setFileToUpload(prev => [...prev, ...files]);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!clinetName || clinetName.trim() === "") {
      toast.error("Please enter client name");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Add basic data
      if (clinetName) {
        formData.append("title", clinetName.trim());
      }
      
      if (submission.managerComments) {
        formData.append("managerComments", submission.managerComments);
      }
      
      if (submission.status) {
        formData.append("status", submission.status);
      }
      
      // Add dynamic form data
      formData.append("formData", JSON.stringify(dynamicFormData));
      
      // Add files to remove
      formData.append("removeFiles", JSON.stringify(filesToRemove));
      
      // Add file name updates
      formData.append("fileUpdates", JSON.stringify(fileNames));
      
      // Add new files to upload
      fileToUpload.forEach(file => {
        formData.append("files", file);
      });

      const response = await axios.put(
        `/api/manager/submissions/${submissionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        toast.success("Submission updated successfully!");
        setFileToUpload([]);
        setFilesToRemove([]);
        setFileNames({});
        router.push("/manager/submissions");
      }
    } catch (error) {
      console.error("Update error:", error);
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
      const response = await axios.delete(
        `/api/manager/submissions/${submissionId}`
      );

      if (response.status === 200) {
        toast.success("Submission deleted successfully!");
        router.push("/manager/submissions");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete submission");
    }
  };

  const handleTeamLeadChange = async () => {
    if (!selectedTeamLead) {
      toast.error("Please select a team lead");
      return;
    }

    if (selectedTeamLead === submission.assignedTo?._id) {
      toast.info("Team lead is already assigned");
      return;
    }

    try {
      setUpdatingTeamLead(true);
      const response = await axios.put(
        `/api/manager/submissions/${submissionId}/team-lead`,
        { assignedTo: selectedTeamLead }
      );

      if (response.status === 200) {
        toast.success("Team lead reassigned successfully!");
        fetchSubmissionDetails();
        fetchTeamLeads();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reassign team lead");
    } finally {
      setUpdatingTeamLead(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-700 border-red-200";
      case "medium": return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-500/10 text-green-700 border-green-200";
      default: return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed": case "approved": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": case "approved": return <CheckCircle className="w-3 h-3" />;
      case "in_progress": return <Clock className="w-3 h-3" />;
      case "pending": return <AlertCircle className="w-3 h-3" />;
      case "rejected": return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
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
          <p className="text-gray-700 mb-6">
            The submission you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => router.push("/manager/submissions")}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-2.5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  const formFields = submission.formId?.fields || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/manager/submissions")}
              className="rounded-xl border-blue-200 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 shadow-sm"
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
                  {submission.formId?.title || "Submission Details"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/manager/dashboard")}
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={() => router.push(`/group-chat?submissionId=${submissionId}`)}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Side - Admin Task & Submission Info */}
          <div className="space-y-6">
            {/* Client Name Card */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-xl font-bold">
                        Client Information
                      </CardTitle>
                      <CardDescription className="text-gray-700 font-medium">
                        Update client details
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="clinetName" className="text-gray-800 font-semibold flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-purple-600" />
                      Client Name *
                    </Label>
                    <div className="relative">
                      <Input
                        id="clinetName"
                        type="text"
                        value={clinetName}
                        onChange={(e) => setClinetName(e.target.value)}
                        placeholder="Enter client name"
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                        required
                      />
                      <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      This is a required field for all form submissions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Lead Assignment Card */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-amber-700 rounded-xl flex items-center justify-center">
                      <Users2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-xl font-bold">
                        Assign Team Lead
                      </CardTitle>
                      <CardDescription className="text-gray-700 font-medium">
                        Override current assignment
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white">
                        <AvatarFallback className="bg-blue-600 text-white font-bold">
                          {submission.assignedTo?.firstName?.[0] || "T"}
                          {submission.assignedTo?.lastName?.[0] || "L"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-gray-900 font-bold text-sm">
                          {submission.assignedTo
                            ? `${submission.assignedTo.firstName} ${submission.assignedTo.lastName}`
                            : "Not Assigned"}
                        </span>
                        <p className="text-gray-600 text-xs">
                          {submission.assignedTo?.email || "No team lead assigned"}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                      Current
                    </Badge>
                  </div>

                  {allTeamLeadsAssigned ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-800 text-sm">
                            All Team Leads Already Assigned
                          </h4>
                          <p className="text-yellow-700 text-xs mt-1">
                            Every team lead in your department has been assigned to this submission at some point.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-gray-800 font-semibold">
                        Assign New Team Lead
                      </Label>
                      <div className="flex gap-3">
                        <Select
                          value={selectedTeamLead}
                          onValueChange={setSelectedTeamLead}
                          disabled={updatingTeamLead || allTeamLeadsAssigned}
                        >
                          <SelectTrigger className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                            <SelectValue placeholder={
                              availableTeamLeads.length > 0
                                ? "Select a team lead"
                                : "No available team leads"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeamLeads.length > 0 ? (
                              availableTeamLeads.map((teamLead) => (
                                <SelectItem key={teamLead._id} value={teamLead._id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs bg-green-100 text-green-800">
                                        {teamLead.firstName[0]}
                                        {teamLead.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="text-gray-900 bg-white font-medium">
                                        {teamLead.firstName} {teamLead.lastName}
                                      </span>
                                      {teamLead.designation && (
                                        <p className="text-gray-600 text-xs">
                                          {teamLead.designation}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                No team leads available for assignment
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleTeamLeadChange}
                          disabled={!selectedTeamLead || selectedTeamLead === submission.assignedTo?._id || updatingTeamLead || allTeamLeadsAssigned}
                          className="bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white whitespace-nowrap"
                        >
                          {updatingTeamLead ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reassign
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {previouslyAssignedTeamLeads.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Previously Assigned Team Leads
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {previouslyAssignedTeamLeads.length} total
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previouslyAssignedTeamLeads.map((teamLead) => (
                          <Badge
                            key={teamLead.id}
                            variant="outline"
                            className={`rounded-full px-3 py-1.5 gap-1.5 ${
                              teamLead.id === submission.assignedTo?._id
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className={`text-xs ${
                                teamLead.id === submission.assignedTo?._id
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-200 text-gray-800"
                              }`}>
                                {teamLead.initials}
                              </AvatarFallback>
                            </Avatar>
                            {teamLead.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin Task Reference */}
            {adminTask && (
              <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
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
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        {adminTask.title}
                      </h3>
                      <p className="text-gray-700 text-sm font-medium">
                        {adminTask.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600" />
                          <Label className="text-sm font-semibold text-gray-700">
                            Client
                          </Label>
                        </div>
                        <p className="text-gray-900 font-bold text-sm">
                          {adminTask.clientName || "No client specified"}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <Label className="text-sm font-semibold text-gray-700">
                            Priority
                          </Label>
                        </div>
                        <Badge className={`${getPriorityColor(adminTask.priority)} capitalize text-xs font-bold`}>
                          {adminTask.priority}
                        </Badge>
                      </div>
                    </div>

                    {adminTask.audioUrl && (
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          Voice Instructions
                        </Label>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => playAudio(adminTask.audioUrl)}
                            variant="outline"
                            className={`rounded-xl border-blue-600 ${audioPlaying ? "text-white bg-blue-600" : "text-blue-700"}`}
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
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Side - Edit Form */}
          <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-xl font-bold">
                    Edit Form Data
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    Update submission details
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
                    Form Fields
                  </h3>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                    {formFields.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formFields.map((field, index) => (
                          <div
                            key={field.name}
                            className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white"
                          >
                            <div className="flex items-center gap-2">
                              {getFieldIcon(field.type) &&
                                React.createElement(getFieldIcon(field.type), {
                                  className: "w-4 h-4 text-blue-600",
                                })}
                              <Label className="text-gray-900 font-medium">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </Label>
                            </div>
                            {field.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {field.description}
                              </p>
                            )}
                            {renderFormField(field)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No form fields available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-blue-600" />
                    Attachments
                  </h3>

                  {/* Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload').click()}
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center bg-gradient-to-br from-white to-gray-50
                      cursor-pointer transition-all duration-300
                      ${isDragging
                        ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                        : "border-gray-300 hover:border-blue-400 hover:shadow-md"
                      }
                    `}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="*/*"
                    />

                    <div className="relative z-10">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center
                        ${isDragging
                          ? "bg-gradient-to-br from-blue-600 to-blue-700"
                          : "bg-gradient-to-br from-blue-100 to-blue-50"
                        }`}
                      >
                        {isDragging ? (
                          <CloudUpload className="w-8 h-8 text-white" />
                        ) : (
                          <FileUp className="w-8 h-8 text-blue-600" />
                        )}
                      </div>

                      <p className={`font-semibold mb-2 text-lg
                        ${isDragging ? "text-blue-700" : "text-gray-800"}`}
                      >
                        {isDragging
                          ? "Drop files anywhere!"
                          : "Drag & drop files or click to browse"}
                      </p>

                      <p className="text-gray-600 mb-4 text-sm">
                        Supports all file types • Unlimited files • Up to 10GB each
                      </p>

                      {(fileToUpload.length > 0 || submission.fileAttachments?.length > 0) && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-white rounded-full border border-blue-200 shadow-sm">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-700">
                            {(fileToUpload.length + (submission.fileAttachments?.length || 0))} file(s) attached
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Files List */}
                  {(fileToUpload.length > 0 || (submission.fileAttachments?.length > 0 && filesToRemove.length < submission.fileAttachments.length)) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Paperclip className="w-5 h-5" />
                        Attached Files
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Existing Files */}
                        {submission.fileAttachments?.map((file) => {
                          if (filesToRemove.includes(file._id)) return null;
                          
                          return (
                            <div
                              key={file._id}
                              className="group relative p-4 rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-md"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-3 rounded-lg bg-blue-50">
                                  {getFileIcon(file.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Input
                                    value={fileNames[file._id] || file.name}
                                    onChange={(e) => handleFileNameChange(file._id, e.target.value)}
                                    className="border-0 focus:ring-0 p-0 h-auto font-medium text-gray-900"
                                  />
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs font-medium text-gray-500">
                                      {formatFileSize(file.size)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {file.type}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                  onClick={() => setPreviewFile(file)}
                                >
                                  <Eye className="w-3 h-3 mr-1.5" />
                                  Preview
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                  onClick={() => window.open(file.url, "_blank")}
                                >
                                  <Download className="w-3 h-3 mr-1.5" />
                                  Download
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                  onClick={() => handleRemoveFile(`existing-${file._id}`)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                        {/* New Files to Upload */}
                        {fileToUpload.map((file, index) => (
                          <div
                            key={file.name + index}
                            className="group relative p-4 rounded-xl border border-blue-100 bg-blue-50 transition-all duration-300 hover:shadow-md"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-3 rounded-lg bg-blue-100">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Input
                                  value={fileNames[file.name] || file.name}
                                  onChange={(e) => handleFileNameChange(file.name, e.target.value)}
                                  className="border-0 focus:ring-0 p-0 h-auto font-medium text-gray-900"
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs font-medium text-gray-500">
                                    {formatFileSize(file.size)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {file.type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg"
                                onClick={() => {
                                  const url = URL.createObjectURL(file);
                                  setPreviewFile({ url, name: file.name, type: file.type });
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1.5" />
                                Preview
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                onClick={() => handleRemoveFile(file.name)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        onChange={(e) =>
                          setSubmission((prev) => ({
                            ...prev,
                            managerComments: e.target.value,
                          }))
                        }
                        placeholder="Add your comments, feedback, or approval notes..."
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white min-h-[120px]"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-2.5 flex-1 font-bold"
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
                    className="border-red-600 text-red-700 bg-white hover:bg-red-600 hover:text-white px-6 py-2.5"
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

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(previewFile.type)}
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{previewFile.name}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {previewFile.type} • {previewFile.size ? formatFileSize(previewFile.size) : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(prev => Math.max(0.2, prev - 0.2))}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    disabled={zoom <= 0.2}
                  >
                    -
                  </Button>
                  <span className="text-sm text-gray-700 w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(prev => prev + 0.2)}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (previewFile.url.startsWith('blob:')) {
                      const link = document.createElement('a');
                      link.href = previewFile.url;
                      link.download = previewFile.name;
                      link.click();
                    } else {
                      downloadFile(previewFile.url, previewFile.name);
                    }
                  }}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-50">
              {previewFile.type?.includes('image') ? (
                <div className="relative">
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="rounded-lg mx-auto transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                  />
                  {zoom !== 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      Zoom: {Math.round(zoom * 100)}%
                    </div>
                  )}
                </div>
              ) : previewFile.type?.includes('video') ? (
                <div className="w-full max-w-4xl">
                  <video controls autoPlay className="w-full rounded-lg">
                    <source src={previewFile.url} type={previewFile.type} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : previewFile.type?.includes('pdf') ? (
                <div className="w-full h-full">
                  <iframe
                    src={previewFile.url}
                    className="w-full h-[80vh] border rounded-lg"
                    title={previewFile.name}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700">Preview not available for this file type</p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open(previewFile.url, '_blank')}
                      className="mr-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (previewFile.url.startsWith('blob:')) {
                          const link = document.createElement('a');
                          link.href = previewFile.url;
                          link.download = previewFile.name;
                          link.click();
                        } else {
                          downloadFile(previewFile.url, previewFile.name);
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}