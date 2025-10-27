"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Save, User, Mail, Phone, MapPin, Calendar, Building, Upload, X, Download, QrCode, Video, VideoOff, Scan, FlipHorizontal } from "lucide-react";
import axios from "axios";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    profilePic: ""
  });
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarOption, setAvatarOption] = useState("avatar");
  const [avatars, setAvatars] = useState([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [customImage, setCustomImage] = useState(null);
  const [customImageFile, setCustomImageFile] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [useFrontCamera, setUseFrontCamera] = useState(true);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [qrData, setQrData] = useState("");

  // Simple QR Code Scanner without external library
  const handleManualScan = () => {
    if (!qrData.trim()) {
      toast.error("Please enter QR code data");
      return;
    }
    setScanning(true);
    toast.success("QR Code Processing...");
    
    setTimeout(() => {
      handleAttendanceScan(qrData);
    }, 1000);
  };

  const handleAttendanceScan = async (scannedData) => {
    if (!session?.user?.id || !session?.user?.role) {
      toast.error("User data not available.");
      return;
    }

    setAttendanceLoading(true);
    try {
      let employeeId = session.user.id;
      
      // Try to parse QR code data if it's a URL
      try {
        if (scannedData.includes('http')) {
          const parsed = new URL(scannedData);
          employeeId = parsed.searchParams.get("id") || session.user.id;
        }
      } catch (e) {
        // If parsing fails, use the scanned data directly or session user ID
        employeeId = scannedData || session.user.id;
      }

      const res = await axios.post("/api/attendance/mark", {
        employeeId,
      });

      if (res.data?.success) {
        setAttendanceStatus(res.data.status || "Present");
        toast.success(`Attendance marked as ${res.data.status}`);
        setCameraActive(false);
        setScanning(false);
        stopCamera();
      } else {
        toast.error(res.data.message || "Attendance already marked.");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError("");
    setScanResult("");
    setAttendanceStatus("");
    setScanning(false);
    
    // Check if browser supports media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera not supported in this browser.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: useFrontCamera ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      toast.success("Camera started! You can see yourself in the camera.");
    } catch (error) {
      console.error("Camera error:", error);
      if (error.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Failed to access camera. Please check your camera settings.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    setCameraActive(false);
    setScanning(false);
    setCameraError("");
  };

  const toggleCamera = () => {
    setUseFrontCamera(!useFrontCamera);
    if (cameraActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 500);
    }
  };

  // Test camera function
  const testCamera = async () => {
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const tracks = testStream.getTracks();
      tracks.forEach(track => track.stop());
      toast.success("Camera test successful!");
      return true;
    } catch (error) {
      console.error("Camera test failed:", error);
      toast.error("Camera test failed. Please check permissions.");
      return false;
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    fetchUserData();

    if (session.user?.id && session.user?.role) {
      fetchQRCode(session.user.id, session.user.role);
    }
  }, [session, status, router]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const fetchQRCode = async (userId, role) => {
    try {
      const response = await fetch(`/api/generateQR?id=${userId}&role=${role}`);
      const data = await response.json();
      if (data.qrImage) {
        setQrCode(data.qrImage);
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
    }
  };

  const fetchAvatars = async () => {
    try {
      setLoadingAvatars(true);
      const response = await axios.get("/api/avatars");

      if (response.status === 200) {
        setAvatars(response.data.avatars);
      }
    } catch (error) {
      console.error("Error fetching avatars:", error);
      const fallbackAvatars = [];
      for (let i = 1; i <= 12; i++) {
        fallbackAvatars.push(`https://avatar.iran.liara.run/public/${i}.png`);
      }
      setAvatars(fallbackAvatars);
    } finally {
      setLoadingAvatars(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/auth/profile`);
      if (response.status === 200) {
        const user = response.data.user;
        setUserData(user);
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          profilePic: user.profilePic || ""
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await axios.put("/api/auth/profile", formData);

      if (response.status === 200) {
        toast.success("Profile updated successfully!");

        await update({
          ...session,
          user: {
            ...session.user,
            ...formData,
            name: `${formData.firstName} ${formData.lastName}`
          }
        });

        fetchUserData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl) => {
    try {
      const updatedFormData = { ...formData, profilePic: avatarUrl };
      const response = await axios.put("/api/auth/profile", updatedFormData);

      if (response.status === 200) {
        setFormData(updatedFormData);
        setShowAvatarSelector(false);
        toast.success("Profile picture updated!");

        await update({
          ...session,
          user: {
            ...session.user,
            profilePic: avatarUrl
          }
        });

        fetchUserData();
      }
    } catch (error) {
      toast.error("Failed to update profile picture");
    }
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setCustomImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomImageSave = async () => {
    if (!customImageFile) {
      toast.error("Please select an image first");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profileImage', customImageFile);

      const response = await axios.post('/api/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        const imageUrl = response.data.imageUrl;
        await handleAvatarSelect(imageUrl);
        setCustomImage(null);
        setCustomImageFile(null);
      }
    } catch (error) {
      toast.error("Failed to upload custom image");
    }
  };

  const handleDownloadPDF = async () => {
    const userId = userData?._id || session?.user?.id;
    const userRole = userData?.role || session?.user?.role;

    if (!userId || !userRole) {
      toast.error("User data not available for PDF generation");
      return;
    }

    try {
      const res = await fetch(`/api/generateCardPDF?id=${userId}&role=${userRole}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${userData?.firstName || 'user'}_${userRole}_MN_Enterprises_Card.pdf`;
      link.click();
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error(error.message || "Failed to download PDF");
    }
  };

  const openAvatarSelector = () => {
    setShowAvatarSelector(true);
    setAvatarOption("avatar");
    fetchAvatars();
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Admin: "bg-red-500/10 text-red-700 border-red-200",
      Manager: "bg-blue-500/10 text-blue-700 border-blue-200",
      TeamLead: "bg-green-500/10 text-green-700 border-green-200",
      Employee: "bg-purple-500/10 text-purple-700 border-purple-200"
    };
    return colors[role] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  const getRoleGradient = (role) => {
    const gradients = {
      Admin: "from-red-500 to-red-600",
      Manager: "from-blue-500 to-blue-600",
      TeamLead: "from-green-500 to-green-600",
      Employee: "from-purple-500 to-purple-600"
    };
    return gradients[role] || "from-gray-500 to-gray-600";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2 sm:mt-3 text-base sm:text-lg">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl shadow-green-500/10 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-2xl shadow-green-500/20">
                      <AvatarImage
                        src={userData?.profilePic || formData.profilePic}
                        alt={`${userData?.firstName} ${userData?.lastName}`}
                        className="object-cover"
                      />
                      <AvatarFallback className={`bg-gradient-to-r ${getRoleGradient(session.user.role)} text-white text-xl sm:text-2xl font-bold`}>
                        {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg"
                      onClick={openAvatarSelector}
                    >
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  {showAvatarSelector && (
                    <div className="mb-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Choose Profile Picture</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => setShowAvatarSelector(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          variant={avatarOption === "avatar" ? "default" : "outline"}
                          className={`flex-1 text-xs ${avatarOption === "avatar" ? "bg-green-600 text-white" : "text-black"}`}
                          onClick={() => setAvatarOption("avatar")}
                        >
                          Avatar
                        </Button>
                        <Button
                          type="button"
                          variant={avatarOption === "custom" ? "default" : "outline"}
                          className={`flex-1 text-xs ${avatarOption === "custom" ? "bg-blue-600 text-white" : "text-black"}`}
                          onClick={() => setAvatarOption("custom")}
                        >
                          Custom
                        </Button>
                      </div>

                      {avatarOption === "avatar" && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-2">Select from Avatars</h4>
                          {loadingAvatars ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-1 sm:gap-2 max-h-48 overflow-y-auto">
                              {avatars.map((avatar, index) => (
                                <button
                                  key={index}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-green-500 transition-all duration-200 focus:border-green-500 focus:outline-none"
                                  onClick={() => handleAvatarSelect(avatar)}
                                >
                                  <img
                                    src={avatar}
                                    alt={`Avatar ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {avatarOption === "custom" && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-2">Upload Custom Image</h4>
                          <div className="space-y-3">
                            {customImage ? (
                              <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-500 mb-2">
                                  <img
                                    src={customImage}
                                    alt="Custom preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="text-xs bg-green-600 hover:bg-green-700"
                                    onClick={handleCustomImageSave}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      setCustomImage(null);
                                      setCustomImageFile(null);
                                    }}
                                  >
                                    Change
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Click to upload</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleCustomImageUpload}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {userData?.firstName} {userData?.lastName}
                  </h2>
                  <Badge className={`mt-2 ${getRoleBadgeColor(session.user.role)} font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm`}>
                    {session.user.role}
                  </Badge>

                  <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-left">
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{userData?.email}</span>
                    </div>
                    {userData?.phone && (
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                        <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{userData.phone}</span>
                      </div>
                    )}
                    {userData?.userId && (
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                        <User className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-mono truncate">{userData.userId}</span>
                      </div>
                    )}
                    {userData?.depId && (
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                        <Building className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">Dept: {userData.depId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">
                        Joined {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {qrCode && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Your QR Code</h3>
                      <div className="flex flex-col items-center">
                        <img
                          src={qrCode}
                          alt="QR Code"
                          className="w-32 h-32 border-2 border-gray-300 p-2 rounded-lg bg-white shadow-sm"
                        />
                        <Button
                          onClick={handleDownloadPDF}
                          className="mt-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/25 px-4 py-2 text-xs"
                        >
                          <Download className="w-3 h-3 mr-2" />
                          Download Profile Card
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Profile Form */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-1 bg-gradient-to-r from-green-50 to-blue-50 p-1 h-auto">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 py-2 sm:py-3 text-xs sm:text-sm"
                >
                  Profile Information
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="border-0 shadow-xl shadow-green-500/10 bg-white/70 backdrop-blur-sm">
                  <CardHeader className={`bg-gradient-to-r from-green-600 to-blue-700 text-white rounded-t-lg py-4 sm:py-6`}>
                    <CardTitle className="text-white text-lg sm:text-xl">Personal Information</CardTitle>
                    <CardDescription className="text-green-100 text-sm sm:text-base">
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 sm:pt-6">
                    <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="firstName" className="text-gray-700 font-semibold text-sm">
                            First Name *
                          </Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="focus:border-green-500 focus:ring-2 focus:ring-green-200 h-10 sm:h-11"
                            required
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="lastName" className="text-gray-700 font-semibold text-sm">
                            Last Name *
                          </Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="focus:border-green-500 focus:ring-2 focus:ring-green-200 h-10 sm:h-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="focus:border-green-500 focus:ring-2 focus:ring-green-200 h-10 sm:h-11"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="focus:border-green-500 focus:ring-2 focus:ring-green-200 h-10 sm:h-11"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <Label htmlFor="address" className="text-gray-700 font-semibold text-sm">
                          Address
                        </Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="focus:border-green-500 focus:ring-2 focus:ring-green-200 h-10 sm:h-11"
                          placeholder="Enter your address"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={updating}
                        className={`w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white shadow-lg shadow-green-500/25 px-6 py-2 sm:py-2.5`}
                      >
                        {updating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </form>
                    <Button
                      onClick={() => {
                        setShowAttendanceModal(true);
                        startCamera();
                      }}
                      className="mt-3 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-lg px-4 py-2 text-xs sm:text-sm w-full"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan QR for Attendance
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 shadow-xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Mark Attendance - QR Scanner
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAttendanceModal(false);
                  stopCamera();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4">
              {attendanceStatus ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 mb-2 text-lg font-semibold">
                    Attendance Marked Successfully!
                  </p>
                  <p className="text-gray-600 mb-4">
                    Status: <span className="font-bold text-green-600">{attendanceStatus}</span>
                  </p>
                  <Button
                    onClick={() => {
                      setShowAttendanceModal(false);
                      setAttendanceStatus("");
                      setScanResult("");
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  {/* Camera Status */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {cameraActive ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-600 font-medium">
                            {useFrontCamera ? "Front Camera Live" : "Back Camera Live"}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-500">Camera Off</span>
                        </>
                      )}
                    </div>
                    
                    <Button
                      onClick={toggleCamera}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                    >
                      <FlipHorizontal className="w-3 h-3 mr-1" />
                      Switch Camera
                    </Button>
                  </div>

                  {/* Simple Camera View */}
                  <div className="w-full max-w-xs relative">
                    {cameraActive ? (
                      <div className="relative rounded-lg overflow-hidden border-2 border-green-500 shadow-lg bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-64 object-cover"
                          style={{
                            transform: useFrontCamera ? 'scaleX(-1)' : 'scaleX(1)'
                          }}
                        />
                        
                        {/* Scanning Guide */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-48 border-2 border-green-400 border-dashed rounded-lg"></div>
                        </div>
                        
                        {/* Center Guide */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-32 h-32 border-2 border-white rounded-lg">
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                          </div>
                        </div>

                        {/* Manual QR Input */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/70 p-2 rounded">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Or enter QR code manually"
                              value={qrData}
                              onChange={(e) => setQrData(e.target.value)}
                              className="flex-1 text-white bg-gray-800 border-gray-600"
                              onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                            />
                            <Button
                              onClick={handleManualScan}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={!qrData.trim()}
                            >
                              <Scan className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                        <VideoOff className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 text-center text-sm mb-2">
                          Camera is not active
                        </p>
                        {cameraError && (
                          <p className="text-red-500 text-xs text-center max-w-xs mb-3">
                            {cameraError}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={startCamera}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Start Camera
                          </Button>
                          <Button
                            onClick={testCamera}
                            variant="outline"
                            size="sm"
                          >
                            Test Camera
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="text-center w-full max-w-xs">
                    <p className="text-sm text-gray-600 mb-4">
                      {cameraActive 
                        ? "✓ Camera is working! Point QR code at the camera or enter manually below"
                        : "Click 'Start Camera' to begin scanning"
                      }
                    </p>
                    
                    {attendanceLoading && (
                      <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing attendance...</span>
                      </div>
                    )}

                    <div className="flex gap-2 w-full">
                      {cameraActive ? (
                        <Button
                          onClick={stopCamera}
                          variant="outline"
                          className="flex-1"
                        >
                          <VideoOff className="w-4 h-4 mr-2" />
                          Stop Camera
                        </Button>
                      ) : (
                        <Button
                          onClick={startCamera}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Start Camera
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowAttendanceModal(false);
                          stopCamera();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 text-left">
                        <strong>How to use:</strong><br/>
                        1. Start camera and allow permissions<br/>
                        2. Point QR code at the camera view<br/>
                        3. Or enter QR code data manually in the input field below camera<br/>
                        4. Click scan button to mark attendance
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}