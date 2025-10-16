"use client";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Building2,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoBase64: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch departments with axios
  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/admin/department");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

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
        setFormData(prev => ({
          ...prev,
          logoBase64: reader.result
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
        logoBase64: dept.logoUrl || ""
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
        description: formData.description.trim() || "", // Empty string if no description
        logoBase64: formData.logoBase64
      };

      if (editingDept) {
        // Update department
        const response = await axios.put(`/api/admin/department/${editingDept._id}`, payload);
        toast.success("Department updated successfully!");
      } else {
        // Create department
        const response = await axios.post("/api/admin/department", payload);
        toast.success("Department created successfully!");
      }

      await fetchDepartments();
      closeModal();
    } catch (error) {
      console.error("Error saving department:", error);
      const errorMessage = error.response?.data?.message || "Error saving department";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete with axios
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}" department?`)) return;

    try {
      await axios.delete(`/api/admin/department/${id}`);
      toast.success("Department deleted successfully!");
      await fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      const errorMessage = error.response?.data?.message || "Error deleting department";
      toast.error(errorMessage);
    }
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-black p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Departments Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your organization departments efficiently
        </p>
      </div>

      {/* Actions Bar */}
      <Card className="mb-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>
            <Button 
              onClick={() => openModal()} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No departments found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first department"}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => openModal()} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <Card 
              key={dept._id} 
              className="border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {dept.logoUrl ? (
                      <img
                        src={dept.logoUrl}
                        alt={dept.name}
                        className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        {dept.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {new Date(dept.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(dept)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(dept._id, dept.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {dept.description || "No description provided"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingDept ? "Edit Department" : "Create New Department"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department Logo
                  </Label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-800">
                      {formData.logoBase64 ? (
                        <img
                          src={formData.logoBase64}
                          alt="Preview"
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">Upload Logo</p>
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
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                    Department Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter department name"
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                </LabelInputContainer>

                {/* Description Field */}
                <LabelInputContainer>
                  <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                    Description {formData.description && `(${formData.description.length}/10)`}
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter department description (minimum 10 characters)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    className="border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !formData.name.trim() || (formData.description && formData.description.length < 10)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingDept ? "Updating..." : "Creating..."}
                      </>
                    ) : editingDept ? "Update" : "Create"}
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