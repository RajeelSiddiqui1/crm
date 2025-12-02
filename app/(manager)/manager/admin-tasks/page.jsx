"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import all Select components together
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Calendar,
  FileText,
  AudioLines,
  Play,
  Pause,
  Download,
  Volume2,
  User,
  Building,
  Clock,
  Eye,
} from "lucide-react";
import axios from "axios";

export default function ManagerAdminTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(null);
  const [managers, setManagers] = useState([]); // Initialize as empty array
  const [selectedManager, setSelectedManager] = useState("");

  // Use ref to track current audio element
  const audioRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/manager/login");
      return;
    }

    fetchTasks();
    fetchManagers();
  }, [session, status, router]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/manager/admin-tasks");

      if (response.data.success) {
        setTasks(response.data.tasks || []);
      } else {
        toast.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get("/api/manager/managers");
      if (response.data.success) {
        setManagers(response.data.managers || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to load managers");
    }
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const playAudio = (taskId, audioUrl) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (audioPlaying === taskId) {
      // If clicking the same audio, just stop it
      setAudioPlaying(null);
      return;
    }

    // Create new audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setAudioPlaying(taskId);
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

    audio.play();
  };

  const downloadFile = (fileData, fileName = "attachment") => {
    const link = document.createElement("a");
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  const handleManagerChange = (managerId) => {
    setSelectedManager(managerId);
    // Here you can add logic to assign the task to selected manager
    toast.success("Manager assigned successfully");
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.priority?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-700 text-lg font-medium">
            Loading Manager Tasks...
          </span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Assigned Tasks
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Tasks assigned to you by Admin with voice instructions and files
            </p>
          </div>

          {/* Manager Info */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                    {session.user.firstName?.charAt(0)}
                    {session.user.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">
                    {session.user.firstName} {session.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">Manager</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Tasks
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    High Priority
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.priority === "high").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Audio
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.audioUrl).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Files
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {tasks.filter((t) => t.fileAttachments).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Your Tasks
                </CardTitle>
                <p className="text-gray-600 text-base mt-2">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to
                  you
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search tasks, clients, priority..."
                  className="pl-12 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl bg-white/80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <span className="text-lg font-medium">
                    Loading your tasks...
                  </span>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <FileText className="w-24 h-24 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {tasks.length === 0
                    ? "No tasks assigned yet"
                    : "No matches found"}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  {tasks.length === 0
                    ? "You don't have any tasks assigned to you yet."
                    : "Try adjusting your search terms to find what you're looking for."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Task Details
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Assign Manager
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow
                        key={task._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {task.audioUrl && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-gray-800 text-white border-gray-700 px-2 py-1 rounded-lg"
                                  >
                                    <AudioLines className="w-3 h-3 mr-1" />
                                    Voice Instructions
                                  </Badge>
                                )}
                                {task.fileAttachments && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-blue-300 text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    File Attached
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Select
                            value={selectedManager}
                            onValueChange={handleManagerChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.map((manager) => (
                                <SelectItem key={manager._id} value={manager._id}>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-gray-900">
                                      {manager.firstName} {manager.lastName}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs text-gray-600"
                                    >
                                      {manager.email}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleView(task)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>

                            <Button
                              onClick={() =>
                                router.push(
                                  `/manager/forms/create?taskId=${task._id}`
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-green-300 text-green-700 hover:bg-green-50"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Create Form
                            </Button>
                            {task.audioUrl && (
                              <Button
                                onClick={() =>
                                  playAudio(task._id, task.audioUrl)
                                }
                                variant="outline"
                                size="sm"
                                className={`rounded-lg ${
                                  audioPlaying === task._id
                                    ? "bg-green-50 border-green-300 text-green-700"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {audioPlaying === task._id ? (
                                  <Pause className="w-4 h-4 mr-2" />
                                ) : (
                                  <Play className="w-4 h-4 mr-2" />
                                )}
                                {audioPlaying === task._id ? "Pause" : "Play"}
                              </Button>
                            )}
                            {task.fileAttachments && (
                              <Button
                                onClick={() =>
                                  downloadFile(
                                    task.fileAttachments,
                                    `task_${task.title}_attachment`
                                  )
                                }
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                File
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Task Dialog */}
      {selectedTask && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${
            viewDialogOpen ? "block" : "hidden"
          }`}
        >
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Task Details
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setViewDialogOpen(false);
                    // Stop audio when closing dialog
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                      audioRef.current = null;
                    }
                    setAudioPlaying(null);
                  }}
                  className="rounded-lg"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Task Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Title
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {selectedTask.title}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Client
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {selectedTask.clientName || "No client"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Priority
                      </label>
                      <Badge
                        className={`${getPriorityColor(
                          selectedTask.priority
                        )} capitalize`}
                      >
                        {selectedTask.priority}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Due Date
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {formatDate(selectedTask.endDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Managers */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Assigned To
                  </h3>
                  <div className="space-y-3">
                    {selectedTask.managers?.map((manager) => (
                      <div
                        key={manager._id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {manager.firstName?.charAt(0)}
                            {manager.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {manager.firstName} {manager.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {manager.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audio Section */}
              {selectedTask.audioUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Voice Instructions
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <audio
                      controls
                      className="w-full"
                      onPlay={() => setAudioPlaying(selectedTask._id)}
                      onPause={() => setAudioPlaying(null)}
                      onEnded={() => setAudioPlaying(null)}
                    >
                      <source src={selectedTask.audioUrl} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}

              {/* File Attachments */}
              {selectedTask.fileAttachments && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    File Attachments
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800">
                            File Attached
                          </p>
                          <p className="text-sm text-green-600">
                            Click to download the file
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          downloadFile(
                            selectedTask.fileAttachments,
                            `task_${selectedTask.title}_attachment`
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}