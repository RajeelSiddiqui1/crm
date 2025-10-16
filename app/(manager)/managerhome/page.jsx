"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Manager Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome, {session?.user?.name}!
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Users</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">150</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100">Revenue</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-300">$12,500</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Projects</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">24</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}