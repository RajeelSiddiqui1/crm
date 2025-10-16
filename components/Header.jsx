"use client";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
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
        const role = session?.user?.role?.toLowerCase();

        if (role === "admin") {
            await signOut({
                callbackUrl: "/adminlogin",
                redirect: true,
            });
        } else if (role === "manager") {
            await signOut({
                callbackUrl: "/managerlogin",
                redirect: true,
            });
        } else if (role === "teamlead") {
            await signOut({
                callbackUrl: "/teamleadlogin",
                redirect: true,
            });
        } else if (role === "employee") {
            await signOut({
                callbackUrl: "/employeelogin",
                redirect: true,
            });
        } else {
            await signOut({ redirect: false });
        }
    };

    // Get user initials for fallback
    const getUserInitials = (name) => {
        if (!name) return "U";
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="w-full bg-gray-800 text-gray-100 shadow-lg px-6 py-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
                {/* Left Section - Title */}
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white">CRM Dashboard</h1>
                </div>

                {/* Right Section - User Info */}
                <div className="flex items-center gap-4">
                    {session?.user && (
                        <div className="flex items-center gap-4">
                            {/* Role Display */}
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-200 border border-gray-600">
                                {session.user.role}
                            </span>

                            {/* User Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-12 w-12 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 p-0 overflow-hidden"
                                    >
                                        {session.user.image ? (
                                            <img
                                                src={session.user.image}
                                                alt="User Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                {getUserInitials(session.user.name)}
                                            </div>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-gray-100" align="end">
                                    <DropdownMenuLabel className="bg-gray-800">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium text-white">{session.user.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {session.user.email || session.user.userId}
                                            </p>
                                            <p className="text-xs text-blue-400 font-medium">
                                                {session.user.role}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem className="cursor-pointer bg-gray-800 text-gray-100 hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem
                                        className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-gray-700 focus:text-red-300 focus:bg-gray-700"
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