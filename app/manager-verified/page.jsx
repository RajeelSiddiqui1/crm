// app/manager-verified/page.js
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle, Mail, ArrowRight, RotateCw, Shield, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import axios from "axios";

function ManagerVerifiedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState("loading");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [resendCooldown, setResendCooldown] = useState(20);
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [fieldsDisabled, setFieldsDisabled] = useState(false); // New state for disabling fields

  useEffect(() => {
    const params = {
      success: searchParams.get('success'),
      error: searchParams.get('error'),
      email: searchParams.get('email')
    };

    if (params.email) setEmail(params.email);

    if (params.success === 'true') {
      setStatus("success");
    } else if (params.error) {
      setStatus(params.error);
      if (params.error === "account-locked") {
        setIsLocked(true);
        setFieldsDisabled(true);
      }
    } else {
      setStatus("pending");
    }

    // Timer for resend OTP (30 seconds)
    const resendTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timer for cooldown (5 minutes)
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(resendTimer);
      clearInterval(cooldownTimer);
    };
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/manager-verify', {
        email,
        otp
      });

      if (response.data.success) {
        setStatus("success");
        toast.success(response.data.message);
        setAttemptsLeft(4);
        setIsLocked(false);
        setFieldsDisabled(false);
      } else {
        if (response.data.isLocked) {
          setIsLocked(true);
          setFieldsDisabled(true); // Disable fields on lock
          setLockTime(response.data.lockTime || 5);
          setAttemptsLeft(0);
          toast.error(response.data.message);
        } else {
          setAttemptsLeft(response.data.attemptsLeft || 4);
          toast.error(`${response.data.message} (${response.data.attemptsLeft || 3} attempts left)`);
        }
      }
    } catch (error) {
      if (error.response?.status === 423) {
        setIsLocked(true);
        setFieldsDisabled(true); // Disable fields on lock
        setLockTime(error.response.data?.lockTime || 5);
        setAttemptsLeft(0);
        toast.error(error.response.data?.message || "Account locked");
      } else {
        toast.error(error.response?.data?.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendLoading || resendCooldown > 0) return;

    setResendLoading(true);
    try {
      const response = await axios.post('/api/auth/resend-otp', { email });
      
      if (response.data.success) {
        toast.success("New OTP sent to your email");
        setTimeLeft(30);
        setResendCooldown(300);
        setAttemptsLeft(4);
        setIsLocked(false);
        setFieldsDisabled(false); // Enable fields again
        setOtp(""); // Clear previous OTP
        
        // Show success message with instructions
        toast.info("Fields are now enabled. Enter the new OTP.");
      } else {
        if (response.data.cooldown) {
          toast.error(response.data.message);
          setResendCooldown(response.data.waitTime || 300);
        } else if (response.data.isLocked) {
          setIsLocked(true);
          setFieldsDisabled(true);
          toast.error(response.data.message);
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      if (error.response?.status === 429) {
        setResendCooldown(error.response.data?.waitTime || 300);
        toast.error(error.response.data?.message || "Please wait before requesting new OTP");
      } else if (error.response?.status === 423) {
        setIsLocked(true);
        setFieldsDisabled(true);
        toast.error(error.response.data?.message || "Account locked");
      } else {
        toast.error("Failed to resend OTP");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const renderLockedView = () => {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Account Locked</h2>
          <p className="text-gray-600 mt-2">
            Too many failed attempts
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Security Lock</h3>
              <p className="text-sm text-red-700 mt-1">
                After 4 incorrect OTP attempts, your account has been temporarily locked for security reasons.
              </p>
              <p className="text-sm text-red-700 mt-2">
                Click "Resend OTP" to unlock your account and receive a new verification code.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Disabled Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              readOnly
              className="w-full bg-gray-100 cursor-not-allowed"
              placeholder="manager@company.com"
            />
          </div>
          
          {/* Disabled OTP Field */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              OTP Code
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                value={otp}
                readOnly
                className="pl-10 text-center text-2xl tracking-widest font-mono bg-gray-100 cursor-not-allowed"
                placeholder="••••••"
              />
            </div>
          </div>
        </div>

        {/* Disabled Verify Button */}
        <Button
          disabled
          className="w-full h-12 bg-gray-400 cursor-not-allowed text-white"
        >
          <Lock className="mr-2 h-4 w-4" />
          Account Locked
        </Button>

        {/* Active Resend Button */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600 mb-3">
            Click below to receive a new OTP and unlock your account
          </p>
          <Button
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
          >
            {resendLoading ? (
              <>
                <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend OTP in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}`
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend OTP to Unlock
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            A new OTP will be sent to {email}
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (status) {
      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Verification Successful!</h2>
              <p className="text-gray-600 mt-2">Your account has been verified successfully.</p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/managerlogin')}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
              >
                Go to Manager Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
            </div>
          </div>
        );

      case "loading":
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-500 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your account.</p>
          </div>
        );

      case "account-locked":
        return renderLockedView();

      case "already-verified":
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Already Verified</h2>
              <p className="text-gray-600 mt-2">Your account is already verified.</p>
            </div>
            <Button
              onClick={() => router.push('/managerlogin')}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white"
            >
              Go to Login
            </Button>
          </div>
        );

      case "invalid-otp":
      case "otp-expired":
      case "not-found":
      case "missing-params":
      case "server-error":
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <XCircle className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Verification Failed</h2>
              <p className="text-gray-600 mt-2">
                {status === "invalid-otp" && "Invalid OTP code."}
                {status === "otp-expired" && "OTP has expired."}
                {status === "not-found" && "Account not found."}
                {status === "missing-params" && "Required parameters missing."}
                {status === "server-error" && "Server error occurred."}
              </p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => setStatus("pending")}
                className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/managerregister')}
                className="w-full h-12"
              >
                Register Again
              </Button>
            </div>
          </div>
        );

      default:
        // If fields are disabled, show locked view
        if (fieldsDisabled) {
          return renderLockedView();
        }

        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Verify Your Account</h2>
              <p className="text-gray-600 mt-2">
                Enter the 6-digit OTP sent to <span className="font-semibold">{email || "your email"}</span>
              </p>
              
              {/* Attempts counter */}
              {attemptsLeft < 4 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-amber-600">
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    placeholder="manager@company.com"
                    required
                    disabled={fieldsDisabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 text-center text-2xl tracking-widest font-mono"
                      placeholder="123456"
                      maxLength={6}
                      required
                      disabled={fieldsDisabled}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6 || fieldsDisabled}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">
                  Didn't receive OTP?
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading || timeLeft > 0 || resendCooldown > 0}
                  className="text-purple-600 hover:text-purple-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <>
                      <RotateCw className="w-3 h-3 mr-1 animate-spin inline" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend available in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}`
                  ) : timeLeft > 0 ? (
                    `Resend in ${timeLeft}s`
                  ) : (
                    "Resend OTP"
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Check your spam folder if you don't see the email
                </p>
              </div>
            </form>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 border border-gray-200">
        {renderContent()}
      </div>
    </div>
  );
}

export default function ManagerVerified() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ManagerVerifiedContent />
    </Suspense>
  );
}