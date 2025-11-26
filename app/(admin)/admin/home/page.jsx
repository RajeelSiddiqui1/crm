"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Admin") {
      router.push("/login");
    }
  }, [session, status, router]);

  const handleLogout = async () => {
    // You can implement logout logic here
    router.push("/login");
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Centered Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          {/* Welcome Message */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent mb-4">
            Welcome
          </h1>
          
          {/* Profile Picture */}
          {session?.user?.profilePic ? (
            <div className="flex justify-center mb-4">
              <img 
                src={session.user.profilePic} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                {session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}
              </div>
            </div>
          )}
          
          {/* User Name */}
          <p className="text-gray-700 text-lg mb-2">
            <span className="font-semibold">
              {session?.user?.firstName} {session?.user?.lastName}
            </span>
          </p>
          
          {/* Role */}
          <p className="text-gray-500 text-sm mb-6">
            {session?.user?.role}
          </p>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}