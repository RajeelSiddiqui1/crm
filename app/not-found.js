"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Home, Search, AlertTriangle, Shield, FileText, Users, Settings } from "lucide-react";

export default function NotFoundPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/admin/dashboard");
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin/dashboard");
    }
  };

  const quickLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: Home, color: "from-blue-500 to-blue-600" },
    { name: "Manager Tasks", path: "/admin/manager-tasks", icon: FileText, color: "from-green-500 to-emerald-600" },
    { name: "Managers", path: "/admin/managers", icon: Users, color: "from-purple-500 to-violet-600" },
    { name: "Settings", path: "/admin/settings", icon: Settings, color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header with Logo */}
        <div className="text-center mb-12">
          
          
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-2xl shadow-red-500/30 mb-6 relative">
            <AlertTriangle className="w-16 h-16 text-white" />
            <div className="absolute -top-2 -right-2 bg-white text-red-600 font-bold text-sm px-3 py-1 rounded-full shadow-lg">
              404
            </div>
          </div>
          
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4 leading-none">
            404
          </h1>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Page Not Found
          </h2>
          
          
        </div>

       

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        
          
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-900 hover:text-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-10 py-6 rounded-2xl font-bold text-lg w-full sm:w-auto"
            size="lg"
          >
            <Home className="w-6 h-6 mr-3" />
               Go Back to Previous Page
          </Button>
        </div>

        {/* Footer Note */}
       
      </div>
    </div>
  );
}