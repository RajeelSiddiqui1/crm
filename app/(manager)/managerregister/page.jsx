"use client";
import React, { useState, useEffect } from "react";
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
    const [departments, setDepartments] = useState([]);
    const [fetchingDepartments, setFetchingDepartments] = useState(true);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        departments: [], // This will be mapped to depIds in the API call
    });

    // Fetch departments on component mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get("/api/admin/department");
                console.log("Departments API Response:", response.data); // Debug log
                
                if (response.status === 200) {
                    // Handle different possible response structures
                    const data = response.data;
                    
                    // Check various possible structures
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
                    console.log("Processed departments:", departmentsArray); // Debug log
                }

            } catch (error) {
                console.error("Error fetching departments:", error);
                toast.error("Failed to fetch departments");
                setDepartments([]); // Ensure it's always an array
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
            // Prepare data for API - map departments to depIds
            const apiData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                depIds: formData.departments // Map to the expected field name
            };

            const response = await axios.post("/api/auth/managerregister", apiData);

            if (response.status === 201) {
                toast.success("Manager registered successfully! Please log in to continue.");
                router.push("/managerlogin");
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
                            Manager Register
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
                                    required
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
                                    required
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
                                required
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
                                required
                                minLength={6}
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
                                required
                                minLength={6}
                            />
                        </LabelInputContainer>

                        <LabelInputContainer>
                            <Label className="text-gray-700 dark:text-gray-300">
                                Departments
                            </Label>
                            {fetchingDepartments ? (
                                <div className="text-sm text-gray-500">Loading departments...</div>
                            ) : !Array.isArray(departments) || departments.length === 0 ? (
                                <div className="text-sm text-gray-500">No departments available</div>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    {departments.map((dept) => (
                                        <div key={dept._id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`dept-${dept._id}`}
                                                checked={formData.departments.includes(dept._id)}
                                                onChange={() => handleDepartmentChange(dept._id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor={`dept-${dept._id}`}
                                                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                {dept.name || dept.departmentName || `Department ${dept._id}`}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </LabelInputContainer>

                        <button
                            disabled={loading || fetchingDepartments}
                            className={`group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
                                loading || fetchingDepartments ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                            type="submit"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                            <BottomGradient />
                        </button>

                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                            Already have an account?{" "}
                            <a href="/managerlogin" className="text-blue-600 dark:text-blue-400 hover:underline">
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