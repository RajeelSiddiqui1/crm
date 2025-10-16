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
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // ✅ Agar session hai → Sidebar + Header show
  if (session) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />

          {/* Main content */}
          <main className="p-6 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  // ❌ Agar session nahi hai → sirf children show (login/register pages)
  return <main className="min-h-screen">{children}</main>;
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body className="font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
