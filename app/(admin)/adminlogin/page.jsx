"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/ThemeProvider";
import { toast, Toaster } from "sonner";

export default function AdminLoginPage() {
    const { theme } = useTheme();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.warning("Please enter both Email and Password.", {
                duration: 2000,
            });
            return;
        }

        setLoading(true);

        const res = await signIn("credentials", {
            redirect: false,
            identifier: email,
            password,
            role: "Admin",
        });

        setLoading(false);

        if (res?.error) {
            toast.error(res.error || "Login failed. Please try again.", {
                duration: 2000,
            });
        } else {
            toast.success("Welcome Admin 👋", {
                duration: 1500,
            });

            setTimeout(() => {
                router.push("/adminhome");
            }, 1200);
        }
    };

    return (
        <>
            <Toaster position="top-right" theme={theme === "dark" ? "dark" : "light"} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
                <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-800">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Admin Login
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Only authorized Admin access
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <LabelInputContainer>
                            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                            />
                        </LabelInputContainer>

                        <LabelInputContainer>
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                            />
                        </LabelInputContainer>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            {loading ? "Logging in..." : "Login"}
                            <BottomGradient />
                        </button>

                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                            Don’t have an account?{" "}
                            <a
                                href="/adminregister"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
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
    <div className={cn("flex w-full flex-col space-y-3", className)}>
        {children}
    </div>
);
