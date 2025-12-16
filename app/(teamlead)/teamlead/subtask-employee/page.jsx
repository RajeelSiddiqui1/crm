"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    ArrowLeft,
    Save,
    Plus,
    X,
    Calendar,
    Clock,
    Loader2,
    AlertCircle,
    Users,
    UserRound,
    Phone,
    Target,
    BarChart3
} from "lucide-react";
import axios from "axios";

export default function CreateSubtaskPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchingEmployees, setFetchingEmployees] = useState(true);
    const [employees, setEmployees] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        priority: "medium",
        leadsRequired: ""  // Default value for leads
    });

    const [selectedEmployees, setSelectedEmployees] = useState([]);

    // Check if current team lead has the specific depId
    const shouldShowLeadsField = useMemo(() => {
        if (!session?.user?.depId) return false;
        return session.user.depId === "694161a12ab0b6a3ab0e0788";
    }, [session]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "TeamLead") {
            router.push("/teamleadlogin");
            return;
        }

        fetchEmployees();
    }, [session, status, router]);

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
        return employees.find(emp => emp._id === employeeId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) {
            toast.error("Please wait, submission in progress...");
            return;
        }

        // Basic validation for all fields
       

        // Additional validation for leads field if it's visible
        if (shouldShowLeadsField) {
            if (!formData.leadsRequired) {
                toast.error("Please enter number of leads required");
                return;
            }

            const leadsRequired = parseInt(formData.leadsRequired);
            if (leadsRequired <= 0) {
                toast.error("Please enter a valid number of leads (greater than 0)");
                return;
            }
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
        setLoading(true);

        try {
            // Prepare assigned employees data
            const assignedEmployees = selectedEmployees.map(empId => {
                const employee = getSelectedEmployeeDetails(empId);
                const employeeData = {
                    employeeId: empId,
                    email: employee?.email || '',
                    name: `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim(),
                    status: 'pending'
                };

                // Add leads distribution only if leads field is shown
                if (shouldShowLeadsField) {
                    const leadsRequired = parseInt(formData.leadsRequired) || 0;
                    employeeData.leadsCompleted = 0;
                    employeeData.leadsAssigned = Math.ceil(leadsRequired / selectedEmployees.length);
                }

                return employeeData;
            });

            const subtaskData = {
                ...formData,
                teamLeadId: session.user.id,
                teamLeadName: session.user.name || `${session.user.firstName} ${session.user.lastName}`,
                teamLeadDepId: session.user.depId, // Include depId for tracking
                status: 'pending',
                assignedEmployees: assignedEmployees
            };

            // Add leads data only if field is shown
            if (shouldShowLeadsField) {
                subtaskData.totalLeadsRequired = parseInt(formData.leadsRequired);
                subtaskData.leadsCompleted = 0;
                subtaskData.hasLeadsTarget = true;
            } else {
                subtaskData.hasLeadsTarget = false;
            }

            console.log("Submitting subtask data:", subtaskData);

            const response = await axios.post('/api/teamlead/subtasks', subtaskData);

            if (response.status === 201) {
                toast.success("Subtask created successfully!");
                setTimeout(() => {
                    router.push('/teamlead/subtasks');
                }, 1000);
            }
        } catch (error) {
            console.error("Error creating subtask:", error);
            if (error.response?.status === 409) {
                toast.error("Subtask with this title already exists");
            } else {
                toast.error(error.response?.data?.error || "Failed to create subtask");
            }
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    const leadsRequired = parseInt(formData.leadsRequired) || 0;
    const selectedCount = selectedEmployees.length;
    const leadsPerEmployee = shouldShowLeadsField && selectedCount > 0 ? Math.ceil(leadsRequired / selectedCount) : 0;

    if (status === "loading" || fetchingEmployees) {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
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
                            Create New Subtask
                        </h1>
                        <p className="text-gray-800 mt-2">
                            {shouldShowLeadsField 
                                ? "Create a new subtask with lead targets" 
                                : "Create a new subtask"}
                        </p>
                    </div>
                </div>

                <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Subtask Information
                                </CardTitle>
                                <CardDescription className="text-gray-700">
                                    Fill in the details for the new subtask
                                </CardDescription>
                            </div>
                            {shouldShowLeadsField && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <Target className="w-3 h-3 mr-1" />
                                    Lead Tracking Enabled
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
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Leads Required Field - Only show for specific depId */}
                            {shouldShowLeadsField && (
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
                                        Enter the total number of leads/calls/targets to be completed
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-gray-800 font-semibold">
                                        Assign Employees *
                                    </Label>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {selectedEmployees.length} selected
                                    </Badge>
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
                                                const employee = getSelectedEmployeeDetails(empId);
                                                
                                                return (
                                                    <div key={empId} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50/50">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                    {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {employee?.firstName} {employee?.lastName}
                                                                </p>
                                                                {shouldShowLeadsField && leadsPerEmployee > 0 && (
                                                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1">
                                                                        {leadsPerEmployee} leads each
                                                                    </Badge>
                                                                )}
                                                                <p className="text-xs text-gray-500 mt-1">{employee?.email}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeEmployee(empId)}
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            disabled={isSubmitting}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {shouldShowLeadsField && leadsRequired > 0 && selectedCount > 0 && (
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
                                    Created By (Team Lead)
                                </Label>
                                <div className="relative">
                                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input
                                        value={session.user.name || `${session.user.firstName} ${session.user.lastName}`}
                                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 bg-gray-50"
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Department ID: {session.user.depId}</span>
                                    {shouldShowLeadsField && (
                                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                            Lead Tracking Active
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
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
                                    disabled={isSubmitting || loading || selectedEmployees.length === 0 || 
                                        (shouldShowLeadsField && leadsRequired <= 0)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Create Subtask
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Summary Card - Only show lead distribution for specific depId */}
                {shouldShowLeadsField && (
                    <div className="mt-6">
                        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    Lead Target Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-5 h-5 text-blue-600" />
                                                <h3 className="font-semibold text-gray-800">Assigned Employees</h3>
                                            </div>
                                            <p className="text-3xl font-bold text-blue-700">{selectedCount}</p>
                                            <p className="text-sm text-gray-600 mt-1">Working on this task</p>
                                        </div>
                                        
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-5 h-5 text-purple-600" />
                                                <h3 className="font-semibold text-gray-800">Total Leads</h3>
                                            </div>
                                            <p className="text-3xl font-bold text-purple-700">{leadsRequired}</p>
                                            <p className="text-sm text-gray-600 mt-1">To be completed</p>
                                        </div>
                                    </div>

                                    {leadsRequired > 0 && selectedCount > 0 && (
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <h3 className="font-semibold text-gray-800 mb-3">Lead Distribution Plan:</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-700">Total leads required:</span>
                                                    <span className="font-bold text-lg">{leadsRequired}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-700">Number of employees:</span>
                                                    <span className="font-bold text-lg">{selectedCount}</span>
                                                </div>
                                                <div className="border-t border-green-300 pt-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">Leads per employee:</span>
                                                        <span className="font-bold text-xl text-green-700">
                                                            {leadsPerEmployee} each
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-800 mb-2">What are "Leads"?</h3>
                                        <ul className="space-y-2 text-sm text-gray-700">
                                            <li className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                                                <span><strong>Leads</strong> = Number of calls/tasks/targets to complete</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                                                <span>Example: 100 calls, 50 emails, 200 follow-ups</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                                                <span>Each employee will track their completed leads</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                                                <span>Progress will be monitored in real-time</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}