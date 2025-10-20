"use client";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
    const { data: session } = useSession();

    const handleLogout = async () => {
        await signOut({
            callbackUrl: "/login",
            redirect: true,
        });
    };

    // Get user initials for fallback
    const getUserInitials = () => {
        if (session?.user?.firstName && session?.user?.lastName) {
            return `${session.user.firstName.charAt(0)}${session.user.lastName.charAt(0)}`.toUpperCase();
        }
        if (session?.user?.name) {
            return session.user.name
                .split(' ')
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        if (session?.user?.email) {
            return session.user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    const getUserDisplayName = () => {
        if (session?.user?.firstName && session?.user?.lastName) {
            return `${session.user.firstName} ${session.user.lastName}`;
        }
        if (session?.user?.name) {
            return session.user.name;
        }
        if (session?.user?.email) {
            return session.user.email;
        }
        return "User";
    };

    const getUserEmailOrId = () => {
        return session?.user?.email || session?.user?.userId || "No email/ID";
    };

    return (
        <header className="w-full bg-black text-white shadow-lg px-6 py-4 border-b border-gray-900">
            <div className="flex justify-between items-center">
                {/* Left Section - Title */}
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white">CRM Dashboard</h1>
                </div>

                {/* Right Section - User Info */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-10 w-10 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                            3
                        </span>
                    </Button>

                    {session?.user && (
                        <div className="flex items-center gap-4">
                            {/* Role Display */}
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-gray-200 border border-gray-800">
                                {session.user.role}
                            </span>

                            {/* User Dropdown */}
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
                                            <p className="text-sm font-medium text-white">
                                                {getUserDisplayName()}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {getUserEmailOrId()}
                                            </p>
                                            <p className="text-xs text-gray-300 font-medium">
                                                {session.user.role}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-gray-800" />
                                    <DropdownMenuItem className="cursor-pointer bg-black text-gray-100 hover:bg-gray-900 focus:bg-gray-900">
                                        <User className="mr-2 h-4 w-4" />
                                       <a href="/profile"><span>Profile</span></a> 
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer bg-black text-gray-100 hover:bg-gray-900 focus:bg-gray-900">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
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