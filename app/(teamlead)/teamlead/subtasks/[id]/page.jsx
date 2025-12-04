"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, FileText, CheckCircle, XCircle, Clock, AlertCircle, User, Calendar, Eye } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function TeamleadEmployeeTaskPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const subtaskId = params.id;

    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "TeamLead") {
            router.push("/login");
            return;
        }

        fetchSubmissions();
    }, [session, status, router, subtaskId]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/teamlead/subtasks/${subtaskId}/submissions`);
            if (response.status === 200) {
                setSubmissions(response.data);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
            toast.error("Failed to load employee submissions");
        } finally {
            setLoading(false);
        }
    };

const handleStatusUpdate = async (submissionId, newStatus) => {
    setUpdating(true);
    try {
        const response = await axios.patch(`/api/teamlead/submissions/${submissionId}`, {
            teamleadstatus: newStatus
        });

        if (response.status === 200) {
            toast.success("Status updated successfully");
            setSubmissions(prev => prev.map(sub => 
                sub._id === submissionId 
                    ? { ...sub, teamleadstatus: newStatus }
                    : sub
            ));
        }
    } catch (error) {
        console.error("Error updating status:", error);
        const errorMessage = error.response?.data?.error || "Failed to update status";
        toast.error(errorMessage);
        
        if (error.response?.status === 403) {
            console.log("403 Error Details:", error.response.data);
        }
    } finally {
        setUpdating(false);
    }
};

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case "rejected":
                return <XCircle className="w-4 h-4 text-red-600" />;
            case "completed":
                return <CheckCircle className="w-4 h-4 text-blue-600" />;
            case "late":
                return <AlertCircle className="w-4 h-4 text-orange-600" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "rejected":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "completed":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "in_progress":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "late":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "approved":
                return "Approved";
            case "rejected":
                return "Rejected";
            case "completed":
                return "Completed";
            case "in_progress":
                return "In Progress";
            case "late":
                return "Late";
            default:
                return "Pending";
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-700">Loading submissions...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "TeamLead") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/teamlead/subtasks">
                        <Button variant="outline" size="icon" className="rounded-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark">Employee Form Submissions</h1>
                        <p className="text-gray-600 dark:text-gray-900 mt-2">
                            Review and manage employee form submissions for this task
                        </p>
                    </div>
                    <Button onClick={fetchSubmissions} variant="outline" className="dark:border-gray-700 dark:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-white">
                        Refresh
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                                    <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {submissions.filter(s => s.teamleadstatus === "pending").length}
                                    </p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Approved</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {submissions.filter(s => s.teamleadstatus === "approved").length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {submissions.filter(s => s.teamleadstatus === "rejected").length}
                                    </p>
                                </div>
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="dark:text-white">Employee Submissions</CardTitle>
                        <CardDescription className="dark:text-gray-400">
                            Review each submission and update their status accordingly
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submissions.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                                <p className="text-gray-600">Employees haven't submitted any forms for this task yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {submissions.map((submission) => (
                                    <div key={submission._id} className="border rounded-lg p-6 bg-white">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {submission.formId?.title || "Unknown Form"}
                                                    </h3>
                                                    <Badge variant="secondary" className={getStatusColor(submission.teamleadstatus)}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(submission.teamleadstatus)}
                                                            {getStatusText(submission.teamleadstatus)}
                                                        </span>
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {submission.employeeId 
                                                            ? `${submission.employeeId.firstName} ${submission.employeeId.lastName}`
                                                            : submission.submittedBy
                                                        }
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(submission.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {submission.completedAt && (
                                                        <span className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Completed: {new Date(submission.completedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Select
                                                    value={submission.teamleadstatus}
                                                    onValueChange={(value) => handleStatusUpdate(submission._id, value)}
                                                    disabled={updating}
                                                >
                                                    <SelectTrigger className="w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                                        <SelectItem value="pending" className="dark:text-white dark:focus:bg-gray-700">Pending</SelectItem>
                                                        <SelectItem value="in_progress" className="dark:text-white dark:focus:bg-gray-700">In Progress</SelectItem>
                                                        <SelectItem value="completed" className="dark:text-white dark:focus:bg-gray-700">Completed</SelectItem>
                                                        <SelectItem value="approved" className="dark:text-white dark:focus:bg-gray-700">Approved</SelectItem>
                                                        <SelectItem value="rejected" className="dark:text-white dark:focus:bg-gray-700">Rejected</SelectItem>
                                                        <SelectItem value="late" className="dark:text-white dark:focus:bg-gray-700">Late</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedSubmission(
                                                        selectedSubmission?._id === submission._id ? null : submission
                                                    )}
                                                    className="dark:border-gray-700 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-white"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    {selectedSubmission?._id === submission._id ? "Hide" : "View"}
                                                </Button>
                                            </div>
                                        </div>

                                        {selectedSubmission?._id === submission._id && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                                <h4 className="font-semibold text-gray-900 mb-3">Submitted Form Data:</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(submission.formData).map(([key, value]) => (
                                                        <div key={key} className="bg-white p-3 rounded border">
                                                            <label className="text-sm font-medium text-gray-700 capitalize">
                                                                {key.replace(/([A-Z])/g, ' $1')}:
                                                            </label>
                                                            <p className="text-gray-900 mt-1">
                                                                {Array.isArray(value) ? value.join(", ") : String(value)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}