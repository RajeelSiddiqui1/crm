// components/tasks/ViewTaskModal.jsx
"use client";
import React from "react";
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
  AlertCircle,
  CalendarDays,
} from "lucide-react";

export default function ViewTaskModal({ isOpen, onClose, task }) {
  if (!task) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
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
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Task Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
              {task.clientName && (
                <p className="text-gray-600 mt-1">
                  Client: <span className="font-medium">{task.clientName}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getPriorityColor(task.priority)} capitalize`}>
                {task.priority} Priority
              </Badge>
              <Badge className={`${getStatusColor(task.status)} capitalize`}>
                {task.status.replace("-", " ")}
              </Badge>
              {task.isLate && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  Late
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-900 text-white">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 " />
                  Created
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-lg font-semibold">
                  {formatDate(task.createdAt)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-700 text-white">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Due Date
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-lg font-semibold">
                  {task.endDate ? formatDate(task.endDate) : "No due date"}
                </p>
              </CardContent>
            </Card>

            {task.completedAt && (
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-lg font-semibold">
                    {formatDate(task.completedAt)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Assigned Managers */}
          <div className="space-y-4">
            <Label className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Assigned Managers ({task.managers?.length || 0})
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {task.managers?.map((manager) => (
                <Card key={manager._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {getManagerDisplayName(manager)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-gray-900  ">
                          {getManagerDisplayName(manager)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building className="w-3 h-3" />
                          <span className="truncate">
                            {getManagerDepartments(manager)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {manager.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Files */}
          {task.fileAttachments && task.fileAttachments.length > 0 && (
            <div className="space-y-4">
              <Label className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Files ({task.fileAttachments.length})
              </Label>
              <div className="space-y-2">
                {task.fileAttachments.map((file, index) => (
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
                          className="bg-blue-900 text-white"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            <Eye className="w-4 h-4 mr-2 " />
                            View
                          </Button>
                          <Button
                          className="bg-gray-900 text-white"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = file.url;
                              link.download = file.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
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

          {/* Audio Files */}
          {task.audioFiles && task.audioFiles.length > 0 && (
            <div className="space-y-4">
              <Label className="font-semibold flex items-center gap-2">
                <AudioLines className="w-4 h-4" />
                Audio Files ({task.audioFiles.length})
              </Label>
              <div className="space-y-2">
                {task.audioFiles.map((audio, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AudioLines className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">{audio.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(audio.size)} • {audio.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <audio controls src={audio.url} className="w-48" />
                          <Button
                          className="bg-gray-900 text-white"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = audio.url;
                              link.download = audio.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
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

          
          {/* Action Buttons */}
          <div className="flex justify-end pt-4 ">
            <Button onClick={onClose} className="bg-red-700 text-white">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}