"use client";
import React, { useState, useEffect } from "react";
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
  Music, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Loader2,
  Plus,
  Download,
  Play,
  X,
  Upload,
  AlertCircle
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
    audio: null
  });
  
  const [existingFile, setExistingFile] = useState(null);
  const [existingAudio, setExistingAudio] = useState(null);
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
      
      // Try different API endpoints based on your setup
      // Option 1: Using /api/admin/teamleads and /api/admin/employees
      // Option 2: Using your existing endpoints from code snippet
      
      console.log("Fetching data from endpoints...");
      
      // Fetch tasks
      try {
        const tasksRes = await axios.get("/api/admin/tasks2");
        console.log("Tasks Response:", tasksRes.data);
        if (tasksRes.data.success) {
          setTasks(tasksRes.data.tasks || []);
        } else {
          toast.error("Failed to fetch tasks: " + (tasksRes.data.message || "Unknown error"));
        }
      } catch (tasksError) {
        console.error("Tasks fetch error:", tasksError);
        toast.error("Failed to fetch tasks");
      }

      // Fetch team leads - TRY DIFFERENT ENDPOINTS
      try {
        // Try first endpoint
        const teamLeadsRes = await axios.get("/api/admin/teamleads");
        console.log("TeamLeads Response:", teamLeadsRes.data);
        
        // Check response structure
        if (teamLeadsRes.data.success) {
          // Try different property names
          const teamLeadsData = teamLeadsRes.data.teamLeads || 
                               teamLeadsRes.data.teamleads || 
                               teamLeadsRes.data.data || 
                               [];
          setTeamLeads(teamLeadsData);
          console.log("Team leads fetched:", teamLeadsData.length);
        } else {
          toast.error("Team leads: " + (teamLeadsRes.data.message || "No data"));
        }
      } catch (teamLeadsError) {
        console.error("TeamLeads fetch error:", teamLeadsError);
        
        // Try alternative endpoint if first one fails
        try {
          const altTeamLeadsRes = await axios.get("/api/teamleads");
          console.log("Alternative TeamLeads Response:", altTeamLeadsRes.data);
          if (altTeamLeadsRes.data.success) {
            const teamLeadsData = altTeamLeadsRes.data.teamleads || 
                                 altTeamLeadsRes.data.teamLeads || 
                                 altTeamLeadsRes.data.data || 
                                 [];
            setTeamLeads(teamLeadsData);
          }
        } catch (altError) {
          console.error("Alternative endpoint also failed:", altError);
          toast.error("Failed to fetch team leads");
        }
      }

      // Fetch employees - TRY DIFFERENT ENDPOINTS
      try {
        const employeesRes = await axios.get("/api/admin/employees");
        console.log("Employees Response:", employeesRes.data);
        
        if (employeesRes.data.success) {
          // Try different property names
          const employeesData = employeesRes.data.employees || 
                               employeesRes.data.employee || 
                               employeesRes.data.data || 
                               [];
          setEmployees(employeesData);
          console.log("Employees fetched:", employeesData.length);
        } else {
          toast.error("Employees: " + (employeesRes.data.message || "No data"));
        }
      } catch (employeesError) {
        console.error("Employees fetch error:", employeesError);
        
        // Try alternative endpoint
        try {
          const altEmployeesRes = await axios.get("/api/employees");
          console.log("Alternative Employees Response:", altEmployeesRes.data);
          if (altEmployeesRes.data.success) {
            const employeesData = altEmployeesRes.data.employees || 
                                 altEmployeesRes.data.employee || 
                                 altEmployeesRes.data.data || 
                                 [];
            setEmployees(employeesData);
          }
        } catch (altError) {
          console.error("Alternative endpoint also failed:", altError);
          toast.error("Failed to fetch employees");
        }
      }

    } catch (error) {
      console.error("General Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setFetching(false);
    }
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      clientName: task.clientName || "",
      priority: task.priority || "low",
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : "",
      teamleadIds: task.teamleads?.map(tl => tl.teamleadId?._id || tl.teamleadId) || [],
      employeeIds: task.employees?.map(emp => emp.employeeId?._id || emp.employeeId) || [],
      file: null,
      audio: null
    });
    setExistingFile(task.fileAttachments ? {
      url: task.fileAttachments,
      name: task.fileName,
      type: task.fileType
    } : null);
    setExistingAudio(task.audioUrl ? { url: task.audioUrl } : null);
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
      audio: null
    });
    setExistingFile(null);
    setExistingAudio(null);
    setCreateDialogOpen(true);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'file') {
        setFormData({ ...formData, file });
        setExistingFile(null);
      } else {
        setFormData({ ...formData, audio: file });
        setExistingAudio(null);
      }
    }
  };

  const removeFile = (type) => {
    if (type === 'file') {
      setFormData({ ...formData, file: null });
      setExistingFile(null);
    } else {
      setFormData({ ...formData, audio: null });
      setExistingAudio(null);
    }
  };

  const handleCheckboxChange = (id, type, checked) => {
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
  };

  const handleSubmit = async (isEdit = false) => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("title", formData.title);
      data.append("clientName", formData.clientName);
      data.append("priority", formData.priority);
      data.append("endDate", formData.endDate);
      data.append("teamleadIds", JSON.stringify(formData.teamleadIds));
      data.append("employeeIds", JSON.stringify(formData.employeeIds));
      
      if (formData.file) data.append("file", formData.file);
      if (formData.audio) data.append("audio", formData.audio);

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
        } else {
          setCreateDialogOpen(false);
        }
        // Reset form
        setFormData({
          title: "",
          clientName: "",
          priority: "low",
          endDate: "",
          teamleadIds: [],
          employeeIds: [],
          file: null,
          audio: null
        });
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
      high: "bg-red-100 text-red-800 hover:bg-red-100",
      medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      low: "bg-green-100 text-green-800 hover:bg-green-100"
    };

    return (
      <Badge className={`${colors[priority]} border-0 font-medium`}>
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading...</span>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              Task Management
            </h1>
            <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg">
              Create and manage tasks for team leads and employees
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-blue-50">
                Team Leads: {teamLeads.length}
              </Badge>
              <Badge variant="outline" className="bg-green-50">
                Employees: {employees.length}
              </Badge>
              <Badge variant="outline" className="bg-purple-50">
                Tasks: {tasks.length}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 self-center sm:self-auto">
            <Button
              onClick={fetchAllData}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white text-xs sm:text-sm"
            >
              <Loader2 className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleCreate}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        <Card className="shadow-xl sm:shadow-2xl shadow-green-500/10 border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Tasks
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} created by you
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-9 sm:pl-10 pr-4 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm h-10 sm:h-11 text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-12 sm:py-16">
                <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-green-600" />
                  <span className="text-sm sm:text-base md:text-lg">Loading tasks...</span>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-300 mb-3 sm:mb-4">
                  <FileText className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {tasks.length === 0 ? "No tasks yet" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto px-4">
                  {tasks.length === 0 
                    ? "Get started by creating your first task."
                    : "Try adjusting your search terms to find what you're looking for."
                  }
                </p>
                {tasks.length === 0 && (
                  <Button 
                    onClick={handleCreate}
                    className="mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-green-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Task Title
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Client
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Assigned To
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Priority
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        Due Date
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Attachments
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task, index) => (
                      <TableRow 
                        key={task._id} 
                        className="group hover:bg-gradient-to-r hover:from-green-50/80 hover:to-blue-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-3 sm:py-4">
                          <div className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-green-700 transition-colors duration-200 truncate max-w-[200px]">
                            {task.title}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="text-gray-700 text-sm">{task.clientName || "N/A"}</div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-gray-600">
                                {task.teamleads?.length || 0} Team Lead{task.teamleads?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-gray-600">
                                {task.employees?.length || 0} Employee{task.employees?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          {getPriorityBadge(task.priority)}
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                              {task.endDate ? formatDate(task.endDate) : "No due date"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex gap-2">
                            {task.fileAttachments && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                File
                              </Badge>
                            )}
                            {task.audioUrl && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                Audio
                              </Badge>
                            )}
                            {!task.fileAttachments && !task.audioUrl && (
                              <span className="text-xs text-gray-500">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white text-black">
                              <DropdownMenuItem onClick={() => handleView(task)} className="text-black cursor-pointer text-xs sm:text-sm">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(task)} className="text-black cursor-pointer text-xs sm:text-sm">
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(task)}
                                className="text-red-600 cursor-pointer text-xs sm:text-sm"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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

      {/* View Task Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">Task Details</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black">
                      {selectedTask.title}
                    </h2>
                    {selectedTask.clientName && (
                      <p className="text-gray-600 text-sm sm:text-base mt-1">
                        Client: <span className="font-medium">{selectedTask.clientName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(selectedTask.priority)}
                    {selectedTask.endDate && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due: {formatDate(selectedTask.endDate)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Created: {formatDate(selectedTask.createdAt)}
                </div>
              </div>

              {/* Assigned To Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Team Leads Card */}
                <Card className="bg-white">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Leads ({selectedTask.teamleads?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    {selectedTask.teamleads && selectedTask.teamleads.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTask.teamleads.map((tl, idx) => {
                          // Find team lead details from our fetched list
                          const teamLeadDetail = teamLeads.find(t => 
                            t._id === tl.teamleadId?._id || t._id === tl.teamleadId
                          );
                          
                          return (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={teamLeadDetail?.profilePic} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs">
                                  {teamLeadDetail?.firstName?.[0]}{teamLeadDetail?.lastName?.[0] || 'TL'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {teamLeadDetail ? getDisplayName(teamLeadDetail) : "Team Lead"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {teamLeadDetail?.email || "Email not available"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No team leads assigned</p>
                    )}
                  </CardContent>
                </Card>

                {/* Employees Card */}
                <Card className="bg-white">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Employees ({selectedTask.employees?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    {selectedTask.employees && selectedTask.employees.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTask.employees.map((emp, idx) => {
                          // Find employee details from our fetched list
                          const employeeDetail = employees.find(e => 
                            e._id === emp.employeeId?._id || e._id === emp.employeeId
                          );
                          
                          return (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={employeeDetail?.profilePic} />
                                <AvatarFallback className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs">
                                  {employeeDetail?.firstName?.[0]}{employeeDetail?.lastName?.[0] || 'E'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {employeeDetail ? getDisplayName(employeeDetail) : "Employee"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {employeeDetail?.email || "Email not available"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No employees assigned</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Attachments Section */}
              <Card className="bg-white">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base font-bold">Attachments</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-3">
                    {selectedTask.fileAttachments && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="font-medium text-sm">{selectedTask.fileName || "File"}</div>
                            <div className="text-xs text-gray-500">Document</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(selectedTask.fileAttachments, '_blank')}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                    
                    {selectedTask.audioUrl && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Music className="w-5 h-5 text-purple-500" />
                          <div>
                            <div className="font-medium text-sm">Audio Recording</div>
                            <div className="text-xs text-gray-500">Voice instructions</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(selectedTask.audioUrl, '_blank')}
                            className="text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(selectedTask.audioUrl, '_blank')}
                            className="text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {!selectedTask.fileAttachments && !selectedTask.audioUrl && (
                      <p className="text-gray-500 text-sm text-center py-4">No attachments</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Task Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          createDialogOpen && setCreateDialogOpen(false);
          editDialogOpen && setEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">
              {editDialogOpen ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {editDialogOpen ? "Update task details below" : "Fill in the task details below"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="Enter client name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Due Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Assign To Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Leads Selection */}
              <Card className="bg-white">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm sm:text-base font-bold">Assign to Team Leads</CardTitle>
                  <div className="text-xs text-gray-500">
                    {teamLeads.length} team leads available
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {teamLeads.length > 0 ? (
                      teamLeads.map((teamLead) => (
                        <div key={teamLead._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`tl-${teamLead._id}`}
                            checked={formData.teamleadIds.includes(teamLead._id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(teamLead._id, 'teamlead', checked)
                            }
                          />
                          <Label
                            htmlFor={`tl-${teamLead._id}`}
                            className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={teamLead.profilePic} />
                              <AvatarFallback className="text-xs">
                                {teamLead.firstName?.[0]}{teamLead.lastName?.[0] || 'TL'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {getDisplayName(teamLead)}
                            </span>
                            {teamLead.depId && (
                              <span className="text-xs text-gray-500 ml-auto">
                                {getDepartmentName(teamLead)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No team leads available</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Check if team leads exist in the system
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Employees Selection */}
              <Card className="bg-white">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm sm:text-base font-bold">Assign to Employees</CardTitle>
                  <div className="text-xs text-gray-500">
                    {employees.length} employees available
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <div key={employee._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`emp-${employee._id}`}
                            checked={formData.employeeIds.includes(employee._id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(employee._id, 'employee', checked)
                            }
                          />
                          <Label
                            htmlFor={`emp-${employee._id}`}
                            className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={employee.profilePic} />
                              <AvatarFallback className="text-xs">
                                {employee.firstName?.[0]}{employee.lastName?.[0] || 'E'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {getDisplayName(employee)}
                            </span>
                            {employee.depId && (
                              <span className="text-xs text-gray-500 ml-auto">
                                {getDepartmentName(employee)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No employees available</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Check if employees exist in the system
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* File Attachment */}
            <Card className="bg-white">
              <CardHeader className="p-4">
                <CardTitle className="text-sm sm:text-base font-bold">File Attachment</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {existingFile ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">{existingFile.name}</div>
                        <div className="text-xs text-gray-500">Existing file</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFile('file')}
                      className="text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.file ? formData.file.name : "Upload a file (optional)"}
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload').click()}
                      >
                        Choose File
                      </Button>
                      {formData.file && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('file')}
                          className="text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'file')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Attachment */}
            <Card className="bg-white">
              <CardHeader className="p-4">
                <CardTitle className="text-sm sm:text-base font-bold">Audio Recording (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {existingAudio ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-sm">Audio Recording</div>
                        <div className="text-xs text-gray-500">Existing audio</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(existingAudio.url, '_blank')}
                        className="text-xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile('audio')}
                        className="text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.audio ? formData.audio.name : "Upload audio recording (optional)"}
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('audio-upload').click()}
                      >
                        Choose Audio
                      </Button>
                      {formData.audio && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('audio')}
                          className="text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'audio')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(editDialogOpen)}
                disabled={loading || !formData.title.trim()}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editDialogOpen ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the task <span className="font-bold">"{taskToDelete?.title}"</span>?
              This action cannot be undone.
            </p>
            {taskToDelete?.fileAttachments || taskToDelete?.audioUrl ? (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
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
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
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