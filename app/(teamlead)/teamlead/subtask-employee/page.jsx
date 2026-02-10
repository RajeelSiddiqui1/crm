"use client";
import React, { useState, useEffect, useMemo } from "react";
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
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Users,
  Target,
  Phone,
  Building,
  UserCog,
  Crown,
  Upload,
  File,
  Trash2,
  Paperclip,
} from "lucide-react";
import axios from "axios";

export default function CreateSubtaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [fetchingTeamLeads, setFetchingTeamLeads] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    priority: "medium",
    totalLeadsRequired: "",
  });

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);

  // Check if current team lead has the specific depId
  const shouldShowLeadsField = useMemo(() => {
    if (!session?.user?.depId) return false;
    return session.user.depId === "698b8832717cd23e92faef95";
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchEmployees();
    fetchManagers();
    fetchTeamLeads();
  }, [session, status, router]);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await axios.get("/api/teamlead/employees");
      if (response.status === 200) {
        setEmployees(response.data.employees || response.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setFetchingEmployees(false);
    }
  };

  const fetchManagers = async () => {
    try {
      setFetchingManagers(true);
      const response = await axios.get("/api/teamlead/managers");
      if (response.status === 200) {
        setManagers(response.data.managers || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to load managers");
    } finally {
      setFetchingManagers(false);
    }
  };

  const fetchTeamLeads = async () => {
    try {
      setFetchingTeamLeads(true);
      const response = await axios.get("/api/teamlead/teamleads");
      if (response.status === 200) {
        setTeamLeads(response.data.teamLeads || []);
      }
    } catch (error) {
      console.error("Error fetching team leads:", error);
      toast.error("Failed to load team leads");
    } finally {
      setFetchingTeamLeads(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmployeeSelect = (employeeId) => {
    if (employeeId && !selectedEmployees.find((emp) => emp.employeeId === employeeId)) {
      const employee = employees.find((emp) => emp._id === employeeId);
      if (employee) {
        setSelectedEmployees([
          ...selectedEmployees,
          {
            employeeId,
            email: employee.email,
            name: `${employee.firstName} ${employee.lastName}`.trim(),
          },
        ]);
      }
    }
  };

  const handleManagerSelect = (managerId) => {
    if (managerId && !selectedManagers.find((mgr) => mgr.managerId === managerId)) {
      const manager = managers.find((mgr) => mgr._id === managerId);
      if (manager) {
        setSelectedManagers([
          ...selectedManagers,
          {
            managerId,
            email: manager.email,
            name: `${manager.firstName} ${manager.lastName}`.trim(),
          },
        ]);
      }
    }
  };

  const handleTeamLeadSelect = (teamLeadId) => {
    if (teamLeadId && !selectedTeamLeads.find((tl) => tl.teamLeadId === teamLeadId)) {
      const teamLead = teamLeads.find((tl) => tl._id === teamLeadId);
      if (teamLead) {
        setSelectedTeamLeads([
          ...selectedTeamLeads,
          {
            teamLeadId,
            email: teamLead.email,
            name: `${teamLead.firstName} ${teamLead.lastName}`.trim(),
            depId: teamLead.depId,
          },
        ]);
      }
    }
  };

  const removeEmployee = (employeeId) => {
    setSelectedEmployees(selectedEmployees.filter((emp) => emp.employeeId !== employeeId));
  };

  const removeManager = (managerId) => {
    setSelectedManagers(selectedManagers.filter((mgr) => mgr.managerId !== managerId));
  };

  const removeTeamLead = (teamLeadId) => {
    setSelectedTeamLeads(selectedTeamLeads.filter((tl) => tl.teamLeadId !== teamLeadId));
  };

  const getEmployeeDetails = (employeeId) => {
    return employees.find((emp) => emp._id === employeeId);
  };

  const getManagerDetails = (managerId) => {
    return managers.find((mgr) => mgr._id === managerId);
  };

  const getTeamLeadDetails = (teamLeadId) => {
    return teamLeads.find((tl) => tl._id === teamLeadId);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check file sizes (limit to 10MB per file)
    const oversizedFiles = selectedFiles.filter(file => file.size > 200 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 10MB limit`);
      return;
    }
    
    // Add new files to state
    setFiles(prev => [...prev, ...selectedFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
    }))]);
    
    // Clear the input
    e.target.value = '';
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      toast.error("Please wait, submission in progress...");
      return;
    }

    // Basic validation
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Additional validation for leads field if visible
    if (shouldShowLeadsField) {
      if (!formData.totalLeadsRequired) {
        toast.error("Please enter number of leads required");
        return;
      }

      const leadsRequired = parseInt(formData.totalLeadsRequired);
      if (leadsRequired <= 0) {
        toast.error("Please enter a valid number of leads (greater than 0)");
        return;
      }
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (startDateTime >= endDateTime) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    // At least one assignee validation
    if (selectedEmployees.length === 0 && selectedManagers.length === 0 && selectedTeamLeads.length === 0) {
      toast.error("Please select at least one employee, manager, or team lead");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("startTime", formData.startTime);
      formDataToSend.append("endTime", formData.endTime);
      formDataToSend.append("priority", formData.priority);
      formDataToSend.append("teamLeadId", session.user.id);
      formDataToSend.append("teamLeadName", session.user.name || `${session.user.firstName} ${session.user.lastName}`);
      formDataToSend.append("teamLeadDepId", session.user.depId);
      formDataToSend.append("status", "pending");
      formDataToSend.append("assignedEmployees", JSON.stringify(selectedEmployees));
      formDataToSend.append("assignedManagers", JSON.stringify(selectedManagers));
      formDataToSend.append("assignedTeamLeads", JSON.stringify(selectedTeamLeads));
      formDataToSend.append("hasLeadsTarget", shouldShowLeadsField && formData.totalLeadsRequired > 0);
      
      if (shouldShowLeadsField) {
        formDataToSend.append("totalLeadsRequired", formData.totalLeadsRequired);
      }

      // Add files
      files.forEach(file => {
        formDataToSend.append("files", file.file);
      });

      const response = await axios.post("/api/teamlead/subtasks", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        toast.success("Subtask created successfully!");
        setTimeout(() => {
          router.push("/teamlead/subtasks");
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating subtask:", error);
      if (error.response?.status === 409) {
        toast.error("Subtask with this title already exists");
      } else {
        toast.error(error.response?.data?.error || "Failed to create subtask");
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };


  
  const leadsRequired = parseInt(formData.totalLeadsRequired) || 0;
  const totalAssignees = selectedEmployees.length + selectedManagers.length + selectedTeamLeads.length;
  const leadsPerAssignee = shouldShowLeadsField && totalAssignees > 0
    ? Math.ceil(leadsRequired / totalAssignees)
    : 0;

  if (status === "loading" || fetchingEmployees || fetchingManagers || fetchingTeamLeads) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-900">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in as TeamLead to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Create New Subtask
            </h1>
            <p className="text-gray-800 mt-1 md:mt-2 text-sm md:text-base">
              {shouldShowLeadsField
                ? "Create a new subtask with lead targets"
                : "Create a new subtask for employees, managers, or team leads"}
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm mb-6">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg md:text-xl font-bold text-gray-900">
                  Subtask Information
                </CardTitle>
                <CardDescription className="text-gray-700 text-sm md:text-base">
                  Fill in the details for the new subtask
                </CardDescription>
              </div>
              {shouldShowLeadsField && (
                <Badge className="bg-green-100 text-green-800 border-green-200 self-start md:self-auto">
                  <Target className="w-3 h-3 mr-1" />
                  Lead Tracking Enabled
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-800 font-semibold">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter subtask title"
                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-800 font-semibold">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter detailed description of the subtask"
                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 min-h-[120px]"
                  disabled={isSubmitting}
                  
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label className="text-gray-800 font-semibold">
                  Attachments
                </Label>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors bg-blue-50/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-gray-700 font-medium">Upload files</p>
                      <p className="text-sm text-gray-500">Drag & drop files here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
                    </div>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload').click()}
                      className="mt-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                      disabled={isSubmitting}
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-gray-700 font-medium">
                      Selected Files ({files.length})
                    </Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <File className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm truncate max-w-xs">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {file.type || "Unknown type"}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Leads Required Field - Only show for specific depId */}
              {shouldShowLeadsField && (
                <div className="space-y-2">
                  <Label htmlFor="totalLeadsRequired" className="text-gray-800 font-semibold">
                    Number of Leads Required *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="totalLeadsRequired"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.totalLeadsRequired}
                      onChange={(e) => handleInputChange("totalLeadsRequired", e.target.value)}
                      placeholder="Enter total number of leads/calls/targets"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      disabled={isSubmitting}
                      required={shouldShowLeadsField}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total leads target</span>
                    <span className={`font-medium ${leadsRequired > 0 ? "text-green-600" : "text-red-600"}`}>
                      {leadsRequired} lead{leadsRequired !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the total number of leads/calls/targets to be completed by all assignees
                  </p>
                </div>
              )}

              {/* Assignees Section */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <Label className="text-gray-800 font-semibold">
                    Assign To *
                  </Label>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 self-start md:self-auto">
                    {totalAssignees} total assignee{totalAssignees !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <Tabs defaultValue="employees" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-xl shadow-md">
                    <TabsTrigger
                      value="employees"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-600 
                               data-[state=active]:bg-blue-600 
                               data-[state=active]:text-white 
                               data-[state=active]:shadow 
                               transition-all text-xs md:text-sm"
                    >
                      <Users className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Employees ({selectedEmployees.length})</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="managers"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-600 
                               data-[state=active]:bg-emerald-600 
                               data-[state=active]:text-white 
                               data-[state=active]:shadow 
                               transition-all text-xs md:text-sm"
                    >
                      <Building className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Managers ({selectedManagers.length})</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="teamleads"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-600 
                               data-[state=active]:bg-purple-600 
                               data-[state=active]:text-white 
                               data-[state=active]:shadow 
                               transition-all text-xs md:text-sm"
                    >
                      <Crown className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Team Leads ({selectedTeamLeads.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Employees Tab */}
                  <TabsContent value="employees" className="space-y-4 mt-4">
                    <Select
                      onValueChange={handleEmployeeSelect}
                      disabled={isSubmitting || employees.length === 0}
                    >
                      <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                        <SelectValue placeholder="Select employees to assign" />
                      </SelectTrigger>
                      <SelectContent className="text-black bg-white max-h-60">
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee._id}
                            value={employee._id}
                            disabled={selectedEmployees.some((emp) => emp.employeeId === employee._id)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                  {employee.firstName?.[0]}
                                  {employee.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {employee.firstName} {employee.lastName}
                                <span className="text-gray-500 text-xs ml-2 truncate">({employee.email})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {employees.length === 0 && (
                          <div className="px-2 py-4 text-center text-gray-500 text-sm">
                            No employees available
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {selectedEmployees.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-800 font-semibold">
                          Selected Employees ({selectedEmployees.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedEmployees.map((emp) => {
                            const employee = getEmployeeDetails(emp.employeeId);
                            return (
                              <div
                                key={emp.employeeId}
                                className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50/50"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                      {employee?.firstName?.[0]}
                                      {employee?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                      {employee?.firstName} {employee?.lastName}
                                    </p>
                                    {shouldShowLeadsField && leadsPerAssignee > 0 && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1">
                                        {leadsPerAssignee} leads assigned
                                      </Badge>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                                      {employee?.email}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEmployee(emp.employeeId)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                  disabled={isSubmitting}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Managers Tab */}
                  <TabsContent value="managers" className="space-y-4 mt-4">
                    <Select
                      onValueChange={handleManagerSelect}
                      disabled={isSubmitting || managers.length === 0}
                    >
                      <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                        <SelectValue placeholder="Select managers to assign" />
                      </SelectTrigger>
                      <SelectContent className="text-black bg-white max-h-60">
                        {managers.map((manager) => (
                          <SelectItem
                            key={manager._id}
                            value={manager._id}
                            disabled={selectedManagers.some((mgr) => mgr.managerId === manager._id)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                                  {manager.firstName?.[0]}
                                  {manager.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {manager.firstName} {manager.lastName}
                                <span className="text-gray-500 text-xs ml-2 truncate">({manager.email})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {managers.length === 0 && (
                          <div className="px-2 py-4 text-center text-gray-500 text-sm">
                            No managers available
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {selectedManagers.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-800 font-semibold">
                          Selected Managers ({selectedManagers.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedManagers.map((mgr) => {
                            const manager = getManagerDetails(mgr.managerId);
                            return (
                              <div
                                key={mgr.managerId}
                                className="flex items-center justify-between p-3 border border-purple-200 rounded-lg bg-purple-50/50"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                      {manager?.firstName?.[0]}
                                      {manager?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                      {manager?.firstName} {manager?.lastName}
                                    </p>
                                    {shouldShowLeadsField && leadsPerAssignee > 0 && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1">
                                        {leadsPerAssignee} leads assigned
                                      </Badge>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                                      {manager?.email}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeManager(mgr.managerId)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                  disabled={isSubmitting}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Team Leads Tab */}
                  <TabsContent value="teamleads" className="space-y-4 mt-4">
                    <Select
                      onValueChange={handleTeamLeadSelect}
                      disabled={isSubmitting || teamLeads.length === 0}
                    >
                      <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                        <SelectValue placeholder="Select team leads to assign" />
                      </SelectTrigger>
                      <SelectContent className="text-black bg-white max-h-60">
                        {teamLeads.map((teamLead) => (
                          <SelectItem
                            key={teamLead._id}
                            value={teamLead._id}
                            disabled={selectedTeamLeads.some((tl) => tl.teamLeadId === teamLead._id)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-yellow-100 text-yellow-600">
                                  {teamLead.firstName?.[0]}
                                  {teamLead.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {teamLead.firstName} {teamLead.lastName}
                                <span className="text-gray-500 text-xs ml-2 truncate">({teamLead.email})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {teamLeads.length === 0 && (
                          <div className="px-2 py-4 text-center text-gray-500 text-sm">
                            No team leads available
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {selectedTeamLeads.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-800 font-semibold">
                          Selected Team Leads ({selectedTeamLeads.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedTeamLeads.map((tl) => {
                            const teamLead = getTeamLeadDetails(tl.teamLeadId);
                            return (
                              <div
                                key={tl.teamLeadId}
                                className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50/50"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-yellow-100 text-yellow-600">
                                      {teamLead?.firstName?.[0]}
                                      {teamLead?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                      {teamLead?.firstName} {teamLead?.lastName}
                                    </p>
                                    <Badge variant="outline" className="text-xs mt-1 bg-yellow-50 text-yellow-700 border-yellow-300">
                                      Team Lead
                                    </Badge>
                                    {shouldShowLeadsField && leadsPerAssignee > 0 && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1 ml-2">
                                        {leadsPerAssignee} leads assigned
                                      </Badge>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                                      {teamLead?.email}
                                    </p>
                                    {teamLead?.depId && (
                                      <p className="text-xs text-gray-500">Dept: {teamLead.depId}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTeamLead(tl.teamLeadId)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                  disabled={isSubmitting}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {shouldShowLeadsField && leadsRequired > 0 && totalAssignees > 0 && (
                  <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-md border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Lead Distribution:</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">{leadsRequired} total leads</span> will be distributed among{" "}
                      <span className="font-semibold">
                        {totalAssignees} assignee{totalAssignees > 1 ? "s" : ""}
                      </span>{" "}
                      ({selectedEmployees.length} employees, {selectedManagers.length} managers, {selectedTeamLeads.length} team leads)
                    </p>
                    <p className="text-sm mt-1">
                      Each assignee will be assigned approximately{" "}
                      <span className="font-semibold">
                        {leadsPerAssignee} lead{leadsPerAssignee > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Date and Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-gray-800 font-semibold">
                    Start Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      disabled={isSubmitting}
                      
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-gray-800 font-semibold">
                    End Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      disabled={isSubmitting}
                      
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-gray-800 font-semibold">
                    Start Time *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      disabled={isSubmitting}
                      
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-gray-800 font-semibold">
                    End Time *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      disabled={isSubmitting}
                      
                    />
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-800 font-semibold">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="text-black bg-white">
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Created By Info */}
              <div className="space-y-2">
                <Label className="text-gray-800 font-semibold">
                  Created By (Team Lead)
                </Label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    value={session.user.name || `${session.user.firstName} ${session.user.lastName}`}
                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 bg-gray-50"
                    readOnly
                    disabled
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>Department ID: {session.user.depId}</span>
                  {shouldShowLeadsField && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                      Lead Tracking Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    loading ||
                    totalAssignees === 0 ||
                    (shouldShowLeadsField && leadsRequired <= 0) ||
                    !formData.title ||
                    !formData.description
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Subtask
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Summary Card - Only show for lead tracking */}
        {shouldShowLeadsField && (
          <Card className="shadow-xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
              <CardTitle className="text-lg font-bold text-gray-900">
                Lead Target Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">Employees</h3>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-blue-700">{selectedEmployees.length}</p>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">Assigned</p>
                  </div>

                  <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">Managers</h3>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-purple-700">{selectedManagers.length}</p>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">Assigned</p>
                  </div>

                  <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">Team Leads</h3>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-yellow-700">{selectedTeamLeads.length}</p>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">Assigned</p>
                  </div>

                  <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">Total Leads</h3>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-green-700">{leadsRequired}</p>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">To be completed</p>
                  </div>
                </div>

                {leadsRequired > 0 && totalAssignees > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Lead Distribution Plan:
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Total leads required:</span>
                        <span className="font-bold text-sm md:text-lg">{leadsRequired}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Total assignees:</span>
                        <span className="font-bold text-sm md:text-lg">{totalAssignees}</span>
                      </div>
                      <div className="border-t border-blue-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Leads per assignee:</span>
                          <span className="font-bold text-lg md:text-xl text-green-700">{leadsPerAssignee} each</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}