// components/tasks2/ViewTaskModal.jsx
"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  AlertTriangle,
  Circle,
  TrendingUp,
  Users,
  Share2,
  ArrowRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ViewTaskModal({ isOpen, onClose, task, teamLeads, employees }) {
  const [playingAudio, setPlayingAudio] = useState(null);

  if (!task) return null;

  const getPriorityBadge = (priority) => {
    const colors = {
      high: "bg-gradient-to-r from-red-500 to-orange-500 text-white",
      medium: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
      low: "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
    };

    return (
      <Badge className={`${colors[priority]} border-0 font-medium px-3 py-1 rounded-lg`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: <Circle className="w-3 h-3" /> },
      in_progress: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: <TrendingUp className="w-3 h-3" /> },
      completed: { color: "bg-green-100 text-green-800 border-green-300", icon: <CheckCircle className="w-3 h-3" /> },
      overdue: { color: "bg-red-100 text-red-800 border-red-300", icon: <AlertTriangle className="w-3 h-3" /> }
    };
    
    const { color, icon } = config[status] || config.pending;
    
    return (
      <Badge variant="outline" className={`${color} border px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1`}>
        {icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
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

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileDownload = (file) => {
  const link = document.createElement('a');
  // Use presigned URL if it exists, otherwise normal URL
  link.href = file.presignedUrl || file.url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleAudioDownload = (audio) => {
  const link = document.createElement('a');
  link.href = audio.presignedUrl || audio.url;
  link.download = audio.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



  const handlePlayAudio = (audioUrl, index) => {
    if (playingAudio === index) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(index);
      const audio = document.getElementById(`audio-${index}`);
      if (audio) {
        audio.play();
        audio.onended = () => setPlayingAudio(null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white">
              Task Details & Status Tracking
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Task Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Task Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-gray-600 text-sm font-medium">Title</Label>
                  <p className="font-bold text-gray-900 text-xl mt-1">{task.title}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm font-medium">Client</Label>
                  <p className="font-semibold text-gray-900 text-lg mt-1">{task.clientName || "No client"}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm font-medium">Description</Label>
                  <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">
                    {task.description || "No description provided"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 text-sm font-medium">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-sm font-medium">Due Date</Label>
                    <p className="font-semibold text-gray-900 text-lg mt-1">
                      {task.endDate ? formatDate(task.endDate) : "No due date"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Stats */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 p-6 border-b">
                <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-gray-600 text-sm font-medium">Completion</Label>
                    <span className="text-2xl font-bold text-gray-900">
                      {task.stats?.completionPercentage || 0}%
                    </span>
                  </div>
                  <Progress
                    value={task.stats?.completionPercentage || 0}
                    className="h-3"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-700">{task.stats?.statusCounts.pending || 0}</p>
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{task.stats?.statusCounts.in_progress || 0}</p>
                    <p className="text-sm text-blue-600 font-medium">In Progress</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{task.stats?.statusCounts.completed || 0}</p>
                    <p className="text-sm text-green-600 font-medium">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{task.stats?.statusCounts.overdue || 0}</p>
                    <p className="text-sm text-red-600 font-medium">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Team Members */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
              <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                <Users className="w-6 h-6 text-blue-600" />
                Assigned Team Members ({task.stats?.totalAssignees || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Leads */}
                {task.teamleads?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Team Leads ({task.teamleads.length})
                    </h3>
                    <div className="space-y-3">
                      {task.teamleads.map((tl, idx) => {
                        const teamLeadDetail = teamLeads.find(t => t._id === tl.teamleadId?._id || t._id === tl.teamleadId);
                        return (
                          <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold">
                                  {getDisplayName(teamLeadDetail).split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">{getDisplayName(teamLeadDetail)}</p>
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                    Team Lead
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {getDepartmentName(teamLeadDetail)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Assigned: {tl.assignedAt ? formatDate(tl.assignedAt) : "Unknown"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(tl.status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Employees */}
                {task.employees?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-green-600" />
                      Employees ({task.employees.length})
                    </h3>
                    <div className="space-y-3">
                      {task.employees.map((emp, idx) => {
                        const employeeDetail = employees.find(e => e._id === emp.employeeId?._id || e._id === emp.employeeId);
                        return (
                          <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold">
                                  {getDisplayName(employeeDetail).split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">{getDisplayName(employeeDetail)}</p>
                                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                    Employee
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {getDepartmentName(employeeDetail)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Assigned: {emp.assignedAt ? formatDate(emp.assignedAt) : "Unknown"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(emp.status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {(!task.teamleads?.length && !task.employees?.length) && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No team members assigned to this task</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share History */}
          {task.shares && task.shares.length > 0 && (
           <Card className="bg-white border border-gray-200 rounded-xl shadow-md">
  <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50/50 p-6 border-b">
    <CardTitle className="text-lg flex items-center gap-3 text-gray-900 font-semibold">
      <Share2 className="w-6 h-6 text-indigo-600" />
      Share History ({task.shares.length})
    </CardTitle>
  </CardHeader>

  <CardContent className="p-6">
    {task.shares.length === 0 ? (
      <p className="text-gray-500 text-sm italic">No shares yet.</p>
    ) : (
      <div className="space-y-4">
        {task.shares.map((share, index) => {
          const sharerId = share.sharedBy?._id || share.sharedBy;
          const receiverId = share.sharedTo?._id || share.sharedTo;

          const sharer =
            teamLeads.find((u) => u._id === sharerId) ||
            employees.find((u) => u._id === sharerId);

          const receiver =
            teamLeads.find((u) => u._id === receiverId) ||
            employees.find((u) => u._id === receiverId);

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Sharer & Receiver */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Sharer */}
                <div className="flex flex-col items-center text-center min-w-[70px]">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                      {sharer?.firstName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {sharer?.firstName} {sharer?.lastName}
                  </p>
                  <span className="text-[10px] text-gray-500 mt-1 font-medium">
                    Sharer
                  </span>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-400" />

                {/* Receiver */}
                <div className="flex flex-col items-center text-center min-w-[70px]">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-indigo-50">
                    <AvatarFallback className="bg-indigo-500 text-white text-xs font-bold">
                      {receiver?.firstName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {receiver?.firstName} {receiver?.lastName}
                  </p>
                  <span className="text-[10px] text-indigo-600 mt-1 font-medium">
                    Receiver
                  </span>
                </div>

                {/* Shared Date */}
                <div className="ml-6 flex-1 min-w-[120px]">
                  <p className="text-xs font-semibold text-gray-900">Shared On</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(share.sharedAt)}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <Badge
                className={`px-3 py-1 text-xs font-medium border shadow-sm ${
                  share.sharedToModel === "TeamLead"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                    : "bg-green-50 text-green-700 border-green-100"
                }`}
              >
                {share.sharedToModel === "TeamLead" ? "Team Lead" : "Employee"}
              </Badge>
            </div>
          );
        })}
      </div>
    )}
  </CardContent>
</Card>

          )}

          {/* Files Section */}
          {(task.fileAttachments?.length > 0 || task.audioFiles?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {/* Files */}
              {task.fileAttachments?.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <FileText className="w-6 h-6 text-green-600" />
                      File Attachments ({task.fileAttachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {task.fileAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-bold text-green-800 text-lg">{file.name}</p>
                              <p className="text-sm text-green-600">
                                {formatFileSize(file.size)} • {file.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => window.open(file.url, "_blank")}
                              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg px-4 py-2"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
  onClick={() => handleFileDownload(file)}
  variant="outline"
  className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg px-4 py-2"
>
  <Download className="w-4 h-4 mr-2" />
  Download
</Button>

                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audio Files */}
              {task.audioFiles?.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <AudioLines className="w-6 h-6 text-purple-600" />
                      Audio Files ({task.audioFiles.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {task.audioFiles.map((audio, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <AudioLines className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-bold text-purple-800 text-lg">{audio.name}</p>
                                <p className="text-sm text-purple-600">
                                  {formatFileSize(audio.size)} • {audio.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handlePlayAudio(audio.url, index)}
                                className={`${
                                  playingAudio === index
                                    ? "bg-yellow-600 hover:bg-yellow-700"
                                    : "bg-purple-600 hover:bg-purple-700"
                                } text-white rounded-lg px-4 py-2`}
                              >
                                {playingAudio === index ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Play
                                  </>
                                )}
                              </Button>
                              <Button
  onClick={() => handleAudioDownload(audio)}
  variant="outline"
  className="border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg px-4 py-2"
>
  <Download className="w-4 h-4 mr-2" />
  Download
</Button>

                            </div>
                          </div>
<audio
  id={`audio-${index}`}
  src={audio.presignedUrl || audio.url} // presigned URL
  controls
  className="w-full mt-2"
/>

                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Task Metadata */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50/50 p-6 border-b">
              <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                <Clock className="w-6 h-6 text-slate-600" />
                Task Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-gray-600 text-sm font-medium">Created</Label>
                  <p className="font-semibold text-gray-900 text-lg mt-1">
                    {formatDate(task.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm font-medium">Last Updated</Label>
                  <p className="font-semibold text-gray-900 text-lg mt-1">
                    {formatDate(task.updatedAt)}
                  </p>
                </div>
                {task.completedAt && (
                  <div>
                    <Label className="text-gray-600 text-sm font-medium">Completed</Label>
                    <p className="font-semibold text-gray-900 text-lg mt-1">
                      {formatDate(task.completedAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl px-8 py-3 font-semibold"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}