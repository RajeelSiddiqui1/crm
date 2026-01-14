// components/tasks/ViewTaskModal.jsx
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Download,
  Eye,
  FileText,
  AudioLines,
  Calendar,
  Clock,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  MessageSquare,
  Send,
  Clock4,
  CheckCheck,
  XCircle,
  TrendingUp,
  FileUp,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function ViewTaskModal({ isOpen, onClose, task }) {
  const [activeTab, setActiveTab] = useState("details");
  const [feedback, setFeedback] = useState("");

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
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getManagerStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCheck className="w-4 h-4" />;
      case "in-progress":
        return <TrendingUp className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock4 className="w-4 h-4" />;
      default:
        return <Clock4 className="w-4 h-4" />;
    }
  };

  const getManagerDisplayName = (manager) => {
    if (!manager) return "Unknown";
    const fullName = `${manager.firstName || ""} ${manager.lastName || ""}`.trim();
    return fullName || "Unknown Manager";
  };

  const getManagerDepartments = (manager) => {
    if (!manager?.departments || !Array.isArray(manager.departments)) {
      return "No Department";
    }
    const departmentNames = manager.departments
      .map((dept) => dept?.name)
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

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Calculate completion statistics
  const getCompletionStats = () => {
    if (!task.managerResponses || task.managerResponses.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const total = task.managerResponses.length;
    const completed = task.managerResponses.filter(
      (response) => response.status === "completed"
    ).length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  };

  const stats = getCompletionStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Task Details
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Task Details
            </button>
            <button
              onClick={() => setActiveTab("responses")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "responses"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Manager Responses ({task.managerResponses?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "files"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Files & Audio ({task.fileAttachments?.length || 0 + task.audioFiles?.length || 0})
            </button>
          </nav>
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
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
                <Badge className={`${getStatusColor(task.status)} capitalize flex items-center gap-1`}>
                  {getStatusIcon(task.status)}
                  {task.status.replace("-", " ")}
                </Badge>
                {task.isLate && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Late
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">Task Progress</Label>
                <span className="text-sm text-gray-600">
                  {stats.completed} of {stats.total} managers completed ({stats.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </Label>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-800">
                    <CalendarDays className="w-4 h-4" />
                    Created
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-lg font-semibold text-green-900">
                    {formatDate(task.createdAt)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {formatTimeAgo(task.createdAt)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-800">
                    <Clock className="w-4 h-4" />
                    Due Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-lg font-semibold text-red-900">
                    {task.endDate ? formatDate(task.endDate) : "No due date"}
                  </p>
                  {task.endDate && (
                    <p className="text-xs text-red-700 mt-1">
                      {formatTimeAgo(task.endDate)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {task.completedAt && (
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-lg font-semibold text-blue-900">
                      {formatDate(task.completedAt)}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {formatTimeAgo(task.completedAt)}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-800">
                    <User className="w-4 h-4" />
                    Assigned To
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-lg font-semibold text-purple-900">
                    {task.managers?.length || 0} Managers
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    {stats.completed} completed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Assigned Managers */}
            <div className="space-y-4">
              <Label className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Assigned Managers ({task.managers?.length || 0})
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {task.managers?.map((manager) => {
                  const response = task.managerResponses?.find(
                    (r) => r.managerId?._id === manager._id || r.managerId === manager._id
                  );
                  
                  return (
                    <Card key={manager._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            {manager.profileImage ? (
                              <AvatarImage src={manager.profileImage} alt={getManagerDisplayName(manager)} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                              {getManagerDisplayName(manager)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold truncate text-gray-900">
                                {getManagerDisplayName(manager)}
                              </p>
                              {response && (
                                <Badge className={`${getManagerStatusColor(response.status)} capitalize text-xs`}>
                                  {response.status.replace("-", " ")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <Building className="w-3 h-3" />
                              <span className="truncate">
                                {getManagerDepartments(manager)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {manager.email}
                            </p>
                            {response?.submittedAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Submitted: {formatDate(response.submittedAt)}
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
          </div>
        )}

        {/* Manager Responses Tab */}
        {activeTab === "responses" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Manager Responses</h3>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-800">
                  {stats.completed} Completed
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {task.managerResponses?.filter(r => r.status === "in-progress").length || 0} In Progress
                </Badge>
                <Badge className="bg-gray-100 text-gray-800">
                  {task.managerResponses?.filter(r => r.status === "pending").length || 0} Pending
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {task.managerResponses?.map((response, index) => {
                const manager = task.managers?.find(
                  (m) => m._id === response.managerId || m._id === response.managerId?._id
                );

                return (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      {/* Manager Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            {manager?.profileImage ? (
                              <AvatarImage src={manager.profileImage} alt={getManagerDisplayName(manager)} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {getManagerDisplayName(manager)
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {getManagerDisplayName(manager)}
                            </p>
                            <p className="text-sm text-gray-500">{manager?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getManagerStatusColor(response.status)} capitalize`}>
                            {getStatusIcon(response.status)}
                            <span className="ml-1">{response.status.replace("-", " ")}</span>
                          </Badge>
                          {response.submittedAt && (
                            <span className="text-xs text-gray-500">
                              {formatDate(response.submittedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Feedback */}
                      {response.feedback && (
                        <div className="mb-4">
                          <Label className="font-medium flex items-center gap-2 text-gray-700 mb-2">
                            <MessageSquare className="w-4 h-4" />
                            Manager's Feedback
                          </Label>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-gray-700">{response.feedback}</p>
                          </div>
                        </div>
                      )}

                      {/* Submitted Files */}
                      {response.submittedFiles && response.submittedFiles.length > 0 && (
                        <div>
                          <Label className="font-medium flex items-center gap-2 text-gray-700 mb-2">
                            <FileUp className="w-4 h-4" />
                            Submitted Files ({response.submittedFiles.length})
                          </Label>
                          <div className="space-y-2">
                            {response.submittedFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-sm">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.size)} • Uploaded {formatTimeAgo(file.uploadedAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(file.url, "_blank")}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
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
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin Feedback Input */}
                     
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="space-y-6">
            {/* Original Files */}
            {task.fileAttachments && task.fileAttachments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                  <FileText className="w-5 h-5" />
                  Original Files ({task.fileAttachments.length})
                </h3>
                <div className="space-y-2">
                  {task.fileAttachments.map((file, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{file.type}</span>
                                <span>•</span>
                                <span>Uploaded {formatTimeAgo(file.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              size="sm"
                              onClick={() => window.open(file.url, "_blank")}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-gradient-to-r from-gray-600 to-gray-600 text-white"
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
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AudioLines className="w-5 h-5" />
                  Audio Files ({task.audioFiles.length})
                </h3>
                <div className="space-y-2">
                  {task.audioFiles.map((audio, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <AudioLines className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{audio.name}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{formatFileSize(audio.size)}</span>
                                <span>•</span>
                                <span>{audio.type}</span>
                                <span>•</span>
                                {audio.duration && (
                                  <>
                                    <span>{Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>Uploaded {formatTimeAgo(audio.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <audio controls src={audio.url} className="w-64" />
                            <Button
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

            {/* Submitted Files from Managers */}
            {task.managerResponses?.some(r => r.submittedFiles && r.submittedFiles.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileUp className="w-5 h-5" />
                  Files Submitted by Managers
                </h3>
                <div className="space-y-4">
                  {task.managerResponses.map((response, idx) => {
                    const manager = task.managers?.find(
                      (m) => m._id === response.managerId || m._id === response.managerId?._id
                    );

                    if (!response.submittedFiles || response.submittedFiles.length === 0) return null;

                    return (
                      <Card key={idx} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                                {getManagerDisplayName(manager)
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{getManagerDisplayName(manager)}</p>
                              <p className="text-xs text-gray-500">Submitted {formatTimeAgo(response.submittedAt)}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {response.submittedFiles.map((file, fileIdx) => (
                              <div
                                key={fileIdx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-green-600" />
                                  <div>
                                    <p className="font-medium text-sm">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.size)} • {formatTimeAgo(file.uploadedAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(file.url, "_blank")}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
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
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Close
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90">
            Export Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}