"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import { Mail, Lock, Shield, Key, RotateCcw, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      toast.warning("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP sent to your email!");
        setResetStep(2);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.warning("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP verified successfully!");
        setResetStep(3);
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.warning("Please enter both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.warning("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error(data.message || "Password reset failed");
      }
    } catch (error) {
      toast.error("Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (resetStep > 1) {
      setResetStep(resetStep - 1);
    } else {
      router.push("/login");
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("New OTP sent to your email!");
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Error resending OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 border border-gray-200">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-gray-600 mt-2">
              {resetStep === 1 && "Enter your email to receive OTP"}
              {resetStep === 2 && "Enter the OTP sent to your email"}
              {resetStep === 3 && "Create your new password"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8 px-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                    resetStep >= step
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {resetStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    resetStep >= step ? "text-blue-600 font-medium" : "text-gray-400"
                  }`}
                >
                  {step === 1 ? "Email" : step === 2 ? "OTP" : "Password"}
                </span>
              </div>
            ))}
            <div className="absolute w-2/3 h-0.5 bg-gray-200 -translate-y-4 -z-10 mx-auto left-0 right-0"></div>
            <div
              className={`absolute h-0.5 bg-blue-600 -translate-y-4 -z-10 transition-all duration-300 ${
                resetStep === 1 ? "w-0" : resetStep === 2 ? "w-1/3" : "w-2/3"
              }`}
            ></div>
          </div>

          <form className="space-y-6">
            {/* Step 1: Email Input */}
            {resetStep === 1 && (
              <LabelInputContainer>
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </LabelInputContainer>
            )}

            {/* Step 2: OTP Input */}
            {resetStep === 2 && (
              <LabelInputContainer>
                <Label htmlFor="otp" className="text-gray-700 font-medium text-sm">
                  Enter OTP
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center tracking-widest font-mono"
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Didn't receive OTP?</span>
                  <Button
                    type="button"
                    variant="link"
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Resend OTP
                  </Button>
                </div>
              </LabelInputContainer>
            )}

            {/* Step 3: New Password */}
            {resetStep === 3 && (
              <>
                <LabelInputContainer>
                  <Label htmlFor="newPassword" className="text-gray-700 font-medium text-sm">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </LabelInputContainer>

                <LabelInputContainer>
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </LabelInputContainer>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                type="button"
                onClick={
                  resetStep === 1
                    ? handleSendOtp
                    : resetStep === 2
                    ? handleVerifyOtp
                    : handleResetPassword
                }
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {resetStep === 1 ? "Sending..." : resetStep === 2 ? "Verifying..." : "Resetting..."}
                  </>
                ) : (
                  <>
                    {resetStep === 1
                      ? "Send OTP"
                      : resetStep === 2
                      ? "Verify OTP"
                      : "Reset Password"}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Button
                variant="link"
                onClick={() => router.push("/login")}
                className="text-blue-600 font-semibold hover:text-blue-700 p-0 h-auto"
              >
                Back to Login
              </Button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);