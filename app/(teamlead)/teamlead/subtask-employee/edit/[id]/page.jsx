"use client";
import React, { useState, useEffect, useMemo } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Save,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Users,
  Target,
  Eye,
  Pencil,
  Building,
  UserCog,
  Crown,
  Sparkles,
  Upload,
  File,
  Paperclip,
  X,
  Image,
  Video,
  FileText,
  Download,
  XCircle,
  CheckCircle,
<<<<<<< HEAD
  UserPlus,
  Mail,
=======
>>>>>>> d285dcb (set submission backend)
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

export default function EditSubtaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subtaskId = params.id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [fetchingTeamLeads, setFetchingTeamLeads] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [subtask, setSubtask] = useState(null);
  const [originalSubtask, setOriginalSubtask] = useState(null);
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [zoom, setZoom] = useState(1);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "17:00",
    priority: "medium",
    totalLeadsRequired: "1",
  });

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);

  // Check if current team lead has the specific depId
  const shouldShowLeadsField = useMemo(() => {
    if (!session?.user?.depId) return false;
    return session.user.depId === "694161a12ab0b6a3ab0e0788";
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchSubtask();
    fetchEmployees();
    fetchManagers();
    fetchTeamLeads();
  }, [session, status, router]);

  const fetchSubtask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/teamlead/subtasks/${subtaskId}`);

      if (response.status === 200) {
        const subtaskData = response.data.subtask;
        setSubtask(subtaskData);
        setOriginalSubtask(JSON.parse(JSON.stringify(subtaskData)));

        // Set existing files
        if (subtaskData.fileAttachments) {
          setExistingFiles(subtaskData.fileAttachments || []);
        }

        // Set existing files
        if (subtaskData.fileAttachments) {
          setExistingFiles(subtaskData.fileAttachments);
        }

        // Format dates for input fields
        const formattedStartDate = format(
          new Date(subtaskData.startDate),
          "yyyy-MM-dd"
        );
        const formattedEndDate = format(
          new Date(subtaskData.endDate),
          "yyyy-MM-dd"
        );
        const formattedStartTime = subtaskData.startTime
          ? subtaskData.startTime.substring(0, 5)
          : "09:00";
        const formattedEndTime = subtaskData.endTime
          ? subtaskData.endTime.substring(0, 5)
          : "17:00";

        let totalLeadsRequired = "1";
        if (shouldShowLeadsField) {
          totalLeadsRequired = subtaskData.totalLeadsRequired?.toString() || 
                            subtaskData.lead?.toString() || "1";
        }

        setFormData({
          title: subtaskData.title || "",
          description: subtaskData.description || "",
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          priority: subtaskData.priority || "medium",
          totalLeadsRequired: totalLeadsRequired,
        });

        // Set already assigned employees
        if (subtaskData.assignedEmployees && subtaskData.assignedEmployees.length > 0) {
          const employeeAssignments = subtaskData.assignedEmployees.map((emp) => {
            const employeeId = emp.id || emp.employeeId?._id || emp.employeeId;
            const email = emp.email || emp.employeeId?.email || "";
            const name = emp.name || 
              `${emp.employeeId?.firstName || ""} ${emp.employeeId?.lastName || ""}`.trim();
            
            return {
              employeeId: employeeId.toString(),
              email: email,
              name: name || "Unknown Employee",
              role: "employee"
            };
          }).filter(emp => emp.employeeId && emp.employeeId !== "undefined");
          setSelectedEmployees(employeeAssignments);
        }

        // Set already assigned managers
        if (subtaskData.assignedManagers && subtaskData.assignedManagers.length > 0) {
          const managerAssignments = subtaskData.assignedManagers.map((mgr) => {
            const managerId = mgr.id || mgr.managerId?._id || mgr.managerId;
            const email = mgr.email || mgr.managerId?.email || "";
            const name = mgr.name || 
              `${mgr.managerId?.firstName || ""} ${mgr.managerId?.lastName || ""}`.trim();
            
            return {
              managerId: managerId.toString(),
              email: email,
              name: name || "Unknown Manager",
              role: "manager"
            };
          }).filter(mgr => mgr.managerId && mgr.managerId !== "undefined");
          setSelectedManagers(managerAssignments);
        }

        // Set already assigned team leads
        if (subtaskData.assignedTeamLeads && subtaskData.assignedTeamLeads.length > 0) {
          const teamLeadAssignments = subtaskData.assignedTeamLeads.map((tl) => {
            const teamLeadId = tl.id || tl.teamLeadId?._id || tl.teamLeadId;
            const email = tl.email || tl.teamLeadId?.email || "";
            const name = tl.name || 
              `${tl.teamLeadId?.firstName || ""} ${tl.teamLeadId?.lastName || ""}`.trim();
            const depId = tl.teamLeadId?.department || tl.depId || tl.department;
            
            return {
              teamLeadId: teamLeadId.toString(),
              email: email,
              name: name || "Unknown Team Lead",
              depId: depId,
              role: "teamlead"
            };
          }).filter(tl => tl.teamLeadId && tl.teamLeadId !== "undefined");
          setSelectedTeamLeads(teamLeadAssignments);
        }
      }
    } catch (error) {
      console.error("Error fetching subtask:", error);
      toast.error("Failed to load subtask details", {
        description: error.response?.data?.error || "Please try again",
        style: { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }
      });
      router.push("/teamlead/subtasks");
    } finally {
      setLoading(false);
    }
  };

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
            role: "employee"
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
            role: "manager"
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
            depId: teamLead.depId || teamLead.department,
            role: "teamlead"
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

  // File Handling Functions
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check file sizes (limit to 10MB per file)
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    
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
<<<<<<< HEAD
=======
  };

  const removeNewFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const removeExistingFile = (fileId) => {
    const file = existingFiles.find(f => f._id === fileId);
    if (file) {
      setFilesToRemove(prev => [...prev, fileId]);
      setExistingFiles(prev => prev.filter(f => f._id !== fileId));
      toast.info("File marked for removal", {
        description: "File will be deleted when you save changes"
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const getEmployeeDetails = (employeeId) => {
    return employees.find((emp) => emp._id === employeeId);
>>>>>>> d285dcb (set submission backend)
  };

  const removeNewFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const removeExistingFile = (fileId) => {
    const file = existingFiles.find(f => f._id === fileId);
    if (file) {
      setFilesToRemove(prev => [...prev, fileId]);
      setExistingFiles(prev => prev.filter(f => f._id !== fileId));
      toast.info("File marked for removal", {
        description: "File will be deleted when you save changes"
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const getEmployeeProgress = (employeeId) => {
    if (!subtask?.assignedEmployees) return { completed: 0, assigned: 0, status: "pending" };

    const assignment = subtask.assignedEmployees.find((emp) => {
      const empId = emp.id || emp.employeeId?._id?.toString() || emp.employeeId?.toString() || emp.employeeId;
      return empId === employeeId;
    });

    return {
      completed: assignment?.leadsCompleted || 0,
      assigned: assignment?.leadsAssigned || 0,
      status: assignment?.status || "pending",
    };
  };

  const getManagerProgress = (managerId) => {
    if (!subtask?.assignedManagers) return { completed: 0, assigned: 0, status: "pending" };

    const assignment = subtask.assignedManagers.find((mgr) => {
      const mgrId = mgr.id || mgr.managerId?._id?.toString() || mgr.managerId?.toString() || mgr.managerId;
      return mgrId === managerId;
    });

    return {
      completed: assignment?.leadsCompleted || 0,
      assigned: assignment?.leadsAssigned || 0,
      status: assignment?.status || "pending",
    };
  };

  const getTeamLeadProgress = (teamLeadId) => {
    if (!subtask?.assignedTeamLeads) return { completed: 0, assigned: 0, status: "pending" };

    const assignment = subtask.assignedTeamLeads.find((tl) => {
      const tlId = tl.id || tl.teamLeadId?._id?.toString() || tl.teamLeadId?.toString() || tl.teamLeadId;
      return tlId === teamLeadId;
    });

    return {
      completed: assignment?.leadsCompleted || 0,
      assigned: assignment?.leadsAssigned || 0,
      status: assignment?.status || "pending",
    };
  };

  const hasChanges = () => {
    if (!originalSubtask) return false;

    // Compare leads
    const originalLeads = originalSubtask.totalLeadsRequired?.toString() || originalSubtask.lead?.toString() || "1";
    if (shouldShowLeadsField && formData.totalLeadsRequired !== originalLeads) return true;

    // Compare employee assignments
    const originalEmployeeIds = (originalSubtask.assignedEmployees || []).map(emp => {
      const empId = emp.id || emp.employeeId?._id || emp.employeeId;
      return empId.toString();
    }).sort();

    const currentEmployeeIds = selectedEmployees.map(emp => emp.employeeId).sort();
    
    if (JSON.stringify(currentEmployeeIds) !== JSON.stringify(originalEmployeeIds)) return true;

    // Compare manager assignments
    const originalManagerIds = (originalSubtask.assignedManagers || []).map(mgr => {
      const mgrId = mgr.id || mgr.managerId?._id || mgr.managerId;
      return mgrId.toString();
    }).sort();

    const currentManagerIds = selectedManagers.map(mgr => mgr.managerId).sort();
    if (JSON.stringify(currentManagerIds) !== JSON.stringify(originalManagerIds)) return true;

    // Compare team lead assignments
    const originalTeamLeadIds = (originalSubtask.assignedTeamLeads || []).map(tl => {
      const tlId = tl.id || tl.teamLeadId?._id || tl.teamLeadId;
      return tlId.toString();
    }).sort();

    const currentTeamLeadIds = selectedTeamLeads.map(tl => tl.teamLeadId).sort();
    if (JSON.stringify(currentTeamLeadIds) !== JSON.stringify(originalTeamLeadIds)) return true;

    // Compare other fields
    const originalFormattedStartDate = format(new Date(originalSubtask.startDate), "yyyy-MM-dd");
    const originalFormattedEndDate = format(new Date(originalSubtask.endDate), "yyyy-MM-dd");
    const originalStartTime = originalSubtask.startTime ? originalSubtask.startTime.substring(0, 5) : "09:00";
    const originalEndTime = originalSubtask.endTime ? originalSubtask.endTime.substring(0, 5) : "17:00";

    const changedFields = [
      ["title", originalSubtask.title],
      ["description", originalSubtask.description],
      ["startDate", originalFormattedStartDate],
      ["endDate", originalFormattedEndDate],
      ["startTime", originalStartTime],
      ["endTime", originalEndTime],
      ["priority", originalSubtask.priority],
    ];

    for (const [field, originalValue] of changedFields) {
      if (formData[field] !== originalValue) return true;
    }

    // Check file changes
    if (files.length > 0 || filesToRemove.length > 0) return true;

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      toast.error("Please wait, submission in progress...");
      return;
    }

    // Basic validation
    if (!formData.title.trim()) {
      toast.error("Please enter subtask title");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter subtask description");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    // Date validation
    const startDateObj = new Date(formData.startDate);
    const endDateObj = new Date(formData.endDate);

    if (startDateObj > endDateObj) {
      toast.error("End date must be after start date");
      return;
    }

    // Leads validation
    if (shouldShowLeadsField) {
      const leadsRequired = parseInt(formData.totalLeadsRequired);
      if (!leadsRequired || leadsRequired <= 0) {
        toast.error("Please enter a valid number of leads (greater than 0)");
        return;
      }
    }

    // At least one assignee validation
    if (selectedEmployees.length === 0 && selectedManagers.length === 0 && selectedTeamLeads.length === 0) {
      toast.error("Please select at least one assignee");
      return;
    }

    setIsSubmitting(true);

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
<<<<<<< HEAD
      formDataToSend.append("teamLeadDepId", session.user.depId || "");
      formDataToSend.append("assignedEmployees", JSON.stringify(selectedEmployees));
      formDataToSend.append("assignedManagers", JSON.stringify(selectedManagers));
      formDataToSend.append("assignedTeamLeads", JSON.stringify(selectedTeamLeads));
      formDataToSend.append("hasLeadsTarget", shouldShowLeadsField.toString());
=======
      formDataToSend.append("teamLeadDepId", session.user.depId);
      formDataToSend.append("assignedEmployees", JSON.stringify(selectedEmployees));
      formDataToSend.append("assignedManagers", JSON.stringify(selectedManagers));
      formDataToSend.append("assignedTeamLeads", JSON.stringify(selectedTeamLeads));
      formDataToSend.append("hasLeadsTarget", shouldShowLeadsField && formData.totalLeadsRequired > 0);
>>>>>>> d285dcb (set submission backend)
      
      if (shouldShowLeadsField) {
        formDataToSend.append("totalLeadsRequired", formData.totalLeadsRequired);
      }

      // Add new files
      files.forEach(file => {
        formDataToSend.append("files", file.file);
      });

      // Add files to remove
      formDataToSend.append("removeFiles", JSON.stringify(filesToRemove));

      const response = await axios.put(`/api/teamlead/subtasks/${subtaskId}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        toast.success("Subtask updated successfully!", {
          icon: <CheckCircle className="w-5 h-5" />,
          style: { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }
        });
        
        // Show notification info
        toast.info("Notifications sent to all assignees", {
          description: "All assigned users have been notified",
          style: { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }
        });
        
        setTimeout(() => {
          router.push("/teamlead/subtasks");
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
      const errorMessage = error.response?.data?.error || "Failed to update subtask";
      toast.error(errorMessage, {
        description: "Please check your inputs and try again",
        style: { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete(`/api/teamlead/subtasks/${subtaskId}`);

      if (response.status === 200) {
        toast.success("Subtask deleted successfully!", {
          icon: <Trash2 className="w-5 h-5" />,
          style: { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }
        });
        
        toast.info("Notifications sent to all assignees", {
          description: "All assigned users have been notified of deletion",
          style: { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }
        });
        
        setTimeout(() => {
          router.push("/teamlead/subtasks");
        }, 1500);
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast.error(error.response?.data?.error || "Failed to delete subtask", {
        style: { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }
      });
      setIsDeleting(false);
    }
  };

  const leadsRequired = parseInt(formData.totalLeadsRequired) || 1;
  const totalAssignees = selectedEmployees.length + selectedManagers.length + selectedTeamLeads.length;
  const leadsPerAssignee = shouldShowLeadsField && totalAssignees > 0
    ? Math.ceil(leadsRequired / totalAssignees)
    : 0;

  const getEmployeeDisplayName = (employeeId) => {
    // First check in selected employees
    const selectedEmp = selectedEmployees.find(emp => emp.employeeId === employeeId);
    if (selectedEmp) return selectedEmp.name;

    // Check in subtask data
    const existingAssignment = subtask?.assignedEmployees?.find((emp) => {
      const existingEmpId = emp.id || emp.employeeId?._id?.toString() || emp.employeeId?.toString() || emp.employeeId;
      return existingEmpId === employeeId;
    });
    
    if (existingAssignment) {
      return existingAssignment.name || 
        `${existingAssignment.employeeId?.firstName || ""} ${existingAssignment.employeeId?.lastName || ""}`.trim() ||
        "Unknown Employee";
    }

    // Check in employees list
    const employee = employees.find(emp => emp._id === employeeId);
    if (employee) return `${employee.firstName} ${employee.lastName}`.trim();

    return "Unknown Employee";
  };

  const getManagerDisplayName = (managerId) => {
    // First check in selected managers
    const selectedMgr = selectedManagers.find(mgr => mgr.managerId === managerId);
    if (selectedMgr) return selectedMgr.name;

    // Check in subtask data
    const existingAssignment = subtask?.assignedManagers?.find((mgr) => {
      const existingMgrId = mgr.id || mgr.managerId?._id?.toString() || mgr.managerId?.toString() || mgr.managerId;
      return existingMgrId === managerId;
    });
    
    if (existingAssignment) {
      return existingAssignment.name || 
        `${existingAssignment.managerId?.firstName || ""} ${existingAssignment.managerId?.lastName || ""}`.trim() ||
        "Unknown Manager";
    }

    // Check in managers list
    const manager = managers.find(mgr => mgr._id === managerId);
    if (manager) return `${manager.firstName} ${manager.lastName}`.trim();

    return "Unknown Manager";
  };

  const getTeamLeadDisplayName = (teamLeadId) => {
    // First check in selected team leads
    const selectedTl = selectedTeamLeads.find(tl => tl.teamLeadId === teamLeadId);
    if (selectedTl) return selectedTl.name;

    // Check in subtask data
    const existingAssignment = subtask?.assignedTeamLeads?.find((tl) => {
      const existingTlId = tl.id || tl.teamLeadId?._id?.toString() || tl.teamLeadId?.toString() || tl.teamLeadId;
      return existingTlId === teamLeadId;
    });
    
    if (existingAssignment) {
      return existingAssignment.name || 
        `${existingAssignment.teamLeadId?.firstName || ""} ${existingAssignment.teamLeadId?.lastName || ""}`.trim() ||
        "Unknown Team Lead";
    }

    // Check in team leads list
    const teamLead = teamLeads.find(tl => tl._id === teamLeadId);
    if (teamLead) return `${teamLead.firstName} ${teamLead.lastName}`.trim();

    return "Unknown Team Lead";
  };

  const isEmployeeExisting = (employeeId) => {
    return subtask?.assignedEmployees?.some((emp) => {
      const existingEmpId = emp.id || emp.employeeId?._id?.toString() || emp.employeeId?.toString() || emp.employeeId;
      return existingEmpId === employeeId;
    });
  };

  const isManagerExisting = (managerId) => {
    return subtask?.assignedManagers?.some((mgr) => {
      const existingMgrId = mgr.id || mgr.managerId?._id?.toString() || mgr.managerId?.toString() || mgr.managerId;
      return existingMgrId === managerId;
    });
  };

  const isTeamLeadExisting = (teamLeadId) => {
    return subtask?.assignedTeamLeads?.some((tl) => {
      const existingTlId = tl.id || tl.teamLeadId?._id?.toString() || tl.teamLeadId?.toString() || tl.teamLeadId;
      return existingTlId === teamLeadId;
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-3 h-3" />;
      case "in_progress":
      case "in progress":
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">Loading Subtask Editor</h3>
            <p className="text-gray-800 mt-2">Preparing your subtask for editing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-red-50">
        <div className="text-center max-w-md p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Restricted</h2>
          <p className="text-gray-800 text-lg mb-6">
            This page is exclusively for team leads. Please log in with your team lead credentials.
          </p>
          <Button
            onClick={() => router.push("/teamleadlogin")}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:opacity-90 px-8 py-6 text-lg rounded-xl shadow-lg"
          >
            Go to Team Lead Login
          </Button>
        </div>
      </div>
    );
  }

  if (!subtask) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subtask Not Found</h2>
          <p className="text-gray-600 mb-4">The subtask you're trying to edit doesn't exist or you don't have permission to access it.</p>
          <Button 
            onClick={() => router.push("/teamlead/subtasks")}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back to Subtasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
        <Toaster position="top-right" richColors expand={true} />

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/teamlead/subtasks")}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Edit Subtask
                </h1>
                <p className="text-gray-800 mt-1">
                  Update subtask details and assignments
                  {shouldShowLeadsField && " with lead targets"}
                </p>
              </div>
=======
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <Toaster position="top-right" />

    
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Edit Subtask
              </h1>
              <p className="text-gray-800 mt-2">
                {shouldShowLeadsField
                  ? "Update subtask details, lead targets, and assignments"
                  : "Update subtask details and assignments"}
              </p>
>>>>>>> d285dcb (set submission backend)
            </div>

            <div className="flex flex-wrap gap-3">
              {shouldShowLeadsField && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-sm px-3 py-1">
                  <Target className="w-3 h-3 mr-1" />
                  Lead Tracking Enabled
                </Badge>
              )}

              <Button
                variant="outline"
                onClick={() => router.push(`/teamlead/subtasks/${subtaskId}`)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm rounded-xl"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white shadow-sm rounded-xl"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete Subtask
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-md">
                  <AlertDialogHeader className="text-gray-900">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-100 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                      </div>
                      <AlertDialogTitle className="text-xl font-bold">Delete Subtask?</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-gray-700 pt-2">
                      This action cannot be undone. This will permanently delete the subtask and:
                      <ul className="list-disc pl-5 mt-3 space-y-1">
                        <li>Remove all assignments</li>
                        <li>Delete progress tracking data</li>
                        <li>Send notifications to all assignees</li>
                        <li>Remove from all reports</li>
                      </ul>
                      <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <p className="text-sm font-medium text-rose-700">Subtask: {subtask.title}</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel 
                      disabled={isDeleting} 
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-4"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white rounded-xl px-4"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Subtask"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Form Card */}
              <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Subtask Details</CardTitle>
                      <CardDescription className="text-gray-700 mt-1">
                        Edit the subtask information below
                      </CardDescription>
                    </div>
                    {hasChanges() && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
                        <Pencil className="w-3 h-3 mr-1" />
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-900 font-semibold flex items-center gap-1">
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="Enter subtask title"
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 rounded-lg h-11"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-gray-900 font-semibold">
                          Priority
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => handleInputChange("priority", value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 rounded-lg h-11">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 rounded-lg">
                            <SelectItem value="low" className="text-gray-900 hover:bg-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Low Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="medium" className="text-gray-900 hover:bg-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Medium Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="high" className="text-gray-900 hover:bg-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                High Priority
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-900 font-semibold flex items-center gap-1">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Enter detailed description of the subtask..."
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 min-h-[100px] rounded-lg"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Timeline
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate" className="text-gray-900 font-semibold flex items-center gap-1">
                            Start Date <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                              id="startDate"
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => handleInputChange("startDate", e.target.value)}
                              className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 pl-10 rounded-lg h-11"
                              required
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate" className="text-gray-900 font-semibold flex items-center gap-1">
                            End Date <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                              id="endDate"
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => handleInputChange("endDate", e.target.value)}
                              className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 pl-10 rounded-lg h-11"
                              required
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime" className="text-gray-900 font-semibold">
                            Start Time
                          </Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                              id="startTime"
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => handleInputChange("startTime", e.target.value)}
                              className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 pl-10 rounded-lg h-11"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime" className="text-gray-900 font-semibold">
                            End Time
                          </Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                              id="endTime"
                              type="time"
                              value={formData.endTime}
                              onChange={(e) => handleInputChange("endTime", e.target.value)}
                              className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 pl-10 rounded-lg h-11"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leads Field */}
                    {shouldShowLeadsField && (
                      <div className="space-y-3 bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-bold text-gray-900">Leads Target</h4>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="totalLeadsRequired" className="text-gray-900 font-semibold">
                            Number of Leads Required
                          </Label>
                          <Input
                            id="totalLeadsRequired"
                            type="number"
                            min="1"
                            value={formData.totalLeadsRequired}
                            onChange={(e) => handleInputChange("totalLeadsRequired", e.target.value)}
                            placeholder="Enter total leads required"
                            className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 text-gray-900 rounded-lg h-11"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Total leads:</span>
                          <span className="font-bold text-emerald-700">
                            {leadsRequired} lead{leadsRequired !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Files Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-blue-600" />
                        Attachments
                      </h3>
                      
                      {/* Existing Files */}
                      {existingFiles.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">
                            Current Files ({existingFiles.length})
                          </Label>
                          <div className="space-y-2">
                            {existingFiles.map((file) => (
                              <div
                                key={file._id || file.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    {getFileIcon(file.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreview(file)}
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    disabled={isSubmitting}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(file.url, file.name)}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                    disabled={isSubmitting}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExistingFile(file._id || file.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* File Upload */}
                      <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-blue-50/30">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Upload className="w-10 h-10 text-blue-500" />
                          <div className="space-y-1">
                            <p className="text-gray-700 font-medium">Upload new files</p>
                            <p className="text-sm text-gray-500">Drag & drop or click to browse</p>
                            <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
                          </div>
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('file-upload').click()}
                            className="mt-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 rounded-lg"
                            disabled={isSubmitting}
                          >
                            <Paperclip className="w-4 h-4 mr-2" />
                            Browse Files
                          </Button>
                        </div>
                      </div>

                      {/* New Files Preview */}
                      {files.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium">
                            New Files to Upload ({files.length})
                          </Label>
                          <div className="space-y-2">
                            {files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50/30"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    {getFileIcon(file.type)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeNewFile(file.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  disabled={isSubmitting}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignees Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-blue-600" />
                          Assign To <span className="text-red-500">*</span>
                        </h3>
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                          {totalAssignees} total assignee{totalAssignees !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <Tabs defaultValue="employees" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-gray-100 p-1 rounded-lg">
                          <TabsTrigger
                            value="employees"
                            className="flex items-center  text-gray-900 justify-center gap-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                          >
                            <Users className="w-4 h-4" />
                            Employees ({selectedEmployees.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="managers"
                            className="flex items-center  text-gray-900 justify-center gap-2 rounded-md data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"
                          >
                            <Building className="w-4 h-4" />
                            Managers ({selectedManagers.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="teamleads"
                            className="flex items-center  text-gray-900 justify-center gap-2 rounded-md data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all"
                          >
                            <Crown className="w-4 h-4" />
                            Team Leads ({selectedTeamLeads.length})
                          </TabsTrigger>
                        </TabsList>

                        {/* Employees Tab */}
                        <TabsContent value="employees" className="space-y-4 mt-4">
                          <Select onValueChange={handleEmployeeSelect} disabled={isSubmitting}>
                            <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 text-gray-900 rounded-lg">
                              <SelectValue placeholder="Select employees to assign" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg max-h-60">
                              {fetchingEmployees ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                </div>
                              ) : employees.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No employees found</div>
                              ) : (
                                employees.map((employee) => (
                                  <SelectItem
                                    key={employee._id}
                                    value={employee._id}
                                    disabled={selectedEmployees.find((emp) => emp.employeeId === employee._id)}
                                    className="text-gray-900 hover:bg-gray-100"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                          {employee.firstName?.[0]}{employee.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {employee.firstName} {employee.lastName}
                                        <span className="text-gray-500 text-xs ml-1">({employee.email})</span>
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>

                          {selectedEmployees.length > 0 && (
                            <div className="space-y-3">
                              <Label className="text-gray-700 font-medium">
                                Selected Employees ({selectedEmployees.length})
                              </Label>
                              <div className="space-y-2">
                                {selectedEmployees.map((emp) => {
                                  const employeeName = getEmployeeDisplayName(emp.employeeId);
                                  const progress = getEmployeeProgress(emp.employeeId);
                                  const isExisting = isEmployeeExisting(emp.employeeId);

                                  return (
                                    <div
                                      key={emp.employeeId}
                                      className={`flex items-center justify-between p-3 border rounded-lg ${
                                        isExisting ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                          <AvatarFallback className={`${isExisting ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {employeeName[0]}
                                            {employeeName.split(' ')[1]?.[0] || ''}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-bold text-gray-900">{employeeName}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            {isExisting ? (
                                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                Currently assigned
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                New assignment
                                              </Badge>
                                            )}
                                            {isExisting && shouldShowLeadsField && progress.assigned > 0 && (
                                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                                {progress.completed}/{progress.assigned} leads
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {emp.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isExisting && progress.status !== "pending" && (
                                          <Badge className={`text-xs px-2 py-1 ${getStatusColor(progress.status)} flex items-center gap-1`}>
                                            {getStatusIcon(progress.status)}
                                            {formatStatus(progress.status)}
                                          </Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeEmployee(emp.employeeId)}
                                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          disabled={isSubmitting}
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        {/* Managers Tab */}
                        <TabsContent value="managers" className="space-y-4 mt-4">
                          <Select onValueChange={handleManagerSelect} disabled={isSubmitting}>
                            <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-200 text-gray-900 rounded-lg">
                              <SelectValue placeholder="Select managers to assign" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg max-h-60">
                              {fetchingManagers ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                </div>
                              ) : managers.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No managers found</div>
                              ) : (
                                managers.map((manager) => (
                                  <SelectItem
                                    key={manager._id}
                                    value={manager._id}
                                    disabled={selectedManagers.find((mgr) => mgr.managerId === manager._id)}
                                    className="text-gray-900 hover:bg-gray-100"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                          {manager.firstName?.[0]}{manager.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {manager.firstName} {manager.lastName}
                                        <span className="text-gray-500 text-xs ml-1">({manager.email})</span>
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>

                          {selectedManagers.length > 0 && (
                            <div className="space-y-3">
                              <Label className="text-gray-700 font-medium">
                                Selected Managers ({selectedManagers.length})
                              </Label>
                              <div className="space-y-2">
                                {selectedManagers.map((mgr) => {
                                  const managerName = getManagerDisplayName(mgr.managerId);
                                  const progress = getManagerProgress(mgr.managerId);
                                  const isExisting = isManagerExisting(mgr.managerId);

                                  return (
                                    <div
                                      key={mgr.managerId}
                                      className={`flex items-center justify-between p-3 border rounded-lg ${
                                        isExisting ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                          <AvatarFallback className={`${isExisting ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {managerName[0]}
                                            {managerName.split(' ')[1]?.[0] || ''}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-bold text-gray-900">{managerName}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            {isExisting ? (
                                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                Currently assigned
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                                New assignment
                                              </Badge>
                                            )}
                                            {isExisting && shouldShowLeadsField && progress.assigned > 0 && (
                                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                                {progress.completed}/{progress.assigned} leads
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {mgr.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isExisting && progress.status !== "pending" && (
                                          <Badge className={`text-xs px-2 py-1 ${getStatusColor(progress.status)} flex items-center gap-1`}>
                                            {getStatusIcon(progress.status)}
                                            {formatStatus(progress.status)}
                                          </Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeManager(mgr.managerId)}
                                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          disabled={isSubmitting}
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        {/* Team Leads Tab */}
                        <TabsContent value="teamleads" className="space-y-4 mt-4">
                          <Select onValueChange={handleTeamLeadSelect} disabled={isSubmitting}>
                            <SelectTrigger className="border-gray-200 focus:border-amber-500 focus:ring-amber-200 text-gray-900 rounded-lg">
                              <SelectValue placeholder="Select team leads to assign" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-lg max-h-60">
                              {fetchingTeamLeads ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                </div>
                              ) : teamLeads.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No team leads found</div>
                              ) : (
                                teamLeads.map((teamLead) => (
                                  <SelectItem
                                    key={teamLead._id}
                                    value={teamLead._id}
                                    disabled={selectedTeamLeads.find((tl) => tl.teamLeadId === teamLead._id)}
                                    className="text-gray-900 hover:bg-gray-100"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-amber-100 text-amber-600 text-xs">
                                          {teamLead.firstName?.[0]}{teamLead.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {teamLead.firstName} {teamLead.lastName}
                                        <span className="text-gray-500 text-xs ml-1">({teamLead.email})</span>
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>

                          {selectedTeamLeads.length > 0 && (
                            <div className="space-y-3">
                              <Label className="text-gray-700 font-medium">
                                Selected Team Leads ({selectedTeamLeads.length})
                              </Label>
                              <div className="space-y-2">
                                {selectedTeamLeads.map((tl) => {
                                  const teamLeadName = getTeamLeadDisplayName(tl.teamLeadId);
                                  const progress = getTeamLeadProgress(tl.teamLeadId);
                                  const isExisting = isTeamLeadExisting(tl.teamLeadId);
                                  const isCurrentUser = tl.teamLeadId === session.user.id;

                                  return (
                                    <div
                                      key={tl.teamLeadId}
                                      className={`flex items-center justify-between p-3 border rounded-lg ${
                                        isExisting ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                                      } ${isCurrentUser ? 'ring-2 ring-blue-300 ring-inset' : ''}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                          <AvatarFallback className={`${isExisting ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {teamLeadName[0]}
                                            {teamLeadName.split(' ')[1]?.[0] || ''}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900">{teamLeadName}</p>
                                            {isCurrentUser && (
                                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                You
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            {isExisting ? (
                                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                Currently assigned
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                                New assignment
                                              </Badge>
                                            )}
                                            {isExisting && shouldShowLeadsField && progress.assigned > 0 && (
                                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                                {progress.completed}/{progress.assigned} leads
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {tl.email}
                                          </p>
                                          {tl.depId && (
                                            <p className="text-xs text-gray-500 mt-1">Department: {tl.depId}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isExisting && progress.status !== "pending" && (
                                          <Badge className={`text-xs px-2 py-1 ${getStatusColor(progress.status)} flex items-center gap-1`}>
                                            {getStatusIcon(progress.status)}
                                            {formatStatus(progress.status)}
                                          </Badge>
                                        )}
                                        {!isCurrentUser && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeTeamLead(tl.teamLeadId)}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            disabled={isSubmitting}
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      {/* Leads Distribution Info */}
                      {shouldShowLeadsField && leadsRequired > 0 && totalAssignees > 0 && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-emerald-600" />
                            <h4 className="font-bold text-gray-900">Lead Distribution</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-700">{leadsRequired}</div>
                              <div className="text-sm text-gray-700">Total Leads</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-700">{totalAssignees}</div>
                              <div className="text-sm text-gray-700">Total Assignees</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-700">{leadsPerAssignee}</div>
                              <div className="text-sm text-gray-700">Leads Per Assignee</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/teamlead/subtasks")}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg h-11"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !hasChanges() || totalAssignees === 0 || (shouldShowLeadsField && leadsRequired <= 0)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white rounded-lg h-11"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Update Subtask
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Current Status Card */}
              <Card className="border-0 shadow-xl bg-white rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-gray-900">Employees</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{subtask.assignedEmployees?.length || 0}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="w-4 h-4 text-purple-600" />
                          <p className="text-sm font-medium text-gray-900">Managers</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{subtask.assignedManagers?.length || 0}</p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Crown className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-medium text-gray-900">Team Leads</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">{subtask.assignedTeamLeads?.length || 0}</p>
                      </div>
                      {shouldShowLeadsField && (
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-emerald-600" />
                            <p className="text-sm font-medium text-gray-900">Leads</p>
                          </div>
                          <p className="text-2xl font-bold text-emerald-700">
                            {subtask.leadsCompleted || 0}/{subtask.totalLeadsRequired || leadsRequired}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Task Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className={`px-2 py-1 ${getStatusColor(subtask.status)}`}>
                          {formatStatus(subtask.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm font-medium">{format(new Date(subtask.createdAt), "dd MMM yyyy")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <span className="text-sm font-medium">
                          {Math.ceil((new Date(subtask.endDate) - new Date(subtask.startDate)) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>

                    {/* Current Assignees Summary */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Current Assignees</h4>
                      <div className="space-y-2">
                        {(subtask.assignedEmployees || []).slice(0, 3).map((emp, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 truncate">
                              {emp.name || `${emp.employeeId?.firstName} ${emp.employeeId?.lastName}`}
                            </span>
                          </div>
                        ))}
                        {subtask.assignedEmployees && subtask.assignedEmployees.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{subtask.assignedEmployees.length - 3} more employees
                          </div>
                        )}
                        {(subtask.assignedManagers || []).slice(0, 2).map((mgr, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-gray-700 truncate">
                              {mgr.name || `${mgr.managerId?.firstName} ${mgr.managerId?.lastName}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Your Role */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Your Role</h4>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <UserCog className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-bold text-gray-900">
                            {session.user.name || `${session.user.firstName} ${session.user.lastName}`}
                          </p>
                          <p className="text-sm text-gray-600">Team Lead (Editor)</p>
                          {session.user.depId && (
                            <p className="text-xs text-gray-500">Department: {session.user.depId}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="border-0 shadow-xl bg-white rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/teamlead/subtasks/${subtaskId}`)}
                      className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/teamlead/subtasks")}
                      className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Subtasks
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/teamlead/subtasks/new")}
                      className="w-full justify-start border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create New Subtask
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] flex flex-col shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <h3 className="font-bold text-gray-900 truncate">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => prev + 0.2)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom In +
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.2))}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  Zoom Out -
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFile(previewFile.url, previewFile.name)}
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
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : previewFile.type?.includes('video') ? (
                <video
                  controls
                  autoPlay
                  className="rounded-lg mx-auto transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <source src={previewFile.url} type={previewFile.type} />
                  Your browser does not support the video tag.
                </video>
              ) : previewFile.type?.includes('pdf') ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[90vh] border rounded-lg"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700">Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                    className="mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
<<<<<<< HEAD
          </div>
        </div>
      )}
=======
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-900 font-semibold">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter subtask title"
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 rounded-xl"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-gray-900 font-semibold">
                      Priority
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleInputChange("priority", value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 rounded-xl">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl">
                        <SelectItem value="low" className="text-gray-900 hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Low Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="medium" className="text-gray-900 hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            Medium Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="high" className="text-gray-900 hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            High Priority
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-900 font-semibold">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter detailed description of the subtask"
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 min-h-[120px] rounded-xl"
                    
                    disabled={isSubmitting}
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <Label className="text-gray-900 font-semibold">
                    Attachments
                  </Label>
                  
                  {/* Existing Files */}
                  {existingFiles.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-medium">
                        Current Files ({existingFiles.length})
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {existingFiles.map((file) => (
                          <div
                            key={file._id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(file)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                disabled={isSubmitting}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(file.url, file.name)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                disabled={isSubmitting}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExistingFile(file._id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Files Upload */}
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-blue-50/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-gray-700 font-medium">Upload new files</p>
                        <p className="text-sm text-gray-500">Drag & drop or click to browse</p>
                        <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
                      </div>
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload').click()}
                        className="mt-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 rounded-xl"
                        disabled={isSubmitting}
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        Add Files
                      </Button>
                    </div>
                  </div>

                  {/* New Files Preview */}
                  {files.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-medium">
                        New Files to Upload ({files.length})
                      </Label>
                      <div className="space-y-2">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 border border-blue-200 rounded-xl bg-blue-50/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                {getFileIcon(file.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNewFile(file.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              disabled={isSubmitting}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Leads Field */}
                {shouldShowLeadsField && (
                  <div className="space-y-2 bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                    <Label htmlFor="totalLeadsRequired" className="text-gray-900 font-semibold">
                      Number of Leads Required *
                    </Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-3 h-4 w-4 text-emerald-600" />
                      <Input
                        id="totalLeadsRequired"
                        type="number"
                        min="1"
                        max="10000"
                        value={formData.totalLeadsRequired}
                        onChange={(e) => handleInputChange("totalLeadsRequired", e.target.value)}
                        placeholder="Enter total number of leads/calls/targets"
                        className="border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-gray-900 pl-10 rounded-xl"
                        
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Total leads target</span>
                      <span className="font-bold text-emerald-700">
                        {leadsRequired} lead{leadsRequired !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Current progress: <span className="font-bold">{subtask.leadsCompleted || 0}</span> /{" "}
                      <span className="font-bold">{subtask.totalLeadsRequired || leadsRequired}</span> leads completed
                    </div>
                  </div>
                )}
              </div>

              {/* Assignees Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-900 font-semibold text-lg">
                    Assign To *
                  </Label>
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                    {totalAssignees} total assignee{totalAssignees !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <Tabs defaultValue="employees" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 bg-gray-100/50 p-1 rounded-xl">
                    <TabsTrigger
                      value="employees"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow transition-all"
                    >
                      <Users className="w-4 h-4" />
                      Employees ({selectedEmployees.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="managers"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow transition-all"
                    >
                      <Building className="w-4 h-4" />
                      Managers ({selectedManagers.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="teamleads"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-700 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      Team Leads ({selectedTeamLeads.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Employees Tab */}
                  <TabsContent value="employees" className="space-y-4 mt-4">
                    <Select onValueChange={handleEmployeeSelect} disabled={isSubmitting}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 rounded-xl">
                        <SelectValue placeholder="Select employees to assign" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl max-h-60">
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee._id}
                            value={employee._id}
                            disabled={selectedEmployees.find((emp) => emp.employeeId === employee._id)}
                            className="text-gray-900 hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {employee.firstName?.[0]}
                                  {employee.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {employee.firstName} {employee.lastName}
                                <span className="text-gray-500 text-xs ml-2">({employee.email})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedEmployees.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-900 font-semibold">
                          Selected Employees ({selectedEmployees.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedEmployees.map((emp) => {
                            const employeeName = getEmployeeDisplayName(emp.employeeId);
                            const progress = getEmployeeProgress(emp.employeeId);
                            const isExisting = subtask?.assignedEmployees?.some((existingEmp) => {
                              const existingEmpId = existingEmp.employeeId?._id?.toString() || existingEmp.employeeId.toString();
                              return existingEmpId === emp.employeeId;
                            });

                            return (
                              <div
                                key={emp.employeeId}
                                className={`flex items-center justify-between p-3 border rounded-xl ${
                                  isExisting ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className={`${isExisting ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {employeeName[0]}
                                      {employeeName.split(' ')[1]?.[0] || ''}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold text-gray-900">{employeeName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {isExisting ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                          Currently assigned
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                          New assignment
                                        </Badge>
                                      )}
                                      {isExisting && shouldShowLeadsField && progress.assigned > 0 && (
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                          {progress.completed}/{progress.assigned} leads
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{emp.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExisting && progress.status !== "pending" && (
                                    <Badge className={`text-xs ${getStatusColor(progress.status)}`}>
                                      {progress.status.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEmployee(emp.employeeId)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={isSubmitting}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Managers Tab */}
                  <TabsContent value="managers" className="space-y-4 mt-4">
                    <Select onValueChange={handleManagerSelect} disabled={isSubmitting}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 rounded-xl">
                        <SelectValue placeholder="Select managers to assign" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl max-h-60">
                        {managers.map((manager) => (
                          <SelectItem
                            key={manager._id}
                            value={manager._id}
                            disabled={selectedManagers.find((mgr) => mgr.managerId === manager._id)}
                            className="text-gray-900 hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                  {manager.firstName?.[0]}
                                  {manager.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {manager.firstName} {manager.lastName}
                                <span className="text-gray-500 text-xs ml-2">({manager.email})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedManagers.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-900 font-semibold">
                          Selected Managers ({selectedManagers.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedManagers.map((mgr) => {
                            const managerName = getManagerDisplayName(mgr.managerId);
                            const progress = getManagerProgress(mgr.managerId);
                            const isExisting = subtask?.assignedManagers?.some((existingMgr) => {
                              const existingMgrId = existingMgr.managerId?._id?.toString() || existingMgr.managerId.toString();
                              return existingMgrId === mgr.managerId;
                            });

                            return (
                              <div
                                key={mgr.managerId}
                                className={`flex items-center justify-between p-3 border rounded-xl ${
                                  isExisting ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className={`${isExisting ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                      {managerName[0]}
                                      {managerName.split(' ')[1]?.[0] || ''}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold text-gray-900">{managerName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {isExisting ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                          Currently assigned
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                          New assignment
                                        </Badge>
                                      )}
                                      {isExisting && shouldShowLeadsField && progress.assigned > 0 && (
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                          {progress.completed}/{progress.assigned} leads
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{mgr.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExisting && progress.status !== "pending" && (
                                    <Badge className={`text-xs ${getStatusColor(progress.status)}`}>
                                      {progress.status.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeManager(mgr.managerId)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={isSubmitting}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Team Leads Tab */}
                  <TabsContent value="teamleads" className="space-y-4 mt-4">
                    <Select onValueChange={handleTeamLeadSelect} disabled={isSubmitting}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-gray-900 rounded-xl">
                        <SelectValue placeholder="Select team leads to assign" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl max-h-60">
                        {teamLeads.map((teamLead) => (
                          <SelectItem
                            key={teamLead._id}
                            value={teamLead._id}
                            disabled={selectedTeamLeads.find((tl) => tl.teamLeadId === teamLead._id)}
                            className="text-gray-900 hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-amber-100 text-amber-600 text-xs">
                                  {teamLead.firstName?.[0]}
                                  {teamLead.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {teamLead.firstName} {teamLead.lastName}
                                <span className="text-gray-500 text-xs ml-2">({teamLead.email})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedTeamLeads.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-900 font-semibold">
                          Selected Team Leads ({selectedTeamLeads.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedTeamLeads.map((tl) => {
                            const teamLeadName = getTeamLeadDisplayName(tl.teamLeadId);
                            const progress = getTeamLeadProgress(tl.teamLeadId);
                            const isExisting = subtask?.assignedTeamLeads?.some((existingTl) => {
                              const existingTlId = existingTl.teamLeadId?._id?.toString() || existingTl.teamLeadId.toString();
                              return existingTlId === tl.teamLeadId;
                            });
                            const isCurrentUser = tl.teamLeadId === session.user.id;

                            return (
                              <div
                                key={tl.teamLeadId}
                                className={`flex items-center justify-between p-3 border rounded-xl ${
                                  isExisting ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                                } ${isCurrentUser ? 'ring-2 ring-blue-300' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className={`${isExisting ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {teamLeadName[0]}
                                      {teamLeadName.split(' ')[1]?.[0] || ''}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-gray-900">{teamLeadName}</p>
                                      {isCurrentUser && (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">You</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {isExisting ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                          Currently assigned
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                          New assignment
                                        </Badge>
                                      )}
                                      {isExisting && shouldShowLeadsField && progress.assigned > 0 && (
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                          {progress.completed}/{progress.assigned} leads
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{tl.email}</p>
                                    {tl.depId && (
                                      <p className="text-xs text-gray-500">Dept: {tl.depId}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExisting && progress.status !== "pending" && (
                                    <Badge className={`text-xs ${getStatusColor(progress.status)}`}>
                                      {progress.status.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  {!isCurrentUser && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTeamLead(tl.teamLeadId)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      disabled={isSubmitting}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Leads Distribution Info */}
                {shouldShowLeadsField && leadsRequired > 0 && totalAssignees > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-gray-900">Lead Distribution Plan</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-700">{leadsRequired}</div>
                        <div className="text-sm text-gray-700">Total Leads</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">{totalAssignees}</div>
                        <div className="text-sm text-gray-700">Total Assignees</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-700">{leadsPerAssignee}</div>
                        <div className="text-sm text-gray-700">Leads Per Assignee</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mt-3">
                      Distribution: {selectedEmployees.length} employees, {selectedManagers.length} managers, {selectedTeamLeads.length} team leads
                    </div>
                  </div>
                )}
              </div>

              {/* Dates and Times */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-gray-900 font-semibold">
                      Start Date *
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 rounded-xl"
                        
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-gray-900 font-semibold">
                      End Date *
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 rounded-xl"
                        
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-gray-900 font-semibold">
                      Start Time *
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 rounded-xl"
                        
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-gray-900 font-semibold">
                      End Time *
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 rounded-xl"
                        
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !hasChanges() || totalAssignees === 0 || (shouldShowLeadsField && leadsRequired <= 0)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Subtask
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Current Status Summary */}
        <div className="mt-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Current Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Employees</h4>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{subtask.assignedEmployees?.length || 0}</p>
                  <p className="text-sm text-gray-600">Assigned</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Managers</h4>
                  </div>
                  <p className="text-3xl font-bold text-purple-700">{subtask.assignedManagers?.length || 0}</p>
                  <p className="text-sm text-gray-600">Assigned</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-gray-900">Team Leads</h4>
                  </div>
                  <p className="text-3xl font-bold text-amber-700">{subtask.assignedTeamLeads?.length || 0}</p>
                  <p className="text-sm text-gray-600">Assigned</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-gray-900">Leads Progress</h4>
                  </div>
                  <p className="text-3xl font-bold text-emerald-700">
                    {subtask.leadsCompleted || 0}/{subtask.totalLeadsRequired || leadsRequired}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Subtask Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={`${getStatusColor(subtask.status)}`}>
                        {subtask.status?.replace('_', ' ') || 'pending'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created On:</span>
                      <span className="font-medium">{format(new Date(subtask.createdAt), "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-medium">{subtask.teamLeadName || "Unknown"}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Role</h4>
                  <div className="flex items-center gap-3">
                    <UserCog className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-bold text-gray-900">
                        {session.user.name || `${session.user.firstName} ${session.user.lastName}`}
                      </p>
                      <p className="text-sm text-gray-600">Team Lead (Editor)</p>
                      <p className="text-xs text-gray-500">Department: {session.user.depId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
    </div>
      {/* Preview Modal */}
      {previewFile && (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[95vh] flex flex-col shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {getFileIcon(previewFile.type)}
            <h3 className="font-bold text-gray-900 truncate">{previewFile.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((prev) => prev + 0.2)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              Zoom In +
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.2))}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              Zoom Out -
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadFile(previewFile.url, previewFile.name)}
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
            <img
              src={previewFile.url}
              alt={previewFile.name}
              className="rounded-lg mx-auto transition-transform"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : previewFile.type?.includes('video') ? (
            <video
              controls
              autoPlay
              className="rounded-lg mx-auto transition-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              <source src={previewFile.url} type={previewFile.type} />
              Your browser does not support the video tag.
            </video>
          ) : previewFile.type?.includes('pdf') ? (
            <iframe
              src={previewFile.url}
              className="w-full h-[90vh] border rounded-lg"
              title={previewFile.name}
            />
          ) : (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700">Preview not available for this file type</p>
              <Button
                variant="outline"
                onClick={() => downloadFile(previewFile.url, previewFile.name)}
                className="mt-4"
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
      )}

>>>>>>> d285dcb (set submission backend)
    </>
  );
}