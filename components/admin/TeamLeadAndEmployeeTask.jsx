// app/admin/tasks2/page.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import CreateTaskModal from "./tasks2/CreateTaskModal";
import EditTaskModal from "./tasks2/EditTaskModal";
import ViewTaskModal from "./tasks2/ViewTaskModal";
import TasksTable from "./tasks2/TasksTable";
import StatsCards from "./tasks2/StatsCards";
import SearchBar from "./tasks2/SearchBar";
import StatusFilter from "./tasks2/StatusFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import axios from "axios";

export default function TeamLeadAndEmployeeTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }

    fetchAllData();
  }, [session, status, router]);

  const fetchAllData = async () => {
    try {
      setFetching(true);
      
      // Fetch tasks
      try {
        const tasksRes = await axios.get("/api/admin/tasks2");
        if (tasksRes.data.success) {
          setTasks(tasksRes.data.tasks || []);
        }
      } catch (tasksError) {
        console.error("Tasks fetch error:", tasksError);
        toast.error("Failed to fetch tasks");
      }

      // Fetch team leads
      try {
        const teamLeadsRes = await axios.get("/api/admin/teamleads");
        if (teamLeadsRes.data.success) {
          const teamLeadsData = teamLeadsRes.data.teamleads || [];
          setTeamLeads(teamLeadsData);
        }
      } catch (teamLeadsError) {
        console.error("TeamLeads fetch error:", teamLeadsError);
      }

      // Fetch employees
      try {
        const employeesRes = await axios.get("/api/admin/employees");
        if (employeesRes.data.success) {
          const employeesData = employeesRes.data.employees || [];
          setEmployees(employeesData);
        }
      } catch (employeesError) {
        console.error("Employees fetch error:", employeesError);
      }

    } catch (error) {
      console.error("General Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setFetching(false);
    }
  };

  const handleCreateTask = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/admin/tasks2", formData);

      if (response.data.success) {
        toast.success("Task created successfully!");
        setShowCreateModal(false);
        fetchAllData();
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
      console.log(`Updating task ${taskId}...`);
      const response = await axios.put(`/api/admin/tasks2/${taskId}`, formData);
      console.log("Update response:", response.data);

      if (response.data.success) {
        toast.success("Task updated successfully!");
        setShowEditModal(false);
        fetchAllData();
        return true;
      } else {
        toast.error(response.data.message || "Failed to update task");
        return false;
      }
    } catch (error) {
      console.error("Task update error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update task");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      setLoading(true);
      const response = await axios.delete(`/api/admin/tasks2/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully!");
        setShowDeleteModal(false);
        setTaskToDelete(null);
        fetchAllData();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete task");
    } finally {
      setLoading(false);
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

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleViewStatus = (task) => {
    setSelectedTask(task);
    setShowStatusModal(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && task.stats?.statusCounts.pending > 0;
    if (activeTab === "in_progress") return matchesSearch && task.stats?.statusCounts.in_progress > 0;
    if (activeTab === "completed") return matchesSearch && task.stats?.statusCounts.completed > 0;
    if (activeTab === "overdue") return matchesSearch && task.stats?.statusCounts.overdue > 0;
    
    return matchesSearch;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Advanced Task Management
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Manage tasks with multiple files, audio recordings, and team hierarchy
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-center sm:self-auto">
            <Button
              onClick={fetchAllData}
              variant="outline"
              size="lg"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white px-6 py-3 rounded-xl font-semibold"
            >
              <Loader2 className={`w-5 h-5 mr-2 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards tasks={tasks} teamLeads={teamLeads} employees={employees} />

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search tasks, clients, descriptions..."
            />
          </div>
          <div>
            <StatusFilter activeTab={activeTab} setActiveTab={setActiveTab} tasks={tasks} />
          </div>
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
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} • Showing {filteredTasks.length}
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
              onDelete={handleDeleteClick}
              onStatus={handleViewStatus}
              teamLeads={teamLeads}
              employees={employees}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        teamLeads={teamLeads}
        employees={employees}
        onSubmit={handleCreateTask}
        loading={loading}
      />

      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        task={selectedTask}
        teamLeads={teamLeads}
        employees={employees}
        onSubmit={handleEditTask}
        loading={loading}
      />

      <ViewTaskModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        task={selectedTask}
        teamLeads={teamLeads}
        employees={employees}
      />

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-bold">"{taskToDelete.title}"</span>?
              This will also delete all attached files and audio from storage.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
                disabled={loading}
                className="bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteTask(taskToDelete._id)}
                disabled={loading}
                className="bg-red-800 text-white hover:bg-red-900 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? "Deleting..." : "Delete Task"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {selectedTask && showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Status Tracking</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatusModal(false)}
              >
                ✕
              </Button>
            </div>
            {/* Status content here */}
          </div>
        </div>
      )}
    </div>
  );
}