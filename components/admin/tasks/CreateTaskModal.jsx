"use client";
import React, { useState, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  X,
  Upload,
  Trash2,
  Play,
  Pause,
  Square,
  Mic,
  Check,
  Building,
  User,
  FileText,
  AudioLines,
  Calendar,
  Clock,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function CreateTaskModal({
  isOpen,
  onClose,
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
  });
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [files, setFiles] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState([]);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter((file) => file.size <= 50 * 1024 * 1024);
    if (validFiles.length !== newFiles.length) {
      toast.error("Some files exceed the 50MB limit");
    }
    setFiles((prev) => [...prev, ...validFiles]);
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAudioSelect = (e) => {
    const newAudioFiles = Array.from(e.target.files);
    const validAudio = newAudioFiles.filter((file) => file.size <= 100 * 1024 * 1024);
    if (validAudio.length !== newAudioFiles.length) {
      toast.error("Some audio files exceed the 100MB limit");
    }
    setAudioFiles((prev) => [...prev, ...validAudio]);
    e.target.value = null;
  };

  const removeAudioFile = (index) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        setRecordedAudios((prev) => [...prev, { blob: audioBlob, url: audioUrl, file: audioFile }]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
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

  const removeRecordedAudio = (index) => {
    setRecordedAudios((prev) => {
      const newList = prev.filter((_, i) => i !== index);
      if (prev[index]?.url) URL.revokeObjectURL(prev[index].url);
      return newList;
    });
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
    submitFormData.append("managersId", JSON.stringify(selectedManagers));

    files.forEach((file) => {
      submitFormData.append("files[]", file);
    });

    audioFiles.forEach((audio) => {
      submitFormData.append("audioFiles[]", audio);
    });

    recordedAudios.forEach((rec) => {
      submitFormData.append("recordedAudios[]", rec.file);
    });

    const success = await onSubmit(submitFormData);
    if (success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      clientName: "",
      priority: "low",
      endDate: "",
    });
    setSelectedManagers([]);
    setFiles([]);
    setAudioFiles([]);
    setRecordedAudios((prev) => {
      prev.forEach((rec) => rec.url && URL.revokeObjectURL(rec.url));
      return [];
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Task
          </DialogTitle>
          <p className="text-gray-600 text-sm">
            Add task details, files, and voice instructions for managers
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">
                Task Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName" className="font-semibold">
                Client Name
              </Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Enter client name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add detailed description for the task..."
              rows={5}
              className="text-gray-900"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Assign to Managers *</Label>
              <Badge variant="secondary">{selectedManagers.length} selected</Badge>
            </div>
            {selectedManagers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                {selectedManagers.map((managerId) => {
                  const manager = managers.find((m) => m._id === managerId);
                  return (
                    <Badge
                      key={managerId}
                      className="flex items-center gap-2 bg-blue-700 text-gray-100 p-3"
                    >
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs bg-white text-blue-600 p-2">
                          {getManagerDisplayName(manager)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{getManagerDisplayName(manager)}</span>
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
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-50 text-gray-600"
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
                        {selectedManagers.includes(manager._id) && <Check className="w-3 h-3" />}
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
                        <p className="font-medium text-sm truncate">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="font-semibold">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="text-gray-600">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="font-semibold">
                Due Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">File Attachments</Label>
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
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">Upload multiple files (max 50MB each)</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Audio Files & Recordings</Label>
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

            {recordedAudios.length > 0 && (
              <div className="space-y-2">
                {recordedAudios.map((rec, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AudioLines className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              Voice Recording {index + 1}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(rec.blob.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <audio controls src={rec.url} className="w-40" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecordedAudio(index)}
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

            {audioFiles.length > 0 && (
              <div className="space-y-2">
                {audioFiles.map((audio, index) => (
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
                            onClick={() => removeAudioFile(index)}
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

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
              disabled={loading}
              className="text-white bg-red-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedManagers.length === 0}
              className="bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}