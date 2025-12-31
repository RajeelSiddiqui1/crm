"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  User,
  Building,
  FileText,
  ClipboardList,
  Share2,
  TrendingUp,
  Loader2,
  X,
  Briefcase,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import UserTasks from "@/components/admin/UserTasks"

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "Admin") router.push("/adminlogin");
    else fetchStats();
  }, [session, status]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setChartLoading(true);
      const res = await axios.get("/api/admin/stats");
      if (res.data.success) {
        setStats(res.data.stats);
        // Small delay to show smooth loading state
        setTimeout(() => setChartLoading(false), 500);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const formatMonthlyData = (data) => {
    const labels = Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString("default", { month: "short" })
    );
    const counts = Array(12).fill(0);
    data?.forEach((d) => (counts[d._id.month - 1] = d.count));
    return { labels, counts };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Loading Dashboard
            </h2>
            <p className="text-gray-500 text-sm">Preparing your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Admin") return null;

  const totals = stats?.totals || {};
  const monthlyEmployees = formatMonthlyData(stats?.charts?.monthlyEmployees);
  const monthlyFormSubmissions = formatMonthlyData(
    stats?.charts?.monthlyFormSubmissions
  );
  const monthlySharedTasks = formatMonthlyData(
    stats?.charts?.monthlySharedTasks
  );

  const cardData = [
    {
      title: "Managers",
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      value: totals.managers || 0,
      bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
      link: "/admin/managers",
      trend: "+12%",
    },
    {
      title: "Team Leads",
      icon: <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      value: totals.teamLeads || 0,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      link: "/admin/teamleads",
      trend: "+8%",
    },
    {
      title: "Employees",
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      value: totals.employees || 0,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      link: "/admin/employees",
      trend: "+15%",
    },
    {
      title: "Departments",
      icon: <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      value: totals.departments || 0,
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
      link: "/admin/departments",
      trend: "+5%",
    },

    // {
    //   title: "Shared Tasks",
    //   icon: <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
    //   value: totals.sharedTasks || 0,
    //   bgColor: "bg-gradient-to-br from-red-500 to-red-600",
    //   link: "/admin/shared-tasks",
    //   trend: "+32%"
    // },
    {
      title: "Admin Tasks",
      icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      value: totals.adminTasks || 0,
      bgColor: "bg-gradient-to-br from-teal-500 to-teal-600",
      link: "/admin/admin-tasks",
      trend: "+7%",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6 md:p-8">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Overview of your organization's performance and analytics
            </p>
          </div>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <button
            onClick={() => setShowUsers(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Show All Users List
          </button>
        </div>
      </div>

{showUsers && <UserTasks onClose={() => setShowUsers(false)} />}


      {/* Stats Cards */}
      <div className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardData.map((card, idx) => (
            <Card
              key={idx}
              className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${card.bgColor} text-white`}
              onClick={() => router.push(card.link)}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-lg bg-white/20 backdrop-blur-sm`}
                  >
                    {card.icon}
                  </div>
                  <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    <span>{card.trend}</span>
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold mb-1">
                  {card.value.toLocaleString()}
                </CardTitle>
                <CardDescription className="text-white/90 text-sm sm:text-base">
                  {card.title}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Analytics Overview
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly New Employees */}
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800">
                  Monthly New Employees
                </CardTitle>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <CardDescription className="text-gray-600">
                Employee growth trend over the year
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">
                      Loading chart data...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <Line
                    data={{
                      labels: monthlyEmployees.labels,
                      datasets: [
                        {
                          label: "Employees",
                          data: monthlyEmployees.counts,
                          backgroundColor: "rgba(34,197,94,0.1)",
                          borderColor: "rgba(34,197,94,1)",
                          borderWidth: 3,
                          tension: 0.4,
                          fill: true,
                          pointBackgroundColor: "white",
                          pointBorderColor: "rgba(34,197,94,1)",
                          pointBorderWidth: 2,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          titleColor: "#1f2937",
                          bodyColor: "#4b5563",
                          borderColor: "#e5e7eb",
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 4,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#6b7280" },
                        },
                        x: {
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#6b7280" },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Form Submissions */}
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800">
                  Monthly Form Submissions
                </CardTitle>
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
              <CardDescription className="text-gray-600">
                Form submission volume by month
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">
                      Loading chart data...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: monthlyFormSubmissions.labels,
                      datasets: [
                        {
                          label: "Form Submissions",
                          data: monthlyFormSubmissions.counts,
                          backgroundColor: "rgba(59,130,246,0.7)",
                          borderColor: "rgba(59,130,246,1)",
                          borderWidth: 1,
                          borderRadius: 6,
                          borderSkipped: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          titleColor: "#1f2937",
                          bodyColor: "#4b5563",
                          borderColor: "#e5e7eb",
                          borderWidth: 1,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#6b7280" },
                        },
                        x: {
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#6b7280" },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Shared Tasks - Full Width */}
          <Card className="shadow-lg border-0 overflow-hidden lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800">
                  Monthly Shared Tasks
                </CardTitle>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <CardDescription className="text-gray-600">
                Collaboration activity through shared tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">
                      Loading chart data...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <Line
                    data={{
                      labels: monthlySharedTasks.labels,
                      datasets: [
                        {
                          label: "Shared Tasks",
                          data: monthlySharedTasks.counts,
                          backgroundColor: "rgba(239,68,68,0.1)",
                          borderColor: "rgba(239,68,68,1)",
                          borderWidth: 3,
                          tension: 0.4,
                          fill: true,
                          pointBackgroundColor: "white",
                          pointBorderColor: "rgba(239,68,68,1)",
                          pointBorderWidth: 2,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          titleColor: "#1f2937",
                          bodyColor: "#4b5563",
                          borderColor: "#e5e7eb",
                          borderWidth: 1,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#6b7280" },
                        },
                        x: {
                          grid: { color: "rgba(0,0,0,0.05)" },
                          ticks: { color: "#6b7280" },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Data updates in real-time</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
