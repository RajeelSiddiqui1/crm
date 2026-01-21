"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  AlertCircle,
  FileText,
  Mail,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Star,
  Check,
  X,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState("assigned");
  const [activeTab, setActiveTab] = useState("assigned"); // 'assigned', 'activity', 'details'

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/employee/assigned-subtasks/${taskId}`);
      setTask(response.data);
    } catch (error) {
      console.error("Error fetching task:", error);
      alert("Failed to load task details");
      router.push("/employee/my-tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/employee/assigned-subtasks/${taskId}`);
      alert("Task deleted successfully!");
      router.push("/employee/my-tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  };

  const handleStatusUpdate = async (userId, userType, newStatus) => {
    try {
      setUpdatingStatus(true);
      
      const endpoint = `/api/employee/assigned-subtasks/${taskId}/status`;
      const payload = {
        userId,
        userType, // 'teamlead', 'manager', 'employee'
        status: newStatus
      };

      const response = await axios.patch(endpoint, payload);
      setTask(response.data);
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFeedbackSubmit = async (userId, userType, feedbackText) => {
    try {
      const endpoint = `/api/employee/assigned-subtasks/${taskId}/feedback`;
      const payload = {
        userId,
        userType,
        feedback: feedbackText
      };

      const response = await axios.post(endpoint, payload);
      setTask(response.data);
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-200",
        icon: <ClockIcon className="w-4 h-4" />,
        label: "Pending",
        color: "yellow"
      },
      in_progress: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "In Progress",
        color: "blue"
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Completed",
        color: "green"
      },
      approved: {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        border: "border-emerald-200",
        icon: <ThumbsUp className="w-4 h-4" />,
        label: "Approved",
        color: "emerald"
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        icon: <ThumbsDown className="w-4 h-4" />,
        label: "Rejected",
        color: "red"
      }
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return "Not set";
    
    const date = new Date(dateString);
    const options = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    
    if (timeString) {
      const [hours, minutes] = timeString.split(":");
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    
    return date.toLocaleString("en-US", options);
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-12 shadow-lg">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Task Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The task you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => router.push("/employee/my-tasks")}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
            >
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalAssignees = 
    (task.assignedTeamLead?.length || 0) + 
    (task.assignedManager?.length || 0) + 
    (task.assignedEmployee?.length || 0);
  
  const completedAssignees = [
    ...(task.assignedTeamLead || []).filter(a => a.status === 'completed' || a.status === 'approved'),
    ...(task.assignedManager || []).filter(a => a.status === 'completed' || a.status === 'approved'),
    ...(task.assignedEmployee || []).filter(a => a.status === 'completed' || a.status === 'approved')
  ].length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Task
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/employee/my-tasks")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Tasks
          </button>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={task.status} />
                  <span className="text-sm text-gray-500">
                    Created: {formatDate(task.createdAt)}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {task.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {totalAssignees} assigned
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {completedAssignees} completed
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/employee/my-tasks/edit/${taskId}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-semibold transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Details & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Task Description
                  </h3>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Timeline & Details
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Start Date & Time</h4>
                        <p className="text-gray-900 font-medium">
                          {formatDateTime(task.startDate, task.startTime)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">End Date & Time</h4>
                        <p className="text-gray-900 font-medium">
                          {formatDateTime(task.endDate, task.endTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                        <p className="text-gray-900 font-medium">
                          {task.startDate && task.endDate ? 
                            `${Math.ceil((new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24))} days` : 
                            'Not set'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Created By</h4>
                        <p className="text-gray-900 font-medium">
                          {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{task.submittedBy?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Assignment Details
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    {totalAssignees} members assigned
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveTab('assigned')}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'assigned'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Assigned Members
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'activity'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Activity Log
                  </button>
                </div>

                {/* Assigned Members Tab */}
                {activeTab === 'assigned' && (
                  <div className="space-y-6">
                    {/* Team Leads */}
                    {task.assignedTeamLead?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            TEAM LEADS
                          </span>
                          <span>{task.assignedTeamLead.length} assigned</span>
                        </h4>
                        <div className="space-y-4">
                          {task.assignedTeamLead.map((assignment) => (
                            <div key={assignment._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <User className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {assignment.teamLeadId?.firstName} {assignment.teamLeadId?.lastName}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      <span className="text-sm text-gray-500">
                                        {assignment.teamLeadId?.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">
                                        {assignment.teamLeadId?.depId?.name || 'No Department'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <StatusBadge status={assignment.status} />
                              </div>
                              
                              {assignment.feedback && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Feedback:</span>
                                  </div>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                                    {assignment.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Managers */}
                    {task.assignedManager?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            MANAGERS
                          </span>
                          <span>{task.assignedManager.length} assigned</span>
                        </h4>
                        <div className="space-y-4">
                          {task.assignedManager.map((assignment) => (
                            <div key={assignment._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <User className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {assignment.managerId?.firstName} {assignment.managerId?.lastName}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      <span className="text-sm text-gray-500">
                                        {assignment.managerId?.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                                        {assignment.managerId?.departments?.map(d => d.name).join(', ') || 'No Department'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <StatusBadge status={assignment.status} />
                              </div>
                              
                              {assignment.feedback && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Feedback:</span>
                                  </div>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                                    {assignment.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Employees */}
                    {task.assignedEmployee?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                            EMPLOYEES
                          </span>
                          <span>{task.assignedEmployee.length} assigned</span>
                        </h4>
                        <div className="space-y-4">
                          {task.assignedEmployee.map((assignment) => (
                            <div key={assignment._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-amber-100 rounded-lg">
                                    <User className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {assignment.employeeId?.firstName} {assignment.employeeId?.lastName}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      <span className="text-sm text-gray-500">
                                        {assignment.employeeId?.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                                        {assignment.employeeId?.depId?.name || 'No Department'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <StatusBadge status={assignment.status} />
                              </div>
                              
                              {assignment.feedback && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Feedback:</span>
                                  </div>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                                    {assignment.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalAssignees === 0 && (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No members assigned to this task</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="p-1.5 bg-blue-100 rounded-full">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium">
                          Task created by {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(task.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="p-1.5 bg-green-100 rounded-full">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium">
                          Task status set to <StatusBadge status={task.status} />
                        </p>
                        <p className="text-xs text-gray-500">
                          Last updated: {formatDate(task.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Show feedback activities */}
                    {[
                      ...(task.assignedTeamLead || []).filter(a => a.feedback),
                      ...(task.assignedManager || []).filter(a => a.feedback),
                      ...(task.assignedEmployee || []).filter(a => a.feedback)
                    ].map((assignment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <div className="p-1.5 bg-amber-100 rounded-full">
                          <MessageSquare className="w-3 h-3 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">
                            Feedback provided by {assignment.teamLeadId?.firstName || assignment.managerId?.firstName || assignment.employeeId?.firstName}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{assignment.feedback}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Status: <StatusBadge status={assignment.status} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Summary */}
          <div className="space-y-6">
            {/* Task Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Task Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Status</span>
                    <StatusBadge status={task.status} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Assignees</span>
                    <span className="font-medium text-gray-900">{totalAssignees}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium text-gray-900">{completedAssignees}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${totalAssignees > 0 ? (completedAssignees / totalAssignees) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Progress</span>
                      <span>{totalAssignees > 0 ? Math.round((completedAssignees / totalAssignees) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Assignment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Team Leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {task.assignedTeamLead?.length || 0}
                      </span>
                      <span className="text-xs text-gray-500">assigned</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Managers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {task.assignedManager?.length || 0}
                      </span>
                      <span className="text-xs text-gray-500">assigned</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Employees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {task.assignedEmployee?.length || 0}
                      </span>
                      <span className="text-xs text-gray-500">assigned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/employee/my-tasks/edit/${taskId}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-medium transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Task Details
                  </button>
                  
                  <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Copy Task Link
                  </button>
                  
                  <button
                    onClick={() => setDeleteModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Task
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Timeline Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(task.createdAt)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(task.updatedAt)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Task Duration</p>
                    <p className="text-sm font-medium text-gray-900">
                      {task.startDate && task.endDate ? 
                        `${Math.ceil((new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24))} days` : 
                        'Not set'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}