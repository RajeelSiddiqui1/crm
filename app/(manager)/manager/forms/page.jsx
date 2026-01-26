"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Progress } from "@/components/ui/progress";
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
  AlertCircle,
  Filter,
  Grid,
  List as ListIcon,
  MoreVertical,
  Copy,
  Move,
  Archive,
  RefreshCw,
  Battery,
  Wifi,
  Signal,
  Monitor,
  Smartphone,
  Database,
  Cpu,
  MemoryStick,
  HardDrive as HardDriveIcon,
  Network,
  Server,
  Globe,
  Shield as ShieldIcon,
  Zap,
  Cloud,
  Layers,
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
  const [viewMode, setViewMode] = useState("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [storageStats, setStorageStats] = useState({
    used: 45.2,
    total: 100,
    files: 128,
  });

  // Main form data
  const [formData, setFormData] = useState({
    clientName: "",
    assignmentType: "single",
    assignedTo: "",
    multipleTeamLeadAssigned: [],
    teamLeadFeedback: "",
    priority: "medium",
   
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
    printCopy: false,
    autoOrganize: true,
  });

  const [showPasswords, setShowPasswords] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [selectedAttachmentType, setSelectedAttachmentType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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
    form.fields?.forEach((field) => {
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

    // Reset attachments
    setAttachments({
      files: [],
      folders: [],
      notes: "",
      isEncrypted: false,
      shareWithClient: false,
      printCopy: false,
      autoOrganize: true,
    });

    setFormData({
      clientName: "",
      assignmentType: "single",
      assignedTo: "",
      multipleTeamLeadAssigned: [],
      teamLeadFeedback: "",
      priority: "medium",
      dueDate: "",
      dueTime: "",
      notes: "",
    });

    setShowPasswords({});
    setDragOver(false);
    setUploadProgress({});
    setIsDragging(false);
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setDynamicFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // File upload handler with large file support
  const handleFileUpload = (files) => {
    const fileArray = Array.from(files);
    let totalSize = 0;

    // Check total size (max 10GB)
    fileArray.forEach((file) => {
      totalSize += file.size;
    });

    if (totalSize > 10 * 1024 * 1024 * 1024) {
      // 10GB
      toast.error("Total file size exceeds 10GB limit");
      return;
    }

    const newFiles = fileArray.map((file) => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: "pending",
      progress: 0,
      category: getFileCategory(file.type),
    }));

    setAttachments((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));

    // Simulate upload progress for each file
    newFiles.forEach((fileObj) => {
      simulateUpload(fileObj.id, fileObj.size);
    });

    toast.success(`${fileArray.length} file(s) added successfully`);
  };

  const getFileCategory = (type) => {
    if (type.startsWith("image/")) return "images";
    if (type.startsWith("video/")) return "videos";
    if (type.startsWith("audio/")) return "audio";
    if (type.includes("pdf")) return "documents";
    if (type.includes("word") || type.includes("document")) return "documents";
    if (type.includes("excel") || type.includes("spreadsheet"))
      return "spreadsheets";
    if (type.includes("zip") || type.includes("compressed")) return "archives";
    return "others";
  };

  // Simulate upload with progress tracking
  const simulateUpload = (fileId, fileSize) => {
    let progress = 0;
    const intervalTime = fileSize > 100000000 ? 100 : 50; // Faster for smaller files

    const interval = setInterval(() => {
      progress += Math.random() * 5 + 1; // Random increment for realism

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setAttachments((prev) => ({
          ...prev,
          files: prev.files.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: "completed" } : f,
          ),
        }));

        // Update storage stats
        setStorageStats((prev) => ({
          ...prev,
          files: prev.files + 1,
          used: Math.min(
            prev.used + fileSize / (1024 * 1024 * 1024),
            prev.total,
          ),
        }));

        toast.success("File uploaded successfully!");
      } else {
        setAttachments((prev) => ({
          ...prev,
          files: prev.files.map((f) =>
            f.id === fileId
              ? { ...f, progress: Math.min(progress, 99), status: "uploading" }
              : f,
          ),
        }));
      }
    }, intervalTime);
  };

  const handleRemoveFile = (fileId) => {
    const file = attachments.files.find((f) => f.id === fileId);
    setAttachments((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));

    // Update storage stats
    if (file) {
      setStorageStats((prev) => ({
        ...prev,
        files: prev.files - 1,
        used: Math.max(0, prev.used - file.size / (1024 * 1024 * 1024)),
      }));
    }

    toast.info("File removed");
  };

  const handleCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName && folderName.trim()) {
      setAttachments((prev) => ({
        ...prev,
        folders: [
          ...prev.folders,
          {
            id: Date.now(),
            name: folderName.trim(),
            createdAt: new Date(),
            fileCount: 0,
            size: 0,
          },
        ],
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
    let files = attachments.files;

    // Filter by type
    if (selectedAttachmentType !== "all") {
      files = files.filter((file) => file.category === selectedAttachmentType);
    }

    // Sort files
    switch (sortBy) {
      case "newest":
        return files.sort(
          (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt),
        );
      case "oldest":
        return files.sort(
          (a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt),
        );
      case "largest":
        return files.sort((a, b) => b.size - a.size);
      case "smallest":
        return files.sort((a, b) => a.size - b.size);
      case "name":
        return files.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return files;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/"))
      return <FileImage className="w-5 h-5 text-rose-500" />;
    if (fileType.startsWith("video/"))
      return <FileVideo className="w-5 h-5 text-violet-500" />;
    if (fileType.startsWith("audio/"))
      return <Music className="w-5 h-5 text-emerald-500" />;
    if (fileType.includes("pdf"))
      return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FileType className="w-5 h-5 text-blue-500" />;
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    if (fileType.includes("code") || fileType.includes("text/plain"))
      return <FileCode className="w-5 h-5 text-indigo-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getFileColor = (fileType) => {
    if (fileType.startsWith("image/")) return "bg-rose-50 border-rose-200";
    if (fileType.startsWith("video/")) return "bg-violet-50 border-violet-200";
    if (fileType.startsWith("audio/"))
      return "bg-emerald-50 border-emerald-200";
    if (fileType.includes("pdf")) return "bg-red-50 border-red-200";
    if (fileType.includes("word") || fileType.includes("document"))
      return "bg-blue-50 border-blue-200";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "bg-emerald-50 border-emerald-200";
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return "bg-amber-50 border-amber-200";
    return "bg-gray-50 border-gray-200";
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

      if (
        formData.assignmentType === "multiple" &&
        formData.multipleTeamLeadAssigned.length === 0
      ) {
        toast.error("Please select at least one team lead");
        setLoading(false);
        return;
      }

      // Prepare FormData
      const formDataToSend = new FormData();

      // Add basic form data
      formDataToSend.append("formId", selectedForm._id);
      formDataToSend.append("clientName", formData.clientName.trim());
      formDataToSend.append("assignmentType", formData.assignmentType);

      // Add assignment data based on type
      if (formData.assignmentType === "single" && formData.assignedTo) {
        formDataToSend.append("assignedTo", formData.assignedTo);
      }

      if (
        formData.assignmentType === "multiple" &&
        formData.multipleTeamLeadAssigned.length > 0
      ) {
        formDataToSend.append(
          "multipleTeamLeadAssigned",
          JSON.stringify(formData.multipleTeamLeadAssigned),
        );
      }

      // Add due date and time
      if (formData.dueDate) {
        formDataToSend.append("dueDate", formData.dueDate);
      }
      if (formData.dueTime) {
        formDataToSend.append("dueTime", formData.dueTime);
      }

      // Add priority
      formDataToSend.append("priority", formData.priority);

      // Add form fields data
      const dynamicFormDataObj = {};
      selectedForm.fields?.forEach((field) => {
        const value = dynamicFormData[field.name];
        if (value !== undefined && value !== null) {
          dynamicFormDataObj[field.name] = value;
        }
      });

      formDataToSend.append("formData", JSON.stringify(dynamicFormDataObj));

      // Add attachment files
      attachments.files.forEach((fileObj) => {
        if (fileObj.file) {
          formDataToSend.append("files", fileObj.file);
        }
      });

      // Add attachment settings
      formDataToSend.append(
        "attachments",
        JSON.stringify({
          notes: attachments.notes,
          isEncrypted: attachments.isEncrypted,
          shareWithClient: attachments.shareWithClient,
          printCopy: attachments.printCopy,
          autoOrganize: attachments.autoOrganize,
        }),
      );

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
        },
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
      toast.error(error.response?.data?.error || "Failed to submit form");
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
      creditCard: CreditCard,
    };
    return fieldIcons[fieldType] || Type;
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
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
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-11 rounded-lg"
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
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.value)
              }
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-11 rounded-lg"
              required={field.required}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600"
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
              placeholder={
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }
              className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 min-h-[100px] rounded-lg"
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
              onValueChange={(value) =>
                handleDynamicFieldChange(field.name, value)
              }
            >
              <SelectTrigger className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-11 rounded-lg">
                <SelectValue
                  placeholder={
                    field.placeholder || `Select ${field.label.toLowerCase()}`
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                {field.options?.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={option}
                    className="text-gray-900 hover:bg-purple-50 rounded-md"
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
              className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
              required={field.required}
              min={field.minDate || ""}
              max={field.maxDate || ""}
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
              className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
              required={field.required}
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
                  handleDynamicFieldChange(
                    field.name,
                    time ? `${date}T${time}` : date,
                  );
                }}
                className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                required={field.required}
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
                  handleDynamicFieldChange(
                    field.name,
                    date ? `${date}T${time}` : time,
                  );
                }}
                className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                required={field.required}
              />
            </div>
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={fieldValue}
              onChange={(e) =>
                handleDynamicFieldChange(field.name, e.target.checked)
              }
              className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              required={field.required}
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
                  className="w-4 h-4 text-purple-600 bg-white border-gray-300 focus:ring-purple-500"
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
                onChange={(e) =>
                  handleDynamicFieldChange(field.name, parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider pl-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                required={field.required}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{field.min || 0}</span>
              <span className="font-semibold text-purple-600">
                {fieldValue}
              </span>
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
            <button
              type="button"
              onClick={() => handleDynamicFieldChange(field.name, !fieldValue)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                fieldValue ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  fieldValue ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
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
              className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-11 rounded-lg"
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
      dueTime: "",
      notes: "",
    });
    setDynamicFormData({});
    setAttachments({
      files: [],
      folders: [],
      notes: "",
      isEncrypted: false,
      shareWithClient: false,
      printCopy: false,
      autoOrganize: true,
    });
    setSelectedForm(null);
    setShowForm(false);
    setActiveTab("form");
    setShowPasswords({});
    setDragOver(false);
    setIsDragging(false);
    setUploadProgress({});
  };

  const filteredForms = forms.filter(
    (form) =>
      form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get file type statistics
  const getFileStats = () => {
    const stats = {
      images: 0,
      videos: 0,
      documents: 0,
      spreadsheets: 0,
      audio: 0,
      archives: 0,
      others: 0,
    };

    attachments.files.forEach((file) => {
      stats[file.category] = (stats[file.category] || 0) + 1;
    });

    return stats;
  };

  const fileStats = getFileStats();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <FileCog className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
          </div>
          <span className="text-gray-700 font-medium">
            Loading Dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.2) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-200">
                  <FileCog className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">
                  Form Management Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Assign forms with attachments to team leads • Secure &
                  Efficient
                </p>
              </div>
            </div>
          
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search forms by title or description..."
                className="pl-10 bg-white/80 backdrop-blur-sm border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-12 rounded-xl shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-200 h-12 px-6 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
           <a href="/manager/managerforms">New Form</a>   
            </Button>
          </div>
        </div>

       

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forms List */}
          <div className="lg:col-span-4">
            <Card className="border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-purple-600" />
                      Available Forms
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Select a form to assign with attachments
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                   <Button
  variant={viewMode === "grid" ? "default" : "outline"}
  size="sm"
  onClick={() => setViewMode("grid")}
  className={`h-9 px-3 rounded-lg transition-all
    ${viewMode === "grid"
      ? "bg-purple-600 text-white hover:bg-purple-700"
      : "text-gray-600 hover:text-purple-600 hover:border-purple-400"}
  `}
