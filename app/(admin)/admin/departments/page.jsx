"use client";
import { useState, useEffect, use } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  Image as ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Filter,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DepartmentsPage() {
  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }
  }, [session, router, status]);

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoBase64: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch departments with axios - FIXED VERSION
  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/admin/department");

      // Check if response.data is array or object with departments property
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data && Array.isArray(response.data.departments)) {
        setDepartments(response.data.departments);
      } else if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setDepartments(response.data.data);
      } else {
        console.error("Unexpected API response structure:", response.data);
        setDepartments([]);
        toast.error("Unexpected data format received");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    checkMobile();

    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logoBase64: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", description: "", logoBase64: "" });
    setEditingDept(null);
  };

  // Open modal for create/edit
  const openModal = (dept) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        description: dept.description || "",
        logoBase64: dept.logoUrl || "",
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => resetForm(), 300);
  };

  // Handle form submit with axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Client side validation
    if (!formData.name.trim()) {
      toast.error("Department name is required");
      setSubmitting(false);
      return;
    }

    if (formData.description && formData.description.length < 10) {
      toast.error("Description must be at least 10 characters long");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        logoBase64: formData.logoBase64,
      };

      if (editingDept) {
        // Update department
        await axios.put(`/api/admin/department/${editingDept._id}`, payload);
        toast.success("Department updated successfully!");
      } else {
        // Create department
        await axios.post("/api/admin/department", payload);
        toast.success("Department created successfully!");
      }

      await fetchDepartments();
      closeModal();
    } catch (error) {
      console.error("Error saving department:", error);
      const errorMessage =
        error.response?.data?.message || "Error saving department";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete with axios
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}" department?`))
      return;

    try {
      await axios.delete(`/api/admin/department/${id}`);
      toast.success("Department deleted successfully!");
      await fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      const errorMessage =
        error.response?.data?.message || "Error deleting department";
      toast.error(errorMessage);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Description", "Created Date", "Employees Count"];
    const csvData = filteredDepartments.map((dept) => [
      dept.name,
      dept.description || "No description",
      dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : "N/A",
      dept.employeeCount || "0",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "departments_export.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Departments data exported successfully");
  };

  // Filter departments based on search - SAFE VERSION
  const filteredDepartments = Array.isArray(departments)
    ? departments.filter(
      (dept) =>
        dept?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept?.description &&
          dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 md:mb-8">
          <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              Departments Management
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg">
              Manage all departments across your organization
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button
              onClick={exportToCSV}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              onClick={fetchDepartments}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            <Button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white shadow-lg transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
              size={isMobile ? "sm" : "default"}
            >
              <Plus className="h-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Department</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 md:mb-8 border-0 shadow-2xl shadow-green-500/10 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-700 text-white rounded-t-lg p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-white">
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search departments by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-sm md:text-base"
                />
              </div>
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="whitespace-nowrap bg-white text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Departments Grid */}
        <Card className="shadow-2xl shadow-green-500/10 border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100/50 p-4 md:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Departments
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm md:text-base">
                  {departments.length} department
                  {departments.length !== 1 ? "s" : ""} in your organization
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredDepartments.length} of {departments.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredDepartments.length === 0 ? (
              <div className="text-center py-12 md:py-16 px-4">
                <div className="text-gray-300 mb-3 md:mb-4">
                  <Building2 className="w-16 h-16 md:w-20 md:h-20 mx-auto" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                  {departments.length === 0
                    ? "No departments found"
                    : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm md:text-lg max-w-md mx-auto">
                  {departments.length === 0
                    ? "Get started by creating your first department."
                    : "Try adjusting your search terms to find what you're looking for."}
                </p>
                {departments.length === 0 && (
                  <Button
                    onClick={() => openModal()}
                    className="mt-4 bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Department
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredDepartments.map((dept) => (
                  <Card
                    key={dept._id}
                    className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group cursor-pointer bg-white/80 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {dept.logoUrl ? (
                            <img
                              src={dept.logoUrl}
                              alt={dept.name}
                              className="h-12 w-12 rounded-lg object-cover border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg text-gray-900 group-hover:text-green-700 transition-colors duration-200">
                              {dept.name}
                            </CardTitle>
                            <Badge
                              variant="secondary"
                              className="mt-1 bg-green-100 text-green-800 border-green-200"
                            >
                              {dept.createdAt
                                ? new Date(dept.createdAt).toLocaleDateString()
                                : "N/A"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(dept);
                            }}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(dept._id, dept.name);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {dept.description || "No description provided"}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Building2 className="w-3 h-3" />
                          <span>{dept.employeeCount || 0} employees</span>
                        </div>
                        <Button
                          onClick={() => router.push(`/admin/departments/${dept._id}`)}
                          size="sm"
                          variant="outline"
                          className="text-xs text-gray-900"
                        >
                          <FolderOpen className="w-3 h-3 mr-1 text-green-900" />
                          View Tasks
                        </Button>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                        >
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent mb-4">
                {editingDept ? "Edit Department" : "Create New Department"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Logo
                  </Label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors bg-gray-50 hover:bg-green-50/50">
                      {formData.logoBase64 ? (
                        <img
                          src={formData.logoBase64}
                          alt="Preview"
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">Upload Logo</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Name Field */}
                <LabelInputContainer>
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Department Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter department name"
                    required
                    className="focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </LabelInputContainer>

                {/* Description Field */}
                <LabelInputContainer>
                  <Label
                    htmlFor="description"
                    className="text-gray-700 font-medium"
                  >
                    Description{" "}
                    {formData.description &&
                      `(${formData.description.length}/10)`}
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter department description (minimum 10 characters)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white text-gray-900 resize-none"
                  />
                  {formData.description && formData.description.length < 10 && (
                    <p className="text-xs text-red-500 mt-1">
                      Description must be at least 10 characters long
                    </p>
                  )}
                </LabelInputContainer>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={submitting}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      !formData.name.trim() ||
                      (formData.description && formData.description.length < 10)
                    }
                    className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingDept ? "Updating..." : "Creating..."}
                      </>
                    ) : editingDept ? (
                      "Update Department"
                    ) : (
                      "Create Department"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-3", className)}>
      {children}
    </div>
  );
};
