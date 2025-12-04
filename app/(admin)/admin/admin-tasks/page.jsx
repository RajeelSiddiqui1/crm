"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Plus,
  Search,
  Calendar,
  User,
  X,
  Loader2,
  FileText,
  AudioLines,
  Building,
  Clock,
  Pencil,
  Eye,
  MoreVertical,
  Trash2,
  Mic,
  Square,
  Play,
  Pause,
  Check,
  Download,
  Volume2,
} from "lucide-react";
import axios from "axios";

export default function AdminTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioRef = useRef(null);

  // Edit modal voice recording states
  const [isEditRecording, setIsEditRecording] = useState(false);
  const [editRecordedAudio, setEditRecordedAudio] = useState(null);
  const [editAudioBlob, setEditAudioBlob] = useState(null);
  const [isEditPlaying, setIsEditPlaying] = useState(false);
  const editMediaRecorder = useRef(null);
  const editAudioChunks = useRef([]);
  const editAudioRef = useRef(null);

  // Multiple managers selection state
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [editSelectedManagers, setEditSelectedManagers] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    fileAttachments: "",
    audioUrl: "",
    priority: "low",
    endDate: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    clientName: "",
    fileAttachments: "",
    audioUrl: "",
    priority: "low",
    endDate: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/admin/login");
      return;
    }

    fetchTasks();
    fetchManagers();
  }, [session, status, router]);

  const fetchTasks = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/admin/tasks");
      if (response.data.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setFetching(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get("/api/admin/managers");
      console.log("Managers API Response:", response.data);
      if (response.data.success) {
        setManagers(response.data.managers || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to fetch managers");
    }
  };

  // Multiple Managers Selection Functions
  const toggleManagerSelection = (managerId) => {
    setSelectedManagers((prev) => {
      if (prev.includes(managerId)) {
        return prev.filter((id) => id !== managerId);
      } else {
        return [...prev, managerId];
      }
    });
  };

  const toggleEditManagerSelection = (managerId) => {
    setEditSelectedManagers((prev) => {
      if (prev.includes(managerId)) {
        return prev.filter((id) => id !== managerId);
      } else {
        return [...prev, managerId];
      }
    });
  };

  const removeSelectedManager = (managerId) => {
    setSelectedManagers((prev) => prev.filter((id) => id !== managerId));
  };

  const removeEditSelectedManager = (managerId) => {
    setEditSelectedManagers((prev) => prev.filter((id) => id !== managerId));
  };

  // Voice Recording Functions for Create Form
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        setAudioBlob(audioBlob);
        setFormData((prev) => ({ ...prev, audioUrl: audioUrl }));

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast.success("Recording completed");
    }
  };

  const playRecordedAudio = () => {
    if (audioRef.current && recordedAudio) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecordedAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const clearRecording = () => {
    setRecordedAudio(null);
    setAudioBlob(null);
    setFormData((prev) => ({ ...prev, audioUrl: "" }));
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // Voice Recording Functions for Edit Form
  const startEditRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      editMediaRecorder.current = new MediaRecorder(stream);
      editAudioChunks.current = [];

      editMediaRecorder.current.ondataavailable = (event) => {
        editAudioChunks.current.push(event.data);
      };

      editMediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(editAudioChunks.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setEditRecordedAudio(audioUrl);
        setEditAudioBlob(audioBlob);
        setEditFormData((prev) => ({ ...prev, audioUrl: audioUrl }));

        stream.getTracks().forEach((track) => track.stop());
      };

      editMediaRecorder.current.start();
      setIsEditRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopEditRecording = () => {
    if (editMediaRecorder.current && isEditRecording) {
      editMediaRecorder.current.stop();
      setIsEditRecording(false);
      toast.success("Recording completed");
    }
  };

  const playEditRecordedAudio = () => {
    if (editAudioRef.current && (editRecordedAudio || editFormData.audioUrl)) {
      editAudioRef.current.play();
      setIsEditPlaying(true);
    }
  };

  const pauseEditRecordedAudio = () => {
    if (editAudioRef.current) {
      editAudioRef.current.pause();
      setIsEditPlaying(false);
    }
  };

  const handleEditAudioEnded = () => {
    setIsEditPlaying(false);
  };

  const clearEditRecording = () => {
    setEditRecordedAudio(null);
    setEditAudioBlob(null);
    setEditFormData((prev) => ({ ...prev, audioUrl: "" }));
    if (editAudioRef.current) {
      editAudioRef.current.pause();
      editAudioRef.current.currentTime = 0;
    }
    setIsEditPlaying(false);
  };

  // Audio Override Functions
  const removeExistingAudio = (isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, audioUrl: "" }));
      setEditRecordedAudio(null);
      setEditAudioBlob(null);
      toast.success("Existing audio removed");
    } else {
      setFormData((prev) => ({ ...prev, audioUrl: "" }));
      setRecordedAudio(null);
      setAudioBlob(null);
      toast.success("Audio removed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.title) {
      toast.error("Please enter a title");
      setLoading(false);
      return;
    }

    if (selectedManagers.length === 0) {
      toast.error("Please select at least one manager");
      setLoading(false);
      return;
    }

    try {
      let audioBase64 = "";
      if (audioBlob) {
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob);
        });
      }

      const submitData = {
        ...formData,
        audioUrl: audioBase64,
        managersId: selectedManagers,
      };

      const response = await axios.post("/api/admin/tasks", submitData);

      if (response.data.success) {
        toast.success("Task created successfully!");
        resetForm();
        fetchTasks();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      clientName: "",
      fileAttachments: "",
      audioUrl: "",
      priority: "low",
      endDate: "",
    });
    setSelectedManagers([]);
    clearRecording();
    setShowForm(false);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditFormData({
      title: task.title || "",
      clientName: task.clientName || "",
      fileAttachments: task.fileAttachments || "",
      audioUrl: task.audioUrl || "",
      priority: task.priority || "low",
      endDate: task.endDate
        ? new Date(task.endDate).toISOString().split("T")[0]
        : "",
    });
    setEditSelectedManagers(task.managers?.map((m) => m._id) || []);
    setEditRecordedAudio(null);
    setEditAudioBlob(null);
    setIsEditPlaying(false);
    setEditDialogOpen(true);
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTask) return;

    setLoading(true);
    try {
      let audioBase64 = editFormData.audioUrl;

      // If there's a new recording, use it (override)
      if (editAudioBlob) {
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(editAudioBlob);
        });
      }

      const updateData = {
        ...editFormData,
        audioUrl: audioBase64,
        managersId: editSelectedManagers,
      };

      const response = await axios.patch(
        `/api/admin/tasks/${selectedTask._id}`,
        updateData
      );

      if (response.data.success) {
        toast.success("Task updated successfully!");
        setEditDialogOpen(false);
        fetchTasks();
        clearEditRecording();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await axios.delete(`/api/admin/tasks/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully!");
        fetchTasks();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditFormData((prev) => ({
            ...prev,
            fileAttachments: reader.result,
          }));
          toast.success(
            "File attached successfully! This will override the existing file."
          );
        } else {
          setFormData((prev) => ({ ...prev, fileAttachments: reader.result }));
          toast.success("File attached successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFileAttachment = (isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, fileAttachments: "" }));
      toast.info("File removed");
    } else {
      setFormData((prev) => ({ ...prev, fileAttachments: "" }));
      toast.info("File removed");
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

  const filteredTasks = tasks.filter(
    (task) =>
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.priority?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get manager full name and department
  const getManagerDisplayName = (manager) => {
    if (!manager) return "Unknown";
    const fullName = `${manager.firstName || ""} ${
      manager.lastName || ""
    }`.trim();
    const department =
      manager.departments?.name || manager.department || "No Department";
    return `${fullName} (${department})`;
  };

  const getManagerShortName = (manager) => {
    if (!manager) return "??";
    const firstName = manager.firstName || "";
    const lastName = manager.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
  };

  const getManagerDepartment = (manager) => {
    return manager.departments?.name || manager.department || "No Department";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-700 text-lg font-medium">
            Loading Admin Panel...
          </span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Task Management
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Create and manage tasks with voice instructions and assign them to
              multiple managers
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl font-semibold"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Tasks
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Managers
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {managers.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    High Priority
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.priority === "high").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Audio
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.audioUrl).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Task Form */}
        {showForm && (
          <Card className="mb-8 border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white text-2xl">
                    Create New Task
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-base">
                    Add task details and voice instructions for managers
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="title"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Task Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter task title"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="clientName"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Client Name
                    </Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) =>
                        setFormData({ ...formData, clientName: e.target.value })
                      }
                      placeholder="Enter client name"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl"
                    />
                  </div>
                </div>

                {/* Multiple Managers Selection */}
                <div className="space-y-3">
                  <Label className="text-gray-700 font-semibold text-sm">
                    Assign to Managers *
                  </Label>

                  {selectedManagers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-xl border">
                      {selectedManagers.map((managerId) => {
                        const manager = managers.find(
                          (m) => m._id === managerId
                        );
                        return (
                          <Badge
                            key={managerId}
                            variant="secondary"
                            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg"
                          >
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="bg-white text-blue-600 text-xs">
                                {getManagerShortName(manager)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {manager
                                ? `${manager.firstName} ${manager.lastName}`
                                : "Unknown Manager"}
                            </span>
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-red-200"
                              onClick={() => removeSelectedManager(managerId)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 max-h-60 overflow-y-auto bg-white">
                    {managers.length === 0 ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Loading managers...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {managers.map((manager) => (
                          <div
                            key={manager._id}
                            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedManagers.includes(manager._id)
                                ? "bg-blue-50 border-2 border-blue-200"
                                : "hover:bg-gray-50 border-2 border-transparent"
                            }`}
                            onClick={() => toggleManagerSelection(manager._id)}
                          >
                            <div
                              className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${
                                selectedManagers.includes(manager._id)
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {selectedManagers.includes(manager._id) && (
                                <Check className="w-4 h-4" />
                              )}
                            </div>
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                {getManagerShortName(manager)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {manager.firstName} {manager.lastName}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {getManagerDepartment(manager)} •{" "}
                                {manager.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Select one or more managers to assign this task
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="priority"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Priority
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger className="h-12 text-base rounded-xl bg-white text-gray-900">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-white text-gray-900">
                        <SelectItem value="low" className="text-base">
                          Low Priority
                        </SelectItem>
                        <SelectItem value="medium" className="text-base">
                          Medium Priority
                        </SelectItem>
                        <SelectItem value="high" className="text-base">
                          High Priority
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="endDate"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Due Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="h-12 text-base rounded-xl border-gray-300"
                    />
                  </div>
                </div>

                {/* Voice Recording Section */}
                <div className="space-y-4">
                  <Label className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                    <AudioLines className="w-5 h-5 text-blue-600" />
                    Voice Instructions
                  </Label>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50/50">
                    {!recordedAudio ? (
                      <div className="text-center space-y-4">
                        <Button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`${
                            isRecording
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-blue-600 hover:bg-blue-700"
                          } text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105`}
                          size="lg"
                        >
                          {isRecording ? (
                            <>
                              <Square className="w-5 h-5 mr-2" />
                              Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="w-5 h-5 mr-2" />
                              Start Recording
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-gray-600">
                          {isRecording
                            ? "🔴 Recording in progress..."
                            : "Click to start recording voice instructions"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <AudioLines className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                Audio Recorded
                              </p>
                              <p className="text-sm text-gray-600">
                                Ready to attach
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isPlaying ? (
                              <Button
                                type="button"
                                onClick={playRecordedAudio}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Play
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={pauseRecordedAudio}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </Button>
                            )}
                            <Button
                              type="button"
                              onClick={clearRecording}
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear
                            </Button>
                          </div>
                        </div>
                        <audio
                          ref={audioRef}
                          src={recordedAudio}
                          onEnded={handleAudioEnded}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label
                    htmlFor="fileAttachments"
                    className="text-gray-700 font-semibold text-sm flex items-center gap-2"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    File Attachments
                  </Label>
                  <Input
                    id="fileAttachments"
                    type="file"
                    onChange={(e) => handleFileUpload(e)}
                    className="rounded-xl border-gray-300 h-12"
                    accept="*/*"
                  />
                  {formData.fileAttachments && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <FileText className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-800">
                          File attached successfully
                        </p>
                        <p className="text-sm text-green-600">
                          Ready to upload with task
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadFile(formData.fileAttachments, "attachment")
                          }
                          className="rounded-lg border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeFileAttachment(false)}
                          className="rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Supported: Images, Documents, PDFs, etc. (Max 10MB)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={loading || selectedManagers.length === 0}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Task...
                      </>
                    ) : (
                      "Create Task"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="py-3 rounded-xl font-semibold text-base border-gray-300 text-gray-700 hover:bg-gray-50"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Tasks
                </CardTitle>
                <CardDescription className="text-gray-600 text-base mt-2">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to
                  managers
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search tasks, clients, priority..."
                  className="pl-12 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl bg-white/80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-3 text-gray-600">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-lg font-medium">Loading tasks...</span>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <FileText className="w-24 h-24 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {tasks.length === 0 ? "No tasks yet" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                  {tasks.length === 0
                    ? "Get started by creating your first task for managers."
                    : "Try adjusting your search terms to find what you're looking for."}
                </p>
                {tasks.length === 0 && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Task Details
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Client
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Priority
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Assigned To
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Due Date
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow
                        key={task._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200 truncate">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {task.audioUrl && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-gray-800 text-white border-gray-700 px-2 py-1 rounded-lg"
                                  >
                                    <AudioLines className="w-3 h-3 mr-1" />
                                    Voice
                                  </Badge>
                                )}
                                {task.fileAttachments && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-blue-300 text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    File
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-base text-gray-700 font-medium">
                            {task.clientName || "No client"}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            className={`${getPriorityColor(
                              task.priority
                            )} text-sm font-semibold capitalize px-3 py-1.5 rounded-lg border`}
                          >
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            {task.managers?.slice(0, 3).map((manager) => (
                              <Badge
                                key={manager._id}
                                variant="outline"
                                className="text-xs flex items-center gap-2 bg-white text-gray-700 border-gray-300 px-3 py-1.5 rounded-lg"
                              >
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold">
                                    {getManagerShortName(manager)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-semibold">
                                    {manager.firstName} {manager.lastName}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {getManagerDepartment(manager)}
                                  </span>
                                </div>
                              </Badge>
                            ))}
                            {task.managers?.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-gray-100 text-gray-600 border-gray-300 px-3 py-1.5 rounded-lg"
                              >
                                +{task.managers.length - 3} more
                              </Badge>
                            )}
                            {!task.managers?.length && (
                              <span className="text-sm text-gray-500 italic">
                                Not assigned
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3 text-gray-600">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold">
                              {formatDate(task.endDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100"
                              >
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-lg w-48"
                            >
                              <DropdownMenuItem
                                onClick={() => handleView(task)}
                                className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(task)}
                                className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(task._id)}
                                className="text-red-600 cursor-pointer text-sm px-4 py-3 hover:bg-red-50 rounded-lg flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Edit Task Dialog */}
      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Edit Task
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-base mt-1">
                  Update task details and assignments. New recordings/files will
                  override existing ones.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(false)}
                className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="editTitle"
                  className="text-gray-700 font-semibold text-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  Task Title *
                </Label>
                <Input
                  id="editTitle"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  placeholder="Enter task title"
                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl border-gray-300"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="editClientName"
                  className="text-gray-700 font-semibold text-sm flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  Client Name
                </Label>
                <Input
                  id="editClientName"
                  value={editFormData.clientName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      clientName: e.target.value,
                    })
                  }
                  placeholder="Enter client name"
                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl border-gray-300"
                />
              </div>
            </div>

            {/* Multiple Managers Selection for Edit */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Assign to Managers *
              </Label>

              {/* Selected Managers Display for Edit */}
              {editSelectedManagers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-800">
                      Selected Managers ({editSelectedManagers.length})
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-500 text-white"
                    >
                      {editSelectedManagers.length} selected
                    </Badge>
                  </div>
                  {editSelectedManagers.map((managerId) => {
                    const manager = managers.find((m) => m._id === managerId);
                    return (
                      <Badge
                        key={managerId}
                        variant="secondary"
                        className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg"
                      >
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="bg-white text-blue-600 text-xs font-bold">
                            {getManagerShortName(manager)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {manager
                            ? `${manager.firstName} ${manager.lastName}`
                            : "Unknown Manager"}
                        </span>
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-200 transition-colors"
                          onClick={() => removeEditSelectedManager(managerId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Managers Selection Dropdown for Edit */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 max-h-60 overflow-y-auto bg-white">
                {managers.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading managers...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {managers.map((manager) => (
                      <div
                        key={manager._id}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                          editSelectedManagers.includes(manager._id)
                            ? "bg-blue-50 border-blue-200 shadow-sm"
                            : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                        }`}
                        onClick={() => toggleEditManagerSelection(manager._id)}
                      >
                        <div
                          className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${
                            editSelectedManagers.includes(manager._id)
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {editSelectedManagers.includes(manager._id) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                            {getManagerShortName(manager)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {manager.firstName} {manager.lastName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {getManagerDepartment(manager)} • {manager.email}
                          </p>
                        </div>
                        {editSelectedManagers.includes(manager._id) && (
                          <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                            Selected
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                Select one or more managers to assign this task
              </p>
            </div>

            {/* Priority and Due Date */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="editPriority"
                  className="text-gray-700 font-semibold text-sm flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-blue-600" />
                  Priority Level
                </Label>
                <Select
                  value={editFormData.priority}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, priority: value })
                  }
                >
                  <SelectTrigger className="h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-lg">
                    <SelectItem
                      value="low"
                      className="text-base py-3 hover:bg-green-50 text-green-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Low Priority
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="text-base py-3 hover:bg-yellow-50 text-yellow-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium Priority
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="high"
                      className="text-base py-3 hover:bg-red-50 text-red-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        High Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="editEndDate"
                  className="text-gray-700 font-semibold text-sm flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Due Date
                </Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      endDate: e.target.value,
                    })
                  }
                  className="h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Voice Recording Section for Edit */}
            <div className="space-y-4">
              <Label className="text-gray-700 font-semibold text-base flex items-center gap-3">
                <AudioLines className="w-5 h-5 text-blue-600" />
                Voice Instructions
                {editFormData.audioUrl && !editRecordedAudio && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  >
                    🎵 Existing Audio Attached
                  </Badge>
                )}
                {editRecordedAudio && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs"
                  >
                    🔄 New Recording Ready
                  </Badge>
                )}
              </Label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
                {!editRecordedAudio && !editFormData.audioUrl ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Mic className="w-8 h-8 text-blue-600" />
                    </div>
                    <Button
                      type="button"
                      onClick={
                        isEditRecording ? stopEditRecording : startEditRecording
                      }
                      className={`${
                        isEditRecording
                          ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
                          : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                      } text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105`}
                      size="lg"
                    >
                      {isEditRecording ? (
                        <>
                          <Square className="w-5 h-5 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      {isEditRecording ? (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span>Recording in progress... Speak now</span>
                        </>
                      ) : (
                        <span>Click to record new voice instructions</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            editRecordedAudio ? "bg-green-100" : "bg-blue-100"
                          }`}
                        >
                          <AudioLines
                            className={`w-6 h-6 ${
                              editRecordedAudio
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {editRecordedAudio
                              ? "New Recording"
                              : "Existing Audio"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {editRecordedAudio
                              ? "Ready to override existing audio"
                              : "Currently attached to this task"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isEditPlaying ? (
                          <Button
                            type="button"
                            onClick={playEditRecordedAudio}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-semibold"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={pauseEditRecordedAudio}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg px-4 py-2 font-semibold"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </Button>
                        )}

                        {editRecordedAudio && (
                          <Button
                            type="button"
                            onClick={clearEditRecording}
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 font-semibold"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear New
                          </Button>
                        )}

                        {editFormData.audioUrl && !editRecordedAudio && (
                          <Button
                            type="button"
                            onClick={() => removeExistingAudio(true)}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 font-semibold"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Audio
                          </Button>
                        )}
                      </div>
                    </div>

                    <audio
                      ref={editAudioRef}
                      src={editRecordedAudio || editFormData.audioUrl}
                      onEnded={handleEditAudioEnded}
                      className="w-full rounded-lg border border-gray-200"
                    />

                    {editRecordedAudio && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800 text-sm">
                              New Recording Ready
                            </p>
                            <p className="text-green-600 text-xs">
                              This will override the existing audio when you
                              update the task
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* File Upload for Edit */}
            <div className="space-y-3">
              <Label
                htmlFor="editFileAttachments"
                className="text-gray-700 font-semibold text-base flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-blue-600" />
                File Attachments
                {editFormData.fileAttachments && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs"
                  >
                    📎 File Attached
                  </Badge>
                )}
              </Label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
                <Input
                  id="editFileAttachments"
                  type="file"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="rounded-xl border-gray-300 h-12 mb-4"
                  accept="*/*"
                />

                {editFormData.fileAttachments && (
                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-800 text-base">
                        File Attached Successfully
                      </p>
                      <p className="text-green-600 text-sm">
                        {editRecordedAudio
                          ? "New file will override existing"
                          : "File is ready with task"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadFile(
                            editFormData.fileAttachments,
                            "attachment"
                          )
                        }
                        className="rounded-lg border-green-300 text-green-700 hover:bg-green-50 font-semibold"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeFileAttachment(true)}
                        className="rounded-lg border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Supported: Images, Documents, PDFs, etc. (Max 10MB). New files
                  will override existing ones.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <Button
                onClick={handleUpdate}
                disabled={loading || editSelectedManagers.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50 shadow-lg shadow-blue-500/25"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating Task...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Update Task
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  clearEditRecording();
                }}
                disabled={loading}
                className="py-3 rounded-xl font-semibold text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                size="lg"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            </div>

            {/* Validation Message */}
            {editSelectedManagers.length === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">
                      Action Required
                    </p>
                    <p className="text-red-600 text-xs">
                      Please select at least one manager to assign this task
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog - Improved */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Task Details
            </DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <FileText className="w-6 h-6 text-blue-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Title
                      </Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">
                        {selectedTask.title}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Client
                      </Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">
                        {selectedTask.clientName || "No client"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Priority
                      </Label>
                      <div className="mt-1">
                        <Badge
                          className={`${getPriorityColor(
                            selectedTask.priority
                          )} capitalize px-3 py-1.5 rounded-lg text-sm font-semibold border`}
                        >
                          {selectedTask.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Due Date
                      </Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">
                        {formatDate(selectedTask.endDate)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <User className="w-6 h-6 text-blue-600" />
                      Assigned Managers ({selectedTask.managers?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {selectedTask.managers?.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedTask.managers.map((manager) => (
                          <div
                            key={manager._id}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm">
                                {getManagerShortName(manager)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-base">
                                {manager.firstName} {manager.lastName}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {getManagerDepartment(manager)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {manager.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-base">
                          No managers assigned to this task
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Audio Section */}
              {selectedTask.audioUrl && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <AudioLines className="w-6 h-6 text-blue-600" />
                      Voice Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <audio controls className="w-full rounded-lg">
                        <source src={selectedTask.audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            const audio = document.querySelector("audio");
                            if (audio) audio.play();
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Play
                        </Button>
                        <Button
                          onClick={() => {
                            const audio = document.querySelector("audio");
                            if (audio) audio.pause();
                          }}
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Attachments */}
              {selectedTask.fileAttachments && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <FileText className="w-6 h-6 text-blue-600" />
                      File Attachments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-800 text-base">
                            File Attached
                          </p>
                          <p className="text-sm text-green-600">
                            Click below to view or download the file
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() =>
                            window.open(selectedTask.fileAttachments, "_blank")
                          }
                          variant="outline"
                          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2"
                        >
                          <FileText className="w-4 h-4" />
                          View File
                        </Button>
                        <Button
                          onClick={() =>
                            downloadFile(
                              selectedTask.fileAttachments,
                              `task_${selectedTask.title}_attachment`
                            )
                          }
                          variant="outline"
                          className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg px-4 py-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white rounded-xl px-8 py-3 font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
