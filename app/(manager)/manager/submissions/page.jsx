"use client";
import React, { useState, useEffect, useRef } from "react";
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
    Edit, 
    Trash2,
    EyeOff,
    Star,
    Upload,
    MapPin,
    CreditCard,
    Phone,
    Link,
    CheckSquare,
    Radio,
    SlidersHorizontal,
    ToggleLeft,
    Mail,
    Hash,
    List,
    Lock,
    X,
    Filter,
    Download,
    RefreshCw
} from "lucide-react";
import axios from "axios";

export default function ManagerSubmissionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [editingSubmission, setEditingSubmission] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [statusUpdate, setStatusUpdate] = useState({
        status: "",
        managerComments: ""
    });
    const [showPasswords, setShowPasswords] = useState({});
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const fileInputRefs = useRef({});

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Manager") {
            router.push("/managerlogin");
            return;
        }

        fetchSubmissions();
    }, [session, status, router]);

    const fetchSubmissions = async () => {
        try {
            setFetching(true);
            const response = await axios.get(`/api/manager/submissions?departmentId=${session.user.depId}`);
            if (response.status === 200) {
                setSubmissions(response.data || []);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
            toast.error("Failed to fetch submissions");
        } finally {
            setFetching(false);
        }
    };

    const handleStatusUpdate = async (submissionId, newStatus, comments = "") => {
        setLoading(true);

        try {
            const updateData = {
                submissionId: submissionId,
                status: newStatus,
                managerComments: comments
            };

            const response = await axios.put("/api/manager/submissions", updateData);

            if (response.status === 200) {
                toast.success("Status updated successfully!");
                fetchSubmissions();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStatusUpdate = async (submissionId, newStatus) => {
        await handleStatusUpdate(submissionId, newStatus, "Status updated via quick action");
    };

    const handleEditSubmission = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.put(`/api/manager/submissions/${editingSubmission._id}`, {
                formData: editingSubmission.formData,
                managerComments: editingSubmission.managerComments
            });

            if (response.status === 200) {
                toast.success("Submission updated successfully!");
                setShowEditForm(false);
                setEditingSubmission(null);
                fetchSubmissions();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update submission");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubmission = async (submissionId) => {
        if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await axios.delete(`/api/manager/submissions/${submissionId}`);

            if (response.status === 200) {
                toast.success("Submission deleted successfully!");
                fetchSubmissions();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete submission");
        }
    };

    const viewSubmissionDetails = (submission) => {
        setSelectedSubmission(submission);
        setStatusUpdate({
            status: submission.status,
            managerComments: submission.managerComments || ""
        });
        setShowDetails(true);
    };

    const editSubmission = (submission) => {
        setEditingSubmission({ 
            ...submission,
            formData: { ...submission.formData }
        });
        setShowEditForm(true);
        setShowPasswords({});
    };

    const handleEditFieldChange = (fieldName, value) => {
        setEditingSubmission(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [fieldName]: value
            }
        }));
    };

    const togglePasswordVisibility = (fieldName) => {
        setShowPasswords(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    const handleFileUploadClick = (fieldName) => {
        if (fileInputRefs.current[fieldName]) {
            fileInputRefs.current[fieldName].click();
        }
    };

    const handleFileChange = (fieldName, event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleEditFieldChange(fieldName, files);
            toast.success(`File selected: ${files[0].name}`);
        }
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

    const renderEditFormField = (fieldConfig, fieldName, fieldValue) => {
        if (!fieldConfig) {
            return (
                <Input
                    value={fieldValue || ""}
                    onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                />
            );
        }

        switch (fieldConfig.type) {
            case "text":
            case "email":
            case "number":
            case "tel":
            case "url":
                return (
                    <Input
                        type={fieldConfig.type}
                        value={fieldValue || ""}
                        onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
                        placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                    />
                );
            case "password":
                return (
                    <div className="relative">
                        <Input
                            type={showPasswords[fieldName] ? "text" : "password"}
                            value={fieldValue || ""}
                            onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
                            placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility(fieldName)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPasswords[fieldName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                );
            case "textarea":
                return (
                    <Textarea
                        value={fieldValue || ""}
                        onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
                        placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                        rows={4}
                    />
                );
            case "select":
                return (
                    <Select 
                        value={fieldValue || ""} 
                        onValueChange={(value) => handleEditFieldChange(fieldName, value)}
                    >
                        <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                            <SelectValue placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {fieldConfig.options?.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "date":
                return (
                    <Input
                        type="date"
                        value={fieldValue || ""}
                        onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                    />
                );
            case "checkbox":
                return (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={!!fieldValue}
                            onChange={(e) => handleEditFieldChange(fieldName, e.target.checked)}
                            className="rounded border-gray-300 bg-white w-4 h-4"
                        />
                        <Label className="text-gray-700">{fieldConfig.label}</Label>
                    </div>
                );
            case "radio":
                return (
                    <div className="space-y-2">
                        {fieldConfig.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name={fieldName}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
                                    className="rounded-full border-gray-300 bg-white w-4 h-4"
                                />
                                <Label className="text-gray-700">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case "file":
                return (
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => handleFileUploadClick(fieldName)}
                    >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <Input
                            ref={el => fileInputRefs.current[fieldName] = el}
                            type="file"
                            onChange={(e) => handleFileChange(fieldName, e)}
                            className="hidden"
                        />
                        {fieldValue && (
                            <p className="text-sm text-green-600 mt-2">
                                {fieldValue.name || 'File selected'}
                            </p>
                        )}
                    </div>
                );
            default:
                return (
                    <Input
                        value={fieldValue || ""}
                        onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                    />
                );
        }
    };

    const getFieldIcon = (fieldType) => {
        const fieldIcons = {
            text: FileText,
            email: Mail,
            number: Hash,
            tel: Phone,
            url: Link,
            password: Lock,
            date: Calendar,
            select: List,
            textarea: FileText,
            checkbox: CheckSquare,
            radio: Radio,
            range: SlidersHorizontal,
            file: Upload,
            rating: Star,
            toggle: ToggleLeft,
            address: MapPin,
            creditCard: CreditCard
        };
        return fieldIcons[fieldType] || FileText;
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

    // Filter submissions based on search and status
    const filteredSubmissions = submissions.filter(submission => {
        const matchesSearch = 
            submission.formId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.status?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || submission.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Status statistics
    const statusStats = {
        total: submissions.length,
        approved: submissions.filter(s => s.status === 'approved').length,
        pending: submissions.filter(s => s.status === 'pending').length,
        in_progress: submissions.filter(s => s.status === 'in_progress').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
        completed: submissions.filter(s => s.status === 'completed').length
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

    if (!session || session.user.role !== "Manager") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <Toaster position="top-right" />
            
            <Button
                onClick={() => router.push("/manager/forms")}
                className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full p-6 shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all duration-300 transform hover:scale-110 z-50"
            >
                <FileText className="w-6 h-6 mr-2" />
                Add Form
            </Button>

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            Form Submissions
                        </h1>
                        <p className="text-gray-800 mt-3 text-lg">
                            Track and manage form submissions from your team
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button
                            onClick={fetchSubmissions}
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Status Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{statusStats.total}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{statusStats.approved}</div>
                            <div className="text-sm text-gray-600">Approved</div>
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
                            <div className="text-2xl font-bold text-yellow-600">{statusStats.pending}</div>
                            <div className="text-sm text-gray-600">Pending</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{statusStats.rejected}</div>
                            <div className="text-sm text-gray-600">Rejected</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-lg">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-indigo-600">{statusStats.completed}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Submissions Table */}
                <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
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
                                        className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11 text-base text-gray-900"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                                        <SelectValue placeholder="Filter status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-black bg-white">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        {fetching ? (
                            <div className="flex justify-center items-center py-16">
                                <div className="flex items-center gap-3 text-gray-800">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-lg">Loading submissions...</span>
                                </div>
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-gray-300 mb-4">
                                    <FileText className="w-20 h-20 mx-auto" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {submissions.length === 0 ? "No submissions yet" : "No matches found"}
                                </h3>
                                <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                                    {submissions.length === 0
                                        ? "Form submissions from your team will appear here."
                                        : "Try adjusting your search terms to find what you're looking for."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Form Details</TableHead>
                                        
                                            <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Status</TableHead>
                                            <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Quick Actions</TableHead>
                                            
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
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            onClick={() => handleQuickStatusUpdate(submission._id, "approved")}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                                                            disabled={loading}
                                                        >
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleQuickStatusUpdate(submission._id, "rejected")}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                                            disabled={loading}
                                                        >
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleQuickStatusUpdate(submission._id, "in_progress")}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                                                            disabled={loading}
                                                        >
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            In Progress
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                               
                                                <TableCell className="py-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => viewSubmissionDetails(submission)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            onClick={() => editSubmission(submission)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                                                        >
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteSubmission(submission._id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submission Details Modal */}
                {showDetails && selectedSubmission && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-white text-2xl">{selectedSubmission.formId?.title || 'Submission Details'}</CardTitle>
                                        <CardDescription className="text-blue-100">
                                            View and update submission status
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setShowDetails(false);
                                            setSelectedSubmission(null);
                                        }}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Submission Information */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Submission Information</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-gray-800 font-semibold">Assigned To</Label>
                                                <p className="text-gray-900 font-medium">{selectedSubmission.assignedTo}</p>
                                            </div>

                                            <div>
                                                <Label className="text-gray-800 font-semibold">Submission Date</Label>
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

                                            {selectedSubmission.teamLeadFeedback && (
                                                <div>
                                                    <Label className="text-gray-800 font-semibold">Team Lead Feedback</Label>
                                                    <p className="text-gray-900 font-medium">{selectedSubmission.teamLeadFeedback}</p>
                                                </div>
                                            )}

                                            {selectedSubmission.managerComments && (
                                                <div>
                                                    <Label className="text-gray-800 font-semibold">Manager Comments</Label>
                                                    <p className="text-gray-900 font-medium">{selectedSubmission.managerComments}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Form Data */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Form Data</h3>

                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {selectedSubmission.formData && Object.entries(selectedSubmission.formData).map(([key, value]) => {
                                                const fieldConfig = selectedSubmission.formId?.fields?.find(f => f.name === key);
                                                const IconComponent = fieldConfig ? getFieldIcon(fieldConfig.type) : FileText;
                                                
                                                return (
                                                    <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                                <IconComponent className="w-4 h-4" />
                                                            </div>
                                                            <Label className="text-gray-800 font-semibold capitalize">
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </Label>
                                                        </div>
                                                        <div className="text-gray-900 font-medium">
                                                            {formatFieldValue(value)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Update Form */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handleStatusUpdate(selectedSubmission._id, statusUpdate.status, statusUpdate.managerComments);
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Label htmlFor="status" className="text-gray-800 font-semibold">
                                                    Status *
                                                </Label>
                                                <Select
                                                    value={statusUpdate.status}
                                                    onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}
                                                >
                                                    <SelectTrigger className="w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="rejected">Rejected</SelectItem>
                                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="managerComments" className="text-gray-800 font-semibold">
                                                    Manager Comments
                                                </Label>
                                                <Textarea
                                                    value={statusUpdate.managerComments}
                                                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, managerComments: e.target.value }))}
                                                    placeholder="Add your comments..."
                                                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-2.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    "Update Status"
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Edit Submission Modal */}
                {showEditForm && editingSubmission && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-white text-2xl">Edit Submission</CardTitle>
                                        <CardDescription className="text-green-100">
                                            Update form data and comments
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setShowEditForm(false);
                                            setEditingSubmission(null);
                                        }}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 overflow-y-auto">
                                <form onSubmit={handleEditSubmission} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-8">
                                        {/* Form Data */}
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Form Data</h3>

                                            <div className="space-y-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                {editingSubmission.formData && Object.entries(editingSubmission.formData).map(([fieldName, fieldValue]) => {
                                                    const fieldConfig = editingSubmission.formId?.fields?.find(f => f.name === fieldName);
                                                    const IconComponent = fieldConfig ? getFieldIcon(fieldConfig.type) : FileText;
                                                    
                                                    return (
                                                        <div key={fieldName} className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                                    <IconComponent className="w-4 h-4" />
                                                                </div>
                                                                <Label className="text-gray-800 font-semibold text-lg capitalize">
                                                                    {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                                                                    {fieldConfig?.required && <span className="text-red-500 ml-1">*</span>}
                                                                </Label>
                                                            </div>
                                                            {renderEditFormField(fieldConfig, fieldName, fieldValue)}
                                                            {fieldConfig?.placeholder && (
                                                                <p className="text-xs text-gray-500 mt-2">{fieldConfig.placeholder}</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Manager Comments */}
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Manager Comments</h3>

                                            <div className="space-y-4">
                                                <div className="space-y-3">
                                                    <Label htmlFor="managerComments" className="text-gray-800 font-semibold">
                                                        Comments
                                                    </Label>
                                                    <Textarea
                                                        value={editingSubmission.managerComments || ""}
                                                        onChange={(e) => setEditingSubmission(prev => ({
                                                            ...prev,
                                                            managerComments: e.target.value
                                                        }))}
                                                        placeholder="Add your comments..."
                                                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                                        rows={6}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-8 py-2.5 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Update Submission
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowEditForm(false);
                                                setEditingSubmission(null);
                                            }}
                                            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-2.5 transition-all duration-200 shadow-sm"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}