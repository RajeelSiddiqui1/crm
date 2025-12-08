"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Building, User, Mail, Lock, ArrowRight } from "lucide-react";

function RegisterPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [fetchingDepartments, setFetchingDepartments] = useState(true);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        departments: [],
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get("/api/admin/department");
                
                if (response.status === 200) {
                    const data = response.data;
                    
                    let departmentsArray = [];
                    
                    if (Array.isArray(data)) {
                        departmentsArray = data;
                    } else if (data.departments && Array.isArray(data.departments)) {
                        departmentsArray = data.departments;
                    } else if (data.data && Array.isArray(data.data)) {
                        departmentsArray = data.data;
                    } else if (Array.isArray(data.data?.departments)) {
                        departmentsArray = data.data.departments;
                    }
                    
                    setDepartments(departmentsArray);
                }

            } catch (error) {
                console.error("Error fetching departments:", error);
                toast.error("Failed to fetch departments");
                setDepartments([]);
            } finally {
                setFetchingDepartments(false);
            }
        };

        fetchDepartments();
    }, []);

    const handleDepartmentChange = (departmentId) => {
        setFormData(prev => {
            const isSelected = prev.departments.includes(departmentId);
            if (isSelected) {
                return {
                    ...prev,
                    departments: prev.departments.filter(id => id !== departmentId)
                };
            } else {
                return {
                    ...prev,
                    departments: [...prev.departments, departmentId]
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.departments.length === 0) {
            toast.error("Please select at least one department");
            setLoading(false);
            return;
        }

        try {
            const apiData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                depIds: formData.departments
            };

            const response = await axios.post("/api/auth/managerregister", apiData);

            if (response.status === 201) {
                toast.success("Manager registered successfully! Please log in to continue.");
                router.push("/manager-verified");
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
                <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 border border-gray-200">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <User className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Manager Registration
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Create your manager account
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <LabelInputContainer>
                                <Label htmlFor="firstname" className="text-gray-700 font-medium text-sm">
                                    First Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="firstname"
                                        placeholder="Enter first name"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        required
                                    />
                                </div>
                            </LabelInputContainer>
                            <LabelInputContainer>
                                <Label htmlFor="lastname" className="text-gray-700 font-medium text-sm">
                                    Last Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="lastname"
                                        placeholder="Enter last name"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        required
                                    />
                                </div>
                            </LabelInputContainer>
                        </div>

                        <LabelInputContainer>
                            <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    placeholder="manager@company.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>
                        </LabelInputContainer>

                        <LabelInputContainer>
                            <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                    minLength={6}
                                />
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
                                    placeholder="••••••••"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </LabelInputContainer>

                        <LabelInputContainer>
                            <Label className="text-gray-700 font-medium text-sm">
                                Assign Departments
                            </Label>
                            {fetchingDepartments ? (
                                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
                                    Loading departments...
                                </div>
                            ) : !Array.isArray(departments) || departments.length === 0 ? (
                                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
                                    No departments available
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                                    {departments.map((dept) => (
                                        <div key={dept._id} className="flex items-center p-2 rounded-lg hover:bg-white transition-colors duration-200">
                                            <input
                                                type="checkbox"
                                                id={`dept-${dept._id}`}
                                                checked={formData.departments.includes(dept._id)}
                                                onChange={() => handleDepartmentChange(dept._id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor={`dept-${dept._id}`}
                                                className="ml-3 text-sm text-gray-700 font-medium flex items-center"
                                            >
                                                <Building className="h-4 w-4 mr-2 text-blue-500" />
                                                {dept.name || dept.departmentName || `Department ${dept._id}`}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </LabelInputContainer>

                        <button
                            disabled={loading || fetchingDepartments}
                            className={`group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
                            type="submit"
                        >
                            <span className="flex items-center justify-center">
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </>
                                )}
                            </span>
                        </button>

                        <p className="text-center text-sm text-gray-600 mt-6">
                            Already have an account?{" "}
                            <a href="/managerlogin" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors duration-200">
                                Login here
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}

const LabelInputContainer = ({ children, className }) => (
    <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);

export default RegisterPage;