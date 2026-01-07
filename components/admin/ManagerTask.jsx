// app/admin/tasks/page.jsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import CreateTaskModal from "./tasks/CreateTaskModal";
import EditTaskModal from "./tasks/EditTaskModal";
import ViewTaskModal from "./tasks/ViewTaskModal";
import TasksTable from "./tasks/TasksTable";
import StatsCards from "./tasks/StatsCards";
import SearchBar from "./tasks/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import axios from "axios";

export default function ManagerTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }

    fetchTasks();
    fetchManagers();
  }, [session, status, router]);

  const fetchTasks = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/admin/tasks");
      if (response.data.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setFetching(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get("/api/admin/managers");
      if (response.data.success) {
        setManagers(response.data.managers || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to fetch managers");
    }
  };

  const handleCreateTask = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/admin/tasks", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Task created successfully!");
        setShowCreateModal(false);
        fetchTasks();
        return true;
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Failed to create task");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async (taskId, formData) => {
    setLoading(true);
    try {
      const response = await axios.patch(`/api/admin/tasks/${taskId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Task updated successfully!");
        setShowEditModal(false);
        fetchTasks();
        return true;
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Failed to update task");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await axios.delete(`/api/admin/tasks/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully!");
        fetchTasks();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const handleEditTaskClick = (task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.priority?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-700 text-lg font-medium">
            Loading Admin Panel...
          </span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Admin") {
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
              Task Management
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Create and manage tasks with voice instructions and assign them to
              multiple managers across departments
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl font-semibold"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards tasks={tasks} managers={managers} />

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search tasks, clients, descriptions..."
          />
        </div>

        {/* Tasks Table */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Tasks
                </CardTitle>
                <p className="text-gray-600 text-base mt-2">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to
                  managers across departments
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TasksTable
              tasks={filteredTasks}
              fetching={fetching}
              onView={handleViewTask}
              onEdit={handleEditTaskClick}
              onDelete={handleDeleteTask}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        managers={managers}
        onSubmit={handleCreateTask}
        loading={loading}
      />

      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        task={selectedTask}
        managers={managers}
        onSubmit={handleEditTask}
        loading={loading}
      />

      <ViewTaskModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        task={selectedTask}
      />
    </div>
  );
}