"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Home, Search, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl shadow-2xl shadow-red-500/30 mb-6">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Oops! The page you're looking for seems to have vanished into thin air.
            Don't worry, let's get you back on track.
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <CardTitle className="text-white text-3xl">MH Circle Solutions</CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Task Management System • Admin Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Search Instead?</h3>
                <p className="text-gray-600 text-sm">
                  Use the search bar at the top to find what you need
                </p>
              </div>
              
              <div className="text-center p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Home className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Return Home</h3>
                <p className="text-gray-600 text-sm">
                  Go back to the main dashboard
                </p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ArrowLeft className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Go Back</h3>
                <p className="text-gray-600 text-sm">
                  Return to your previous page
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl">
                <span className="text-gray-700 font-medium">You came from:</span>
                <span className="font-semibold text-blue-600">
                  {typeof window !== 'undefined' ? document.referrer || 'Direct Access' : 'Checking...'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl font-semibold text-lg"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
          
         
        </div>

      
      </div>
    </div>
  );
}