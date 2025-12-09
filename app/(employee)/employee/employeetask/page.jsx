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
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Eye,
    Loader2,
    RefreshCw,
    X,
} from "lucide-react";
import axios from "axios";

export default function EmployeeTask() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Employee") {
            router.push("/employeelogin");
            return;
        }

        fetchTasks();
    }, [session, status, router]);

    const fetchTasks = async () => {
        try {
            setFetching(true);
            const response = await axios.get('/api/employee/employeetask');
            if (response.status === 200) {
                setTasks(response.data || []);
                toast.success(`Loaded ${response.data.length} tasks`);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            if (error.response?.status === 401) {
                toast.error("Please login again");
                router.push("/login");
            } else {
                toast.error(error.response?.data?.error || "Failed to fetch tasks");
            }
        } finally {
            setFetching(false);
        }
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        setLoading(true);

        try {
            const updateData = {
                submissionId: taskId,
                status: newStatus,
                feedback: feedback
            };

            const response = await axios.put("/api/employee/employeetask", updateData);

            if (response.status === 200) {
                toast.success("Status updated successfully!");
                fetchTasks();
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

    const handleQuickStatusUpdate = async (taskId, newStatus) => {
        setLoading(true);
        try {
            const updateData = {
                submissionId: taskId,
                status: newStatus
            };

            const response = await axios.put("/api/employee/employeetask", updateData);

            if (response.status === 200) {
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
                fetchTasks();
            }
        } catch (error) {
            console.error("Quick status update error:", error);
            toast.error(error.response?.data?.error || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "completed":
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

    // Get current employee's status for a task
    const getMyStatus = (task) => {
        if (!task.assignedEmployees) return "pending";
        const myAssignment = task.assignedEmployees.find(
            emp => emp.employeeId._id === session.user.id
        );
        return myAssignment?.status || "pending";
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.formId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getMyStatus(task)?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || getMyStatus(task) === statusFilter;

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
        total: tasks.length,
        pending: tasks.filter(t => getMyStatus(t) === 'pending').length,
        in_progress: tasks.filter(t => getMyStatus(t) === 'in_progress').length,
        completed: tasks.filter(t => getMyStatus(t) === 'completed').length,
        rejected: tasks.filter(t => getMyStatus(t) === 'rejected').length
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

    if (!session || session.user.role !== "Employee") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You need to be logged in as Employee to access this page.</p>
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
                            Welcome, {session.user.firstName}! Manage your assigned tasks
                        </p>
                    </div>

                    <Button
                        onClick={fetchTasks}
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        disabled={fetching}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                        {fetching ? 'Refreshing...' : 'Refresh'}
                    </Button>
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
                                    {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
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
                        ) : filteredTasks.length === 0 ? (
                            <div className="text-center py-16 h-full flex items-center justify-center">
                                <div>
                                    <div className="text-gray-300 mb-4">
                                        <FileText className="w-20 h-20 mx-auto" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        {tasks.length === 0 ? "No tasks assigned" : "No matches found"}
                                    </h3>
                                    <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                                        {tasks.length === 0
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
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Task Details</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">My Status</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Overall Status</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Quick Actions</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Assigned Date</TableHead>
                                                <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTasks.map((task) => (
                                                <TableRow
                                                    key={task._id}
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
                                                                    {task.formId?.title || 'Untitled Task'}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {task.formId?.description || 'No description'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge className={`${getStatusVariant(getMyStatus(task))} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                            {getStatusIcon(getMyStatus(task))}
                                                            {getMyStatus(task).replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge className={`${getStatusVariant(task.status)} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                            {getStatusIcon(task.status)}
                                                            {task.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Select 
                                                                onValueChange={(value) => handleQuickStatusUpdate(task._id, value)}
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
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                                            <Calendar className="w-5 h-5 text-blue-500" />
                                                            <span className="text-base font-medium">{formatDate(task.createdAt)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedTask(task);
                                                                setShowDetails(true);
                                                                setFeedback("");
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </Button>
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

                {showDetails && selectedTask && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-white text-2xl">{selectedTask.formId?.title || 'Task Details'}</CardTitle>
                                        <CardDescription className="text-blue-100">
                                            View task details and update your status
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setShowDetails(false);
                                            setSelectedTask(null);
                                            setFeedback("");
                                        }}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Task Information</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-gray-800 font-semibold">Assigned Date</Label>
                                                <p className="text-gray-900 font-medium">{formatDate(selectedTask.createdAt)}</p>
                                            </div>

                                            <div>
                                                <Label className="text-gray-800 font-semibold">My Current Status</Label>
                                                <Badge className={`${getStatusVariant(getMyStatus(selectedTask))} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                    {getStatusIcon(getMyStatus(selectedTask))}
                                                    {getMyStatus(selectedTask).replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            <div>
                                                <Label className="text-gray-800 font-semibold">Overall Task Status</Label>
                                                <Badge className={`${getStatusVariant(selectedTask.status)} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                    {getStatusIcon(selectedTask.status)}
                                                    {selectedTask.status.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            {selectedTask.completedAt && (
                                                <div>
                                                    <Label className="text-gray-800 font-semibold">Completed Date</Label>
                                                    <p className="text-gray-900 font-medium">{formatDate(selectedTask.completedAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Update My Status</h3>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                onClick={() => handleStatusUpdate(selectedTask._id, "pending")}
                                                variant="outline"
                                                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                                disabled={loading}
                                            >
                                                Set Pending
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate(selectedTask._id, "in_progress")}
                                                variant="outline"
                                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                disabled={loading}
                                            >
                                                Set In Progress
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate(selectedTask._id, "completed")}
                                                className="bg-green-600 text-white hover:bg-green-700"
                                                disabled={loading}
                                            >
                                                Set Completed
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

                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Data</h3>
                                    <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                                        {selectedTask.formData && Object.entries(selectedTask.formData).map(([key, value]) => (
                                            <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <Label className="text-gray-800 font-semibold capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </Label>
                                                </div>
                                                <div className="text-gray-900 font-medium ml-11">
                                                    {formatFieldValue(value)}
                                                </div>
                                            </div>
                                        ))}
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