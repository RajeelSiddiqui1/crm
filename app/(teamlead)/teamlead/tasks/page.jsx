"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Search,
    FileText,
    User,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Eye,
    Loader2,
    RefreshCw,
    X,
    Users,
    Plus,
    Trash2
} from "lucide-react";
import axios from "axios";

export default function TeamLeadSubmissionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [submissions, setSubmissions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [fetchingEmployees, setFetchingEmployees] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [feedback, setFeedback] = useState("");
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "TeamLead") {
            router.push("/login");
            return;
        }

        fetchSubmissions();
        fetchEmployees();
    }, [session, status, router]);

    const fetchSubmissions = async () => {
        try {
            setFetching(true);
            const response = await axios.get('/api/teamlead/tasks');
            if (response.status === 200) {
                setSubmissions(response.data || []);
                toast.success(`Loaded ${response.data.length} submissions`);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
            if (error.response?.status === 401) {
                toast.error("Please login again");
                router.push("/login");
            } else {
                toast.error(error.response?.data?.error || "Failed to fetch submissions");
            }
        } finally {
            setFetching(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            setFetchingEmployees(true);
            const response = await axios.get('/api/teamlead/employees');
            if (response.status === 200) {
                setEmployees(response.data || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("Failed to fetch employees");
        } finally {
            setFetchingEmployees(false);
        }
    };

    const handleStatusUpdate = async (submissionId, newStatus, feedback = "") => {
        setLoading(true);

        try {
            const updateData = {
                submissionId: submissionId,
                status: newStatus,
                teamLeadFeedback: feedback
            };

            const response = await axios.put("/api/teamlead/tasks", updateData);

            if (response.status === 200) {
                toast.success("Status updated successfully!");
                fetchSubmissions();
                setShowDetails(false);
                setFeedback("");
            }
        } catch (error) {
            console.error("Status update error:", error);
            if (error.response?.status === 401) {
                toast.error("Please login again");
                router.push("/login");
            } else if (error.response?.status === 403) {
                toast.error(error.response.data.error);
            } else {
                toast.error(error.response?.data?.error || "Failed to update status");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStatusUpdate = async (submissionId, newStatus) => {
        setLoading(true);
        try {
            const updateData = {
                submissionId: submissionId,
                status: newStatus,
                teamLeadFeedback: `Status changed to ${newStatus}`
            };

            const response = await axios.put("/api/teamlead/tasks", updateData);

            if (response.status === 200) {
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
                fetchSubmissions();
            }
        } catch (error) {
            console.error("Quick status update error:", error);
            toast.error(error.response?.data?.error || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignEmployees = async (submissionId) => {
        if (selectedEmployees.length === 0) {
            toast.error("Please select at least one employee");
            return;
        }

        setLoading(true);
        try {
            const assignedEmployeesData = selectedEmployees.map(empId => {
                const employee = employees.find(e => e._id === empId);
                return {
                    employeeId: empId,
                    email: employee.email,
                    status: "pending"
                };
            });

            const updateData = {
                submissionId: submissionId,
                assignedEmployees: assignedEmployeesData
            };

            const response = await axios.put("/api/teamlead/tasks", updateData);

            if (response.status === 200) {
                toast.success(`Assigned ${selectedEmployees.length} employee(s) successfully!`);
                fetchSubmissions();
                setSelectedEmployees([]);
                setShowDetails(false);
            }
        } catch (error) {
            console.error("Assign employees error:", error);
            toast.error(error.response?.data?.error || "Failed to assign employees");
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeStatusUpdate = async (submissionId, employeeId, newStatus) => {
        setLoading(true);
        try {
            const submission = submissions.find(s => s._id === submissionId);
            const updatedEmployees = submission.assignedEmployees.map(emp => 
                emp.employeeId._id === employeeId ? { ...emp, status: newStatus } : emp
            );

            const updateData = {
                submissionId: submissionId,
                assignedEmployees: updatedEmployees
            };

            const response = await axios.put("/api/teamlead/tasks", updateData);

            if (response.status === 200) {
                toast.success(`Employee status updated to ${newStatus}`);
                fetchSubmissions();
            }
        } catch (error) {
            console.error("Employee status update error:", error);
            toast.error(error.response?.data?.error || "Failed to update employee status");
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "completed":
            case "approved":
                return "bg-green-100 text-green-800 border-green-200";
            case "in_progress":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
            case "approved":
                return <CheckCircle className="w-4 h-4" />;
            case "in_progress":
                return <Clock className="w-4 h-4" />;
            case "pending":
                return <AlertCircle className="w-4 h-4" />;
            case "rejected":
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    // Get available employees for assignment (excluding already assigned ones)
    const getAvailableEmployees = (submission) => {
        if (!submission || !submission.assignedEmployees) return employees;
        
        const assignedEmployeeIds = submission.assignedEmployees.map(emp => emp.employeeId._id);
        return employees.filter(employee => !assignedEmployeeIds.includes(employee._id));
    };

    const filteredSubmissions = submissions.filter(submission => {
        const matchesSearch =
            submission.formId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.status?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || submission.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFieldValue = (value) => {
        if (value === null || value === undefined || value === "") {
            return <span className="text-gray-500">Not provided</span>;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            return (
                <div className="space-y-1 text-sm">
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key} className="flex">
                            <span className="font-medium capitalize w-20">{key}:</span>
                            <span className="text-gray-900">{val || 'N/A'}</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (Array.isArray(value)) {
            return value.join(', ');
        }

        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return value.toString();
    };

    const statusStats = {
        total: submissions.length,
        pending: submissions.filter(s => s.status === 'pending').length,
        in_progress: submissions.filter(s => s.status === 'in_progress').length,
        completed: submissions.filter(s => s.status === 'completed').length,
        rejected: submissions.filter(s => s.status === 'rejected').length
    };

    if (status === "loading") {
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

            <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            My Assigned Tasks
                        </h1>
                        <p className="text-gray-800 mt-3 text-lg">
                            Welcome, {session.user.firstName}! Manage your assigned form submissions
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={fetchSubmissions}
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            disabled={fetching}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                            {fetching ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{statusStats.total}</div>
                            <div className="text-sm text-gray-600">Total Tasks</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{statusStats.pending}</div>
                            <div className="text-sm text-gray-600">Pending</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{statusStats.in_progress}</div>
                            <div className="text-sm text-gray-600">In Progress</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{statusStats.completed}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden flex-1 flex flex-col">
                    <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    My Tasks
                                </CardTitle>
                                <CardDescription className="text-gray-700 text-base">
                                    {filteredSubmissions.length} task{filteredSubmissions.length !== 1 ? 's' : ''} found
                                </CardDescription>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search tasks..."
                                        className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11 text-base text-gray-900"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                                        <SelectValue placeholder="Filter Status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1">
                        {fetching ? (
                            <div className="flex justify-center items-center py-16 h-full">
                                <div className="flex items-center gap-3 text-gray-800">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-lg">Loading tasks...</span>
                                </div>
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="text-center py-16 h-full flex items-center justify-center">
                                <div>
                                    <div className="text-gray-300 mb-4">
                                        <FileText className="w-20 h-20 mx-auto" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        {submissions.length === 0 ? "No tasks assigned" : "No matches found"}
                                    </h3>
                                    <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                                        {submissions.length === 0
                                            ? "Tasks assigned to you will appear here."
                                            : "Try adjusting your search terms to find what you're looking for."
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto h-full">
                                <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 sticky top-0">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Form Details</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Status</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Assigned Employees</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Quick Actions</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Assigned Date</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSubmissions.map((submission) => (
                                                <TableRow
                                                    key={submission._id}
                                                    className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-300 border-b border-gray-100/50"
                                                >
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-600/30 transition-all duration-300">
                                                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold">
                                                                    <FileText className="w-4 h-4" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200">
                                                                    {submission.formId?.title || 'Untitled Form'}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {submission.formId?.description || 'No description'}
                                                                </div>
                                                                {submission.assignedEmployees && submission.assignedEmployees.length > 0 && (
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <Users className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-500">
                                                                            {submission.assignedEmployees.length} employee(s)
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge className={`${getStatusVariant(submission.status)} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                            {getStatusIcon(submission.status)}
                                                            {submission.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {submission.assignedEmployees && submission.assignedEmployees.length > 0 ? (
                                                                submission.assignedEmployees.slice(0, 3).map((emp, index) => (
                                                                    <div key={emp.employeeId._id} className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="w-6 h-6">
                                                                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                                                                    {emp.employeeId.firstName?.[0]}{emp.employeeId.lastName?.[0]}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="text-xs text-gray-700">
                                                                                {emp.employeeId.firstName} {emp.employeeId.lastName}
                                                                            </span>
                                                                        </div>
                                                                        <Badge variant="outline" className={`text-xs ${getStatusVariant(emp.status)}`}>
                                                                            {emp.status}
                                                                        </Badge>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-500">No employees assigned</span>
                                                            )}
                                                            {submission.assignedEmployees && submission.assignedEmployees.length > 3 && (
                                                                <span className="text-xs text-gray-500">
                                                                    +{submission.assignedEmployees.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Select 
                                                                onValueChange={(value) => handleQuickStatusUpdate(submission._id, value)}
                                                                disabled={loading}
                                                            >
                                                                <SelectTrigger className="w-36 h-8 text-xs text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                                                    <SelectValue placeholder="Update Status" />
                                                                </SelectTrigger>
                                                                <SelectContent className="text-black bg-white min-w-[140px]">
                                                                    <SelectItem value="pending" className="text-xs py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <AlertCircle className="w-3 h-3 text-yellow-600" />
                                                                            <span>Pending</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="in_progress" className="text-xs py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="w-3 h-3 text-blue-600" />
                                                                            <span>In Progress</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="completed" className="text-xs py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                                                            <span>Completed</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="rejected" className="text-xs py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <XCircle className="w-3 h-3 text-red-600" />
                                                                            <span>Rejected</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                                            <Calendar className="w-5 h-5 text-blue-500" />
                                                            <span className="text-base font-medium">{formatDate(submission.createdAt)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    setSelectedSubmission(submission);
                                                                    setShowDetails(true);
                                                                    setSelectedEmployees([]);
                                                                }}
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {showDetails && selectedSubmission && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-white text-2xl">{selectedSubmission.formId?.title || 'Task Details'}</CardTitle>
                                        <CardDescription className="text-blue-100">
                                            View task details, assign employees, and update status
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setShowDetails(false);
                                            setSelectedSubmission(null);
                                            setFeedback("");
                                            setSelectedEmployees([]);
                                        }}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Task Information</h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-gray-800 font-semibold">Assigned Date</Label>
                                                    <p className="text-gray-900 font-medium">{formatDate(selectedSubmission.createdAt)}</p>
                                                </div>

                                                <div>
                                                    <Label className="text-gray-800 font-semibold">Status</Label>
                                                    <Badge className={`${getStatusVariant(selectedSubmission.status)} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                        {getStatusIcon(selectedSubmission.status)}
                                                        {selectedSubmission.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>

                                                {selectedSubmission.completedAt && (
                                                    <div>
                                                        <Label className="text-gray-800 font-semibold">Completed Date</Label>
                                                        <p className="text-gray-900 font-medium">{formatDate(selectedSubmission.completedAt)}</p>
                                                    </div>
                                                )}

                                                {selectedSubmission.managerComments && (
                                                    <div>
                                                        <Label className="text-gray-800 font-semibold">Manager Comments</Label>
                                                        <p className="text-gray-900 font-medium">{selectedSubmission.managerComments}</p>
                                                    </div>
                                                )}

                                                {selectedSubmission.teamLeadFeedback && (
                                                    <div>
                                                        <Label className="text-gray-800 font-semibold">Your Feedback</Label>
                                                        <p className="text-gray-900 font-medium">{selectedSubmission.teamLeadFeedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Form Data</h3>

                                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                                {selectedSubmission.formData && Object.entries(selectedSubmission.formData).map(([key, value]) => (
                                                    <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <Label className="text-gray-800 font-semibold capitalize">
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </Label>
                                                        </div>
                                                        <div className="text-gray-900 font-medium">
                                                            {formatFieldValue(value)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Assign Employees</h3>
                                            
                                            <div className="space-y-3">
                                                <Label className="text-gray-800 font-semibold">Select Employees</Label>
                                                <Select 
                                                    onValueChange={(value) => {
                                                        if (value && !selectedEmployees.includes(value)) {
                                                            setSelectedEmployees([...selectedEmployees, value]);
                                                        }
                                                    }}
                                                    disabled={fetchingEmployees}
                                                >
                                                    <SelectTrigger className="w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                                                        <SelectValue placeholder="Select employees to assign" />
                                                    </SelectTrigger>
                                                    <SelectContent className="text-black bg-white">
                                                        {getAvailableEmployees(selectedSubmission).map((employee) => (
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
                                                                        <span className="text-gray-500 text-xs ml-2">({employee.email})</span>
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        {getAvailableEmployees(selectedSubmission).length === 0 && (
                                                            <div className="px-2 py-4 text-center text-gray-500 text-sm">
                                                                All employees are already assigned to this task
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>

                                                {selectedEmployees.length > 0 && (
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-800 font-semibold">Selected Employees:</Label>
                                                        <div className="space-y-2">
                                                            {selectedEmployees.map(empId => {
                                                                const employee = employees.find(e => e._id === empId);
                                                                return (
                                                                    <div key={empId} className="flex items-center justify-between p-2 border rounded-lg">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="w-6 h-6">
                                                                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                                                                    {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="text-sm">
                                                                                {employee?.firstName} {employee?.lastName}
                                                                            </span>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSelectedEmployees(selectedEmployees.filter(id => id !== empId))}
                                                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <Button
                                                            onClick={() => handleAssignEmployees(selectedSubmission._id)}
                                                            disabled={loading}
                                                            className="w-full bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            Assign {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Assigned Employees</h3>
                                            
                                            {selectedSubmission.assignedEmployees && selectedSubmission.assignedEmployees.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedSubmission.assignedEmployees.map((emp) => (
                                                        <div key={emp.employeeId._id} className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                                                        {emp.employeeId.firstName?.[0]}{emp.employeeId.lastName?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">
                                                                        {emp.employeeId.firstName} {emp.employeeId.lastName}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{emp.employeeId.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Select 
                                                                    value={emp.status}
                                                                    onValueChange={(value) => handleEmployeeStatusUpdate(selectedSubmission._id, emp.employeeId._id, value)}
                                                                    disabled={loading}
                                                                >
                                                                    <SelectTrigger className="w-28 h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="text-black bg-white">
                                                                        <SelectItem value="pending">Pending</SelectItem>
                                                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                                                        <SelectItem value="completed">Completed</SelectItem>
                                                                        <SelectItem value="rejected">Rejected</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                    <p>No employees assigned yet</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    onClick={() => handleStatusUpdate(selectedSubmission._id, "pending", feedback)}
                                                    variant="outline"
                                                    className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                                    disabled={loading}
                                                >
                                                    Set Pending
                                                </Button>
                                                <Button
                                                    onClick={() => handleStatusUpdate(selectedSubmission._id, "in_progress", feedback)}
                                                    variant="outline"
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    disabled={loading}
                                                >
                                                    Set In Progress
                                                </Button>
                                                <Button
                                                    onClick={() => handleStatusUpdate(selectedSubmission._id, "completed", feedback)}
                                                    className="bg-green-600 text-white hover:bg-green-700"
                                                    disabled={loading}
                                                >
                                                    Set Completed
                                                </Button>
                                                <Button
                                                    onClick={() => handleStatusUpdate(selectedSubmission._id, "rejected", feedback)}
                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                    disabled={loading}
                                                >
                                                    Set Rejected
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="feedback" className="text-gray-800 font-semibold">
                                                    Feedback (Optional)
                                                </Label>
                                                <Textarea
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    placeholder="Add your feedback or comments about this task..."
                                                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
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