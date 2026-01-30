// components/tasks2/CreateTaskModal.jsx
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  X,
  Upload,
  Trash2,
  Square,
  Mic,
  FileText,
  AudioLines,
  Loader2,
  Users,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateTaskModal({
  isOpen,
  onClose,
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
  const [files, setFiles] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        setAudioBlob(blob);
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

  const clearRecording = () => {
    if (recordedAudio) URL.revokeObjectURL(recordedAudio);
    setRecordedAudio(null);
    setAudioBlob(null);
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

    files.forEach((file) => submitFormData.append("files[]", file));
    audioFiles.forEach((audio) => submitFormData.append("audioFiles[]", audio));
    if (audioBlob) {
      const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      submitFormData.append("recordedAudio", audioFile);
    }

    const success = await onSubmit(submitFormData);
    if (success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", clientName: "", priority: "low", endDate: "" });
    setSelectedTeamLeads([]);
    setSelectedEmployees([]);
    setFiles([]);
    setAudioFiles([]);
    clearRecording();
  };

  const toggleTeamLeadSelection = (id) => {
    setSelectedTeamLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleEmployeeSelection = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getDisplayName = (item) =>
    item ? `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email || "Unknown" : "Unknown";

  const getDepartmentName = (item) => {
    if (!item) return "No Department";
    if (item.depId) return typeof item.depId === "object" ? item.depId.name : "Department";
    if (item.department) return typeof item.department === "object" ? item.department.name : item.department;
    return "No Department";
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Task
          </DialogTitle>
          <p className="text-gray-600 text-sm">Add task details, multiple files, and voice instructions</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName" className="font-semibold">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Enter client name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold ">Description (Optional)</Label>
         <Textarea
  id="description"
  value={formData.description}
  className="text-gray-900 placeholder:text-gray-900"
  onChange={(e) =>
    setFormData({ ...formData, description: e.target.value })
  }
  placeholder="Add detailed description for the task..."
  rows={5}
/>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
  <Label htmlFor="priority" className="font-semibold text-gray-900">
    Priority
  </Label>

  <Select
    value={formData.priority}
    onValueChange={(v) =>
      setFormData({ ...formData, priority: v })
    }
  >
    <SelectTrigger className="text-gray-900">
      <SelectValue placeholder="Select priority" />
    </SelectTrigger>

    <SelectContent className="text-gray-900">
      <SelectItem value="low" className="text-gray-900">
        Low Priority
      </SelectItem>
      <SelectItem value="medium" className="text-gray-900">
        Medium Priority
      </SelectItem>
      <SelectItem value="high" className="text-gray-900">
        High Priority
      </SelectItem>
    </SelectContent>
  </Select>
</div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="font-semibold">Due Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Users className="w-5 h-5" />
                  Assign to Team Leads
                  <Badge variant="secondary" className="ml-2">{selectedTeamLeads.length} selected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {teamLeads.length > 0 ? (
                    teamLeads.map((teamLead) => (
                      <div key={teamLead._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg">
                        <Checkbox
                          id={`tl-${teamLead._id}`}
                          checked={selectedTeamLeads.includes(teamLead._id)}
                          onCheckedChange={() => toggleTeamLeadSelection(teamLead._id)}
                        />
                        <Label htmlFor={`tl-${teamLead._id}`} className="flex items-center gap-3 text-sm cursor-pointer flex-1">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs">
                              {getDisplayName(teamLead).split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{getDisplayName(teamLead)}</p>
                            <p className="text-xs text-gray-600 truncate">{getDepartmentName(teamLead)}</p>
                          </div>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-gray-500">No team leads available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <User className="w-5 h-5" />
                  Assign to Employees
                  <Badge variant="secondary" className="ml-2">{selectedEmployees.length} selected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <div key={employee._id} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-lg">
                        <Checkbox
                          id={`emp-${employee._id}`}
                          checked={selectedEmployees.includes(employee._id)}
                          onCheckedChange={() => toggleEmployeeSelection(employee._id)}
                        />
                        <Label htmlFor={`emp-${employee._id}`} className="flex items-center gap-3 text-sm cursor-pointer flex-1">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs">
                              {getDisplayName(employee).split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{getDisplayName(employee)}</p>
                            <p className="text-xs text-gray-600 truncate">{getDepartmentName(employee)}</p>
                          </div>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-gray-500">No employees available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">File Attachments</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-white bg-blue-900">
                <Upload className="w-4 h-4 mr-2" />
                Add Files
              </Button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept="*/*" />
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
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
              <Label className="font-semibold">Audio Files</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => audioInputRef.current?.click()} className="text-white bg-blue-900">
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
            <input type="file" ref={audioInputRef} onChange={handleAudioSelect} multiple className="hidden" accept="audio/*" />

            {recordedAudio && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AudioLines className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">Voice Recording</p>
                        <p className="text-xs text-gray-500">{formatFileSize(audioBlob?.size || 0)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <audio controls src={recordedAudio} className="w-40" />
                      <Button type="button" variant="ghost" size="sm" onClick={clearRecording}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                            <p className="font-medium text-sm truncate max-w-xs text-gray-900">{audio.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(audio.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <audio controls src={URL.createObjectURL(audio)} className="w-40" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeAudioFile(index)}>
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
              onClick={() => { onClose(); resetForm(); }}
              disabled={loading}
              className="text-white bg-green-700"
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