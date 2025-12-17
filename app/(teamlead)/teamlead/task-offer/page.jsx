"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";

export default function TaskOfferPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }
    fetchTasks();
  }, [session, status, router]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/teamlead/task-offer");
      if (response.status === 200) setTasks(response.data.tasks || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (taskId) => {
    try {
      const response = await axios.put(`/api/teamlead/task-offer/${taskId}`);
      if (response.status === 200) {
        toast.success("Task claimed");
        setTasks(prev => prev.filter(task => task._id !== taskId));
        router.push(`/teamlead/tasks`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to claim");
    }
  };

  const viewDetails = (taskId) => router.push(`/teamlead/task-offer/${taskId}`);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      in_progress: { icon: AlertCircle, label: "In Progress", color: "bg-blue-100 text-blue-800" },
      completed: { icon: CheckCircle, label: "Completed", color: "bg-green-100 text-green-800" },
      rejected: { icon: XCircle, label: "Rejected", color: "bg-red-100 text-red-800" }
    };
    const { icon: Icon, label, color } = config[status] || config.pending;
    return (
      <Badge className={`flex items-center gap-1 ${color} px-2 py-1 rounded-md text-sm`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Available Tasks</h1>

        <input
          placeholder="Search tasks..."
          className="mb-6 w-full md:w-96 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="overflow-x-auto rounded-lg shadow-lg bg-white border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Submitted By</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Team Leads</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks
                .filter(task => task.formId?.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(task => (
                <tr key={task._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-2 text-gray-800">{task.formId?.title}</td>
                  <td className="px-4 py-2 text-gray-700">{task.formId?.description || "No description"}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {task.submittedBy?.name} <br />
                    <span className="text-gray-400 text-xs">{task.submittedBy?.email}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{formatDate(task.createdAt)}</td>
                  <td className="px-4 py-2">{getStatusBadge(task.status)}</td>
                  <td className="px-4 py-2 text-gray-700">{task.multipleTeamLeadAssigned?.length || 0}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <Button
                      onClick={() => handleClaim(task._id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Claim
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => viewDetails(task._id)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tasks.length === 0 && !loading && (
          <div className="text-center mt-6 text-gray-500">
            No tasks available
          </div>
        )}
      </div>
    </div>
  );
}
