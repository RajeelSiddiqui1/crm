"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Save,
    Trash2,
    Edit,
    Calendar,
    Clock,
    Loader2,
    AlertCircle,
    Users,
    UserRound,
    Phone,
    Target,
    Eye,
    Pencil,
    CheckCircle,
    XCircle
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

export default function EditSubtaskPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const subtaskId = params.id;

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [fetchingEmployees, setFetchingEmployees] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [subtask, setSubtask] = useState(null);
    const [originalSubtask, setOriginalSubtask] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        priority: "medium",
        leadsRequired: "1" // Default to 1
    });

    const [selectedEmployees, setSelectedEmployees] = useState([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "TeamLead") {
            router.push("/teamleadlogin");
            return;
        }

        fetchSubtask();
        fetchEmployees();
    }, [session, status, router]);

    const fetchSubtask = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/teamlead/subtasks/${subtaskId}`);
            
            if (response.status === 200) {
                const subtaskData = response.data.subtask;
                setSubtask(subtaskData);
                setOriginalSubtask(subtaskData);
                
                // Format dates for input fields
                const formattedStartDate = format(new Date(subtaskData.startDate), 'yyyy-MM-dd');
                const formattedEndDate = format(new Date(subtaskData.endDate), 'yyyy-MM-dd');
                const formattedStartTime = subtaskData.startTime ? subtaskData.startTime.substring(0, 5) : "09:00";
                const formattedEndTime = subtaskData.endTime ? subtaskData.endTime.substring(0, 5) : "17:00";

                // Use lead field for leadsRequired
                const leadsRequired = subtaskData.lead || "1";

                setFormData({
                    title: subtaskData.title || "",
                    description: subtaskData.description || "",
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    startTime: formattedStartTime,
                    endTime: formattedEndTime,
                    priority: subtaskData.priority || "medium",
                    leadsRequired: leadsRequired
                });

                // Set already assigned employees
                if (subtaskData.assignedEmployees) {
                    const assignedIds = subtaskData.assignedEmployees.map(emp => 
                        emp.employeeId?._id?.toString() || emp.employeeId.toString()
                    );
                    setSelectedEmployees(assignedIds);
                }
            }
        } catch (error) {
            console.error("Error fetching subtask:", error);
            toast.error("Failed to load subtask details");
            router.push('/teamlead/subtasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            setFetchingEmployees(true);
            const response = await axios.get('/api/teamlead/employees');
            
            if (response.status === 200) {
                setEmployees(response.data.employees || response.data || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("Failed to load employees");
        } finally {
            setFetchingEmployees(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEmployeeSelect = (employeeId) => {
        if (employeeId && !selectedEmployees.includes(employeeId)) {
            setSelectedEmployees([...selectedEmployees, employeeId]);
        }
    };

    const removeEmployee = (employeeId) => {
        setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    };

    const getSelectedEmployeeDetails = (employeeId) => {
        const employee = employees.find(emp => emp._id === employeeId);
        if (!employee) return null;
        
        return {
            _id: employee._id,
            email: employee.email || "",
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim()
        };
    };

    const getEmployeeProgress = (employeeId) => {
        if (!subtask?.assignedEmployees) return { completed: 0, assigned: 0, status: 'pending' };
        
        const assignment = subtask.assignedEmployees.find(emp => {
            const empId = emp.employeeId?._id?.toString() || emp.employeeId.toString();
            return empId === employeeId;
        });
        
        return {
            completed: assignment?.leadsCompleted || 0,
            assigned: assignment?.leadsAssigned || 0,
            status: assignment?.status || 'pending'
        };
    };

    const hasChanges = () => {
        if (!originalSubtask) return false;
        
        // Compare original with current form data
        const originalLeads = originalSubtask.lead || "1";
        const originalEmployees = originalSubtask.assignedEmployees?.map(emp => 
            emp.employeeId?._id?.toString() || emp.employeeId.toString()
        ) || [];

        // Check if leads changed
        if (formData.leadsRequired !== originalLeads) return true;
        
        // Check if employees changed
        if (JSON.stringify(selectedEmployees.sort()) !== JSON.stringify(originalEmployees.sort())) {
            return true;
        }

        // Check other fields
        const originalFormattedStartDate = format(new Date(originalSubtask.startDate), 'yyyy-MM-dd');
        const originalFormattedEndDate = format(new Date(originalSubtask.endDate), 'yyyy-MM-dd');
        const originalStartTime = originalSubtask.startTime ? originalSubtask.startTime.substring(0, 5) : "09:00";
        const originalEndTime = originalSubtask.endTime ? originalSubtask.endTime.substring(0, 5) : "17:00";

        const changedFields = [
            ['title', originalSubtask.title],
            ['description', originalSubtask.description],
            ['startDate', originalFormattedStartDate],
            ['endDate', originalFormattedEndDate],
            ['startTime', originalStartTime],
            ['endTime', originalEndTime],
            ['priority', originalSubtask.priority]
        ];

        for (const [field, originalValue] of changedFields) {
            if (formData[field] !== originalValue) return true;
        }

        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) {
            toast.error("Please wait, submission in progress...");
            return;
        }

        // Basic validation
        if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || 
            !formData.startTime || !formData.endTime || !formData.leadsRequired) {
            toast.error("Please fill all required fields");
            return;
        }

        // Leads validation
        const leadsRequired = parseInt(formData.leadsRequired);
        if (leadsRequired <= 0) {
            toast.error("Please enter a valid number of leads (greater than 0)");
            return;
        }

        // Date validation
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
        
        if (startDateTime >= endDateTime) {
            toast.error("End date/time must be after start date/time");
            return;
        }

        // Employee validation
        if (selectedEmployees.length === 0) {
            toast.error("Please select at least one employee");
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare assigned employees data
            const assignedEmployees = selectedEmployees.map(empId => {
                const employee = getSelectedEmployeeDetails(empId);
                const existingAssignment = subtask?.assignedEmployees?.find(emp => {
                    const existingEmpId = emp.employeeId?._id?.toString() || emp.employeeId.toString();
                    return existingEmpId === empId;
                });
                
                return {
                    employeeId: empId,
                    email: employee?.email || '',
                    name: employee?.name || '',
                    status: existingAssignment?.status || 'pending',
                    leadsCompleted: existingAssignment?.leadsCompleted || 0,
                    leadsAssigned: Math.ceil(parseInt(formData.leadsRequired) / selectedEmployees.length)
                };
            });

            const subtaskData = {
                ...formData,
                teamLeadId: session.user.id,
                teamLeadName: session.user.name || `${session.user.firstName} ${session.user.lastName}`,
                assignedEmployees: assignedEmployees,
                totalLeadsRequired: parseInt(formData.leadsRequired),
                leadsRequired: formData.leadsRequired, // This will be stored in lead field
                leadsCompleted: subtask?.leadsCompleted || 0
            };

            console.log("Updating subtask with data:", subtaskData);

            const response = await axios.put(`/api/teamlead/subtasks/${subtaskId}`, subtaskData);

            if (response.status === 200) {
                toast.success("Subtask updated successfully!");
                setTimeout(() => {
                    router.push('/teamlead/subtasks');
                }, 1000);
            }
        } catch (error) {
            console.error("Error updating subtask:", error);
            if (error.response?.status === 409) {
                toast.error("Subtask with this title already exists");
            } else {
                toast.error(error.response?.data?.error || "Failed to update subtask");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            const response = await axios.delete(`/api/teamlead/subtasks/${subtaskId}`);
            
            if (response.status === 200) {
                toast.success("Subtask deleted successfully!");
                setTimeout(() => {
                    router.push('/teamlead/subtasks');
                }, 1000);
            }
        } catch (error) {
            console.error("Error deleting subtask:", error);
            toast.error(error.response?.data?.error || "Failed to delete subtask");
            setIsDeleting(false);
        }
    };

    const leadsRequired = parseInt(formData.leadsRequired) || 1;
    const selectedCount = selectedEmployees.length;
    const leadsPerEmployee = selectedCount > 0 ? Math.ceil(leadsRequired / selectedCount) : 0;

    const getEmployeeDisplayName = (employeeId) => {
        const employee = getSelectedEmployeeDetails(employeeId);
        if (!employee) {
            // Try to find in existing subtask assignments
            const existingAssignment = subtask?.assignedEmployees?.find(emp => {
                const existingEmpId = emp.employeeId?._id?.toString() || emp.employeeId.toString();
                return existingEmpId === employeeId;
            });
            if (existingAssignment) {
                return existingAssignment.name || "Unknown Employee";
            }
            return "Unknown Employee";
        }
        return employee.name;
    };

    const getEmployeeEmail = (employeeId) => {
        const employee = getSelectedEmployeeDetails(employeeId);
        if (!employee) {
            const existingAssignment = subtask?.assignedEmployees?.find(emp => {
                const existingEmpId = emp.employeeId?._id?.toString() || emp.employeeId.toString();
                return existingEmpId === employeeId;
            });
            return existingAssignment?.email || "";
        }
        return employee.email;
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-900">Loading...</span>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "TeamLead") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You need to be logged in as TeamLead to access this page.</p>
                </div>
            </div>
        );
    }

    if (!subtask) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Subtask Not Found</h2>
                    <Button onClick={() => router.push('/teamlead/subtasks')}>
                        Go Back to Subtasks
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                Edit Subtask
                            </h1>
                            <p className="text-gray-800 mt-2">
                                Update subtask details and assignments
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/teamlead/subtask-employee/view/${subtaskId}`)}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                        </Button>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 mr-2" />
                                    )}
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader className="text-gray-900">
                                    <AlertDialogTitle >Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the subtask
                                        and remove all associated data including employee assignments.
                                        All assigned employees will be notified.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting} className="text-gray-900">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            "Delete Subtask"
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Edit Subtask
                                </CardTitle>
                                <CardDescription className="text-gray-700">
                                    Update the details below
                                </CardDescription>
                            </div>
                            {hasChanges() && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    <Pencil className="w-3 h-3 mr-1" />
                                    Unsaved Changes
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-gray-800 font-semibold">
                                    Title *
                                </Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder="Enter subtask title"
                                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-gray-800 font-semibold">
                                    Description *
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Enter detailed description of the subtask"
                                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 min-h-[120px]"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Leads Required Field */}
                            <div className="space-y-2">
                                <Label htmlFor="leadsRequired" className="text-gray-800 font-semibold">
                                    Number of Leads Required *
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="leadsRequired"
                                        type="number"
                                        min="1"
                                        max="10000"
                                        value={formData.leadsRequired}
                                        onChange={(e) => handleInputChange('leadsRequired', e.target.value)}
                                        placeholder="Enter number of leads/calls/targets"
                                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        Total leads target
                                    </span>
                                    <span className={`font-medium ${leadsRequired > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {leadsRequired} lead{leadsRequired !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Current completion: {subtask.leadsCompleted || 0} / {subtask.totalLeadsRequired || leadsRequired} leads
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-gray-800 font-semibold">
                                        Assign Employees *
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {selectedEmployees.length} selected
                                        </Badge>
                                        {selectedEmployees.length !== (subtask.assignedEmployees?.length || 0) && (
                                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                Changes in assignment
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <Select 
                                    onValueChange={handleEmployeeSelect} 
                                    disabled={isSubmitting || employees.length === 0}
                                >
                                    <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                                        <SelectValue placeholder="Select employees to assign" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white max-h-60">
                                        {employees.map((employee) => (
                                            <SelectItem
                                                key={employee._id}
                                                value={employee._id}
                                                disabled={selectedEmployees.includes(employee._id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarFallback className="text-xs bg-green-100 text-green-600">
                                                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>
                                                        {employee.firstName} {employee.lastName}
                                                        <span className="text-gray-500 text-xs ml-2">
                                                            ({employee.email})
                                                        </span>
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        {employees.length === 0 && (
                                            <div className="px-2 py-4 text-center text-gray-500 text-sm">
                                                No employees available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>

                                {selectedEmployees.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-gray-800 font-semibold">
                                            Selected Employees ({selectedCount})
                                        </Label>
                                        <div className="space-y-2">
                                            {selectedEmployees.map((empId) => {
                                                const employeeName = getEmployeeDisplayName(empId);
                                                const employeeEmail = getEmployeeEmail(empId);
                                                const progress = getEmployeeProgress(empId);
                                                const isExisting = subtask.assignedEmployees?.some(emp => {
                                                    const existingEmpId = emp.employeeId?._id?.toString() || emp.employeeId.toString();
                                                    return existingEmpId === empId;
                                                });
                                                
                                                return (
                                                    <div key={empId} className={`flex items-center justify-between p-3 border rounded-lg ${isExisting ? 'bg-green-50 border-green-200' : 'bg-blue-50/50 border-blue-200'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarFallback className={isExisting ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}>
                                                                    {employeeName[0]}{employeeName.split(' ')[1]?.[0] || ''}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium text-gray-900">
                                                                        {employeeName}
                                                                    </p>
                                                                    {isExisting ? (
                                                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                                            Currently assigned
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                                            New assignment
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-1">
                                                                    <div className="text-xs text-gray-500">{employeeEmail}</div>
                                                                    {isExisting && progress.completed > 0 && (
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <span className="text-gray-600">Progress:</span>
                                                                            <span className={`font-medium ${progress.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                                                                                {progress.completed}/{progress.assigned}
                                                                            </span>
                                                                            <span className={`${progress.status === 'completed' ? 'text-green-600' : progress.status === 'in_progress' ? 'text-blue-600' : 'text-yellow-600'}`}>
                                                                                ({progress.status})
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isExisting && progress.status !== 'pending' && (
                                                                <Badge className={`${progress.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                    {progress.status === 'completed' ? (
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                    ) : (
                                                                        <Clock className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    {progress.status.replace('_', '-')}
                                                                </Badge>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeEmployee(empId)}
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                disabled={isSubmitting}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {leadsRequired > 0 && selectedCount > 0 && (
                                            <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-md border border-green-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Target className="w-4 h-4 text-green-600" />
                                                    <span className="font-medium">Lead Distribution:</span>
                                                </div>
                                                <p className="text-sm">
                                                    <span className="font-semibold">{leadsRequired} total leads</span> will be distributed among{' '}
                                                    <span className="font-semibold">{selectedCount} employee{selectedCount > 1 ? 's' : ''}</span>
                                                </p>
                                                <p className="text-sm mt-1">
                                                    Each employee will be assigned approximately{' '}
                                                    <span className="font-semibold">{leadsPerEmployee} lead{leadsPerEmployee > 1 ? 's' : ''}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate" className="text-gray-800 font-semibold">
                                        Start Date *
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate" className="text-gray-800 font-semibold">
                                        End Date *
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime" className="text-gray-800 font-semibold">
                                        Start Time *
                                    </Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="startTime"
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => handleInputChange('startTime', e.target.value)}
                                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endTime" className="text-gray-800 font-semibold">
                                        End Time *
                                    </Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="endTime"
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => handleInputChange('endTime', e.target.value)}
                                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-gray-800 font-semibold">
                                    Priority
                                </Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => handleInputChange('priority', value)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white">
                                        <SelectItem value="low">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                Low
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                Medium
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                High
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-800 font-semibold">
                                    Last Updated
                                </Label>
                                <div className="text-sm text-gray-600">
                                    {subtask.updatedAt ? format(new Date(subtask.updatedAt), 'PPPpp') : 'Not updated yet'}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !hasChanges() || selectedEmployees.length === 0 || leadsRequired <= 0}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Update Subtask
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-6">
                    <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                            <CardTitle className="text-lg font-bold text-gray-900">
                                Current Status Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-5 h-5 text-blue-600" />
                                            <h3 className="font-semibold text-gray-800">Current Employees</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-blue-700">{subtask.assignedEmployees?.length || 0}</p>
                                        <p className="text-sm text-gray-600 mt-1">Currently assigned</p>
                                    </div>
                                    
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-5 h-5 text-purple-600" />
                                            <h3 className="font-semibold text-gray-800">Leads Progress</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-purple-700">
                                            {subtask.leadsCompleted || 0} / {subtask.totalLeadsRequired || leadsRequired}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {subtask.totalLeadsRequired ? 
                                                Math.round(((subtask.leadsCompleted || 0) / subtask.totalLeadsRequired) * 100) : 0}% completed
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-3">Subtask Information:</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <Badge className={`
                                                ${subtask.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                subtask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                                'bg-yellow-100 text-yellow-800'}
                                            `}>
                                                {subtask.status?.replace('_', '-') || 'pending'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created On:</span>
                                            <span className="font-medium">{format(new Date(subtask.createdAt), 'PPP')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created By:</span>
                                            <span className="font-medium">{subtask.teamLeadName || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}