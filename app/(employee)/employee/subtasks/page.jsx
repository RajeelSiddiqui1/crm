"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    Users,
    User
} from "lucide-react";
import axios from "axios";

export default function EmployeeSubtasksPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedSubtask, setSelectedSubtask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Employee") {
            router.push("/login");
            return;
        }

        fetchSubtasks();
    }, [session, status, router]);

    const fetchSubtasks = async () => {
        try {
            setFetching(true);
            const response = await axios.get('/api/employee/subtasks');
            if (response.status === 200) {
                setSubtasks(response.data.subtasks || []);
            }
        } catch (error) {
            console.error("Error fetching subtasks:", error);
            toast.error("Failed to fetch subtasks");
        } finally {
            setFetching(false);
        }
    };

    const openModal = async (subtask) => {
        try {
            const response = await axios.get(`/api/employee/subtasks/${subtask._id}`);
            if (response.status === 200) {
                setSelectedSubtask(response.data);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching subtask details:", error);
            toast.error("Failed to load subtask details");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubtask(null);
    };

    const updateSubtaskStatus = async (newStatus) => {
        try {
            const response = await axios.put(`/api/employee/subtasks/${selectedSubtask._id}`, {
                status: newStatus
            });

            if (response.status === 200) {
                setSelectedSubtask(response.data);
                // Update in local list as well
                setSubtasks(prev => prev.map(st =>
                    st._id === selectedSubtask._id
                        ? { ...st, employeeStatus: newStatus }
                        : st
                ));
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
            }
        } catch (error) {
            console.error("Error updating subtask:", error);
            toast.error("Failed to update subtask status");
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredSubtasks = subtasks.filter(subtask => {
        const matchesSearch =
            subtask.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subtask.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subtask.submissionId?.title?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || subtask.employeeStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusStats = {
        total: subtasks.length,
        pending: subtasks.filter(s => s.employeeStatus === 'pending').length,
        in_progress: subtasks.filter(s => s.employeeStatus === 'in_progress').length,
        completed: subtasks.filter(s => s.employeeStatus === 'completed').length,
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-black">Loading...</span>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Employee") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
                    <p className="text-gray-700">You need to be logged in as Employee to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <Toaster position="top-right" />

            {/* Subtask Detail Modal */}
            {isModalOpen && selectedSubtask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileText className="w-6 h-6" />
                                        <h2 className="text-2xl font-bold truncate text-white">
                                            {selectedSubtask.title}
                                        </h2>
                                    </div>
                                    <p className="text-blue-100 text-sm line-clamp-2">
                                        {selectedSubtask.description}
                                    </p>
                                </div>
                                <Button
                                    onClick={closeModal}
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                                >
                                    <XCircle className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Status Update */}
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-black">Update Your Status</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['pending', 'in_progress', 'completed'].map((status) => (
                                                    <Button
                                                        key={status}
                                                        variant={selectedSubtask.employeeStatus === status ? "default" : "outline"}
                                                        className={`flex flex-col h-16 ${selectedSubtask.employeeStatus === status
                                                                ? 'bg-blue-600 text-white'
                                                                : 'border-gray-300 text-black hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => updateSubtaskStatus(status)}
                                                    >
                                                        {getStatusIcon(status)}
                                                        <span className="text-xs mt-1 capitalize">
                                                            {status.replace('_', ' ')}
                                                        </span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Task Details */}
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-black">Task Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-black">Description</label>
                                                <p className="text-gray-700 mt-1">{selectedSubtask.description}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-black">Start Date</label>
                                                    <p className="text-gray-700">{formatDate(selectedSubtask.startDate)}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-black">End Date</label>
                                                    <p className="text-gray-700">{formatDate(selectedSubtask.endDate)}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-black">Time</label>
                                                <p className="text-gray-700">{selectedSubtask.startTime} - {selectedSubtask.endTime}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Team Lead Info */}
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-black">Team Lead</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                        {selectedSubtask.teamLeadId?.firstName?.[0]}{selectedSubtask.teamLeadId?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-black">
                                                        {selectedSubtask.teamLeadId?.firstName} {selectedSubtask.teamLeadId?.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-700">{selectedSubtask.teamLeadId?.email}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Other Assigned Employees */}
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-black">Team Members</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {selectedSubtask.assignedEmployees?.slice(0, 5).map((emp, index) => (
                                                    <div key={emp.employeeId._id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                                                                    {emp.employeeId.firstName?.[0]}{emp.employeeId.lastName?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm text-black">
                                                                {emp.employeeId.firstName} {emp.employeeId.lastName}
                                                            </span>
                                                        </div>
                                                        <Badge className={getStatusVariant(emp.status)}>
                                                            {emp.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                ))}
                                                {selectedSubtask.assignedEmployees?.length > 5 && (
                                                    <div className="text-center text-sm text-gray-600">
                                                        +{selectedSubtask.assignedEmployees.length - 5} more team members
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Parent Submission */}
                                    <Card className="border border-gray-200 shadow-sm">
                                        {/* <CardHeader>
                                            <CardTitle className="text-black">Parent Submission</CardTitle>
                                        </CardHeader> */}
                                        <CardContent>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-black">
                                                    {selectedSubtask.submissionId?.title || 'N/A'}
                                                </h4>
                                                <p className="text-sm text-gray-700">
                                                    {selectedSubtask.submissionId?.description || 'No description available'}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t bg-gray-50 px-6 py-4">
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={closeModal}
                                    className="border-gray-300 text-black"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Page Content */}
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            My Assigned Tasks
                        </h1>
                        <p className="text-black mt-3 text-lg">
                            Manage your assigned subtasks and update progress
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={fetchSubtasks}
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            disabled={fetching}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                            {fetching ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-black">{statusStats.total}</div>
                            <div className="text-sm text-gray-700">Total Tasks</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{statusStats.pending}</div>
                            <div className="text-sm text-gray-700">Pending</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{statusStats.in_progress}</div>
                            <div className="text-sm text-gray-700">In Progress</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{statusStats.completed}</div>
                            <div className="text-sm text-gray-700">Completed</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subtasks Table */}
                <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold text-black">
                                    My Tasks
                                </CardTitle>
                                <CardDescription className="text-gray-700 text-base">
                                    {filteredSubtasks.length} task{filteredSubtasks.length !== 1 ? 's' : ''} found
                                </CardDescription>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search tasks..."
                                        className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11 text-base text-black bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black bg-white">
                                        <SelectValue placeholder="Filter Status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {fetching ? (
                            <div className="flex justify-center items-center py-16">
                                <div className="flex items-center gap-3 text-black">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-lg">Loading your tasks...</span>
                                </div>
                            </div>
                        ) : filteredSubtasks.length === 0 ? (
                            <div className="text-center py-16">
                                <div>
                                    <div className="text-gray-300 mb-4">
                                        <FileText className="w-20 h-20 mx-auto" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-black mb-3">
                                        {subtasks.length === 0 ? "No tasks assigned" : "No matches found"}
                                    </h3>
                                    <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                                        {subtasks.length === 0
                                            ? "You don't have any assigned tasks yet."
                                            : "Try adjusting your search terms to find what you're looking for."
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">Task Details</TableHead>
                                            {/* <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">Parent Submission</TableHead> */}
                                            <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">Teamlead Status</TableHead>
                                            <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">My Status</TableHead>
                                            <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">Team Lead</TableHead>
                                            <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">Timeline</TableHead>
                                            <TableHead className="font-bold text-black text-sm uppercase tracking-wide py-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSubtasks.map((subtask) => (
                                            <TableRow
                                                key={subtask._id}
                                                className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-300 border-b border-gray-100/50"
                                            >
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-600/30 transition-all duration-300">
                                                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold">
                                                                <FileText className="w-4 h-4" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-black text-lg group-hover:text-blue-700 transition-colors duration-200">
                                                                {subtask.title}
                                                            </div>
                                                            <div className="text-sm text-gray-700 line-clamp-2">
                                                                {subtask.description}
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Users className="w-3 h-3 text-gray-500" />
                                                                <span className="text-xs text-gray-700">
                                                                    {subtask.totalAssignedEmployees} team members
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                     <TableCell className="py-4">
                                                    <Badge className={`${getStatusVariant(subtask.employeeStatus || 'pending')} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                        {getStatusIcon(subtask.employeeStatus || 'pending')}
                                                        {(subtask.employeeStatus || 'pending').replace('_', ' ')}
                                                    </Badge>

                                                </TableCell>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge className={`${getStatusVariant(subtask.employeeStatus || 'pending')} border flex items-center gap-1 px-3 py-1.5 font-medium`}>
                                                        {getStatusIcon(subtask.employeeStatus || 'pending')}
                                                        {(subtask.employeeStatus || 'pending').replace('_', ' ')}
                                                    </Badge>

                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                                                {subtask.teamLeadId?.firstName?.[0]}{subtask.teamLeadId?.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-black">
                                                            {subtask.teamLeadId?.firstName} {subtask.teamLeadId?.lastName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-black">
                                                            <Calendar className="w-4 h-4 text-green-500" />
                                                            <span>Start: {formatDate(subtask.startDate)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-black">
                                                            <Calendar className="w-4 h-4 text-red-500" />
                                                            <span>End: {formatDate(subtask.endDate)}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                                                        onClick={() => openModal(subtask)}
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}