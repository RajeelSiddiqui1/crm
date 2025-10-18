"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import { Mail, Lock, ArrowRight, Shield, User } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password || !role) {
      toast.warning("Please fill in all fields.", { duration: 2000 });
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false, // Handle redirect manually to catch errors
      identifier,
      password,
      role,
      callbackUrl: `/${role.toLowerCase()}home`, // Set desired redirect URL
    });
    setLoading(false);

    if (res?.error) {
      toast.error(res.error || "Login failed.", { duration: 2000 });
    } else if (res?.url) {
      toast.success(`Welcome ${role} 👋`, { duration: 1500 });
      window.location.href = `/${role.toLowerCase()}home`; // Manual redirect
    } else {
      toast.error("Unexpected error during login.", { duration: 2000 });
    }
  };

  // Function to determine if register link should be shown
  const shouldShowRegisterLink = () => {
    return role === "Admin" || role === "Manager";
  };

  // Function to get register link based on role
  const getRegisterLink = () => {
    if (role === "Admin") return "/adminregister";
    if (role === "Manager") return "/managerregister";
    return "#";
  };

  // Function to get register text based on role
  const getRegisterText = () => {
    if (role === "Admin") return "Admin Register";
    if (role === "Manager") return "Manager Register";
    return "Register";
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {role} Login
            </h2>
            <p className="text-gray-600 mt-2">Access your {role.toLowerCase()} dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <LabelInputContainer>
              <Label htmlFor="role" className="text-gray-700 font-medium text-sm">
                Role
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="pl-10 w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors duration-200"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="TeamLead">TeamLead</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </LabelInputContainer>

            {/* Identifier (Email or User ID) */}
            <LabelInputContainer>
              <Label htmlFor="identifier" className="text-gray-700 font-medium text-sm">
                {role === "Admin" || role === "Manager" ? "Email Address" : "User ID"}
              </Label>
              <div className="relative">
                {role === "Admin" || role === "Manager" ? (
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                ) : (
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
                <Input
                  id="identifier"
                  type={role === "Admin" || role === "Manager" ? "email" : "text"}
                  placeholder={
                    role === "Admin" || role === "Manager"
                      ? `${role.toLowerCase()}@company.com`
                      : `Enter your User ID`
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                />
              </div>
            </LabelInputContainer>

            {/* Password */}
            <LabelInputContainer>
              <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                />
              </div>
            </LabelInputContainer>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    Login to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
            </button>

            {/* Conditional Register Link - Only show for Admin and Manager */}
            {shouldShowRegisterLink() && (
              <p className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{" "}
                <a
                  href={getRegisterLink()}
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors duration-200"
                >
                  {getRegisterText()} here
                </a>
              </p>
            )}

            {/* Forgot Password Link */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Forgot your password?{" "}
              <a
                href="/forgot-password"
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors duration-200"
              >
                Reset here
              </a>
            </p>

            {/* Information message for TeamLead and Employee */}
            {!shouldShowRegisterLink() && (
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 text-center">
                  <span className="font-semibold">Note:</span> {role} accounts can only be created by Administrators.
                  Please contact your system administrator for account access.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);