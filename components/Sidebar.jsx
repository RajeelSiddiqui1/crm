"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Briefcase,
  User,
  Building,
  BarChart3,
  Target,
  Calendar,
  MessageSquare,
  PieChart,
  Shield,
  Wallet,
  Clock,
  Award,
  ClipboardList,
  FolderOpen,
  UserCog,
  UsersRound,
  TargetIcon,
  Share2,
  Workflow
} from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const role = session?.user?.role;

  const iconMap = {
    Dashboard: LayoutDashboard,
    "User Management": Users,
    "Departments": Building,
    "Analytics": BarChart3,
    "Reports": PieChart,
    "Performance": Target,
    "Team Leads": UsersRound,
    "Forms": ClipboardList,
    "ManagerForms": FolderOpen,
    "Employees": User,
    "Projects": Briefcase,
    "Tasks": FileText,
    "Team Members": Users,
    "My Tasks": FileText,
    "Profile": User,
    "Attendance": Clock,
    "Payroll": Wallet,
    "Recruitment": Award,
    "Messages": MessageSquare,
    "Calendar": Calendar,
    "Settings": Settings,
    "Managers": UserCog,
    "TeamLeads": TargetIcon,
    "AdminTasks": FileText,
    "ManagerTasks": ClipboardList,
    "EmployeeForms": FolderOpen,
    "Submissions": FileText,
    "Subtasks": Workflow,
    "SharedTasks": Share2,
    "OperationTasks": Workflow,
    "ReceivedTasks": Share2,
    "OperationManagerTasks": Briefcase
  };

  const links = {
    admin: [
      { href: "/admin/home", label: "Dashboard", icon: "Dashboard" },
      // { href: "/admin/posts", label: "Post", icon: "Dashboard" },
      { href: "/admin/forms", label: "Forms", icon: "Forms" },
      { href: "/admin/admin-tasks", label: "Admin Tasks", icon: "AdminTasks" },
      { href: "/admin/manager-tasks", label: "Manager Tasks", icon: "ManagerTasks" },
      { href: "/admin/departments", label: "Departments", icon: "Departments" },
      { href: "/admin/managers", label: "Managers", icon: "Managers" },
      { href: "/admin/teamleads", label: "Team Leads", icon: "TeamLeads" },
      { href: "/admin/employees", label: "Employees", icon: "Employees" },
    ],
    manager: [
      { href: "/manager/home", label: "Dashboard", icon: "Dashboard" },
      // { href: "/manager/post", label: "Manager Post", icon: "Dashboard" },
      { href: "/manager/teamleads", label: "Team Leads", icon: "Team Leads" },
      { href: "/manager/admin-tasks", label: "Admin Tasks", icon: "AdminTasks" },
      { href: "/manager/employees", label: "Employees", icon: "Employees" },
      { href: "/manager/managerforms", label: "Forms", icon: "Forms" },
      { href: "/manager/employeeform", label: "Employee Forms", icon: "EmployeeForms" },
      { href: "/manager/submissions", label: "Submissions", icon: "Submissions" },
      { href: "/manager/subtasks", label: "Subtasks", icon: "Subtasks" },
      { href: "/manager/received-tasks", label: "Shared Tasks", icon: "SharedTasks" },
      { href: "/manager/operation-manager-task", label: "Operation Tasks", icon: "OperationTasks" },
    ],
    teamlead: [
      { href: "/teamlead/home", label: "Dashboard", icon: "Dashboard" },
      { href: "/teamlead/subtasks", label: "Subtasks", icon: "Subtasks" },
      { href: "/teamlead/tasks", label: "Tasks", icon: "Tasks" },
      { href: "/teamlead/operation-tasks", label: "Operation Tasks", icon: "OperationTasks" },
      { href: "/teamlead/received-tasks", label: "Received Tasks", icon: "ReceivedTasks" },
      { href: "/messages", label: "Messages", icon: "Messages" },
    ],
    employee: [
      { href: "/employee/home", label: "Dashboard", icon: "Dashboard" },
      { href: "/employee/tasks", label: "Tasks", icon: "Tasks" },
      { href: "/employee/subtasks", label: "Subtasks", icon: "Subtasks" },
      { href: "/employee/operation-tasks", label: "Operation Tasks", icon: "OperationTasks" },
      { href: "/employee/received-tasks", label: "Received Tasks", icon: "ReceivedTasks" },
    ],
  };

  const roleLinks = links[role?.toLowerCase()] || [];

  return (
    <aside
      className={cn(
        "bg-black text-white shadow-xl transition-all duration-300 flex flex-col border-r border-gray-800",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-15 h-15 rounded-full overflow-hidden bg-white flex items-center justify-center">
              <img
                src="/office/mhsolution.png"
                alt="MH Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">MH Solutions</h2>
              <p className="text-xs text-gray-400 capitalize">{role} Panel</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-black" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {roleLinks.map((link) => {
          const IconComponent = iconMap[link.icon];
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white",
                isCollapsed ? "p-3 justify-center" : "p-3"
              )}
              title={isCollapsed ? link.label : undefined}
            >
              {/* Active indicator for collapsed state */}
              {isActive && isCollapsed && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
              )}

              {IconComponent && (
                <IconComponent
                  size={20}
                  className={cn(
                    "transition-transform duration-200 flex-shrink-0",
                    isCollapsed ? "" : "mr-3",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )}
                />
              )}

              {!isCollapsed && (
                <span className="font-medium text-sm whitespace-nowrap">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info (when expanded) */}
      {!isCollapsed && session?.user && (
        <div className="p-3 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border border-blue-500">
              {session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session.user.email || session.user.userId}
              </p>
              <p className="text-xs text-blue-300 font-medium capitalize mt-0.5">
                {role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed User Info */}
      {isCollapsed && session?.user && (
        <div className="p-3 border-t border-gray-800 bg-gray-900">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border border-blue-500 mx-auto">
            {session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
        </div>
      )}
    </aside>
  );
}