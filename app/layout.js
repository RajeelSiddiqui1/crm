"use client";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";
import { ThemeProvider } from "./ThemeProvider";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";

function LayoutContent({ children }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col">
        {/* Loader favicon */}
        <img
          src="/office/mhsolution.png"     // <-- favicon as loader icon
          alt="Loading..."
          className="w-20 h-20 animate-spin-slow mb-4"
        />
        <p className="text-gray-900 text-lg font-medium">Loading...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <Header />
          <main className="p-6 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  return <main className="min-h-screen">{children}</main>;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* ⬇️ Here you set favicon manually (works inside use client) */}
      <head>
        <link rel="icon" href="/favicon.ico" className="bg-white" sizes="any" />
          <title>MH Cricle Solution</title>

      </head>

      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
