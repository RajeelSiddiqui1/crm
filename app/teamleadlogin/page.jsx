"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import { User, Lock, ArrowRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TeamLeadLoginPage() {
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
      role: "TeamLead",
    });

    setLoading(false);

    if (res?.error) {
      toast.error(res.error || "Login failed.", { duration: 2000 });
    } else {
      toast.success("Welcome Team Lead 👋", { duration: 1500 });
      router.push("/teamlead/home");
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center p-4">
        <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Team Lead Login
            </h2>
            <p className="text-gray-600 mt-2">Access team lead dashboard</p>
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
                  className="pl-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors duration-200"
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
                  className="pl-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors duration-200"
                />
              </div>
            </LabelInputContainer>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    Login as Team Lead
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
            </button>

            {/* Information message */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-purple-700 text-center">
                <span className="font-semibold">Note:</span> Team Lead accounts can only be created by Administrators or Managers.
                Please contact your system administrator for account access.
              </p>
            </div>

           <div className="text-center pt-4 border-t">
                         <p className="text-sm text-gray-600">
                           forget password?{" "}
                           <Link 
                             href="/forgot-password" 
                             className="text-blue-600 hover:text-blue-700 font-medium"
                           >
                            click here
                           </Link>
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