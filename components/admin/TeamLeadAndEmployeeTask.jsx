"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Mail, 
  Calendar, 
  User, 
  Users, 
  Building, 
  FileText, 
  AudioLines, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Loader2,
  Plus,
  Download,
  Play,
  Pause,
  X,
  Upload,
  AlertCircle,
  Mic,
  Square,
  Check,
  Volume2,
  Briefcase,
  Clock,
  Share2,
  CheckCircle,
  AlertTriangle,
  Circle,
  TrendingUp,
  BarChart3,
  Target,
  Percent,
  ArrowRight
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";

export default function TeamLeadAndEmployeeTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State variables
  const [tasks, setTasks] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Voice recording states for create form
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioRef = useRef(null);

  // Voice recording states for edit form
  const [isEditRecording, setIsEditRecording] = useState(false);
  const [editRecordedAudio, setEditRecordedAudio] = useState(null);
  const [editAudioBlob, setEditAudioBlob] = useState(null);
  const [isEditPlaying, setIsEditPlaying] = useState(false);
  const editMediaRecorder = useRef(null);
  const editAudioChunks = useRef([]);
  const editAudioRef = useRef(null);

  // Selected item states
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskForStatus, setTaskForStatus] = useState(null);
  const [taskToShare, setTaskToShare] = useState(null);
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    priority: "low",
    endDate: "",
    teamleadIds: [],
    employeeIds: [],
    file: null,
    audioUrl: "",
    fileAttachments: ""
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    clientName: "",
    priority: "low",
    endDate: "",
    teamleadIds: [],
    employeeIds: [],
    file: null,
    audioUrl: "",
    fileAttachments: ""
  });

  const [shareFormData, setShareFormData] = useState({
    sharedToId: "",
    sharedToModel: "TeamLead",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }

    fetchAllData();
  }, [session, status, router]);

  const fetchAllData = async () => {
    try {
      setFetching(true);
      
      // Fetch tasks
      try {
        const tasksRes = await axios.get("/api/admin/tasks2");
        if (tasksRes.data.success) {
          setTasks(tasksRes.data.tasks || []);
        }
      } catch (tasksError) {
        console.error("Tasks fetch error:", tasksError);
        toast.error("Failed to fetch tasks");
      }

      // Fetch team leads
      try {
        const teamLeadsRes = await axios.get("/api/admin/teamleads");
        if (teamLeadsRes.data.success) {
          const teamLeadsData = teamLeadsRes.data.teamleads || [];
          setTeamLeads(teamLeadsData);
        }
      } catch (teamLeadsError) {
        console.error("TeamLeads fetch error:", teamLeadsError);
      }

      // Fetch employees
      try {
        const employeesRes = await axios.get("/api/admin/employees");
        if (employeesRes.data.success) {
          const employeesData = employeesRes.data.employees || [];
          setEmployees(employeesData);
        }
      } catch (employeesError) {
        console.error("Employees fetch error:", employeesError);
      }

    } catch (error) {
      console.error("General Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setFetching(false);
    }
  };

  // Voice Recording Functions (same as before, keeping for brevity)
  // ... [Voice recording functions remain the same] ...

  const handleView = (task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditFormData({
      title: task.title,
      clientName: task.clientName || "",
      priority: task.priority || "low",
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : "",
      teamleadIds: task.teamleads?.map(tl => tl.teamleadId?._id || tl.teamleadId) || [],
      employeeIds: task.employees?.map(emp => emp.employeeId?._id || emp.employeeId) || [],
      file: null,
      audioUrl: task.audioUrl || "",
      fileAttachments: task.fileAttachments || ""
    });
    setEditRecordedAudio(null);
    setEditAudioBlob(null);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`/api/admin/tasks2/${taskToDelete._id}`);
      
      if (response.data.success) {
        toast.success("Task deleted successfully");
        setTasks(tasks.filter(task => task._id !== taskToDelete._id));
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      title: "",
      clientName: "",
      priority: "low",
      endDate: "",
      teamleadIds: [],
      employeeIds: [],
      file: null,
      audioUrl: "",
      fileAttachments: ""
    });
    setRecordedAudio(null);
    setAudioBlob(null);
    setCreateDialogOpen(true);
  };

  const handleViewStatus = (task) => {
    setTaskForStatus(task);
    setStatusDialogOpen(true);
  };

  const handleCheckboxChange = (id, type, checked, isEdit = false) => {
    const listName = type === 'teamlead' ? 'teamleadIds' : 'employeeIds';
    const setter = isEdit ? setEditFormData : setFormData;
    
    setter(prev => {
      const currentList = prev[listName] || [];
      if (checked) {
        return {
          ...prev,
          [listName]: [...currentList, id]
        };
      } else {
        return {
          ...prev,
          [listName]: currentList.filter(itemId => itemId !== id)
        };
      }
    });
  };

  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      const setter = isEdit ? setEditFormData : setFormData;
      const url = URL.createObjectURL(file);
      setter(prev => ({ ...prev, file: file, fileAttachments: url }));
      toast.success("File attached");
    }
  };

  const removeFileAttachment = (isEdit = false) => {
    const setter = isEdit ? setEditFormData : setFormData;
    setter(prev => ({ ...prev, file: null, fileAttachments: "" }));
    toast.success("File removed");
  };

  const handleSubmit = async (isEdit = false) => {
    try {
      setLoading(true);
      const data = isEdit ? editFormData : formData;
      const url = isEdit ? `/api/admin/tasks2/${selectedTask._id}` : "/api/admin/tasks2";
      const method = isEdit ? "put" : "post";

      const submitData = new FormData();
      submitData.append("title", data.title);
      submitData.append("clientName", data.clientName || "");
      submitData.append("priority", data.priority);
      submitData.append("endDate", data.endDate);
      submitData.append("teamleadIds", JSON.stringify(data.teamleadIds));
      submitData.append("employeeIds", JSON.stringify(data.employeeIds));

      if (data.file) {
        submitData.append("file", data.file);
      }

      // Handle audio
      const currentAudioBlob = isEdit ? editAudioBlob : audioBlob;
      if (currentAudioBlob) {
        submitData.append("audio", currentAudioBlob, "task_audio.wav");
      }

      const response = await axios({
        method,
        url,
        data: submitData,
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        toast.success(isEdit ? "Task updated successfully" : "Task created successfully");
        fetchAllData();
        if (isEdit) {
          setEditDialogOpen(false);
          clearEditRecording();
        } else {
          setCreateDialogOpen(false);
          clearRecording();
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(isEdit ? "Failed to update task" : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleShareTask = (task) => {
    setTaskToShare(task);
    setShareFormData({
      sharedToId: "",
      sharedToModel: "TeamLead",
      message: ""
    });
    setShareDialogOpen(true);
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
        setFormData(prev => ({ ...prev, audioUrl: audioUrl }));

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
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
    setFormData(prev => ({ ...prev, audioUrl: "" }));
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
        const audioBlob = new Blob(editAudioChunks.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setEditRecordedAudio(audioUrl);
        setEditAudioBlob(audioBlob);
        setEditFormData(prev => ({ ...prev, audioUrl: audioUrl }));

        stream.getTracks().forEach((track) => track.stop());
      };

      editMediaRecorder.current.start();
      setIsEditRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
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
    setEditFormData(prev => ({ ...prev, audioUrl: "" }));
    if (editAudioRef.current) {
      editAudioRef.current.pause();
      editAudioRef.current.currentTime = 0;
    }
    setIsEditPlaying(false);
  };

  
  const handleShareSubmit = async () => {
    if (!taskToShare) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`/api/admin/tasks2/${taskToShare._id}/share`, {
        ...shareFormData,
        sharedBY: session.user.id
      });
      
      if (response.data.success) {
        toast.success("Task shared successfully");
        fetchAllData();
        setShareDialogOpen(false);
        setTaskToShare(null);
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, assigneeType, assigneeId, newStatus) => {
    try {
      const response = await axios.put(`/api/admin/tasks2/${taskId}/status`, {
        assigneeType,
        assigneeId,
        status: newStatus
      });
      
      if (response.data.success) {
        toast.success("Status updated successfully");
        fetchAllData();
        if (taskForStatus?._id === taskId) {
          setTaskForStatus(response.data.task);
        }
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: <Circle className="w-3 h-3" /> },
      in_progress: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: <TrendingUp className="w-3 h-3" /> },
      completed: { color: "bg-green-100 text-green-800 border-green-300", icon: <CheckCircle className="w-3 h-3" /> },
      overdue: { color: "bg-red-100 text-red-800 border-red-300", icon: <AlertTriangle className="w-3 h-3" /> }
    };
    
    const { color, icon } = config[status] || config.pending;
    
    return (
      <Badge variant="outline" className={`${color} border px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1`}>
        {icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: "bg-gradient-to-r from-red-500 to-orange-500 text-white",
      medium: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
      low: "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
    };

    return (
      <Badge className={`${colors[priority]} border-0 font-medium px-3 py-1 rounded-lg`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getDisplayName = (item) => {
    if (!item) return "Unknown";
    return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || "Unknown";
  };

  const getDepartmentName = (item) => {
    if (!item) return "No Department";
    if (item.depId) {
      return typeof item.depId === 'object' ? item.depId.name : "Department";
    }
    if (item.department) {
      return typeof item.department === 'object' ? item.department.name : item.department;
    }
    return "No Department";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && task.stats?.statusCounts.pending > 0;
    if (activeTab === "in_progress") return matchesSearch && task.stats?.statusCounts.in_progress > 0;
    if (activeTab === "completed") return matchesSearch && task.stats?.statusCounts.completed > 0;
    if (activeTab === "overdue") return matchesSearch && task.stats?.statusCounts.overdue > 0;
    
    return matchesSearch;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              Task Management Dashboard
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Track task progress, status updates, and sharing between team leads and employees
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-center sm:self-auto">
            <Button
              onClick={fetchAllData}
              variant="outline"
              size="lg"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white px-6 py-3 rounded-xl font-semibold"
            >
              <Loader2 className={`w-5 h-5 mr-2 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleCreate}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats Cards with Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold">
                    {tasks.length > 0 
                      ? Math.round(tasks.reduce((acc, task) => acc + (task.stats?.completionPercentage || 0), 0) / tasks.length)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={tasks.length > 0 
                    ? Math.round(tasks.reduce((acc, task) => acc + (task.stats?.completionPercentage || 0), 0) / tasks.length)
                    : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.pending || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-3 py-1 rounded-lg">
                  <Circle className="w-3 h-3 mr-1" />
                  Awaiting Action
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.in_progress || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Active Work
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.completed || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1 rounded-lg">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Finished
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Status Filtering */}
        <div className="flex flex-wrap gap-2 mb-6">
  <Button
    variant="outline"
    onClick={() => setActiveTab("all")}
    className={`rounded-xl px-4 py-2 font-semibold transition-all duration-300 ${
      activeTab === "all"
        ? "bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg"
        : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-100"
    }`}
  >
    All Tasks ({tasks.length})
  </Button>

  <Button
    variant="outline"
    onClick={() => setActiveTab("pending")}
    className={`rounded-xl px-4 py-2 font-semibold flex items-center gap-1 transition-all duration-300 ${
      activeTab === "pending"
        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
        : "bg-white text-gray-800 border border-gray-200 hover:bg-yellow-50"
    }`}
  >
    <Circle className="w-3 h-3" />
    Pending ({tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.pending || 0), 0)})
  </Button>

  <Button
    variant="outline"
    onClick={() => setActiveTab("in_progress")}
    className={`rounded-xl px-4 py-2 font-semibold flex items-center gap-1 transition-all duration-300 ${
      activeTab === "in_progress"
        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
        : "bg-white text-gray-800 border border-gray-200 hover:bg-blue-50"
    }`}
  >
    <TrendingUp className="w-3 h-3" />
    In Progress ({tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.in_progress || 0), 0)})
  </Button>

  <Button
    variant="outline"
    onClick={() => setActiveTab("completed")}
    className={`rounded-xl px-4 py-2 font-semibold flex items-center gap-1 transition-all duration-300 ${
      activeTab === "completed"
        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
        : "bg-white text-gray-800 border border-gray-200 hover:bg-green-50"
    }`}
  >
    <CheckCircle className="w-3 h-3" />
    Completed ({tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.completed || 0), 0)})
  </Button>

  <Button
    variant="outline"
    onClick={() => setActiveTab("overdue")}
    className={`rounded-xl px-4 py-2 font-semibold flex items-center gap-1 transition-all duration-300 ${
      activeTab === "overdue"
        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
        : "bg-white text-gray-800 border border-gray-200 hover:bg-red-50"
    }`}
  >
    <AlertTriangle className="w-3 h-3" />
    Overdue ({tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.overdue || 0), 0)})
  </Button>
</div>


        {/* Tasks List */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Tasks with Status Tracking
                </CardTitle>
                <CardDescription className="text-gray-600 text-base mt-2">
                  Track progress, view status, and manage task sharing
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search tasks, clients, status..."
                  className="pl-12 pr-4 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 h-12 text-base rounded-xl bg-white/80"
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
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
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
                    ? "Get started by creating your first task."
                    : "Try adjusting your search terms to find what you're looking for."
                  }
                </p>
                {tasks.length === 0 && (
                  <Button 
                    onClick={handleCreate}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-green-50/50">
                    <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Task Details
                      </TableHead>
                      
                      
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Status Overview
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Team Hierarchy
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Priority & Due Date
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
                        className="group hover:bg-gradient-to-r hover:from-green-50/80 hover:to-blue-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors duration-200 truncate">
                                {task.title}
                              </div>
                              <div className="text-sm text-gray-600 mt-1 truncate">
                                {task.clientName || "No client specified"}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {task.audioUrl && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300 px-2 py-1 rounded-lg">
                                    <AudioLines className="w-3 h-3 mr-1" />
                                    Voice
                                  </Badge>
                                )}
                                {task.fileAttachments && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 px-2 py-1 rounded-lg">
                                    <FileText className="w-3 h-3 mr-1" />
                                    File
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                       
                        


                      
                        
                        <TableCell className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Progress</span>
                              <span className="text-xs font-bold">{task.stats?.completionPercentage || 0}%</span>
                            </div>
                            <Progress 
                              value={task.stats?.completionPercentage || 0} 
                              className={`h-2 ${getStatusColor(task.stats?.completionPercentage || 0)}`}
                            />
                            <div className="flex flex-wrap gap-1">
                              {task.stats?.statusCounts.pending > 0 && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300 px-2 py-0.5">
                                  {task.stats.statusCounts.pending} Pending
                                </Badge>
                              )}
                              {task.stats?.statusCounts.in_progress > 0 && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 px-2 py-0.5">
                                  {task.stats.statusCounts.in_progress} In Progress
                                </Badge>
                              )}
                              {task.stats?.statusCounts.completed > 0 && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 px-2 py-0.5">
                                  {task.stats.statusCounts.completed} Completed
                                </Badge>
                              )}
                              {task.stats?.statusCounts.overdue > 0 && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300 px-2 py-0.5">
                                  {task.stats.statusCounts.overdue} Overdue
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-6 min-w-[300px]">
                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                            {/* Initial Assignments */}
                            {(task.teamleads?.length > 0 || task.employees?.length > 0) && (
                              <div className="flex flex-col gap-2 mb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Initial Assignment</span>
                                {task.teamleads?.map((tl, idx) => {
                                  const detail = teamLeads.find(t => t._id === (tl.teamleadId?._id || tl.teamleadId));
                                  return (
                                    <div key={`init-tl-${idx}`} className="flex items-center gap-2 text-sm bg-blue-50/50 p-2 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors">
                                      <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Avatar className="w-6 h-6 border bg-white">
                                              <AvatarFallback className="bg-gray-200 text-gray-700 text-[10px] font-bold">AD</AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Admin (Original Creator)</p></TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0" />

                                      <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <Avatar className="w-6 h-6 border">
                                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-[10px] font-bold">
                                                  {detail?.firstName?.[0] || "T"}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col truncate">
                                                <span className="text-xs font-semibold text-gray-900 truncate">{getDisplayName(detail)}</span>
                                                <span className="text-[10px] text-purple-600 font-medium capitalize">{tl.status?.replace('_', ' ')}</span>
                                              </div>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="font-semibold">{getDisplayName(detail)}</p>
                                            <p className="text-xs opacity-75">Team Lead • Assigned by Admin</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  );
                                })}

                                {task.employees?.map((emp, idx) => {
                                  const detail = employees.find(e => e._id === (emp.employeeId?._id || emp.employeeId));
                                  return (
                                    <div key={`init-emp-${idx}`} className="flex items-center gap-2 text-sm bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors">
                                      <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Avatar className="w-6 h-6 border bg-white">
                                              <AvatarFallback className="bg-gray-200 text-gray-700 text-[10px] font-bold">AD</AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Admin (Original Creator)</p></TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <ArrowRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />

                                      <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <Avatar className="w-6 h-6 border">
                                                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold">
                                                  {detail?.firstName?.[0] || "E"}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col truncate">
                                                <span className="text-xs font-semibold text-gray-900 truncate">{getDisplayName(detail)}</span>
                                                <span className="text-[10px] text-emerald-600 font-medium capitalize">{emp.status?.replace('_', ' ')}</span>
                                              </div>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="font-semibold">{getDisplayName(detail)}</p>
                                            <p className="text-xs opacity-75">Employee • Assigned by Admin</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Shares Hierarchy */}
                            {task.shares && task.shares.length > 0 && (
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Share History</span>
                                {task.shares.map((share, index) => {
                                  const sharerId = share.sharedBy?._id || share.sharedBy;
                                  const receiverId = share.sharedTo?._id || share.sharedTo;
                                  
                                  const sharer = teamLeads.find(u => u._id === sharerId) || employees.find(u => u._id === sharerId);
                                  const receiver = teamLeads.find(u => u._id === receiverId) || employees.find(u => u._id === receiverId);

                                  return (
                                    <div key={`share-${index}`} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                                      <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Avatar className="w-6 h-6 border">
                                              <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white text-[10px] font-bold">
                                                {sharer?.firstName?.[0] || "?"}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="font-semibold">Shared by: {getDisplayName(sharer)}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />

                                      <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <Avatar className="w-6 h-6 border">
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-[10px] font-bold">
                                                  {receiver?.firstName?.[0] || "?"}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col truncate">
                                                <span className="text-xs font-medium text-gray-700 truncate">{getDisplayName(receiver)}</span>
                                                <span className="text-[10px] text-gray-500 truncate">{formatDate(share.sharedAt)}</span>
                                              </div>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="font-semibold">Shared to: {getDisplayName(receiver)}</p>
                                            <p className="text-xs opacity-75">{formatDate(share.sharedAt)}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {(!task.teamleads?.length && !task.employees?.length && !task.shares?.length) && (
                              <div className="text-center py-2 text-gray-400 h-full flex flex-col items-center justify-center">
                                <Users className="w-4 h-4 mb-1 opacity-50" />
                                <span className="text-xs italic">Unassigned</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-6">
                          <div className="space-y-3">
                            <div>
                              {getPriorityBadge(task.priority)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span className="font-medium">
                                {task.endDate ? formatDate(task.endDate) : "No due date"}
                              </span>
                            </div>
                            {task.isLate && (
                              <Badge className="bg-red-100 text-red-800 border-red-300 text-xs px-2 py-1">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100">
                                  <MoreVertical className="h-5 w-5 text-gray-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-lg w-56">
                                <DropdownMenuItem onClick={() => handleView(task)} className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewStatus(task)} className="text-blue-600 cursor-pointer text-sm px-4 py-3 hover:bg-blue-50 rounded-lg flex items-center gap-3">
                                  <BarChart3 className="w-4 h-4" />
                                  View Status
                                </DropdownMenuItem>
                              
                                <DropdownMenuItem onClick={() => handleEdit(task)} className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                                  <Edit className="w-4 h-4" />
                                  Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(task)} className="text-red-600 cursor-pointer text-sm px-4 py-3 hover:bg-red-50 rounded-lg flex items-center gap-3">
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

         {/* Create Task Dialog */}
           <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
             <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
               <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-2xl">
                 <div className="flex items-center justify-between">
                   <div>
                     <DialogTitle className="text-2xl font-bold text-white">
                       Create New Task
                     </DialogTitle>
                     <DialogDescription className="text-green-100 text-base mt-1">
                       Add task details and voice instructions for team leads and employees
                     </DialogDescription>
                   </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => {
                       setCreateDialogOpen(false);
                       clearRecording();
                     }}
                     className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
                   >
                     <X className="w-5 h-5" />
                   </Button>
                 </div>
               </DialogHeader>
     
               <div className="space-y-6 p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <Label htmlFor="title" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <FileText className="w-4 h-4 text-green-600" />
                       Task Title *
                     </Label>
                     <Input
                       id="title"
                       placeholder="Enter task title"
                       value={formData.title}
                       onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                       className="focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 h-12 text-base rounded-xl"
                     />
                   </div>
                   
                   <div className="space-y-3">
                     <Label htmlFor="clientName" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <User className="w-4 h-4 text-green-600" />
                       Client Name
                     </Label>
                     <Input
                       id="clientName"
                       placeholder="Enter client name"
                       value={formData.clientName}
                       onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                       className="focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 h-12 text-base rounded-xl"
                     />
                   </div>
                   
                   <div className="space-y-3">
                     <Label htmlFor="priority" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <Clock className="w-4 h-4 text-green-600" />
                       Priority
                     </Label>
                     <Select 
                       value={formData.priority} 
                       onValueChange={(value) => setFormData({ ...formData, priority: value })}
                     >
                       <SelectTrigger className="h-12 text-base rounded-xl">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="low">Low Priority</SelectItem>
                         <SelectItem value="medium">Medium Priority</SelectItem>
                         <SelectItem value="high">High Priority</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-3">
                     <Label htmlFor="endDate" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-green-600" />
                       Due Date
                     </Label>
                     <Input
                       id="endDate"
                       type="date"
                       value={formData.endDate}
                       onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                       className="h-12 text-base rounded-xl"
                     />
                   </div>
                 </div>
     
                 {/* Assign To Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Team Leads Selection */}
                   <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                     <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-4 border-b">
                       <CardTitle className="text-base font-bold flex items-center gap-2">
                         <Users className="w-5 h-5 text-blue-600" />
                         Assign to Team Leads
                       </CardTitle>
                       <CardDescription className="text-xs text-gray-500">
                         {teamLeads.length} team leads available
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="p-4 pt-0">
                       <div className="space-y-2 max-h-60 overflow-y-auto mt-2">
                         {teamLeads.length > 0 ? (
                           teamLeads.map((teamLead) => (
                             <div key={teamLead._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200">
                               <Checkbox
                                 id={`tl-${teamLead._id}`}
                                 checked={formData.teamleadIds.includes(teamLead._id)}
                                 onCheckedChange={(checked) => 
                                   handleCheckboxChange(teamLead._id, 'teamlead', checked)
                                 }
                               />
                               <Label
                                 htmlFor={`tl-${teamLead._id}`}
                                 className="flex items-center gap-3 text-sm cursor-pointer flex-1"
                               >
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold">
                                     {teamLead.firstName?.[0]}{teamLead.lastName?.[0] || 'TL'}
                                   </AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1 min-w-0">
                                   <p className="font-semibold text-gray-900 truncate">
                                     {getDisplayName(teamLead)}
                                   </p>
                                   <p className="text-xs text-gray-600 truncate">
                                     <span className="flex items-center gap-1">
                                       <Building className="w-3 h-3" />
                                       {getDepartmentName(teamLead)}
                                     </span>
                                   </p>
                                 </div>
                               </Label>
                             </div>
                           ))
                         ) : (
                           <div className="text-center py-4">
                             <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                             <p className="text-gray-500 text-sm">No team leads available</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
     
                   {/* Employees Selection */}
                   <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                     <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 p-4 border-b">
                       <CardTitle className="text-base font-bold flex items-center gap-2">
                         <User className="w-5 h-5 text-green-600" />
                         Assign to Employees
                       </CardTitle>
                       <CardDescription className="text-xs text-gray-500">
                         {employees.length} employees available
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="p-4 pt-0">
                       <div className="space-y-2 max-h-60 overflow-y-auto mt-2">
                         {employees.length > 0 ? (
                           employees.map((employee) => (
                             <div key={employee._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200">
                               <Checkbox
                                 id={`emp-${employee._id}`}
                                 checked={formData.employeeIds.includes(employee._id)}
                                 onCheckedChange={(checked) => 
                                   handleCheckboxChange(employee._id, 'employee', checked)
                                 }
                               />
                               <Label
                                 htmlFor={`emp-${employee._id}`}
                                 className="flex items-center gap-3 text-sm cursor-pointer flex-1"
                               >
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold">
                                     {employee.firstName?.[0]}{employee.lastName?.[0] || 'E'}
                                   </AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1 min-w-0">
                                   <p className="font-semibold text-gray-900 truncate">
                                     {getDisplayName(employee)}
                                   </p>
                                   <p className="text-xs text-gray-600 truncate">
                                     <span className="flex items-center gap-1">
                                       <Building className="w-3 h-3" />
                                       {getDepartmentName(employee)}
                                     </span>
                                   </p>
                                 </div>
                               </Label>
                             </div>
                           ))
                         ) : (
                           <div className="text-center py-4">
                             <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                             <p className="text-gray-500 text-sm">No employees available</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </div>
     
                 {/* Voice Recording Section */}
                 <div className="space-y-4">
                   <Label className="text-gray-700 font-semibold text-base flex items-center gap-3">
                     <AudioLines className="w-5 h-5 text-green-600" />
                     Voice Instructions
                   </Label>
     
                   <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-green-50/30">
                     {!recordedAudio ? (
                       <div className="text-center space-y-4">
                         <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                           <Mic className="w-8 h-8 text-green-600" />
                         </div>
                         <Button
                           type="button"
                           onClick={isRecording ? stopRecording : startRecording}
                           className={`${
                             isRecording
                               ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
                               : "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25"
                           } text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105`}
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
                         <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                           {isRecording ? (
                             <>
                               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                               <span>Recording in progress... Speak now</span>
                             </>
                           ) : (
                             <span>Click to record voice instructions</span>
                           )}
                         </div>
                       </div>
                     ) : (
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                               <AudioLines className="w-6 h-6 text-green-600" />
                             </div>
                             <div>
                               <p className="font-semibold text-gray-900 text-lg">
                                 Audio Recorded
                               </p>
                               <p className="text-sm text-gray-600">
                                 Ready to attach to task
                               </p>
                             </div>
                           </div>
                           <div className="flex gap-2">
                             {!isPlaying ? (
                               <Button
                                 type="button"
                                 onClick={playRecordedAudio}
                                 className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-semibold"
                               >
                                 <Play className="w-4 h-4 mr-2" />
                                 Play
                               </Button>
                             ) : (
                               <Button
                                 type="button"
                                 onClick={pauseRecordedAudio}
                                 className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg px-4 py-2 font-semibold"
                               >
                                 <Pause className="w-4 h-4 mr-2" />
                                 Pause
                               </Button>
                             )}
                             <Button
                               type="button"
                               onClick={clearRecording}
                               variant="outline"
                               className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 font-semibold"
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
                           className="w-full rounded-lg border border-gray-200"
                         />
                       </div>
                     )}
                   </div>
                 </div>
     
                 {/* File Upload Section */}
                 <div className="space-y-3">
                   <Label htmlFor="fileAttachments" className="text-gray-700 font-semibold text-base flex items-center gap-3">
                     <FileText className="w-5 h-5 text-green-600" />
                     File Attachments (Optional)
                   </Label>
                   
                   <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-green-50/30">
                     <Input
                       id="fileAttachments"
                       type="file"
                       onChange={(e) => handleFileUpload(e)}
                       className="rounded-xl border-gray-300 h-12 mb-4"
                       accept="*/*"
                     />
                     
                     {formData.fileAttachments && (
                       <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                         <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                           <FileText className="w-6 h-6 text-green-600" />
                         </div>
                         <div className="flex-1">
                           <p className="font-semibold text-green-800 text-base">
                             {formData.file?.name || "File Attached"}
                           </p>
                           {formData.file && (
                             <p className="text-green-600 text-sm">
                               {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                             </p>
                           )}
                         </div>
                         <div className="flex gap-2">
                           <Button
                             type="button"
                             size="sm"
                             variant="outline"
                             onClick={() => window.open(formData.fileAttachments, "_blank")}
                             className="rounded-lg border-green-300 text-green-700 hover:bg-green-50 font-semibold"
                           >
                             <Eye className="w-4 h-4 mr-2" />
                             Preview
                           </Button>
                           <Button
                             type="button"
                             size="sm"
                             variant="outline"
                             onClick={() => removeFileAttachment(false)}
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
                       Supported: Images, Documents, PDFs, etc. (Max 10MB)
                     </p>
                   </div>
                 </div>
     
                 <DialogFooter className="pt-6 border-t border-gray-200">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => {
                       setCreateDialogOpen(false);
                       clearRecording();
                     }}
                     className="py-3 rounded-xl font-semibold text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                   >
                     Cancel
                   </Button>
                   <Button
                     type="button"
                     onClick={() => handleSubmit(false)}
                     disabled={loading || !formData.title.trim()}
                     className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 shadow-lg shadow-green-500/25"
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
                 </DialogFooter>
               </div>
             </DialogContent>
           </Dialog>
     
           {/* Edit Task Dialog */}
           <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
             <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
               <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-2xl">
                 <div className="flex items-center justify-between">
                   <div>
                     <DialogTitle className="text-2xl font-bold text-white">
                       Edit Task
                     </DialogTitle>
                     <DialogDescription className="text-blue-100 text-base mt-1">
                       Update task details. New recordings/files will override existing ones.
                     </DialogDescription>
                   </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => {
                       setEditDialogOpen(false);
                       clearEditRecording();
                     }}
                     className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
                   >
                     <X className="w-5 h-5" />
                   </Button>
                 </div>
               </DialogHeader>
     
               <div className="space-y-6 p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <Label htmlFor="editTitle" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <FileText className="w-4 h-4 text-blue-600" />
                       Task Title *
                     </Label>
                     <Input
                       id="editTitle"
                       placeholder="Enter task title"
                       value={editFormData.title}
                       onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                       className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl"
                     />
                   </div>
                   
                   <div className="space-y-3">
                     <Label htmlFor="editClientName" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <User className="w-4 h-4 text-blue-600" />
                       Client Name
                     </Label>
                     <Input
                       id="editClientName"
                       placeholder="Enter client name"
                       value={editFormData.clientName}
                       onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                       className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl"
                     />
                   </div>
                   
                   <div className="space-y-3">
                     <Label htmlFor="editPriority" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <Clock className="w-4 h-4 text-blue-600" />
                       Priority
                     </Label>
                     <Select 
                       value={editFormData.priority} 
                       onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}
                     >
                       <SelectTrigger className="h-12 text-base rounded-xl">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="low">Low Priority</SelectItem>
                         <SelectItem value="medium">Medium Priority</SelectItem>
                         <SelectItem value="high">High Priority</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-3">
                     <Label htmlFor="editEndDate" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-blue-600" />
                       Due Date
                     </Label>
                     <Input
                       id="editEndDate"
                       type="date"
                       value={editFormData.endDate}
                       onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                       className="h-12 text-base rounded-xl"
                     />
                   </div>
                 </div>
     
                 {/* Assign To Section for Edit */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Team Leads Selection */}
                   <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                     <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-4 border-b">
                       <CardTitle className="text-base font-bold flex items-center gap-2">
                         <Users className="w-5 h-5 text-blue-600" />
                         Assign to Team Leads
                       </CardTitle>
                       <CardDescription className="text-xs text-gray-500">
                         Selected: {editFormData.teamleadIds.length} of {teamLeads.length}
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="p-4 pt-0">
                       <div className="space-y-2 max-h-60 overflow-y-auto mt-2">
                         {teamLeads.length > 0 ? (
                           teamLeads.map((teamLead) => (
                             <div key={teamLead._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200">
                               <Checkbox
                                 id={`edit-tl-${teamLead._id}`}
                                 checked={editFormData.teamleadIds.includes(teamLead._id)}
                                 onCheckedChange={(checked) => 
                                   handleCheckboxChange(teamLead._id, 'teamlead', checked, true)
                                 }
                               />
                               <Label
                                 htmlFor={`edit-tl-${teamLead._id}`}
                                 className="flex items-center gap-3 text-sm cursor-pointer flex-1"
                               >
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold">
                                     {teamLead.firstName?.[0]}{teamLead.lastName?.[0] || 'TL'}
                                   </AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1 min-w-0">
                                   <p className="font-semibold text-gray-900 truncate">
                                     {getDisplayName(teamLead)}
                                   </p>
                                   <p className="text-xs text-gray-600 truncate">
                                     <span className="flex items-center gap-1">
                                       <Building className="w-3 h-3" />
                                       {getDepartmentName(teamLead)}
                                     </span>
                                   </p>
                                 </div>
                               </Label>
                             </div>
                           ))
                         ) : (
                           <div className="text-center py-4">
                             <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                             <p className="text-gray-500 text-sm">No team leads available</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
     
                   {/* Employees Selection */}
                   <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                     <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 p-4 border-b">
                       <CardTitle className="text-base font-bold flex items-center gap-2">
                         <User className="w-5 h-5 text-green-600" />
                         Assign to Employees
                       </CardTitle>
                       <CardDescription className="text-xs text-gray-500">
                         Selected: {editFormData.employeeIds.length} of {employees.length}
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="p-4 pt-0">
                       <div className="space-y-2 max-h-60 overflow-y-auto mt-2">
                         {employees.length > 0 ? (
                           employees.map((employee) => (
                             <div key={employee._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200">
                               <Checkbox
                                 id={`edit-emp-${employee._id}`}
                                 checked={editFormData.employeeIds.includes(employee._id)}
                                 onCheckedChange={(checked) => 
                                   handleCheckboxChange(employee._id, 'employee', checked, true)
                                 }
                               />
                               <Label
                                 htmlFor={`edit-emp-${employee._id}`}
                                 className="flex items-center gap-3 text-sm cursor-pointer flex-1"
                               >
                                 <Avatar className="w-8 h-8">
                                   <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold">
                                     {employee.firstName?.[0]}{employee.lastName?.[0] || 'E'}
                                   </AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1 min-w-0">
                                   <p className="font-semibold text-gray-900 truncate">
                                     {getDisplayName(employee)}
                                   </p>
                                   <p className="text-xs text-gray-600 truncate">
                                     <span className="flex items-center gap-1">
                                       <Building className="w-3 h-3" />
                                       {getDepartmentName(employee)}
                                     </span>
                                   </p>
                                 </div>
                               </Label>
                             </div>
                           ))
                         ) : (
                           <div className="text-center py-4">
                             <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                             <p className="text-gray-500 text-sm">No employees available</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </div>
     
                 {/* Voice Recording Section for Edit */}
                 <div className="space-y-4">
                   <Label className="text-gray-700 font-semibold text-base flex items-center gap-3">
                     <AudioLines className="w-5 h-5 text-blue-600" />
                     Voice Instructions
                     {editFormData.audioUrl && !editRecordedAudio && (
                       <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-xs">
                         🎵 Existing Audio
                       </Badge>
                     )}
                     {editRecordedAudio && (
                       <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                         🔄 New Recording
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
                           onClick={isEditRecording ? stopEditRecording : startEditRecording}
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
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                               editRecordedAudio ? "bg-green-100" : "bg-blue-100"
                             }`}>
                               <AudioLines className={`w-6 h-6 ${
                                 editRecordedAudio ? "text-green-600" : "text-blue-600"
                               }`} />
                             </div>
                             <div>
                               <p className="font-semibold text-gray-900 text-lg">
                                 {editRecordedAudio ? "New Recording" : "Existing Audio"}
                               </p>
                               <p className="text-sm text-gray-600">
                                 {editRecordedAudio 
                                   ? "Ready to override existing audio" 
                                   : "Currently attached to this task"
                                 }
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
                                 onClick={() => {
                                   setEditFormData(prev => ({ ...prev, audioUrl: "" }));
                                   toast.success("Existing audio marked for removal");
                                 }}
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
                       </div>
                     )}
                   </div>
                 </div>
     
                 {/* File Upload for Edit */}
                 <div className="space-y-3">
                   <Label htmlFor="editFileAttachments" className="text-gray-700 font-semibold text-base flex items-center gap-3">
                     <FileText className="w-5 h-5 text-blue-600" />
                     File Attachments
                     {editFormData.fileAttachments && !editFormData.file && (
                       <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                         📎 Existing File
                       </Badge>
                     )}
                     {editFormData.file && (
                       <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-xs">
                         🔄 New File
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
     
                     {editFormData.fileAttachments && !editFormData.file && (
                       <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                         <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                           <FileText className="w-6 h-6 text-green-600" />
                         </div>
                         <div className="flex-1">
                           <p className="font-semibold text-green-800 text-base">
                             Existing File Attached
                           </p>
                           <p className="text-green-600 text-sm">
                             Upload a new file to replace this one
                           </p>
                         </div>
                         <div className="flex gap-2">
                           <Button
                             type="button"
                             size="sm"
                             variant="outline"
                             onClick={() => window.open(editFormData.fileAttachments, "_blank")}
                             className="rounded-lg border-green-300 text-green-700 hover:bg-green-50 font-semibold"
                           >
                             <Eye className="w-4 h-4 mr-2" />
                             View
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
     
                     {editFormData.file && (
                       <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                         <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                           <FileText className="w-6 h-6 text-blue-600" />
                         </div>
                         <div className="flex-1">
                           <p className="font-semibold text-blue-800 text-base">
                             {editFormData.file.name}
                           </p>
                           <p className="text-blue-600 text-sm">
                             New file to upload ({(editFormData.file.size / 1024 / 1024).toFixed(2)} MB)
                           </p>
                         </div>
                         <div className="flex gap-2">
                           <Button
                             type="button"
                             size="sm"
                             variant="outline"
                             onClick={() => window.open(URL.createObjectURL(editFormData.file), "_blank")}
                             className="rounded-lg border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                           >
                             <Eye className="w-4 h-4 mr-2" />
                             Preview
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
                   </div>
                 </div>
     
                 <DialogFooter className="pt-6 border-t border-gray-200">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => {
                       setEditDialogOpen(false);
                       clearEditRecording();
                     }}
                     className="py-3 rounded-xl font-semibold text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                   >
                     Cancel
                   </Button>
                   <Button
                     type="button"
                     onClick={() => handleSubmit(true)}
                     disabled={loading || !editFormData.title.trim()}
                     className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 shadow-lg shadow-blue-500/25"
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
                 </DialogFooter>
               </div>
             </DialogContent>
           </Dialog>

      {/* View Task Dialog with Enhanced Details */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-white">
                Task Details & Status Tracking
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewDialogOpen(false)}
                className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6 p-6">
              {/* Task Header */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <FileText className="w-6 h-6 text-green-600" />
                      Task Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">Title</Label>
                      <p className="font-bold text-gray-900 text-xl mt-1">{selectedTask.title}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">Client</Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">{selectedTask.clientName || "No client"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">Priority</Label>
                        <div className="mt-1">{getPriorityBadge(selectedTask.priority)}</div>
                      </div>
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">Due Date</Label>
                        <p className="font-semibold text-gray-900 text-lg mt-1">
                          {selectedTask.endDate ? formatDate(selectedTask.endDate) : "No due date"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

               

                {/* Progress Stats */}
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <Target className="w-6 h-6 text-purple-600" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-gray-600 text-sm font-medium">Completion</Label>
                        <span className="text-2xl font-bold text-gray-900">
                          {selectedTask.stats?.completionPercentage || 0}%
                        </span>
                      </div>
                      <Progress 
                        value={selectedTask.stats?.completionPercentage || 0} 
                        className="h-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-2xl font-bold text-yellow-700">{selectedTask.stats?.statusCounts.pending || 0}</p>
                        <p className="text-sm text-yellow-600 font-medium">Pending</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-700">{selectedTask.stats?.statusCounts.in_progress || 0}</p>
                        <p className="text-sm text-blue-600 font-medium">In Progress</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{selectedTask.stats?.statusCounts.completed || 0}</p>
                        <p className="text-sm text-green-600 font-medium">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-2xl font-bold text-red-700">{selectedTask.stats?.statusCounts.overdue || 0}</p>
                        <p className="text-sm text-red-600 font-medium">Overdue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assigned Team Members with Status */}
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                  <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                    <Users className="w-6 h-6 text-blue-600" />
                    Assigned Team Members ({selectedTask.stats?.totalAssignees || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team Leads */}
                    {selectedTask.teamleads?.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Team Leads ({selectedTask.teamleads.length})
                        </h3>
                        <div className="space-y-3">
                          {selectedTask.teamleads.map((tl, idx) => {
                            const teamLeadDetail = teamLeads.find(t => t._id === tl.teamleadId?._id || t._id === tl.teamleadId);
                            return (
                              <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold">
                                      {teamLeadDetail?.firstName?.[0]}{teamLeadDetail?.lastName?.[0] || 'TL'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-gray-900">{getDisplayName(teamLeadDetail)}</p>
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                        Team Lead
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                      <Building className="w-3 h-3" />
                                      {getDepartmentName(teamLeadDetail)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Assigned: {tl.assignedAt ? formatDate(tl.assignedAt) : "Unknown"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {getStatusBadge(tl.status)}
                                  <div className="flex gap-2">
                                   
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Employees */}
                    {selectedTask.employees?.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-green-600" />
                          Employees ({selectedTask.employees.length})
                        </h3>
                        <div className="space-y-3">
                          {selectedTask.employees.map((emp, idx) => {
                            const employeeDetail = employees.find(e => e._id === emp.employeeId?._id || e._id === emp.employeeId);
                            return (
                              <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="flex items-center gap-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold">
                                      {employeeDetail?.firstName?.[0]}{employeeDetail?.lastName?.[0] || 'E'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-gray-900">{getDisplayName(employeeDetail)}</p>
                                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                        Employee
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                      <Building className="w-3 h-3" />
                                      {getDepartmentName(employeeDetail)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Assigned: {emp.assignedAt ? formatDate(emp.assignedAt) : "Unknown"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {getStatusBadge(emp.status)}
                                  <div className="flex gap-2">
                                
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {(!selectedTask.teamleads?.length && !selectedTask.employees?.length) && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No team members assigned to this task</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share History Section */}
              {selectedTask.shares && selectedTask.shares.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <Share2 className="w-6 h-6 text-indigo-600" />
                      Share History & Hierarchy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {selectedTask.shares.map((share, index) => {
                        const sharerId = share.sharedBy?._id || share.sharedBy;
                        const receiverId = share.sharedTo?._id || share.sharedTo;
                        
                        const sharer = teamLeads.find(u => u._id === sharerId) || employees.find(u => u._id === sharerId);
                        const receiver = teamLeads.find(u => u._id === receiverId) || employees.find(u => u._id === receiverId);

                        return (
                          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex flex-col items-center">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                  <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                                    {sharer?.firstName?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-gray-500 mt-1 font-medium">Sharer</span>
                              </div>
                              
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                              
                              <div className="flex flex-col items-center">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-indigo-50">
                                  <AvatarFallback className="bg-indigo-500 text-white text-xs font-bold">
                                    {receiver?.firstName?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-indigo-600 mt-1 font-medium">Receiver</span>
                              </div>
                              
                              <div className="ml-4 flex-1">
                                <p className="font-bold text-gray-900">{getDisplayName(receiver)}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Shared on {formatDate(share.sharedAt)}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-white text-gray-600 border shadow-sm">
                              {share.sharedToModel === "TeamLead" ? "Team Lead" : "Employee"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Attachments Section */}
              {(selectedTask.audioUrl || selectedTask.fileAttachments) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Audio Section */}
                  {selectedTask.audioUrl && (
                    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 p-6 border-b">
                        <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                          <AudioLines className="w-6 h-6 text-purple-600" />
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
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 p-6 border-b">
                        <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                          <FileText className="w-6 h-6 text-green-600" />
                          File Attachments
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-green-800 text-lg">File Attached</p>
                              <p className="text-sm text-green-600">Download or view the attached file</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => window.open(selectedTask.fileAttachments, "_blank")}
                              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg px-6 py-3"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View File
                            </Button>
                            <Button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedTask.fileAttachments;
                                link.download = `task_${selectedTask.title}_attachment`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg px-6 py-3"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl px-8 py-3 font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Tracking Dialog */}
  <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
  <DialogContent className="max-w-4xl w-full max-h-[90vh] bg-white text-gray-900 rounded-2xl flex flex-col">
    
    {/* Header - fixed */}
    <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-2xl flex-shrink-0">
      <DialogTitle className="text-2xl font-bold text-white">
        Status Tracking
      </DialogTitle>
      <DialogDescription className="text-blue-100">
        Update and track status for each team member
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable content */}
    <div className="p-6 overflow-y-auto flex-1 space-y-6">
      {taskForStatus && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Leads Status */}
            {taskForStatus.teamleads?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Leads Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {taskForStatus.teamleads.map((tl, idx) => {
                      const teamLeadDetail = teamLeads.find(
                        t => t._id === tl.teamleadId?._id || t._id === tl.teamleadId
                      );
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {teamLeadDetail?.firstName?.[0]}{teamLeadDetail?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getDisplayName(teamLeadDetail)}</p>
                              <p className="text-sm text-gray-500">Team Lead</p>
                            </div>
                          </div>
                          <Badge
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              tl.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : tl.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : tl.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : tl.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tl.status.replace("_", " ").charAt(0).toUpperCase() +
                              tl.status.slice(1).replace("_", " ")}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employees Status */}
            {taskForStatus.employees?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Employees Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {taskForStatus.employees.map((emp, idx) => {
                      const employeeDetail = employees.find(
                        e => e._id === emp.employeeId?._id || e._id === emp.employeeId
                      );
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {employeeDetail?.firstName?.[0]}{employeeDetail?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getDisplayName(employeeDetail)}</p>
                              <p className="text-sm text-gray-500">Employee</p>
                            </div>
                          </div>
                          <Badge
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              emp.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : emp.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : emp.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : emp.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {emp.status.replace("_", " ").charAt(0).toUpperCase() +
                              emp.status.slice(1).replace("_", " ")}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Overall Progress</span>
                    <span className="font-bold">{taskForStatus.stats?.completionPercentage || 0}%</span>
                  </div>
                  <Progress value={taskForStatus.stats?.completionPercentage || 0} />
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold">{taskForStatus.stats?.statusCounts.pending || 0}</p>
                    <p className="text-sm text-yellow-600">Pending</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold">{taskForStatus.stats?.statusCounts.in_progress || 0}</p>
                    <p className="text-sm text-blue-600">In Progress</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold">{taskForStatus.stats?.statusCounts.completed || 0}</p>
                    <p className="text-sm text-green-600">Completed</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold">{taskForStatus.stats?.statusCounts.overdue || 0}</p>
                    <p className="text-sm text-red-600">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <DialogFooter className="flex-shrink-0">
            <Button onClick={() => setStatusDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>


      {/* Share Task Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Task
            </DialogTitle>
          </DialogHeader>
          
          {taskToShare && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold">{taskToShare.title}</p>
                <p className="text-sm text-gray-600">Share this task with another user</p>
              </div>
              
              <div className="space-y-3">
                <Label>Share With</Label>
                <Select 
                  value={shareFormData.sharedToModel}
                  onValueChange={(value) => setShareFormData({...shareFormData, sharedToModel: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TeamLead">Team Lead</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Select User</Label>
                <Select 
                  value={shareFormData.sharedToId}
                  onValueChange={(value) => setShareFormData({...shareFormData, sharedToId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareFormData.sharedToModel === "TeamLead" 
                      ? teamLeads.map(tl => (
                          <SelectItem key={tl._id} value={tl._id}>
                            {getDisplayName(tl)} (Team Lead)
                          </SelectItem>
                        ))
                      : employees.map(emp => (
                          <SelectItem key={emp._id} value={emp._id}>
                            {getDisplayName(emp)} (Employee)
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Message (Optional)</Label>
                <Input 
                  placeholder="Add a message..." 
                  value={shareFormData.message}
                  onChange={(e) => setShareFormData({...shareFormData, message: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShareSubmit} 
              disabled={!shareFormData.sharedToId}
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white"
            >
              Share Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (same as before) */}
  {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the task <span className="font-bold">"{taskToDelete?.title}"</span>?
              This action cannot be undone.
            </p>
            {taskToDelete?.fileAttachments || taskToDelete?.audioUrl ? (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                Note: This will also delete attached files and audio recordings from storage.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
              className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}