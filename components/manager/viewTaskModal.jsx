"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  X,
  Download,
  Eye,
  Play,
  Pause,
  FileText,
  AudioLines,
  Calendar,
  Clock,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Send,
  Upload,
  MessageSquare,
  RefreshCw,
  Loader2,
  Check,
  XCircle,
  AlertTriangle,
  FileUp,
  Mic,
  Users,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ManagerStatusModal from "./ManagerStatusModal";

export default function ViewTaskModal({ isOpen, onClose, task, isManagerView = false, refetch }) {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState("pending");
  const [feedback, setFeedback] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [managerResponse, setManagerResponse] = useState(null);
  const [taskDetails, setTaskDetails] = useState(task);
  const [audioPlaying, setAudioPlaying] = useState(null);
  const audioRef = useRef(null);
  const [showManagerStatus, setShowManagerStatus] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setTaskDetails(task);
      
      if (isManagerView && session?.user?.id) {
        // Find current manager's response
        const response = task.managerResponses?.find(
          r => r.managerId?._id?.toString() === session.user.id
        );
        if (response) {
          setStatus(response.status);
          setFeedback(response.feedback || "");
          setManagerResponse(response);
        } else {
          setStatus("pending");
          setFeedback("");
        }
      }
    }
  }, [task, isOpen, isManagerView, session]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "rejected":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getManagerStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gradient-to-r from-green-500 to-emerald-600";
      case "in-progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-600";
      case "rejected":
        return "bg-gradient-to-r from-orange-500 to-red-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getManagerStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case "in-progress":
        return <RefreshCw className="w-4 h-4 mr-1" />;
      case "rejected":
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return <AlertCircle className="w-4 h-4 mr-1" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStatusUpdate = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    if (status === "rejected" && !feedback.trim()) {
      toast.error("Please provide feedback for rejection");
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("feedback", feedback);
      
      selectedFiles.forEach((file, index) => {
        formData.append("submittedFiles[]", file);
      });

      const response = await axios.patch(`/api/manager/admin-tasks/${task._id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success("Status updated successfully");
        
        setSelectedFiles([]);
        if (refetch) {
          await refetch();
        }
        
        // Update local task data
        setTaskDetails(response.data.task);
        setManagerResponse(response.data.task.managerResponses?.find(
          r => r.managerId?._id?.toString() === session?.user?.id
        ));
        
        onClose();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getManagerResponse = (managerId) => {
    return taskDetails.managerResponses?.find(r => 
      r.managerId?._id?.toString() === managerId?.toString()
    );
  };

  const playAudio = (audioUrl) => {
    if (audioRef.current) {
      if (audioPlaying === audioUrl) {
        audioRef.current.pause();
        setAudioPlaying(null);
        return;
      } else {
        audioRef.current.pause();
      }
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setAudioPlaying(audioUrl);
    audio.onpause = () => {
      if (audioRef.current === audio) {
        setAudioPlaying(null);
      }
    };
    audio.onended = () => {
      if (audioRef.current === audio) {
        setAudioPlaying(null);
        audioRef.current = null;
      }
    };

    audio.play().catch(err => {
      console.error("Error playing audio:", err);
      toast.error("Failed to play audio");
    });
  };

  const downloadFile = (fileUrl, fileName) => {
    try {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  // Calculate progress based on manager responses
  const getTaskProgress = () => {
    if (!taskDetails.managers || taskDetails.managers.length === 0) return 0;
    
    const completedResponses = taskDetails.managerResponses?.filter(
      r => r.status === "completed"
    ).length || 0;
    
    return (completedResponses / taskDetails.managers.length) * 100;
  };

  // Get manager display name
  const getManagerName = (manager) => {
    if (!manager) return "Unknown";
    const fullName = `${manager.firstName || ""} ${manager.lastName || ""}`.trim();
    return fullName || manager.email || "Unknown Manager";
  };

  // Get manager departments
  const getManagerDepartments = (manager) => {
    if (!manager.departments || !Array.isArray(manager.departments)) {
      return "No Department";
    }
    const departmentNames = manager.departments
      .map((dept) => dept?.name)
      .filter((name) => name);
    return departmentNames.length > 0 ? departmentNames.join(", ") : "No Department";
  };

  if (!taskDetails) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-700">
            {taskDetails.title}
            {isManagerView && (
              <Badge variant="outline" className="ml-2 border-blue-300 text-blue-700">
                <User className="w-3 h-3 mr-1" />
                Your Assignment
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {taskDetails.clientName && (
              <span className="text-gray-600">Client: {taskDetails.clientName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Header with Status Badges */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getPriorityColor(taskDetails.priority)}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <Badge className={`${getPriorityColor(taskDetails.priority)} capitalize text-sm`}>
                  {taskDetails.priority}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getStatusColor(taskDetails.status)} capitalize`}>
                {taskDetails.status.replace("-", " ")}
              </Badge>
              {taskDetails.isLate && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Late
                </Badge>
              )}
            </div>
          </div>

          {/* Manager Status Update Section */}
          {isManagerView && (
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                  <Send className="w-5 h-5 text-blue-600" />
                  Update Your Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
  <div className="space-y-2">
    <Label htmlFor="status" className="font-semibold text-gray-900">
      Your Status *
    </Label>

    <Select value={status} onValueChange={setStatus}>
      <SelectTrigger className="h-11 bg-white text-gray-900 border-gray-300">
        <SelectValue
          placeholder="Select your status"
          className="text-gray-900"
        />
      </SelectTrigger>

      <SelectContent className="bg-white text-gray-900">
        <SelectItem value="pending" className="flex items-center text-gray-900">
          <AlertCircle className="w-4 h-4 mr-2 text-gray-500" />
          Pending - Not Started
        </SelectItem>

        <SelectItem value="in-progress" className="flex items-center text-gray-900">
          <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
          In Progress - Working on it
        </SelectItem>

        <SelectItem value="completed" className="flex items-center text-gray-900">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          Completed - Task Done
        </SelectItem>

        <SelectItem value="rejected" className="flex items-center text-gray-900">
          <XCircle className="w-4 h-4 mr-2 text-red-500" />
          Rejected - Cannot Complete
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>


                <div className="space-y-2">
                  <Label htmlFor="feedback" className="font-semibold">
                    Feedback / Comments
                    <span className="text-gray-500 text-sm font-normal ml-2">
                      (Required for Rejected status)
                    </span>
                  </Label>
                  <Textarea
  id="feedback"
  value={feedback}
  onChange={(e) => setFeedback(e.target.value)}
  placeholder={
    status === "rejected"
      ? "Please explain why you cannot complete this task..."
      : "Add your feedback, progress notes, or completion details..."
  }
  rows={3}
  className="resize-none text-gray-900 placeholder:text-gray-500"
/>

                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Selected Files ({selectedFiles.length})
                    </Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {file.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedFile(index)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previously Submitted Files */}
                {managerResponse?.submittedFiles && managerResponse.submittedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Previously Submitted Files ({managerResponse.submittedFiles.length})
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {managerResponse.submittedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-green-600" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                Submitted on: {formatDate(file.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.url, "_blank")}
                              className="h-8 hover:bg-blue-100"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(file.url, file.name)}
                              className="h-8 hover:bg-green-100"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                     <Button
        variant="outline"
        size="sm"
        onClick={() => setShowManagerStatus(true)}
        className=" items-center p-4  bg-green-600 hover:bg-green-700 text-white"
      >
        <ExternalLink className="w-4 h-4" />
        View Other Managers Details
      </Button>
                  <Button variant="outline" onClick={onClose} disabled={isUpdating} className="bg-red-600 hover:bg-red-700 text-white">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || (status === "rejected" && !feedback.trim())}
                    className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Update Status
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Progress Bar (Admin View) */}
          {!isManagerView && taskDetails.managers && taskDetails.managers.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold">Task Progress</Label>
                    <span className="text-sm font-medium text-gray-700">
                      {taskDetails.managerResponses?.filter(r => r.status === "completed").length || 0}/
                      {taskDetails.managers.length} managers completed
                    </span>
                  </div>
                  <Progress value={getTaskProgress()} className="h-2" />
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                    <span>0%</span>
                    <span className="text-center">25%</span>
                    <span className="text-center">50%</span>
                    <span className="text-right">100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Description */}
          {taskDetails.description && (
            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {taskDetails.description}
                </p>
              </div>
            </div>
          )}

          {/* Timeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-lg font-semibold">
                      {formatDate(taskDetails.createdAt)}
                    </p>
                    {taskDetails.submittedBy && (
                      <p className="text-sm opacity-90 mt-1">
                        By: {taskDetails.submittedBy?.name || "Admin"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${
              taskDetails.endDate && new Date(taskDetails.endDate) < new Date()
                ? "from-red-500 to-red-600"
                : "from-blue-500 to-cyan-600"
            } text-white`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-lg font-semibold">
                      {taskDetails.endDate ? formatDate(taskDetails.endDate) : "No due date"}
                    </p>
                    {taskDetails.endDate && (
                      <p className="text-sm opacity-90 mt-1">
                        {new Date(taskDetails.endDate) < new Date() ? "Overdue" : "Active"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {taskDetails.completedAt && (
              <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-lg font-semibold">
                        {formatDate(taskDetails.completedAt)}
                      </p>
                      <p className="text-sm opacity-90 mt-1">
                        All managers completed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Manager Status Overview (Admin View) */}
          {!isManagerView && taskDetails.managers && taskDetails.managers.length > 0 && (
            <div className="space-y-4">
              <Label className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manager Status Overview
                <Badge variant="outline" className="ml-2">
                  {taskDetails.managerResponses?.length || 0}/{taskDetails.managers.length}
                </Badge>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {taskDetails.managers.map((manager) => {
                  const response = getManagerResponse(manager._id);
                  return (
                    <Card key={manager._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                      {response && (
                        <div className={`absolute top-0 right-0 w-2 h-full ${getManagerStatusColor(response.status)}`} />
                      )}
                      <CardContent className="p-4 pr-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white shadow">
                            {manager.profilePicture ? (
                              <AvatarImage src={manager.profilePicture} alt={getManagerName(manager)} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                {getManagerName(manager).split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold truncate text-gray-900">
                                  {getManagerName(manager)}
                                </p>
                                {manager.email && (
                                  <a 
                                    href={`mailto:${manager.email}`}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Send email"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              {response ? (
                                <Badge className={`${getStatusColor(response.status)} capitalize flex items-center gap-1`}>
                                  {getManagerStatusIcon(response.status)}
                                  {response.status}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            
                            {/* Manager Departments */}
                            {manager.departments && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                <Building className="w-3 h-3" />
                                <span className="truncate">
                                  {getManagerDepartments(manager)}
                                </span>
                              </div>
                            )}

                            {/* Feedback Preview */}
                            {response?.feedback && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600 font-medium">Feedback:</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {response.feedback}
                                </p>
                              </div>
                            )}

                            {/* Submitted Files */}
                            {response?.submittedFiles && response.submittedFiles.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 font-medium mb-1">
                                  Files: {response.submittedFiles.length}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {response.submittedFiles.slice(0, 2).map((file, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="text-xs cursor-pointer hover:bg-blue-100"
                                      onClick={() => window.open(file.url, "_blank")}
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      {file.name.length > 15 
                                        ? file.name.substring(0, 12) + "..."
                                        : file.name}
                                    </Badge>
                                  ))}
                                  {response.submittedFiles.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{response.submittedFiles.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Last Updated */}
                            {response?.updatedAt && (
                              <p className="text-xs text-gray-500 mt-2">
                                Updated: {formatDate(response.updatedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files Section */}
          {taskDetails.fileAttachments && taskDetails.fileAttachments.length > 0 && (
            <div className="space-y-4">
              <Label className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Task Files ({taskDetails.fileAttachments.length})
              </Label>
              <div className="space-y-2">
                {taskDetails.fileAttachments.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-dark-600 hover:bg-dark-700 text-white"
                            size="sm"
                            onClick={() => downloadFile(file.url, file.name)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Audio Files Section */}
          {taskDetails.audioFiles && taskDetails.audioFiles.length > 0 && (
            <div className="space-y-4">
              <Label className="font-semibold flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Audio Instructions ({taskDetails.audioFiles.length})
              </Label>
              <div className="space-y-2">
                {taskDetails.audioFiles.map((audio, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AudioLines className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">{audio.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(audio.size)} • {audio.type}
                              {audio.duration && ` • ${Math.round(audio.duration / 60)} min`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={audioPlaying === audio.url ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => playAudio(audio.url)}
                          >
                            {audioPlaying === audio.url ? (
                              <Pause className="w-4 h-4 mr-2" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            {audioPlaying === audio.url ? "Pause" : "Play"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(audio.url, audio.name)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Current Manager Status (Manager View) */}
          {isManagerView && managerResponse && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(managerResponse.status)}`}>
                      {getManagerStatusIcon(managerResponse.status)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Your Current Status</p>
                      <p className="text-sm text-gray-600">
                        Last updated: {formatDate(managerResponse.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(managerResponse.status)} capitalize font-semibold`}>
                    {managerResponse.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="pt-4 border-t ">
          <Button variant="outline" onClick={onClose} className="bg-red-700 text-white">
            Close
          </Button>
         
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ManagerStatusModal
        isOpen={showManagerStatus}
        onClose={() => setShowManagerStatus(false)}
        task={task}
        isManagerView={isManagerView}
      />
      </>
  );
}