"use client";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Bell, Shield, Briefcase, Users, LogIn } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const [count, setCount] = useState(0);

    // 1️⃣ Get role-specific login page
    const getRoleLoginLink = () => {
        if (!session?.user?.role) return "/adminlogin"; // fallback
        const roleLinks = {
            Admin: "/adminlogin",
            Manager: "/managerlogin",
            TeamLead: "/teamleadlogin",
            Employee: "/employeelogin",
        };
        return roleLinks[session.user.role];
    };

    // 2️⃣ Logout handler → redirect to role login page
    const handleLogout = async () => {
        const loginLink = getRoleLoginLink();
        await signOut({
            callbackUrl: loginLink,
            redirect: true,
        });
    };

    // Notifications
    const fetchNotifications = async () => {
        try {
            const res = await axios.get("/api/notifications");
            if (res.data.success) setCount(res.data.unseenCount);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleNotificationClick = async () => {
        try {
            await axios.patch("/api/notifications/seen");
            setCount(0);
            router.push("/notifications");
        } catch (error) {
            console.error(error);
            router.push("/notifications");
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    // User initials
    const getUserInitials = () => {
        if (session?.user?.firstName && session?.user?.lastName) {
            return `${session.user.firstName[0]}${session.user.lastName[0]}`.toUpperCase();
        }
        if (session?.user?.name) {
            return session.user.name
                .split(" ")
                .map(w => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (session?.user?.email) return session.user.email[0].toUpperCase();
        return "U";
    };

    // Role icon
    const getRoleIcon = () => {
        if (!session?.user?.role) return <LogIn className="w-4 h-4 mr-2" />;
        const roleIcons = {
            Admin: <Shield className="w-4 h-4 mr-2" />,
            Manager: <Users className="w-4 h-4 mr-2" />,
            TeamLead: <Briefcase className="w-4 h-4 mr-2" />,
            Employee: <User className="w-4 h-4 mr-2" />,
        };
        return roleIcons[session.user.role] || <LogIn className="w-4 h-4 mr-2" />;
    };

    // Role badge display
    const getRoleDisplay = () => {
        if (!session?.user?.role) return "Guest";
        const roleColors = {
            Admin: "bg-red-900/30 text-red-300 border-red-800",
            Manager: "bg-green-900/30 text-green-300 border-green-800",
            TeamLead: "bg-purple-900/30 text-purple-300 border-purple-800",
            Employee: "bg-amber-900/30 text-amber-300 border-amber-800",
        };
        const colorClass = roleColors[session.user.role] || "bg-gray-900 text-gray-300 border-gray-800";
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}>
                {getRoleIcon()}
                {session.user.role}
            </span>
        );
    };

    return (
        <header className="w-full bg-black text-white shadow-lg px-6 py-4 border-b border-gray-900">
            <div className="flex justify-between items-center">
                {/* Left */}
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">CRM Dashboard</h1>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <Button
                        onClick={handleNotificationClick}
                        variant="ghost"
                        size="icon"
                        className="relative h-10 w-10 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white"
                    >
                        <Bell className="w-5 h-5" />
                        {count > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {count > 99 ? "99+" : count}
                            </span>
                        )}
                    </Button>

                    {/* User Dropdown */}
                    {session?.user && (
                        <div className="flex items-center gap-4">
                            {getRoleDisplay()}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-12 w-12 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 p-0 overflow-hidden"
                                    >
                                        {session.user.profilePic ? (
                                            <img
                                                src={session.user.profilePic}
                                                alt="User Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-lg border border-gray-700">
                                                {getUserInitials()}
                                            </div>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-56 bg-black border-gray-800 text-white" align="end">
                                    <DropdownMenuLabel className="bg-black">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium text-white">{session.user.name}</p>
                                            <p className="text-xs text-gray-400">{session.user.email}</p>
                                            <div className="flex items-center">
                                                {getRoleIcon()}
                                                <p className="text-xs text-gray-300 font-medium">{session.user.role}</p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator className="bg-gray-800" />

                                    <DropdownMenuItem className="cursor-pointer bg-black text-gray-100 hover:bg-gray-900 focus:bg-gray-900">
                                        <User className="mr-2 h-4 w-4" />
                                        <Link href="/profile">
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-gray-800" />

                                    <DropdownMenuItem
                                        className="cursor-pointer text-red-500 hover:text-red-400 hover:bg-gray-900 focus:text-red-400"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
