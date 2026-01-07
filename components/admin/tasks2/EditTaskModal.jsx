// components/tasks2/EditTaskModal.jsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Upload,
  Trash2,
  Play,
  Pause,
  Square,
  Mic,
  Check,
  Building,
  FileText,
  AudioLines,
  Loader2,
  Eye,
  Download,
  Users,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
  teamLeads,
  employees,
  onSubmit,
  loading,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientName: "",
    priority: "low",
    endDate: "",
  });

  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newAudioFiles, setNewAudioFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [audioToRemove, setAudioToRemove] = useState([]);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        clientName: task.clientName || "",
        priority: task.priority || "low",
        endDate: task.endDate ? new Date(task.endDate).toISOString().split("T")[0] : "",
      });
      setSelectedTeamLeads(task.teamleads?.map(tl => tl.teamleadId?._id || tl.teamleadId) || []);
      setSelectedEmployees(task.employees?.map(emp => emp.employeeId?._id || emp.employeeId) || []);
      setNewFiles([]);
      setNewAudioFiles([]);
      setRecordedAudio(null);
      setAudioBlob(null);
      setFilesToRemove([]);
      setAudioToRemove([]);
    }
  }, [task]);

  const handleFileSelect = (e) => {
    const newFilesArray = Array.from(e.target.files);
    const validFiles = newFilesArray.filter((file) => file.size <= 50 * 1024 * 1024);
    
    if (validFiles.length !== newFilesArray.length) {
      toast.error("Some files exceed the 50MB limit");
    }

    setNewFiles((prev) => [...prev, ...validFiles]);
    e.target.value = null;
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId) => {
    setFilesToRemove((prev) => [...prev, fileId]);
  };

  const handleAudioSelect = (e) => {
    const newAudioArray = Array.from(e.target.files);
    const validAudio = newAudioArray.filter((file) => file.size <= 100 * 1024 * 1024);
    
    if (validAudio.length !== newAudioArray.length) {
      toast.error("Some audio files exceed the 100MB limit");
    }

    setNewAudioFiles((prev) => [...prev, ...validAudio]);
    e.target.value = null;
  };

  const removeNewAudioFile = (index) => {
    setNewAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAudio = (audioId) => {
    setAudioToRemove((prev) => [...prev, audioId]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
    }
    setRecordedAudio(null);
    setAudioBlob(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (selectedTeamLeads.length === 0 && selectedEmployees.length === 0) {
      toast.error("Please select at least one team lead or employee");
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append("title", formData.title);
    submitFormData.append("description", formData.description);
    submitFormData.append("clientName", formData.clientName);
    submitFormData.append("priority", formData.priority);
    submitFormData.append("endDate", formData.endDate);
    submitFormData.append("teamleadIds", JSON.stringify(selectedTeamLeads));
    submitFormData.append("employeeIds", JSON.stringify(selectedEmployees));

    // Add new files
    newFiles.forEach((file) => {
      submitFormData.append("files[]", file);
    });

    // Add new audio files
    newAudioFiles.forEach((audio) => {
      submitFormData.append("audioFiles[]", audio);
    });

    // Add recorded audio
    if (audioBlob) {
      const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });
      submitFormData.append("recordedAudio", audioFile);
    }

    // Add files/audio to remove
    if (filesToRemove.length > 0) {
      submitFormData.append("removeFiles", JSON.stringify(filesToRemove));
    }

    if (audioToRemove.length > 0) {
      submitFormData.append("removeAudio", JSON.stringify(audioToRemove));
    }

    const success = await onSubmit(task._id, submitFormData);
    if (success) {
      onClose();
    }
  };

  const toggleTeamLeadSelection = (teamLeadId) => {
    setSelectedTeamLeads((prev) => {
      if (prev.includes(teamLeadId)) {
        return prev.filter((id) => id !== teamLeadId);
      } else {
        return [...prev, teamLeadId];
      }
    });
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!task) return null;

  const existingFiles = task.fileAttachments?.filter(
    (file) => !filesToRemove.includes(file._id.toString())
  ) || [];

  const existingAudio = task.audioFiles?.filter(
    (audio) => !audioToRemove.includes(audio._id.toString())
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Task
          </DialogTitle>
          <p className="text-gray-600 text-sm">
            Update task details, files, and voice instructions
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle" className="font-semibold">
                Task Title *
              </Label>
              <Input
                id="editTitle"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editClientName" className="font-semibold">
                Client Name
              </Label>
              <Input
                id="editClientName"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="Enter client name"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="editDescription" className="font-semibold">
              Description
            </Label>
            <Textarea
              id="editDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add detailed description for the task..."
              className="text-gray-600"
              rows={5}
            />
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editPriority" className="font-semibold">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger className="text-gray-600">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="text-gray-600 bg-white">
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEndDate" className="font-semibold">
                Due Date
              </Label>
              <Input
                id="editEndDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Assign To Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Leads Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  Assign to Team Leads
                  <Badge variant="secondary" className="ml-2">
                    {selectedTeamLeads.length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {teamLeads.length > 0 ? (
                    teamLeads.map((teamLead) => (
                      <div key={teamLead._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg">
                        <Checkbox
                          id={`edit-tl-${teamLead._id}`}
                          checked={selectedTeamLeads.includes(teamLead._id)}
                          onCheckedChange={() => toggleTeamLeadSelection(teamLead._id)}
                          className="text-gray-600"
                        />
                        <Label
                          htmlFor={`edit-tl-${teamLead._id}`}
                          className="flex items-center gap-3 text-sm cursor-pointer flex-1"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs">
                              {getDisplayName(teamLead).split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {getDisplayName(teamLead)}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {getDepartmentName(teamLead)}
                            </p>
                          </div>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No team leads available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employees Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-600">
                  <User className="w-5 h-5" />
                  Assign to Employees
                  <Badge variant="secondary" className="ml-2">
                    {selectedEmployees.length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <div key={employee._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg">
                        <Checkbox
                          id={`edit-emp-${employee._id}`}
                          checked={selectedEmployees.includes(employee._id)}
                          onCheckedChange={() => toggleEmployeeSelection(employee._id)}
                          className="text-gray-600"
                        />
                        <Label
                          htmlFor={`edit-emp-${employee._id}`}
                          className="flex items-center gap-3 text-sm cursor-pointer flex-1"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs">
                              {getDisplayName(employee).split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {getDisplayName(employee)}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {getDepartmentName(employee)}
                            </p>
                          </div>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No employees available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="font-semibold">Existing Files</Label>
              <div className="space-y-2">
                {existingFiles.map((file) => (
                  <Card key={file._id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs text-gray-600">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                            className="text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingFile(file._id.toString())}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* New Files */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Add New Files</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-900 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Files
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept="*/*"
            />

            {newFiles.length > 0 && (
              <div className="space-y-2">
                {newFiles.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs text-gray-900">
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
                          onClick={() => removeNewFile(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Existing Audio */}
          {existingAudio.length > 0 && (
            <div className="space-y-3">
              <Label className="font-semibold">Existing Audio Files</Label>
              <div className="space-y-2">
                {existingAudio.map((audio) => (
                  <Card key={audio._id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AudioLines className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs text-gray-900">
                              {audio.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(audio.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <audio controls src={audio.url} className="w-40" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingAudio(audio._id.toString())}
                            className="text-gray-600"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* New Audio and Recording */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Add Audio</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => audioInputRef.current?.click()}
                  className="bg-blue-900 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="bg-green-900 text-white"
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Record Voice
                    </>
                  )}
                </Button>
              </div>
            </div>

            <input
              type="file"
              ref={audioInputRef}
              onChange={handleAudioSelect}
              multiple
              className="hidden"
              accept="audio/*"
            />

            {/* Recorded Audio */}
            {recordedAudio && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AudioLines className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">New Voice Recording</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(audioBlob?.size || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <audio
                        controls
                        src={recordedAudio}
                        className="w-40"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearRecording}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Audio Files */}
            {newAudioFiles.length > 0 && (
              <div className="space-y-2">
                {newAudioFiles.map((audio, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AudioLines className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs">
                              {audio.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(audio.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <audio controls src={URL.createObjectURL(audio)} className="w-40" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewAudioFile(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                clearRecording();
              }}
              disabled={loading}
              className="bg-red-800 text-white hover:bg-red-900 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim() || (selectedTeamLeads.length === 0 && selectedEmployees.length === 0)}
                className="bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}