>
  <Grid className="w-4 h-4" />
</Button>

<Button
  variant={viewMode === "list" ? "default" : "outline"}
  size="sm"
  onClick={() => setViewMode("list")}
  className={`h-9 px-3 rounded-lg transition-all
    ${viewMode === "list"
      ? "bg-purple-600 text-white hover:bg-purple-700"
      : "text-gray-600 hover:text-purple-600 hover:border-purple-400"}
  `}
>
  <ListIcon className="w-4 h-4" />
</Button>

                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {fetching ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      <span className="text-gray-700">Loading forms...</span>
                    </div>
                  </div>
                ) : filteredForms.length === 0 ? (
                  <div className="text-center py-16">
                    <FileSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {forms.length === 0
                        ? "No forms available"
                        : "No matches found"}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {forms.length === 0
                        ? "No forms have been created for your department yet."
                        : "Try adjusting your search terms."}
                    </p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {filteredForms.map((form) => (
                      <div
                        key={form._id}
                        className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => handleFormSelect(form)}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 transition-colors">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                              {form.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {form.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {form.fields?.slice(0, 3).map((field, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs border-gray-200 text-gray-700 px-2 py-0.5"
                            >
                              {getFieldIcon(field.type) &&
                                React.createElement(getFieldIcon(field.type), {
                                  className: "w-2.5 h-2.5 mr-1",
                                })}
                              {field.label}
                            </Badge>
                          ))}
                          {form.fields?.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5"
                            >
                              +{form.fields.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(form.createdAt)}</span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-900 py-4">
                            Form Details
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-4">
                            Fields
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-4">
                            Created
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-4">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredForms.map((form) => (
                          <TableRow key={form._id} className="hover:bg-gray-50">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="border border-gray-200">
                                  <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 font-semibold">
                                    {form.title?.charAt(0) || "F"}
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
                                  const IconComponent = getFieldIcon(
                                    field.type,
                                  );
                                  return (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs border-gray-200 text-gray-700"
                                    >
                                      <IconComponent className="w-3 h-3 mr-1" />
                                      {field.label}
                                    </Badge>
                                  );
                                })}
                                {form.fields?.length > 4 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-gray-100 text-gray-700"
                                  >
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
                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm rounded-lg"
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
          </div>

          {/* Sidebar - Quick Stats & Actions */}
  
        </div>

        {/* Form Submission Modal */}
        {showForm && selectedForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="border border-gray-200 shadow-2xl bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-700 to-purple-900 text-white sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                      <FileSignature className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">
                        Assign: {selectedForm.title}
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Fill form and add attachments • Secure submission
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetForm}
                    className="h-9 w-9 text-white hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/20 mt-4">
                  <button
                    onClick={() => setActiveTab("form")}
                    className={`px-5 py-3 font-medium text-sm transition-all relative ${
                      activeTab === "form"
                        ? "text-white"
                        : "text-purple-200 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Form Details
                    </div>
                    {activeTab === "form" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("attachments")}
                    className={`px-5 py-3 font-medium text-sm transition-all relative ${
                      activeTab === "attachments"
                        ? "text-white"
                        : "text-purple-200 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments
                      {attachments.files.length > 0 && (
                        <Badge className="ml-1.5 bg-white text-purple-700 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center text-xs">
                          {attachments.files.length}
                        </Badge>
                      )}
                    </div>
                    {activeTab === "attachments" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("assignment")}
                    className={`px-5 py-3 font-medium text-sm transition-all relative ${
                      activeTab === "assignment"
                        ? "text-white"
                        : "text-purple-200 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assignment
                    </div>
                    {activeTab === "assignment" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                    )}
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
                <form onSubmit={handleSubmit}>
                  {/* Form Tab */}
                  {activeTab === "form" && (
                    <div className="space-y-6">
                      {/* Client Information */}
                      <div className="space-y-4 p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCircle className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Client Information
                          </h3>
                          <span className="text-red-500 ml-1">*</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Client Name *
                            </Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <Input
                                value={formData.clientName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    clientName: e.target.value,
                                  })
                                }
                                placeholder="Enter client name"
                                className="pl-10 h-11 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Priority
                            </Label>
                            <Select
                              value={formData.priority}
                              onValueChange={(value) =>
                                setFormData({ ...formData, priority: value })
                              }
                            >
                              <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                                <SelectItem
                                  value="low"
                                  className="text-gray-900 hover:bg-green-50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Low Priority
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="medium"
                                  className="text-gray-900 hover:bg-amber-50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    Medium Priority
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="high"
                                  className="text-gray-900 hover:bg-red-50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    High Priority
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                     
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <FileDigit className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Form Fields
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-3">
                          {selectedForm.fields?.map((field, index) => (
                            <div
                              key={field.name}
                              className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
                            >
                              <div className="flex items-center gap-2">
                                {getFieldIcon(field.type) &&
                                  React.createElement(
                                    getFieldIcon(field.type),
                                    { className: "w-4 h-4 text-purple-600" },
                                  )}
                                <Label className="text-gray-900 font-medium">
                                  {field.label}{" "}
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
                      </div>
                    </div>
                  )}

                  {/* Attachments Tab */}
                  {activeTab === "attachments" && (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-200">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FolderArchive className="w-5 h-5 text-purple-600" />
                            File Attachments
                          </h3>
                          <p className="text-gray-600 mt-1">
                            Upload any file type • Max 10GB total • Secure
                            storage
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200">
                            <Cpu className="w-3 h-3 mr-1" />
                            Auto-optimized
                          </Badge>
                          <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200">
                            <Server className="w-3 h-3 mr-1" />
                            Multi-server
                          </Badge>
                        </div>
                      </div>

                      {/* Upload Area */}
                      <div className="space-y-4">
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() =>
                            document.getElementById("file-upload").click()
                          }
                          className={`
                                                        relative border-2 border-dashed rounded-xl p-8 text-center bg-gradient-to-br from-white to-gray-50
                                                        cursor-pointer transition-all duration-300
                                                        ${
                                                          isDragging
                                                            ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-100"
                                                            : "border-gray-300 hover:border-purple-400 hover:shadow-md"
                                                        }
                                                    `}
                        >
                          <input
                            type="file"
                            id="file-upload"
                            multiple // agar multiple files chahiye
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                            accept="*/*" // sab file types
                          />

                          <div className="relative z-10">
                            <div
                              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center
                                                            ${
                                                              isDragging
                                                                ? "bg-gradient-to-br from-purple-600 to-purple-700"
                                                                : "bg-gradient-to-br from-purple-100 to-purple-50"
                                                            }`}
                            >
                              {isDragging ? (
                                <CloudUpload className="w-8 h-8 text-white" />
                              ) : (
                                <FileUp className="w-8 h-8 text-purple-600" />
                              )}
                            </div>

                            <p
                              className={`font-semibold mb-2 text-lg
                                                            ${isDragging ? "text-purple-700" : "text-gray-800"}`}
                            >
                              {isDragging
                                ? "Drop files anywhere!"
                                : "Drag & drop files or click to browse"}
                            </p>

                            <p className="text-gray-600 mb-4 text-sm">
                              Supports all file types • Unlimited files • Up to
                              10GB each
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                              <Badge
                                variant="outline"
                                className="border-gray-200 text-gray-700"
                              >
                                <Monitor className="w-3 h-3 mr-1" />
                                Desktop files
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-gray-200 text-gray-700"
                              >
                                <Smartphone className="w-3 h-3 mr-1" />
                                Mobile files
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-gray-200 text-gray-700"
                              >
                                <Globe className="w-3 h-3 mr-1" />
                                Web files
                              </Badge>
                            </div>

                            {attachments.files.length > 0 && (
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-white rounded-full border border-purple-200 shadow-sm">
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-purple-700">
                                  {attachments.files.length} file
                                  {attachments.files.length !== 1 ? "s" : ""}{" "}
                                  ready
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Background Pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.3) 2px, transparent 0)`,
                                backgroundSize: "20px 20px",
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Controls */}
                        {attachments.files.length > 0 && (
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <Label className="text-gray-700 font-medium">
                                Filter:
                              </Label>
                              <Select
                                value={selectedAttachmentType}
                                onValueChange={handleAttachmentTypeFilter}
                              >
                                <SelectTrigger className="w-40 h-9">
                                  <SelectValue placeholder="All files" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All files</SelectItem>
                                  <SelectItem value="images">Images</SelectItem>
                                  <SelectItem value="videos">Videos</SelectItem>
                                  <SelectItem value="documents">
                                    Documents
                                  </SelectItem>
                                  <SelectItem value="spreadsheets">
                                    Spreadsheets
                                  </SelectItem>
                                  <SelectItem value="audio">Audio</SelectItem>
                                  <SelectItem value="archives">
                                    Archives
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-gray-700 font-medium">
                                Sort by:
                              </Label>
                              <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40 h-9">
                                  <SelectValue placeholder="Newest first" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="newest">
                                    Newest first
                                  </SelectItem>
                                  <SelectItem value="oldest">
                                    Oldest first
                                  </SelectItem>
                                  <SelectItem value="largest">
                                    Largest first
                                  </SelectItem>
                                  <SelectItem value="smallest">
                                    Smallest first
                                  </SelectItem>
                                  <SelectItem value="name">
                                    Name (A-Z)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCreateFolder}
                              className="flex items-center gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              <FolderPlus className="w-4 h-4" />
                              New Folder
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Files Grid */}
                      {filteredAttachments().length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Paperclip className="w-5 h-5" />
                              Uploaded Files ({filteredAttachments().length})
                              <span className="text-sm font-normal text-gray-600 ml-2">
                                •{" "}
                                {formatFileSize(
                                  attachments.files.reduce(
                                    (acc, file) => acc + file.size,
                                    0,
                                  ),
                                )}{" "}
                                total
                              </span>
                            </h4>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <Copy className="w-4 h-4 mr-1.5" />
                                Copy All
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <Move className="w-4 h-4 mr-1.5" />
                                Move All
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAttachments().map((fileObj) => (
                              <div
                                key={fileObj.id}
                                className={`group relative p-4 rounded-xl border transition-all duration-300 ${getFileColor(fileObj.type)} hover:shadow-md`}
                              >
                                {/* Status Badge */}
                                {fileObj.status === "uploading" && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Uploading
                                    </div>
                                  </div>
                                )}
                                {fileObj.status === "completed" && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                                      <CheckCircle className="w-3 h-3" />
                                      Ready
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-start gap-3">
                                  <div
                                    className={`p-3 rounded-lg ${getFileColor(fileObj.type).replace("border", "border").replace("bg", "bg")}`}
                                  >
                                    {getFileIcon(fileObj.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="font-medium text-gray-900 truncate"
                                      title={fileObj.name}
                                    >
                                      {fileObj.name}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs font-medium text-gray-500">
                                        {formatFileSize(fileObj.size)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          fileObj.uploadedAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>

                                    {/* Progress Bar */}
                                    {fileObj.status === "uploading" && (
                                      <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                          <span>Uploading...</span>
                                          <span>
                                            {Math.round(fileObj.progress)}%
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                                            style={{
                                              width: `${fileObj.progress}%`,
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                  >
                                    <EyeIcon className="w-3 h-3 mr-1.5" />
                                    Preview
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                  >
                                    <Download className="w-3 h-3 mr-1.5" />
                                    Download
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFile(fileObj.id);
                                    }}
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
                  )}

                  {/* Assignment Tab */}
                  {activeTab === "assignment" && (
                    <div className="space-y-6">
                      {/* Assignment Type */}
                      <div className="space-y-4 p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                        <Label className="text-gray-900 font-semibold text-lg mb-4">
                          Assignment Configuration
                        </Label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div
                            className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                              formData.assignmentType === "single"
                                ? "border-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-sm"
                                : "border-gray-200 hover:border-purple-300 hover:shadow-sm hover:bg-gray-50"
                            }`}
                            onClick={() => handleAssignmentTypeChange("single")}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                  formData.assignmentType === "single"
                                    ? "border-purple-500 bg-purple-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {formData.assignmentType === "single" && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-5 h-5 text-purple-600" />
                                  <span className="font-semibold text-gray-900">
                                    Single Team Lead
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Assign to one primary team lead for focused
                                  work
                                </p>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                              formData.assignmentType === "multiple"
                                ? "border-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-sm"
                                : "border-gray-200 hover:border-purple-300 hover:shadow-sm hover:bg-gray-50"
                            }`}
                            onClick={() =>
                              handleAssignmentTypeChange("multiple")
                            }
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                  formData.assignmentType === "multiple"
                                    ? "border-purple-500 bg-purple-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {formData.assignmentType === "multiple" && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-5 h-5 text-purple-600" />
                                  <span className="font-semibold text-gray-900">
                                    Multiple Team Leads
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Assign to multiple team leads for
                                  collaboration
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Lead Selection */}
                      <div className="space-y-4 p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
                        {formData.assignmentType === "single" ? (
                          <>
                            <Label className="text-gray-900 font-semibold flex items-center gap-2">
                              <User className="w-5 h-5" />
                              Select Primary Team Lead *
                            </Label>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                              <select
                                value={formData.assignedTo}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    assignedTo: e.target.value,
                                  })
                                }
                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900 h-11 appearance-none"
                                required
                              >
                                <option value="" className="text-gray-500">
                                  Select a team lead...
                                </option>
                                {teamLeads.map((tl) => (
                                  <option
                                    key={tl._id}
                                    value={tl._id}
                                    className="text-gray-900"
                                  >
                                    {tl.name || tl.email} •{" "}
                                    {tl.depId?.name || "No Department"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <Label className="text-gray-900 font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Select Team Leads *
                              </Label>
                              <Badge className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200">
                                {formData.multipleTeamLeadAssigned.length}{" "}
                                selected
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                              {teamLeads.map((tl) => {
                                const isSelected =
                                  formData.multipleTeamLeadAssigned.includes(
                                    tl._id,
                                  );
                                return (
                                  <div
                                    key={tl._id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                                      isSelected
                                        ? "border-purple-500 bg-gradient-to-r from-purple-50 to-white"
                                        : "border-gray-200 hover:border-purple-300 hover:bg-white"
                                    }`}
                                    onClick={() => {
                                      setFormData((prev) => {
                                        const isSelected =
                                          prev.multipleTeamLeadAssigned.includes(
                                            tl._id,
                                          );
                                        return {
                                          ...prev,
                                          multipleTeamLeadAssigned: isSelected
                                            ? prev.multipleTeamLeadAssigned.filter(
                                                (id) => id !== tl._id,
                                              )
                                            : [
                                                ...prev.multipleTeamLeadAssigned,
                                                tl._id,
                                              ],
                                        };
                                      });
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback
                                          className={`${
                                            isSelected
                                              ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {tl.name?.charAt(0) ||
                                            tl.email?.charAt(0) ||
                                            "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {tl.name || "No Name"}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {tl.email}
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      className={`w-5 h-5 border rounded flex items-center justify-center ${
                                        isSelected
                                          ? "bg-purple-600 border-purple-600"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                   

                      {/* Summary Card */}
                      <div className="p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          Assignment Summary
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Form:</span>
                            <span className="font-semibold text-gray-900">
                              {selectedForm.title}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Client:</span>
                            <span className="font-semibold text-gray-900">
                              {formData.clientName || "Not set"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Attachments:</span>
                            <span className="font-semibold text-gray-900">
                              {attachments.files.length} files (
                              {formatFileSize(
                                attachments.files.reduce(
                                  (acc, file) => acc + file.size,
                                  0,
                                ),
                              )}
                              )
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">
                              Assignment Type:
                            </span>
                            <Badge className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200">
                              {formData.assignmentType}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Team Leads:</span>
                            <span className="font-semibold text-gray-900">
                              {formData.assignmentType === "single"
                                ? teamLeads.find(
                                    (tl) => tl._id === formData.assignedTo,
                                  )?.name || "Not selected"
                                : `${formData.multipleTeamLeadAssigned.length} selected`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Priority:</span>
                            <Badge
                              className={
                                formData.priority === "high"
                                  ? "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200"
                                  : formData.priority === "medium"
                                    ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-200"
                                    : "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200"
                              }
                            >
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
              <CardFooter className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 p-6 sticky bottom-0">
                <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                  {/* Navigation */}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (activeTab === "attachments") setActiveTab("form");
                        else if (activeTab === "assignment")
                          setActiveTab("attachments");
                      }}
                      className="flex items-center gap-2 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-purple-300 rounded-lg"
                      disabled={activeTab === "form"}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${activeTab === "form" ? "bg-purple-600" : "bg-gray-300"}`}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full ${activeTab === "attachments" ? "bg-purple-600" : "bg-gray-300"}`}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full ${activeTab === "assignment" ? "bg-purple-600" : "bg-gray-300"}`}
                      ></div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (activeTab === "form") setActiveTab("attachments");
                        else if (activeTab === "attachments")
                          setActiveTab("assignment");
                      }}
                      className="flex items-center gap-2 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-purple-300 rounded-lg"
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
                      className="px-6 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-purple-300 rounded-lg h-11"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || uploadProgress.isUploading}
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 shadow-lg shadow-purple-200 rounded-lg h-11"
                    >
                      {loading || uploadProgress.isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {uploadProgress.isUploading
                            ? "Uploading..."
                            : "Submitting..."}
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
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <CloudUpload className="w-4 h-4 text-purple-600" />
                        Uploading attachments...
                      </span>
                      <span className="text-sm font-medium text-purple-700">
                        {Math.round(uploadProgress.progress)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${uploadProgress.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Please don't close this window until upload is complete
                    </p>
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
