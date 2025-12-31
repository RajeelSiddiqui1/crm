"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  User,
  Building,
  FileText,
  ClipboardList,
  Share2,
  TrendingUp,
  Loader2,
  X,
  Briefcase,
  Plus,
  Check,
  Mic,
  MicOff,
  Upload,
  Trash2,
  Play,
  Pause,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Search,
  UserCheck,
  Sparkles,
  Target,
  Clock,
  FolderOpen,
  MessageSquare,
  Zap,
  Eye,
} from "lucide-react";
import axios from "axios";
import { debounce } from "lodash";

// Import UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

function UserTasks({ onClose }) {
  const [data, setData] = useState({
    managers: [],
    teamLeads: [],
    employees: [],
  });
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState(["all"]);
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    priority: "medium",
    endDate: "",
    description: "",
    category: "general",
  });
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [fileAttachment, setFileAttachment] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const mediaRecorderRef = React.useRef(null);
  const audioPlayerRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/admin/users-info");
        const m = res.data.managers || [];
        const t = res.data.teamLeads || [];
        const e = res.data.employees || [];
        setData({ managers: m, teamLeads: t, employees: e });

        // Extract departments
        const depts = new Set();
        [...m, ...t, ...e].forEach(u => {
          const dept = u.manager?.departments?.[0]?.name || u.teamLead?.depId?.name || u.employee?.depId?.name;
          if (dept) depts.add(dept);
        });
        setDepartments(["all", ...Array.from(depts)]);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Selection handlers
  const handleManagerSelect = (id) => {
    const newSelected = selectedManagers.includes(id)
      ? selectedManagers.filter(x => x !== id)
      : [...selectedManagers, id];
    
    setSelectedManagers(newSelected);
    if (newSelected.length > 0) {
      setSelectedType("manager");
      setSelectedTeamLeads([]);
      setSelectedEmployees([]);
    } else if (selectedTeamLeads.length === 0 && selectedEmployees.length === 0) {
      setSelectedType(null);
    }
  };

  const handleTeamLeadSelect = (id) => {
    const newSelected = selectedTeamLeads.includes(id)
      ? selectedTeamLeads.filter(x => x !== id)
      : [...selectedTeamLeads, id];
    
    setSelectedTeamLeads(newSelected);
    if (newSelected.length > 0 || selectedEmployees.length > 0) {
      setSelectedType("teamlead_employee");
      setSelectedManagers([]);
    } else if (selectedManagers.length === 0) {
      setSelectedType(null);
    }
  };

  const handleEmployeeSelect = (id) => {
    const newSelected = selectedEmployees.includes(id)
      ? selectedEmployees.filter(x => x !== id)
      : [...selectedEmployees, id];
    
    setSelectedEmployees(newSelected);
    if (newSelected.length > 0 || selectedTeamLeads.length > 0) {
      setSelectedType("teamlead_employee");
      setSelectedManagers([]);
    } else if (selectedManagers.length === 0) {
      setSelectedType(null);
    }
  };

  const clearAllSelections = () => {
    setSelectedManagers([]);
    setSelectedTeamLeads([]);
    setSelectedEmployees([]);
    setSelectedType(null);
  };

  const totalSelected = selectedManagers.length + selectedTeamLeads.length + selectedEmployees.length;
  const isAnyUserSelected = totalSelected > 0;

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioFile(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }
      setFileAttachment(file);
    }
  };

  // Task submission
  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      alert("Title is required");
      return;
    }

    if (!isAnyUserSelected) {
      alert("Please select at least one user");
      return;
    }

    setLoading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("clientName", formData.clientName);
      submitFormData.append("priority", formData.priority);
      submitFormData.append("endDate", formData.endDate);
      submitFormData.append("description", formData.description);
      submitFormData.append("category", formData.category);

      if (selectedType === "manager") {
        submitFormData.append("managersId", JSON.stringify(selectedManagers));
      } else {
        submitFormData.append("teamleadIds", JSON.stringify(selectedTeamLeads));
        submitFormData.append("employeeIds", JSON.stringify(selectedEmployees));
      }

      if (fileAttachment) {
        submitFormData.append("file", fileAttachment);
      }

      if (audioFile) {
        const audioFileObj = new File([audioFile], "audio.webm", { type: "audio/webm" });
        submitFormData.append("audio", audioFileObj);
      }

      const endpoint = selectedType === "manager" ? "/api/admin/tasks" : "/api/admin/tasks2";
      const response = await axios.post(endpoint, submitFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        alert("Task created successfully!");
        resetForm();
        if (onClose) onClose();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      clientName: "",
      priority: "medium",
      endDate: "",
      description: "",
      category: "general",
    });
    clearAllSelections();
    setAudioFile(null);
    setAudioUrl("");
    setFileAttachment(null);
    setShowTaskForm(false);
    setShowSelectionModal(true);
  };

  const handleProceedToTaskForm = () => {
    setShowSelectionModal(false);
    setShowTaskForm(true);
  };

  const handleBackToSelection = () => {
    setShowTaskForm(false);
    setShowSelectionModal(true);
  };

  const handleCloseAll = () => {
    resetForm();
    if (onClose) onClose();
  };

  // Filter users
  const getFilteredUsers = (users, type) => {
    return users.filter((item) => {
      const user = item[type] || item.manager || item.teamLead || item.employee;
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      const dept = type === 'manager' ? user.departments?.[0]?.name : user.depId?.name;
      
      const matchesSearch = !searchQuery || fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
      const matchesDept = selectedDepartment === 'all' || dept === selectedDepartment;
      
      return matchesSearch && matchesDept;
    });
  };

  const filteredManagers = getFilteredUsers(data.managers, 'manager');
  const filteredTeamLeads = getFilteredUsers(data.teamLeads, 'teamLead');
  const filteredEmployees = getFilteredUsers(data.employees, 'employee');

  // User Card Component
  const UserCard = ({ user, stats, type, isSelected, onSelect }) => {
    const userData = user.manager || user.teamLead || user.employee || user;
    const userName = `${userData.firstName} ${userData.lastName}`;
    const userEmail = userData.email;
    const userDept = type === 'manager' 
      ? userData.departments?.[0]?.name
      : userData.depId?.name;
    
    const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
    
    const typeColors = {
      manager: "from-purple-500 via-pink-500 to-rose-500",
      teamLead: "from-blue-500 via-cyan-500 to-teal-500",
      employee: "from-emerald-500 via-green-500 to-teal-500"
    };

    const typeBorderColors = {
      manager: "border-purple-400 shadow-purple-200",
      teamLead: "border-blue-400 shadow-blue-200",
      employee: "border-emerald-400 shadow-emerald-200"
    };

    const typeCheckColors = {
      manager: "bg-gradient-to-br from-purple-600 to-pink-600",
      teamLead: "bg-gradient-to-br from-blue-600 to-cyan-600",
      employee: "bg-gradient-to-br from-emerald-600 to-teal-600"
    };
    
    const activeColor = typeColors[type] || typeColors.employee;
    const activeBorder = typeBorderColors[type] || typeBorderColors.employee;
    const activeCheck = typeCheckColors[type] || typeCheckColors.employee;

    return (
      <div
        onClick={onSelect}
        className={`
          relative group cursor-pointer rounded-xl border-2 p-4 transition-all duration-300
          hover:shadow-xl hover:-translate-y-1
          ${isSelected 
            ? `bg-gradient-to-br ${activeColor} bg-opacity-10 ${activeBorder} shadow-lg` 
            : "bg-white border-gray-200 hover:border-gray-300"}
        `}
      >
        <div className="absolute top-3 right-3">
          <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md
            ${isSelected 
              ? `${activeCheck} scale-110` 
              : "bg-gray-200 group-hover:bg-gray-300"}
          `}>
            {isSelected && <Check size={16} className="text-white stroke-[3]" />}
          </div>
        </div>

        <div className="flex items-start gap-3 pr-8">
          <Avatar className={`h-14 w-14 border-3 shadow-lg transition-all duration-300 ${isSelected ? 'ring-2 ring-white ring-offset-2' : ''}`}>
            {userData.profilePic && <AvatarImage src={userData.profilePic} />}
            <AvatarFallback className={`text-base font-bold bg-gradient-to-br ${activeColor} text-white`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className={`font-bold truncate transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>{userName}</p>
            <p className={`text-xs truncate ${isSelected ? 'text-gray-700' : 'text-gray-600'}`}>{userEmail}</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {userDept && (
                <Badge variant="secondary" className={`text-[10px] px-2.5 py-0.5 font-semibold ${isSelected ? 'bg-white/80 text-gray-800' : 'bg-gray-100 text-gray-700'}`}>
                  <Building className="w-3 h-3 mr-1 inline" />
                  {userDept}
                </Badge>
              )}
              {stats && (
                <>
                  {stats.pending > 0 && (
                    <Badge className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                      <Clock className="w-3 h-3 mr-1 inline" />
                      {stats.pending}
                    </Badge>
                  )}
                  {stats.inProgress > 0 && (
                    <Badge className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                      <TrendingUp className="w-3 h-3 mr-1 inline" />
                      {stats.inProgress}
                    </Badge>
                  )}
                  {stats.completed > 0 && (
                    <Badge className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      <Check className="w-3 h-3 mr-1 inline" />
                      {stats.completed}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Selection Modal */}
      <Dialog open={showSelectionModal} onOpenChange={(open) => !open && handleCloseAll()}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col bg-white">
          <DialogHeader className="px-6 py-4 bg-white border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Select Assignees
                  {totalSelected > 0 && <Badge className="bg-blue-600 text-white">{totalSelected}</Badge>}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Choose people to assign this task to
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                {/* Task Stats Legend */}
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                      <Clock className="w-3 h-3 mr-1 inline" />
                      #
                    </Badge>
                    <span className="text-xs text-gray-600 font-medium">Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                      <TrendingUp className="w-3 h-3 mr-1 inline" />
                      #
                    </Badge>
                    <span className="text-xs text-gray-600 font-medium">In Progress</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-[10px] px-2 py-0.5 font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      <Check className="w-3 h-3 mr-1 inline" />
                      #
                    </Badge>
                    <span className="text-xs text-gray-600 font-medium">Completed</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={clearAllSelections} disabled={totalSelected === 0}>
                  Clear All
                </Button>
                <Button onClick={handleProceedToTaskForm} disabled={totalSelected === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Next Step <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCloseAll}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search people..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-gray-300"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[200px] bg-white border-gray-300">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
               <SelectContent className="bg-white border-gray-300">
  {departments.map(d => (
    <SelectItem
      key={d}
      value={d}
      className={`hover:bg-gray-100 ${
        d === "all" ? "text-gray-900 font-medium" : "text-gray-500"
      }`}
    >
      {d === "all" ? "All Departments" : d}
    </SelectItem>
  ))}
</SelectContent>

              </Select>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 bg-white">
            <div className="p-6 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p>Loading directory...</p>
                </div>
              )}

              {!loading && (
                <>
                  {/* Managers */}
                  <section className={`space-y-4 ${selectedType === 'teamlead_employee' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      Managers
                      <Badge variant="outline" className="font-normal bg-purple-500 text-white">{filteredManagers.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredManagers.map(m => (
                        <UserCard 
                          key={m.manager._id} 
                          user={m} 
                          type="manager" 
                          stats={m.stats}
                          isSelected={selectedManagers.includes(m.manager._id)}
                          onSelect={() => handleManagerSelect(m.manager._id)}
                        />
                      ))}
                      {filteredManagers.length === 0 && <p className="text-sm text-gray-400 col-span-full italic py-4 text-center">No managers found</p>}
                    </div>
                  </section>

                  {/* Team Leads */}
                  <section className={`space-y-4 ${selectedType === 'manager' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Team Leads
                      <Badge variant="outline" className="font-normal bg-blue-500 text-white">{filteredTeamLeads.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredTeamLeads.map(t => (
                        <UserCard 
                          key={t.teamLead._id} 
                          user={t} 
                          type="teamLead" 
                          stats={t.stats}
                          isSelected={selectedTeamLeads.includes(t.teamLead._id)}
                          onSelect={() => handleTeamLeadSelect(t.teamLead._id)}
                        />
                      ))}
                      {filteredTeamLeads.length === 0 && <p className="text-sm text-gray-400 col-span-full italic py-4 text-center">No team leads found</p>}
                    </div>
                  </section>

                  {/* Employees */}
                  <section className={`space-y-4 ${selectedType === 'manager' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      Employees
                      <Badge variant="outline" className="font-normal bg-emerald-500 text-white">{filteredEmployees.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredEmployees.map(e => (
                        <UserCard 
                          key={e.employee._id} 
                          user={e} 
                          type="employee" 
                          stats={e.stats}
                          isSelected={selectedEmployees.includes(e.employee._id)}
                          onSelect={() => handleEmployeeSelect(e.employee._id)}
                        />
                      ))}
                      {filteredEmployees.length === 0 && <p className="text-sm text-gray-400 col-span-full italic py-4 text-center">No employees found</p>}
                    </div>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Task Form Modal */}
      <Dialog open={showTaskForm} onOpenChange={(open) => !open && handleCloseAll()}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col bg-white overflow-hidden">
          <DialogHeader className="px-6 py-4 bg-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBackToSelection}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">Create Task</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Assign task to {totalSelected} selected user{totalSelected !== 1 ? 's' : ''}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCreateTask} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCloseAll} disabled={loading}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 bg-white">
            <div className="p-6 max-w-3xl mx-auto space-y-6">
              {/* Task Details */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-medium">Task Title <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="text-lg py-6 font-medium border-gray-300 bg-white text-gray-900"
                      placeholder="e.g. Q3 Performance Review"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium">Client / Project</Label>
                      <Input 
                        value={formData.clientName} 
                        onChange={e => setFormData({...formData, clientName: e.target.value})}
                        placeholder="e.g. Internal"
                        className="border-gray-300 bg-white text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium">Due Date</Label>
                      <Input 
                        type="date"
                        value={formData.endDate} 
                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                        className="border-gray-300 bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 font-medium">Priority</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['low', 'medium', 'high'].map(p => (
                        <div 
                          key={p}
                          onClick={() => setFormData({...formData, priority: p})}
                          className={`
                            cursor-pointer text-center py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all duration-300 capitalize transform hover:scale-105
                            ${formData.priority === p 
                              ? p === 'high' ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-500 text-white shadow-lg shadow-orange-200'
                              : p === 'medium' ? 'bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-500 text-white shadow-lg shadow-blue-200'
                              : 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-200'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'}
                          `}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>


                </CardContent>
              </Card>

              {/* Selected Users */}
              <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader className="bg-white/80 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    Selected Assignees ({totalSelected})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {selectedManagers.map(id => {
                      const user = data.managers.find(m => m.manager._id === id);
                      if (!user) return null;
                      const userData = user.manager;
                      const name = `${userData.firstName} ${userData.lastName}`;
                      const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
                      return (
                        <Badge key={id} className="bg-gradient-to-br from-purple-500 to-pink-600 text-white px-3 py-2 text-sm font-semibold flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {userData.profilePic && <AvatarImage src={userData.profilePic} />}
                            <AvatarFallback className="bg-white text-purple-600 text-xs font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          {name}
                        </Badge>
                      );
                    })}
                    {selectedTeamLeads.map(id => {
                      const user = data.teamLeads.find(t => t.teamLead._id === id);
                      if (!user) return null;
                      const userData = user.teamLead;
                      const name = `${userData.firstName} ${userData.lastName}`;
                      const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
                      return (
                        <Badge key={id} className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white px-3 py-2 text-sm font-semibold flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {userData.profilePic && <AvatarImage src={userData.profilePic} />}
                            <AvatarFallback className="bg-white text-blue-600 text-xs font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          {name}
                        </Badge>
                      );
                    })}
                    {selectedEmployees.map(id => {
                      const user = data.employees.find(e => e.employee._id === id);
                      if (!user) return null;
                      const userData = user.employee;
                      const name = `${userData.firstName} ${userData.lastName}`;
                      const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
                      return (
                        <Badge key={id} className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-3 py-2 text-sm font-semibold flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {userData.profilePic && <AvatarImage src={userData.profilePic} />}
                            <AvatarFallback className="bg-white text-emerald-600 text-xs font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          {name}
                        </Badge>
                      );
                    })}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBackToSelection}
                    className="mt-4 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Edit Selection
                  </Button>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-blue-600" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Voice Note */}
                    <div className="space-y-3">
                      <Label className="text-gray-900 font-medium">Voice Note</Label>
                      {audioUrl ? (
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <Button size="icon" variant="ghost" className="rounded-full bg-white shadow-sm" onClick={togglePlayback}>
                            {isPlaying ? <Pause className="w-4 h-4 text-blue-600" /> : <Play className="w-4 h-4 text-blue-600" />}
                          </Button>
                          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all" style={{width: `${(currentTime/audioDuration)*100}%`}} />
                          </div>
                          <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => { setAudioFile(null); setAudioUrl(''); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <audio 
                            ref={audioPlayerRef} 
                            src={audioUrl} 
                            onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
                            onLoadedMetadata={e => setAudioDuration(e.target.duration)}
                            onEnded={() => setIsPlaying(false)} 
                            hidden 
                          />
                        </div>
                      ) : (
                        <Button 
                          className={`w-full font-bold transition-all duration-300 transform hover:scale-105 ${
                            isRecording 
                              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-200' 
                              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-200'
                          }`}
                          onClick={isRecording ? stopRecording : startRecording}
                        >
                          {isRecording ? <><MicOff className="w-4 h-4 mr-2 animate-pulse" /> Stop Recording</> : <><Mic className="w-4 h-4 mr-2" /> Record Voice Note</>}
                        </Button>
                      )}
                    </div>

                    {/* File */}
                    <div className="space-y-3">
                      <Label className="text-gray-900 font-medium">Document</Label>
                      {fileAttachment ? (
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <FileText className="w-8 h-8 text-blue-500 p-1.5 bg-blue-50 rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">{fileAttachment.name}</p>
                            <p className="text-xs text-gray-500">{(fileAttachment.size/1024/1024).toFixed(2)} MB</p>
                          </div>
                          <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setFileAttachment(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Button 
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold shadow-lg shadow-blue-200 transition-all duration-300 transform hover:scale-105" 
                            onClick={() => document.getElementById('file-input').click()}
                          >
                            <Upload className="w-4 h-4 mr-2" /> Upload File
                          </Button>
                          <input id="file-input" type="file" className="hidden" onChange={handleFileChange} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserTasks;