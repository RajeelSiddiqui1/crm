"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
    Users,
    Calendar,
    Clock,
    FileText,
    Loader2,
    AlertCircle,
    User
} from "lucide-react";
import axios from "axios";

export default function CreateSubtaskPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const submissionId = searchParams.get('submissionId');

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [submission, setSubmission] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        priority: "medium",
        lead: ""
    });

    const [selectedEmployees, setSelectedEmployees] = useState([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "TeamLead") {
            router.push("/teamleadlogin");
            return;
        }

        if (!submissionId) {
            toast.error("Submission ID is required");
            router.back();
            return;
        }

        if (session.user) {
            setFormData(prev => ({
                ...prev,
                lead: session.user.name || `${session.user.firstName} ${session.user.lastName}`
            }));
        }

        fetchSubmissionDetails();
    }, [session, status, router, submissionId]);

    const fetchSubmissionDetails = async () => {
        try {
            setFetching(true);
            const response = await axios.get(`/api/teamlead/tasks?submissionId=${submissionId}`);
            if (response.status === 200 && response.data.length > 0) {
                setSubmission(response.data[0]);
            } else {
                toast.error("Submission not found");
                router.back();
            }
        } catch (error) {
            console.error("Error fetching submission:", error);
            toast.error("Failed to fetch submission details");
            router.back();
        } finally {
            setFetching(false);
        }
    };

    const getAssignedEmployees = () => {
        if (!submission || !submission.assignedEmployees) return [];

        return submission.assignedEmployees.map(emp => ({
            _id: emp.employeeId._id || emp.employeeId,
            firstName: emp.employeeId.firstName,
            lastName: emp.employeeId.lastName,
            email: emp.employeeId.email,
            status: emp.status
        }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) {
            toast.error("Please wait, submission in progress...");
            return;
        }

        if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime || !formData.lead) {
            toast.error("Please fill all required fields");
            return;
        }

        if (selectedEmployees.length === 0) {
            toast.error("Please select at least one employee");
            return;
        }

        setIsSubmitting(true);
        setLoading(true);

        try {
            const assignedEmployeesData = selectedEmployees.map(empId => {
                const employee = getAssignedEmployees().find(e => e._id === empId);
                return {
                    employeeId: empId,
                    email: employee?.email || '',
                    name: `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim()
                };
            });

            const subtaskData = {
                ...formData,
                submissionId: submissionId,
                assignedEmployees: assignedEmployeesData
            };

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (status === "loading" || fetching) {
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

    const assignedEmployees = getAssignedEmployees();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-4xl mx-auto">
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
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            Create Subtask
                        </h1>
                        <p className="text-gray-800 mt-2 text-lg">
                            Create a new subtask for {submission?.formId?.title || 'the submission'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    Subtask Details
                                </CardTitle>
                                <CardDescription className="text-gray-700 text-base">
                                    Fill in the details for the new subtask
                                </CardDescription>
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
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lead" className="text-gray-800 font-semibold">
                                            Lead *
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="lead"
                                                value={formData.lead}
                                                onChange={(e) => handleInputChange('lead', e.target.value)}
                                                placeholder="Enter lead name"
                                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Team lead responsible for this subtask
                                        </p>
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

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-gray-800 font-semibold">
                                                Assign Employees *
                                            </Label>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {selectedEmployees.length} selected
                                            </Badge>
                                        </div>

                                        <Select onValueChange={handleEmployeeSelect} disabled={isSubmitting}>
                                            <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                                                <SelectValue placeholder="Select employees to assign" />
                                            </SelectTrigger>
                                            <SelectContent className="text-black bg-white max-h-60">
                                                {assignedEmployees.map((employee) => (
                                                    <SelectItem
                                                        key={employee._id}
                                                        value={employee._id}
                                                        disabled={selectedEmployees.includes(employee._id) || isSubmitting}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="w-6 h-6">
                                                                <AvatarFallback className="text-xs bg-green-100 text-green-600">
                                                                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span>
                                                                {employee.firstName} {employee.lastName}
                                                                <span className="text-gray-500 text-xs ml-2">({employee.email})</span>
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                {assignedEmployees.length === 0 && (
                                                    <div className="px-2 py-4 text-center text-gray-500 text-sm">
                                                        No employees assigned to this submission
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>

                                        {selectedEmployees.length > 0 && (
                                            <div className="space-y-3">
                                                <Label className="text-gray-800 font-semibold">
                                                    Selected Employees
                                                </Label>
                                                <div className="space-y-2">
                                                    {selectedEmployees.map(empId => {
                                                        const employee = assignedEmployees.find(e => e._id === empId);
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
                                                                        <p className="text-sm text-gray-500">{employee?.email}</p>
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
                                            </div>
                                        )}
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
                                            disabled={isSubmitting || loading || assignedEmployees.length === 0}
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
                    </div>

                    <div className="space-y-6">
                        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Parent Submission
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {submission ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20">
                                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold">
                                                    <FileText className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg">
                                                    {submission.formId?.title || 'Untitled Form'}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {submission.formId?.description || 'No description'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span>Assigned: {formatDate(submission.createdAt)}</span>
                                            </div>

                                            <div>
                                                <Label className="text-gray-800 font-semibold text-sm">Status</Label>
                                                <Badge className={`mt-1 ${submission.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                                        submission.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                                'bg-gray-100 text-gray-800 border-gray-200'
                                                    }`}>
                                                    {submission.status.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            {assignedEmployees.length > 0 && (
                                                <div>
                                                    <Label className="text-gray-800 font-semibold text-sm">Available Employees ({assignedEmployees.length})</Label>
                                                    <div className="mt-1 space-y-1">
                                                        {assignedEmployees.slice(0, 3).map((emp, index) => (
                                                            <div key={emp._id} className="flex items-center gap-2 text-xs">
                                                                <Avatar className="w-5 h-5">
                                                                    <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                                                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-gray-700">
                                                                    {emp.firstName} {emp.lastName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {assignedEmployees.length > 3 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{assignedEmployees.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        <p>Loading submission details...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Instructions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm text-gray-700">
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                        <span>Fill in all required fields marked with *</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                        <span>Assign at least one employee to the subtask</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                        <span>Set realistic deadlines for the subtask</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                        <span>Employees will be notified when assigned</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                        <span>Only employees already assigned to the parent task can be selected</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Current Lead
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20">
                                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold">
                                            <User className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-gray-900">
                                            {session.user.name || `${session.user.firstName} ${session.user.lastName}`}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {session.user.email}
                                        </div>
                                        <Badge className="mt-1 bg-green-100 text-green-800 border-green-200">
                                            Team Lead
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}