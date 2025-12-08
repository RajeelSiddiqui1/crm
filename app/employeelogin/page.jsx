"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import { User, Lock, ArrowRight, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeLoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!userId || !password) {
      toast.warning("Please fill in all fields.", { duration: 2000 });
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      identifier: userId,
      password,
      role: "Employee",
    });

    setLoading(false);

    if (res?.error) {
      toast.error(res.error || "Login failed.", { duration: 2000 });
    } else {
      toast.success("Welcome Employee 👋", { duration: 1500 });
      router.push("/employee/home");
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Employee Login
            </h2>
            <p className="text-gray-600 mt-2">Access employee dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* User ID */}
            <LabelInputContainer>
              <Label htmlFor="userId" className="text-gray-700 font-medium text-sm">
                User ID
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="userId"
                  type="text"
                  placeholder="Enter your User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors duration-200"
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
                  className="pl-10 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors duration-200"
                />
              </div>
            </LabelInputContainer>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    Login as Employee
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
            </button>

            {/* Information message */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700 text-center">
                <span className="font-semibold">Note:</span> Employee accounts can only be created by Administrators or Managers.
                Please contact your system administrator for account access.
              </p>
            </div>


          </form>
        </div>
      </div>
    </>
  );
}

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);