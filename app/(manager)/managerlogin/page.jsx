"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/ThemeProvider";
import { toast, Toaster } from "sonner";

export default function ManagerLoginPage() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Please enter both Email and Password.", { duration: 2000 });
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: true,
      callbackUrl: "/dashboard/managerhome",
      identifier: email,
      password,
      role: "Manager",
    });
    setLoading(false);
    if (res?.error) toast.error(res.error || "Login failed.", { duration: 2000 });
    else toast.success("Welcome Manager 👋", { duration: 1500 });
  };

  return (
    <>
      <Toaster position="top-right" theme={theme === "dark" ? "dark" : "light"} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
        <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Login</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Only authorized Manager access</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <LabelInputContainer>
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
              <Input id="email" type="email" placeholder="manager@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </LabelInputContainer>
            <button type="submit" disabled={loading} className="group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
              {loading ? "Logging in..." : "Login"}
              <BottomGradient />
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
              Don’t have an account?{" "}
              <a href="/managerregister" className="text-blue-600 dark:text-blue-400 hover:underline">
                Register here
              </a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-0.5 block h-1.5 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-0.5 mx-auto block h-1 w-1/2 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-3", className)}>{children}</div>
);
