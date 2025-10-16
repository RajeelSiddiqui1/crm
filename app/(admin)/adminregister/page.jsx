"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import axios from "axios";

function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/adminresgiter", formData);

      if (response.status === 201) {
        toast.success("Admin registered successfully! Please log in to continue.");
        router.push("/adminlogin");
      } else {
        toast.warning("Something went wrong during registration.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
        <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Register
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <LabelInputContainer>
                <Label htmlFor="firstname" className="text-gray-700 dark:text-gray-300">
                  First Name
                </Label>
                <Input
                  id="firstname"
                  placeholder="Enter first name"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </LabelInputContainer>
              <LabelInputContainer>
                <Label htmlFor="lastname" className="text-gray-700 dark:text-gray-300">
                  Last Name
                </Label>
                <Input
                  id="lastname"
                  placeholder="Enter last name"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </LabelInputContainer>
            </div>

            <LabelInputContainer>
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                placeholder="Enter email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                placeholder="••••••••"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </LabelInputContainer>

            <button
              disabled={loading}
              className={`group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              type="submit"
            >
              {loading ? "Creating Account..." : "Create Account"}
              <BottomGradient />
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
              Already have an account?{" "}
              <a href="/adminlogin" className="text-blue-600 dark:text-blue-400 hover:underline">
                Login
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

export default RegisterPage;
