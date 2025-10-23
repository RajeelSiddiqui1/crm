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
  Award
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
    "Team Leads": Users,
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
    "Settings": Settings
  };

  const links = {
    admin: [
      { href: "/adminhome", label: "Dashboard", icon: "Dashboard" },
      { href: "/users", label: "User Management", icon: "User Management" },
      { href: "/departments", label: "Departments", icon: "Departments" },
      { href: "/analytics", label: "Analytics", icon: "Analytics" },
      { href: "/reports", label: "Reports", icon: "Reports" },
      { href: "/settings", label: "Settings", icon: "Settings" },
    ],
    manager: [
      { href: "/managerhome", label: "Dashboard", icon: "Dashboard" },
      { href: "/teamleads", label: "Team Leads", icon: "Team Leads" },
      { href: "/employees", label: "Employees", icon: "Employees" },
      { href: "/manager/submissions", label: "Tasks", icon: "Tasks" },
      { href: "/performance", label: "Performance", icon: "Performance" },
      { href: "/attendance", label: "Attendance", icon: "Attendance" },
      { href: "/reports", label: "Reports", icon: "Reports" },
    ],
    teamlead: [
      { href: "/teamleadhome", label: "Dashboard", icon: "Dashboard" },
      { href: "/team-members", label: "Team Members", icon: "Team Members" },
      { href: "/teamlead/tasks", label: "Tasks", icon: "Tasks" },
      { href: "/performance", label: "Performance", icon: "Performance" },
      { href: "/messages", label: "Messages", icon: "Messages" },
    ],
    employee: [
      { href: "/employeehome", label: "Dashboard", icon: "Dashboard" },
      { href: "/mytasks", label: "My Tasks", icon: "My Tasks" },
      { href: "/attendance", label: "Attendance", icon: "Attendance" },
      { href: "/profile", label: "Profile", icon: "Profile" },
      { href: "/messages", label: "Messages", icon: "Messages" },
    ],
  };

  const roleLinks = links[role?.toLowerCase()] || [];

  return (
    <aside
      className={cn(
        "bg-black text-white shadow-xl transition-all duration-300 flex flex-col border-r border-black",
        isCollapsed ? "w-20" : "w-80"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-black flex items-center justify-between bg-black">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">MH Enterprises</h2>
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
          className="p-2 rounded-lg bg-black hover:bg-black border border-gray-800 text-white"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {roleLinks.map((link) => {
          const IconComponent = iconMap[link.icon];
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-black text-white border border-gray-800" 
                  : "text-gray-400 hover:bg-black hover:text-white border border-transparent",
                isCollapsed ? "p-3 justify-center" : "p-3"
              )}
              title={isCollapsed ? link.label : undefined}
            >
              {/* Active indicator */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
              )}
              
              {IconComponent && (
                <IconComponent 
                  size={20} 
                  className={cn(
                    "transition-transform duration-200",
                    isCollapsed ? "" : "mr-3",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )} 
                />
              )}
              
              {!isCollapsed && (
                <span className="font-medium text-sm">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info (when expanded) */}
      {!isCollapsed && session?.user && (
        <div className="p-4 border-t border-black bg-black">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-black border border-gray-800">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-sm border border-gray-700">
              {session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session.user.email || session.user.userId}
              </p>
              <p className="text-xs text-gray-300 font-medium capitalize">
                {role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}