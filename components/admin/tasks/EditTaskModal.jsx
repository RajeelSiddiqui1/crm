// components/tasks/EditTaskModal.jsx
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
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { toast } from "sonner";

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
  managers,
  onSubmit,
  loading,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientName: "",
    priority: "low",
    endDate: "",
    status: "pending",
  });

  const [selectedManagers, setSelectedManagers] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newAudioFiles, setNewAudioFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [audioToRemove, setAudioToRemove] = useState([]);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        clientName: task.clientName || "",
        priority: task.priority || "low",
        endDate: task.endDate ? new Date(task.endDate).toISOString().split("T")[0] : "",
        status: task.status || "pending",
      });
      setSelectedManagers(task.managers?.map((m) => m._id) || []);
      setNewFiles([]);
      setNewAudioFiles([]);
      setRecordedAudio(null);
      setFilesToRemove([]);
      setAudioToRemove([]);
    }
  }, [task]);

  const toggleManagerSelection = (managerId) => {
    setSelectedManagers((prev) => {
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
        setRecordedAudio({ blob: audioBlob, url: audioUrl });
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

  const clearRecording = () => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (selectedManagers.length === 0) {
      toast.error("Please select at least one manager");
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append("title", formData.title);
    submitFormData.append("description", formData.description);
    submitFormData.append("clientName", formData.clientName);
    submitFormData.append("priority", formData.priority);
    submitFormData.append("endDate", formData.endDate);
    submitFormData.append("status", formData.status);
    submitFormData.append("managersId", JSON.stringify(selectedManagers));

    // Add new files
    newFiles.forEach((file) => {
      submitFormData.append("files[]", file);
    });

    // Add new audio files
    newAudioFiles.forEach((audio) => {
      submitFormData.append("audioFiles[]", audio);
    });

    // Add recorded audio
    if (recordedAudio?.blob) {
      const audioFile = new File([recordedAudio.blob], "recording.webm", {
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

  const getManagerDisplayName = (manager) => {
    if (!manager) return "Unknown";
    const fullName = `${manager.firstName || ""} ${manager.lastName || ""}`.trim();
    return fullName || "Unknown Manager";
  };

  const getManagerDepartments = (manager) => {
    if (!manager.departments || !Array.isArray(manager.departments)) {
      return "No Department";
    }
    const departmentNames = manager.departments
      .map((dept) => dept.name)
      .filter((name) => name);
    return departmentNames.length > 0 ? departmentNames.join(", ") : "No Department";
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
    });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              rows={3}
            />
          </div>

          {/* Status */}
         

          {/* Managers Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Assign to Managers *</Label>
              <Badge variant="secondary">
                {selectedManagers.length} selected
              </Badge>
            </div>

            {selectedManagers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                {selectedManagers.map((managerId) => {
                  const manager = managers.find((m) => m._id === managerId);
                  return (
                    <Badge
                      key={managerId}
                      className="flex items-center gap-2 bg-blue-500 text-white p-2"
                    >
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs bg-white text-blue-600">
                          {getManagerDisplayName(manager)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs ">
                        {getManagerDisplayName(manager)}
                      </span>
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeSelectedManager(managerId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}

            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {managers.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading managers...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {managers.map((manager) => (
                    <div
                      key={manager._id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedManagers.includes(manager._id)
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleManagerSelection(manager._id)}
                    >
                      <div
                        className={`w-5 h-5 border rounded flex items-center justify-center ${
                          selectedManagers.includes(manager._id)
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedManagers.includes(manager._id) && (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                          {getManagerDisplayName(manager)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-blue-600">
                          {getManagerDisplayName(manager)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {getManagerDepartments(manager)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <SelectContent className="bg-white text-gray-600">
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
                className="text-white bg-blue-900"
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
                            <p className="font-medium text-sm truncate max-w-xs text-gray-600">
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
                  className="text-white bg-blue-900"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="text-white bg-green-900"
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
                          {formatFileSize(recordedAudio.blob.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <audio
                        controls
                        src={recordedAudio.url}
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
                            <p className="font-medium text-sm truncate max-w-xs text-gray-900">
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

          {/* Task Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Created:</p>
                <p className="font-medium text-gray-600">{formatDate(task.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Updated:</p>
                <p className="font-medium text-gray-600">{formatDate(task.updatedAt)}</p>
              </div>
              {task.completedAt && (
                <div>
                  <p className="text-gray-600">Completed:</p>
                  <p className="font-medium">{formatDate(task.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-gray-white bg-red-700"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedManagers.length === 0}
            className="bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center">
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