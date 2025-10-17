"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Users, DollarSign, Briefcase, BarChart3, Activity, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "TeamLead") {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading Admin Dashboard...</span>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: "1,250",
      icon: Users,
      color: "from-red-500 to-pink-600",
      bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
      change: "+12%",
      trend: "up"
    },
    {
      title: "Revenue",
      value: "$45,280",
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      change: "+8.2%",
      trend: "up"
    },
    {
      title: "Active Projects",
      value: "48",
      icon: Briefcase,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      change: "+5",
      trend: "up"
    },
    {
      title: "System Health",
      value: "99.9%",
      icon: Activity,
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-indigo-50",
      change: "Optimal",
      trend: "stable"
    }
  ];

  const quickActions = [
    { title: "User Management", icon: Users, href: "/manage-users", color: "text-red-600 bg-red-100" },
    { title: "Analytics", icon: BarChart3, href: "/analytics", color: "text-blue-600 bg-blue-100" },
    { title: "System Settings", icon: Settings, href: "/settings", color: "text-purple-600 bg-purple-100" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Welcome back, <span className="font-semibold text-red-600">{session?.user?.name}</span>!
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">System Online</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.title}
                className={`${stat.bgColor} rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-md`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${
                    stat.trend === 'up' ? 'text-green-600 bg-green-100' : 
                    stat.trend === 'down' ? 'text-red-600 bg-red-100' : 
                    'text-blue-600 bg-blue-100'
                  } px-2 py-1 rounded-full`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-600 font-medium">{stat.title}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <a
                      key={action.title}
                      href={action.href}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-all duration-200 group"
                    >
                      <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="font-semibold text-gray-700 group-hover:text-red-700 transition-colors duration-200">
                        {action.title}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">System Overview</h2>
              
              {/* Recent Activity */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: "New user registered", time: "2 min ago", type: "user" },
                    { action: "Project created", time: "15 min ago", type: "project" },
                    { action: "System backup completed", time: "1 hour ago", type: "system" },
                    { action: "Performance report generated", time: "2 hours ago", type: "report" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'user' ? 'bg-green-500' :
                        activity.type === 'project' ? 'bg-blue-500' :
                        activity.type === 'system' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{activity.action}</p>
                        <p className="text-gray-500 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-800">Database</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">All systems operational</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-800">API</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">Response time: 120ms</p>
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