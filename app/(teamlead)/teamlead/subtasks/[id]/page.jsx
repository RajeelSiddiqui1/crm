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
        
        // Debugging info show karo
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
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "in_progress":
                return "bg-yellow-100 text-yellow-800";
            case "late":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
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
                    <Link href="/teamlead/dashboard">
                        <Button variant="outline" size="icon" className="rounded-full">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">Employee Form Submissions</h1>
                        <p className="text-gray-600 mt-2">
                            Review and manage employee form submissions for this task
                        </p>
                    </div>
                    <Button onClick={fetchSubmissions} variant="outline">
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
                        <CardTitle>Employee Submissions</CardTitle>
                        <CardDescription>
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
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {submission.formId?.title || "Unknown Form"}
                                                    </h3>
                                                    <Badge variant="secondary" className={getStatusColor(submission.teamleadstatus)}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(submission.teamleadstatus)}
                                                            {getStatusText(submission.teamleadstatus)}
                                                        </span>
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
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
                                                    <SelectTrigger className="w-40">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="rejected">Rejected</SelectItem>
                                                        <SelectItem value="late">Late</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedSubmission(
                                                        selectedSubmission?._id === submission._id ? null : submission
                                                    )}
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