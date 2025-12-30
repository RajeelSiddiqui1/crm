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
  Clock
} from "lucide-react";
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

  const [loading, setLoading] = useState(false);

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

  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB");
        return;
      }

      if (isEdit) {
        setEditFormData(prev => ({
          ...prev,
          file: file,
          fileAttachments: URL.createObjectURL(file)
        }));
        toast.success("New file selected for upload!");
      } else {
        setFormData(prev => ({
          ...prev,
          file: file,
          fileAttachments: URL.createObjectURL(file)
        }));
        toast.success("File attached successfully!");
      }
    }
  };

  const removeFileAttachment = (isEdit = false) => {
    if (isEdit) {
      setEditFormData(prev => ({ ...prev, fileAttachments: "", file: null }));
      toast.info("File removed");
    } else {
      setFormData(prev => ({ ...prev, fileAttachments: "", file: null }));
      toast.info("File removed");
    }
  };

  const handleCheckboxChange = (id, type, checked, isEdit = false) => {
    if (isEdit) {
      if (type === 'teamlead') {
        setEditFormData({
          ...editFormData,
          teamleadIds: checked 
            ? [...editFormData.teamleadIds, id]
            : editFormData.teamleadIds.filter(item => item !== id)
        });
      } else {
        setEditFormData({
          ...editFormData,
          employeeIds: checked 
            ? [...editFormData.employeeIds, id]
            : editFormData.employeeIds.filter(item => item !== id)
        });
      }
    } else {
      if (type === 'teamlead') {
        setFormData({
          ...formData,
          teamleadIds: checked 
            ? [...formData.teamleadIds, id]
            : formData.teamleadIds.filter(item => item !== id)
        });
      } else {
        setFormData({
          ...formData,
          employeeIds: checked 
            ? [...formData.employeeIds, id]
            : formData.employeeIds.filter(item => item !== id)
        });
      }
    }
  };

  const handleSubmit = async (isEdit = false) => {
    const dataToSubmit = isEdit ? editFormData : formData;
    
    if (!dataToSubmit.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("title", dataToSubmit.title);
      data.append("clientName", dataToSubmit.clientName);
      data.append("priority", dataToSubmit.priority);
      data.append("endDate", dataToSubmit.endDate);
      data.append("teamleadIds", JSON.stringify(dataToSubmit.teamleadIds));
      data.append("employeeIds", JSON.stringify(dataToSubmit.employeeIds));
      
      if (isEdit ? editFormData.file : formData.file) {
        data.append("file", isEdit ? editFormData.file : formData.file);
      }
      
      if (isEdit ? editAudioBlob : audioBlob) {
        data.append("audio", isEdit ? editAudioBlob : audioBlob);
      }

      let response;
      if (isEdit && selectedTask) {
        response = await axios.put(`/api/admin/tasks2/${selectedTask._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post("/api/admin/tasks2", data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

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

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Helper function to get display name
  const getDisplayName = (item) => {
    if (!item) return "Unknown";
    return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || "Unknown";
  };

  // Helper function to get department name
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

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (type) => {
    const colors = {
      teamLead: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      employee: "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
    };
    
    return (
      <Badge className={`${colors[type]} text-xs px-2 py-1 rounded-md`}>
        {type === 'teamLead' ? 'Team Lead' : 'Employee'}
      </Badge>
    );
  };

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
              Task Management
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Create and manage tasks with voice instructions for team leads and employees
            </p>
          </div>
          <div className="flex items-center gap-3 self-center sm:self-auto">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Leads</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{teamLeads.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Employees</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{employees.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Audio</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.filter(t => t.audioUrl).length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Tasks
                </CardTitle>
                <CardDescription className="text-gray-600 text-base mt-2">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to team leads and employees
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search tasks, clients..."
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
                        Attachments
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
                              <div className="flex items-center gap-2 mt-2">
                                {task.audioUrl && (
                                  <Badge variant="outline" className="text-xs bg-gray-800 text-white border-gray-700 px-2 py-1 rounded-lg">
                                    <AudioLines className="w-3 h-3 mr-1" />
                                    Voice
                                  </Badge>
                                )}
                                {task.fileAttachments && (
                                  <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50 px-2 py-1 rounded-lg">
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
                          {getPriorityBadge(task.priority)}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-gray-700 font-medium">
                                {task.teamleads?.length || 0} Team Lead{task.teamleads?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-700 font-medium">
                                {task.employees?.length || 0} Employee{task.employees?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3 text-gray-600">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold">
                              {task.endDate ? formatDate(task.endDate) : "No due date"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex gap-2">
                            {task.fileAttachments && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border-green-300 text-green-700 bg-green-50">
                                <FileText className="w-3 h-3" />
                                File
                              </Badge>
                            )}
                            {task.audioUrl && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border-purple-300 text-purple-700 bg-purple-50">
                                <AudioLines className="w-3 h-3" />
                                Audio
                              </Badge>
                            )}
                            {!task.fileAttachments && !task.audioUrl && (
                              <span className="text-sm text-gray-500 italic">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-lg w-48">
                              <DropdownMenuItem onClick={() => handleView(task)} className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                                <Eye className="w-4 h-4" />
                                View Details
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

      {/* View Task Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-white">
                Task Details
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <FileText className="w-6 h-6 text-green-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">Title</Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">{selectedTask.title}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">Client</Label>
                      <p className="font-semibold text-gray-900 text-lg mt-1">{selectedTask.clientName || "No client"}</p>
                    </div>
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
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <Users className="w-6 h-6 text-blue-600" />
                      Assigned Team ({selectedTask.teamleads?.length + selectedTask.employees?.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {selectedTask.teamleads?.length > 0 || selectedTask.employees?.length > 0 ? (
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {/* Team Leads */}
                        {selectedTask.teamleads?.map((tl, idx) => {
                          const teamLeadDetail = teamLeads.find(t => t._id === tl.teamleadId?._id || t._id === tl.teamleadId);
                          return (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-bold">
                                  {teamLeadDetail?.firstName?.[0]}{teamLeadDetail?.lastName?.[0] || 'TL'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">{getDisplayName(teamLeadDetail)}</p>
                                  {getRoleBadge('teamLead')}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {getDepartmentName(teamLeadDetail)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Employees */}
                        {selectedTask.employees?.map((emp, idx) => {
                          const employeeDetail = employees.find(e => e._id === emp.employeeId?._id || e._id === emp.employeeId);
                          return (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold">
                                  {employeeDetail?.firstName?.[0]}{employeeDetail?.lastName?.[0] || 'E'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">{getDisplayName(employeeDetail)}</p>
                                  {getRoleBadge('employee')}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {getDepartmentName(employeeDetail)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-base">No team members assigned to this task</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

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
                        <FileText className="w-8 h-8 text-green-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-800 text-base">File Attached</p>
                          <p className="text-sm text-green-600">Click below to view or download the file</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => window.open(selectedTask.fileAttachments, "_blank")}
                          variant="outline"
                          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2"
                        >
                          <FileText className="w-4 h-4" />
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
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl px-8 py-3 font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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