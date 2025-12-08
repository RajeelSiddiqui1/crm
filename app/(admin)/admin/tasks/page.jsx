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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Filter,
    Download,
    BarChart3,
    Settings
} from "lucide-react";
import axios from "axios";

export default function AdminSubmissionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [status2Filter, setStatus2Filter] = useState("all");
    const [employeeStatusFilter, setEmployeeStatusFilter] = useState("all");
    const [comments, setComments] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Admin") {
            router.push("/adminlogin");
            return;
        }

        fetchSubmissions();
    }, [session, status, router]);

    const fetchSubmissions = async () => {
        try {
            setFetching(true);
            const response = await axios.get('/api/admin/submissions');
            if (response.status === 200) {
                setSubmissions(response.data || []);
                toast.success(`Loaded ${response.data.length} submissions`);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
            if (error.response?.status === 401) {
                toast.error("Please login again");
                router.push("/adminlogin");
            } else {
                toast.error(error.response?.data?.error || "Failed to fetch submissions");
            }
        } finally {
            setFetching(false);
        }
    };

    const handleStatusUpdate = async (submissionId, statusType, newStatus, comments = "") => {
        setLoading(true);

        try {
            const updateData = {
                submissionId: submissionId,
                statusType: statusType,
                status: newStatus,
                comments: comments
            };

            const response = await axios.put("/api/admin/submissions", updateData);

            if (response.status === 200) {
                toast.success("Status updated successfully!");
                fetchSubmissions();
                setShowDetails(false);
                setComments("");
            }
        } catch (error) {
            console.error("Status update error:", error);
            if (error.response?.status === 401) {
                toast.error("Please login again");
                router.push("/adminlogin");
            } else {
                toast.error(error.response?.data?.error || "Failed to update status");
            }
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

    const filteredSubmissions = submissions.filter(submission => {
        const matchesSearch =
            submission.formId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
        const matchesStatus2 = status2Filter === "all" || submission.status2 === status2Filter;
        
        const matchesEmployeeStatus = employeeStatusFilter === "all" || 
            (submission.assignedEmployees && submission.assignedEmployees.some(
                emp => emp.status === employeeStatusFilter
            ));

        return matchesSearch && matchesStatus && matchesStatus2 && matchesEmployeeStatus;
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

    const getEmployeeStatusStats = (submission) => {
        if (!submission.assignedEmployees) return { total: 0, pending: 0, in_progress: 0, completed: 0, rejected: 0 };
        
        return {
            total: submission.assignedEmployees.length,
            pending: submission.assignedEmployees.filter(emp => emp.status === 'pending').length,
            in_progress: submission.assignedEmployees.filter(emp => emp.status === 'in_progress').length,
            completed: submission.assignedEmployees.filter(emp => emp.status === 'completed').length,
            rejected: submission.assignedEmployees.filter(emp => emp.status === 'rejected').length
        };
    };

    const statusStats = {
        total: submissions.length,
        pending: submissions.filter(s => s.status === 'pending').length,
        in_progress: submissions.filter(s => s.status === 'in_progress').length,
        completed: submissions.filter(s => s.status === 'completed').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
        pending2: submissions.filter(s => s.status2 === 'pending').length,
        in_progress2: submissions.filter(s => s.status2 === 'in_progress').length,
        completed2: submissions.filter(s => s.status2 === 'completed').length,
        rejected2: submissions.filter(s => s.status2 === 'rejected').length
    };

    const exportToCSV = () => {
        const headers = ['Form Title', 'Submitted By', 'Assigned To', 'Manager Status', 'TeamLead Status', 'Created At', 'Completed At'];
        const csvData = filteredSubmissions.map(sub => [
            sub.formId?.title || 'N/A',
            sub.submittedBy,
            sub.assignedTo,
            sub.status,
            sub.status2,
            formatDate(sub.createdAt),
            formatDate(sub.completedAt) || 'N/A'
        ]);

        const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Data exported successfully');
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="text-gray-900">Loading...</span>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Admin") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You need to be logged in as Admin to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent">
                            Submission Management
                        </h1>
                        <p className="text-gray-800 mt-3 text-lg">
                            Welcome, {session.user.firstName}! Manage all form submissions
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={exportToCSV}
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button
                            onClick={fetchSubmissions}
                            variant="outline"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            disabled={fetching}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                            {fetching ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                    {[
                        { label: "Total", value: statusStats.total, color: "gray" },
                        { label: "Manager Pending", value: statusStats.pending, color: "yellow" },
                        { label: "Manager In Progress", value: statusStats.in_progress, color: "blue" },
                        { label: "Manager Completed", value: statusStats.completed, color: "green" },
                        { label: "TeamLead Pending", value: statusStats.pending2, color: "purple" },
                        { label: "TeamLead In Progress", value: statusStats.in_progress2, color: "indigo" },
                        { label: "TeamLead Completed", value: statusStats.completed2, color: "green" },
                        { label: "TeamLead Rejected", value: statusStats.rejected2, color: "red" }
                    ].map((stat, index) => (
                        <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardContent className="p-4 text-center">
                                <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                                <div className="text-sm text-gray-600">{stat.label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content */}
                <Card className="shadow-2xl shadow-purple-500/10 border-0 bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm overflow-hidden flex-1 flex flex-col">
                    <CardHeader className="bg-gradient-to-r from-white to-purple-50 border-b border-purple-100/50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    All Submissions
                                </CardTitle>
                                <CardDescription className="text-gray-700 text-base">
                                    {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
                                </CardDescription>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search submissions..."
                                        className="pl-10 pr-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 shadow-sm h-11 text-base text-gray-900"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-40 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900">
                                        <SelectValue placeholder="Manager Status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white">
                                        <SelectItem value="all">All Manager</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={status2Filter} onValueChange={setStatus2Filter}>
                                    <SelectTrigger className="w-full sm:w-40 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900">
                                        <SelectValue placeholder="TeamLead Status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white">
                                        <SelectItem value="all">All TeamLead</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={employeeStatusFilter} onValueChange={setEmployeeStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-40 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900">
                                        <SelectValue placeholder="Employee Status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white">
                                        <SelectItem value="all">All Employee</SelectItem>
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
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                    <span className="text-lg">Loading submissions...</span>
                                </div>
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="text-center py-16 h-full flex items-center justify-center">
                                <div>
                                    <div className="text-gray-300 mb-4">
                                        <FileText className="w-20 h-20 mx-auto" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        {submissions.length === 0 ? "No submissions" : "No matches found"}
                                    </h3>
                                    <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                                        {submissions.length === 0
                                            ? "Form submissions will appear here."
                                            : "Try adjusting your search terms to find what you're looking for."
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto h-full">
                                <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 sticky top-0">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Task Details</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Manager Status</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">TeamLead Status</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Employee Status</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Assigned To</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Submitted By</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Created At</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSubmissions.map((submission) => {
                                                const employeeStats = getEmployeeStatusStats(submission);
                                                return (
                                                <TableRow
                                                    key={submission._id}
                                                    className="group hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-indigo-50/80 transition-all duration-300 border-b border-gray-100/50"
                                                >
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="border-2 border-white shadow-lg shadow-purple-500/20 group-hover:shadow-xl group-hover:shadow-purple-600/30 transition-all duration-300">
                                                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold">
                                                                    <FileText className="w-4 h-4" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors duration-200">
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
                                                        <Badge className={`${getStatusVariant(submission.status2)} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                            {getStatusIcon(submission.status2)}
                                                            {submission.status2.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span>Total: {employeeStats.total}</span>
                                                                <span className="text-yellow-600">P: {employeeStats.pending}</span>
                                                                <span className="text-blue-600">IP: {employeeStats.in_progress}</span>
                                                                <span className="text-green-600">C: {employeeStats.completed}</span>
                                                                <span className="text-red-600">R: {employeeStats.rejected}</span>
                                                            </div>
                                                            {submission.assignedEmployees && submission.assignedEmployees.slice(0, 2).map((emp, index) => (
                                                                <div key={emp.employeeId._id} className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="w-5 h-5">
                                                                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                                                                {emp.employeeId.firstName?.[0]}{emp.employeeId.lastName?.[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-xs text-gray-700 truncate max-w-20">
                                                                            {emp.employeeId.firstName}
                                                                        </span>
                                                                    </div>
                                                                    <Badge variant="outline" className={`text-xs ${getStatusVariant(emp.status)}`}>
                                                                        {emp.status.charAt(0)}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                            {submission.assignedEmployees && submission.assignedEmployees.length > 2 && (
                                                                <span className="text-xs text-gray-500">
                                                                    +{submission.assignedEmployees.length - 2} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="text-sm text-gray-900 font-medium">
                                                            {submission.assignedTo}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="text-sm text-gray-900 font-medium">
                                                            {submission.submittedBy}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                                            <Calendar className="w-4 h-4 text-purple-500" />
                                                            <span className="text-sm font-medium">{formatDate(submission.createdAt)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    setSelectedSubmission(submission);
                                                                    setShowDetails(true);
                                                                    setComments("");
                                                                }}
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )})}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enhanced Modal */}
                {showDetails && selectedSubmission && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-white text-2xl">{selectedSubmission.formId?.title || 'Submission Details'}</CardTitle>
                                        <CardDescription className="text-purple-100">
                                            View complete submission details and update status
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setShowDetails(false);
                                            setSelectedSubmission(null);
                                            setComments("");
                                        }}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="overview" className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4" />
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="employees" className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Employees
                                        </TabsTrigger>
                                        <TabsTrigger value="actions" className="flex items-center gap-2">
                                            <Settings className="w-4 h-4" />
                                            Actions
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left Column - Submission Info */}
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-lg">Submission Information</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">Submitted By</Label>
                                                                <p className="text-gray-900 font-medium">{selectedSubmission.submittedBy}</p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">Assigned To</Label>
                                                                <p className="text-gray-900 font-medium">{selectedSubmission.assignedTo}</p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">Created Date</Label>
                                                                <p className="text-gray-900 font-medium">{formatDate(selectedSubmission.createdAt)}</p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">Completed Date</Label>
                                                                <p className="text-gray-900 font-medium">{formatDate(selectedSubmission.completedAt) || 'N/A'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">Manager Status</Label>
                                                                <Badge className={`${getStatusVariant(selectedSubmission.status)} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                                    {getStatusIcon(selectedSubmission.status)}
                                                                    {selectedSubmission.status.replace('_', ' ')}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">TeamLead Status</Label>
                                                                <Badge className={`${getStatusVariant(selectedSubmission.status2)} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                                    {getStatusIcon(selectedSubmission.status2)}
                                                                    {selectedSubmission.status2.replace('_', ' ')}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {selectedSubmission.managerComments && (
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">Manager Comments</Label>
                                                                <p className="text-gray-900 font-medium bg-yellow-50 p-3 rounded-lg border">
                                                                    {selectedSubmission.managerComments}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {selectedSubmission.teamLeadFeedback && (
                                                            <div>
                                                                <Label className="text-gray-800 font-semibold">TeamLead Feedback</Label>
                                                                <p className="text-gray-900 font-medium bg-blue-50 p-3 rounded-lg border">
                                                                    {selectedSubmission.teamLeadFeedback}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Right Column - Form Data */}
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-lg">Form Data</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                                            {selectedSubmission.formData && Object.entries(selectedSubmission.formData).map(([key, value]) => (
                                                                <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
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
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="employees" className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Assigned Employees</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {selectedSubmission.assignedEmployees && selectedSubmission.assignedEmployees.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {selectedSubmission.assignedEmployees.map((emp) => (
                                                            <div key={emp.employeeId._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center gap-4">
                                                                    <Avatar className="w-12 h-12">
                                                                        <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                                                                            {emp.employeeId.firstName?.[0]}{emp.employeeId.lastName?.[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900 text-lg">
                                                                            {emp.employeeId.firstName} {emp.employeeId.lastName}
                                                                        </p>
                                                                        <p className="text-sm text-gray-500">{emp.employeeId.email}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Assigned: {formatDate(emp.assignedAt)}
                                                                            {emp.completedAt && ` | Completed: ${formatDate(emp.completedAt)}`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Badge className={`${getStatusVariant(emp.status)} border flex items-center gap-1 px-3 py-1.5 font-medium text-sm`}>
                                                                    {getStatusIcon(emp.status)}
                                                                    {emp.status.replace('_', ' ')}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg">No employees assigned to this submission</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="actions" className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Admin Actions</CardTitle>
                                                <CardDescription>
                                                    Update submission status and add comments
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Manager Status Update */}
                                                    <div className="space-y-4">
                                                        <Label className="text-gray-800 font-semibold">Update Manager Status</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['pending', 'in_progress', 'completed', 'rejected'].map((status) => (
                                                                <Button
                                                                    key={status}
                                                                    variant="outline"
                                                                    onClick={() => handleStatusUpdate(selectedSubmission._id, 'manager', status, comments)}
                                                                    disabled={loading}
                                                                    className={`flex-1 min-w-[120px] ${getStatusVariant(status)} border-2`}
                                                                >
                                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : status.replace('_', ' ')}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* TeamLead Status Update */}
                                                    <div className="space-y-4">
                                                        <Label className="text-gray-800 font-semibold">Update TeamLead Status</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['pending', 'in_progress', 'completed', 'rejected'].map((status) => (
                                                                <Button
                                                                    key={status}
                                                                    variant="outline"
                                                                    onClick={() => handleStatusUpdate(selectedSubmission._id, 'teamlead', status, comments)}
                                                                    disabled={loading}
                                                                    className={`flex-1 min-w-[120px] ${getStatusVariant(status)} border-2`}
                                                                >
                                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : status.replace('_', ' ')}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Comments */}
                                                <div className="space-y-4">
                                                    <Label htmlFor="comments" className="text-gray-800 font-semibold">
                                                        Additional Comments
                                                    </Label>
                                                    <Textarea
                                                        id="comments"
                                                        placeholder="Add comments for this status update..."
                                                        value={comments}
                                                        onChange={(e) => setComments(e.target.value)}
                                                        className="min-h-[100px] resize-none"
                                                    />
                                                </div>

                                                {/* Quick Actions */}
                                                <div className="space-y-4">
                                                    <Label className="text-gray-800 font-semibold">Quick Actions</Label>
                                                    <div className="flex flex-wrap gap-3">
                                                        <Button
                                                            onClick={exportToCSV}
                                                            variant="outline"
                                                            className="border-green-200 text-green-700 hover:bg-green-50"
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Export This Submission
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(JSON.stringify(selectedSubmission, null, 2));
                                                                toast.success('Submission data copied to clipboard');
                                                            }}
                                                            variant="outline"
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            Copy Data
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}