"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, FileText, CheckCircle, ClipboardList, Users, Calendar, Eye, Clock, AlertCircle, RefreshCw, Target, Filter } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function EmployeeSubmissionForm() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const subtaskId = params.id;

    const [availableForms, setAvailableForms] = useState([]);
    const [completedForms, setCompletedForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [formData, setFormData] = useState({});
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [subtaskDetails, setSubtaskDetails] = useState(null);
    const [existingSubmissions, setExistingSubmissions] = useState([]);
    const [viewMode, setViewMode] = useState(false);
    const [activeTab, setActiveTab] = useState("available");
    const [filter, setFilter] = useState("all");
    const [error, setError] = useState(null);

    useEffect(() => {
        if (status === "loading") return;
        if (!session || session.user.role !== "Employee") {
            router.push("/login");
            return;
        }
        fetchAllData();
    }, [session, status, router, subtaskId]);

    useEffect(() => {
        if (activeTab === "completed") {
            fetchCompletedForms();
        }
    }, [filter, activeTab]);

    const fetchAllData = async () => {
        setFetching(true);
        try {
            await Promise.all([
                fetchAvailableForms(),
                fetchCompletedForms(),
                fetchSubtaskDetails(),
                fetchExistingSubmissions()
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setFetching(false);
        }
    };

    const fetchAvailableForms = async () => {
        try {
            setError(null);
            const response = await axios.get(`/api/employee/available-forms?subtaskId=${subtaskId}`);
            if (response.status === 200) {
                setAvailableForms(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error("Error fetching available forms:", error);
            const errorMessage = error.response?.data?.error || "Failed to load available forms";
            setError(errorMessage);
            setAvailableForms([]);
        }
    };

    const fetchCompletedForms = async () => {
        try {
            const response = await axios.get(`/api/employee/completed-forms?subtaskId=${subtaskId}&filter=${filter}`);
            if (response.status === 200) {
                setCompletedForms(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error("Error fetching completed forms:", error);
            setCompletedForms([]);
        }
    };

    const fetchSubtaskDetails = async () => {
        try {
            const response = await axios.get(`/api/employee/subtasks/${subtaskId}`);
            if (response.status === 200) {
                setSubtaskDetails(response.data);
            }
        } catch (error) {
            console.error("Error fetching subtask details:", error);
            toast.error("Failed to load task details");
        }
    };

const fetchExistingSubmissions = async () => {
    try {
        // Use completed forms data as existing submissions
        const response = await axios.get(`/api/employee/completed-forms?subtaskId=${subtaskId}&filter=all`);
        if (response.status === 200) {
            setExistingSubmissions(response.data);
        }
    } catch (error) {
        console.error("Error fetching existing submissions:", error);
        setExistingSubmissions([]);
    }
};

const getProgressInfo = () => {
    if (!subtaskDetails?.lead) return { completed: 0, required: 1, remaining: 1, progress: 0 };
    
    const required = parseInt(subtaskDetails.lead) || 1;
    
    // Count approved submissions from existingSubmissions
    const approvedByLead = existingSubmissions.filter(
        submission => submission.teamleadstatus === "approved"
    );
    
    const completed = approvedByLead.length;
    const remaining = Math.max(0, required - completed);
    const progress = required > 0 ? (completed / required) * 100 : 0;
    
    return { completed, required, remaining, progress };
};
    const handleFormSelect = (formId, isCompleted = false) => {
        let form;
        if (isCompleted) {
            form = completedForms.find(f => f._id === formId);
        } else {
            form = availableForms.find(f => f._id === formId);
        }
        if (!form) {
            toast.error("Form not found");
            return;
        }
        setSelectedForm(form);
        setFormData(isCompleted ? (form.formData || {}) : {});
        setSubmitted(false);
        setViewMode(isCompleted);
    };

    const handleInputChange = (fieldName, value) => {
        if (viewMode) return;
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleArrayInputChange = (fieldName, value, isChecked) => {
        if (viewMode) return;
        setFormData(prev => {
            const currentArray = prev[fieldName] || [];
            let newArray;
            if (isChecked) {
                newArray = [...currentArray, value];
            } else {
                newArray = currentArray.filter(item => item !== value);
            }
            return {
                ...prev,
                [fieldName]: newArray
            };
        });
    };

    const validateForm = () => {
        if (!selectedForm) {
            toast.error("Please select a form first");
            return false;
        }
        if (!selectedForm.fields || !Array.isArray(selectedForm.fields)) {
            toast.error("Form configuration error: No fields found");
            return false;
        }
        for (const field of selectedForm.fields) {
            if (field.required) {
                const value = formData[field.name];
                if (value === undefined || value === null || value === "" || 
                    (Array.isArray(value) && value.length === 0)) {
                    toast.error(`Please fill in "${field.label}"`);
                    return false;
                }
            }
        }
        return true;
    };

const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const progress = getProgressInfo();
    console.log("📊 Client Progress:", progress);
    
    if (progress.completed >= progress.required) {
        toast.error(`You have already completed ${progress.required} forms. No more submissions allowed.`);
        return;
    }
    
    setSubmitting(true);
    try {
        console.log("🚀 Submitting form:", {
            formId: selectedForm._id,
            subtaskId: subtaskId
        });
        
        const response = await axios.post("/api/employee/submission", {
            formId: selectedForm._id,
            subtaskId: subtaskId,
            formData: formData
        });
        
        if (response.status === 201) {
            console.log("✅ Form submitted successfully");
            toast.success("Form submitted successfully!");
            setSubmitted(true);
            await fetchAllData();
            
            const newProgress = getProgressInfo();
            if (newProgress.remaining === 0) {
                toast.success("Congratulations! You have completed all required forms!");
            }
        }
    } catch (error) {
        console.error("❌ Form submission error:", error.response?.data);
        toast.error(error.response?.data?.error || "Failed to submit form");
    } finally {
        setSubmitting(false);
    }
};

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case "rejected":
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-600" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "approved":
                return "Approved";
            case "rejected":
                return "Rejected";
            default:
                return "Pending Review";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-800 border-green-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
    };

    const isLateSubmission = (submittedAt) => {
        const submissionDate = new Date(submittedAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return submissionDate < sevenDaysAgo;
    };

    const renderField = (field) => {
        const fieldValue = formData[field.name] || "";
        const isReadOnly = viewMode;
        switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "date":
                return (
                    <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={fieldValue}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        readOnly={isReadOnly}
                        className={`mt-1 bg-white border-gray-300 focus:border-blue-400 transition-colors text-black ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                );
            case "textarea":
                return (
                    <Textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        value={fieldValue}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        readOnly={isReadOnly}
                        className={`mt-1 bg-white border-gray-300 focus:border-blue-400 transition-colors min-h-[100px] text-black ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                );
            case "select":
                return (
                    <Select
                        value={fieldValue}
                        onValueChange={(value) => handleInputChange(field.name, value)}
                        disabled={isReadOnly}
                    >
                        <SelectTrigger className={`mt-1 bg-white border-gray-300 focus:border-blue-400 transition-colors text-black ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                            <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "radio":
                return (
                    <RadioGroup
                        value={fieldValue}
                        onValueChange={(value) => handleInputChange(field.name, value)}
                        className="mt-1 space-y-3"
                        disabled={isReadOnly}
                    >
                        {field.options?.map((option, index) => (
                            <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${isReadOnly ? "bg-gray-100 border-gray-300" : "bg-white border-gray-300"}`}>
                                <RadioGroupItem 
                                    value={option} 
                                    id={`${field.name}-${index}`} 
                                    className="text-blue-600"
                                    disabled={isReadOnly}
                                />
                                <Label htmlFor={`${field.name}-${index}`} className="font-medium text-black cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case "checkbox":
                return (
                    <div className="space-y-3 mt-1">
                        {field.options?.map((option, index) => (
                            <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${isReadOnly ? "bg-gray-100 border-gray-300" : "bg-white border-gray-300"}`}>
                                <Checkbox
                                    id={`${field.name}-${index}`}
                                    checked={Array.isArray(formData[field.name]) && formData[field.name].includes(option)}
                                    onCheckedChange={(checked) => 
                                        handleArrayInputChange(field.name, option, checked)
                                    }
                                    className="text-blue-600"
                                    disabled={isReadOnly}
                                />
                                <Label htmlFor={`${field.name}-${index}`} className="font-medium text-black cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </div>
                );
            default:
                return (
                    <Input
                        id={field.name}
                        type="text"
                        placeholder={field.placeholder}
                        value={fieldValue}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        readOnly={isReadOnly}
                        className={`mt-1 bg-white border-gray-300 focus:border-blue-400 transition-colors text-black ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                );
        }
    };

    const progressInfo = getProgressInfo();

    if (status === "loading" || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <ClipboardList className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-black">Loading Forms</h3>
                        <p className="text-gray-700">Preparing your submission workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Employee") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-200 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-black mb-2">Access Restricted</h2>
                    <p className="text-gray-700 mb-6">Employee authorization required to access this page.</p>
                    <Link href="/login">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                            Sign In as Employee
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-4">
            <Toaster position="top-right" />
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/employee/subtasks">
                        <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-gray-50 transition-all">
                            <ArrowLeft className="w-4 h-4 text-black" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-black">
                            Task Submission
                        </h1>
                        <p className="text-gray-700 mt-2 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Complete the form for your assigned task
                        </p>
                        {subtaskDetails && (
                            <div className="flex flex-wrap gap-4 mt-3">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-300">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-black">{subtaskDetails.title}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-300">
                                    <Users className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-black">{session.user.department}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">
                                        Approved: {progressInfo.completed}/{progressInfo.required} forms
                                    </span>
                                </div>
                                {progressInfo.remaining > 0 && (
                                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                                        <AlertCircle className="w-4 h-4 text-orange-600" />
                                        <span className="text-sm font-medium text-orange-700">
                                            {progressInfo.remaining} more approval(s) required
                                        </span>
                                    </div>
                                )}
                                {progressInfo.remaining === 0 && progressInfo.required > 0 && (
                                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">
                                            All forms approved!
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <Button 
                        onClick={fetchAllData} 
                        variant="outline" 
                        disabled={fetching}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
                    >
                        <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {subtaskDetails && (
                    <Card className="mb-6 border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-800">
                                    Form Approval Progress
                                </span>
                                <span className="text-sm text-blue-700">
                                    {progressInfo.completed} of {progressInfo.required} approved
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progressInfo.progress}%` }}
                                ></div>
                            </div>
                            {progressInfo.remaining === 0 && progressInfo.required > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-700 font-medium">
                                        All required forms approved!
                                    </span>
                                </div>
                            )}
                            <div className="mt-2 text-xs text-blue-600">
                                Forms disappear from available once submitted
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Card className="border-2 border-red-200 bg-red-50 mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                                <div>
                                    <h3 className="font-semibold text-red-800">Failed to Load Forms</h3>
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                                <Button 
                                    onClick={fetchAllData} 
                                    variant="outline" 
                                    size="sm"
                                    className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
                                >
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {submitted ? (
                    <Card className="border-2 border-green-200 bg-green-50 max-w-2xl mx-auto">
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-green-800 mb-3">
                                Submission Complete!
                            </h2>
                            <p className="text-green-700 mb-2 text-lg">
                                Your form has been successfully submitted
                            </p>
                            <p className="text-green-600 mb-8">
                                The task manager will review your submission shortly
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button 
                                    onClick={() => {
                                        setSubmitted(false);
                                        setSelectedForm(null);
                                        setFormData({});
                                        setActiveTab("completed");
                                    }} 
                                    variant="outline" 
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    View Submissions
                                </Button>
                                <Link href="/employee/subtasks">
                                    <Button className="bg-green-600 hover:bg-green-700">
                                        Back to Tasks
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        <Card className="xl:col-span-1 border-gray-300 bg-white">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-black">
                                    <FileText className="w-6 h-6" />
                                    Forms
                                </CardTitle>
                                <CardDescription className="text-gray-700">
                                    {progressInfo.remaining > 0 
                                        ? `Need ${progressInfo.remaining} more approval(s)` 
                                        : "All forms approved!"
                                    }
                                </CardDescription>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                                    <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                                        <TabsTrigger value="available" className="data-[state=active]:bg-white data-[state=active]:text-black text-white">
                                            Available ({availableForms.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:text-black text-white">
                                            Submitted ({completedForms.length})
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardHeader>
                            <CardContent>
                                {activeTab === "completed" && (
                                    <div className="mb-4">
                                        <Label className="text-sm font-medium text-black mb-2 flex items-center gap-2">
                                            <Filter className="w-4 h-4" />
                                            Filter by Status
                                        </Label>
                                        <Select value={filter} onValueChange={setFilter}>
                                            <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700">
                                                <SelectValue placeholder="All submissions" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800">
                                                <SelectItem value="all">All Submissions</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="late">Late Submissions</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {activeTab === "available" ? (
                                        availableForms.length === 0 ? (
                                            <div className="text-center py-8 text-gray-700">
                                                {progressInfo.remaining > 0 ? (
                                                    <>
                                                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                                                        <p className="font-medium text-black">No forms available</p>
                                                        <p className="text-sm">Contact your manager for more forms</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                                                        <p className="font-medium text-black">All forms approved!</p>
                                                        <p className="text-sm">No available forms to submit</p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            availableForms.map((form) => (
                                                <button
                                                    key={form._id}
                                                    onClick={() => handleFormSelect(form._id)}
                                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                                                        selectedForm?._id === form._id 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-300 bg-white hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-black mb-1">
                                                        {form.title}
                                                    </div>
                                                    <div className="text-sm text-gray-700 line-clamp-2">
                                                        {form.description || "No description provided"}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <span className="text-xs font-medium text-blue-600">
                                                            {form.fields?.length || 0} fields
                                                        </span>
                                                        {selectedForm?._id === form._id && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        )
                                    ) : (
                                        completedForms.length === 0 ? (
                                            <div className="text-center py-8 text-gray-700">
                                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                                <p className="font-medium text-black">No submissions yet</p>
                                                <p className="text-sm">Complete forms from Available tab</p>
                                            </div>
                                        ) : (
                                            completedForms.map((form) => (                                                
                                                <button
                                                    key={form.submissionId}
                                                    onClick={() => handleFormSelect(form._id, true)}
                                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                                                        selectedForm?._id === form._id 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-300 bg-white hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-black mb-1 flex items-center gap-2">
                                                        {form.title}
                                                        {getStatusIcon(form.status)}
                                                        {isLateSubmission(form.submittedAt) && form.status === "pending" && (
                                                            <Badge variant="destructive" className="text-xs">Late</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-700 line-clamp-2">
                                                        {form.description || "No description provided"}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(form.status)}`}>
                                                            {getStatusText(form.status)}
                                                        </span>
                                                        {selectedForm?._id === form._id && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        Submitted: {new Date(form.submittedAt).toLocaleDateString()}
                                                    </div>
                                                </button>
                                            ))
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="xl:col-span-3 border-gray-300 bg-white">
                            <CardHeader className="pb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl text-black flex items-center gap-3">
                                            {selectedForm ? (
                                                <>
                                                    <div className="w-3 h-8 bg-blue-600 rounded-full"></div>
                                                    {selectedForm.title}
                                                    {viewMode && (
                                                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />
                                                            View Only
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                "Select a Form"
                                            )}
                                        </CardTitle>
                                        <CardDescription className="text-gray-700 mt-2 text-base">
                                            {selectedForm 
                                                ? viewMode 
                                                    ? "Viewing your submitted form. This form cannot be edited."
                                                    : "Please fill out all required fields below"
                                                : activeTab === "available" 
                                                    ? "Choose a form from the sidebar to begin your submission"
                                                    : "Select a submitted form to view your submission"
                                            }
                                        </CardDescription>
                                    </div>
                                    {selectedForm && !viewMode && (
                                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                                            <span className="text-sm font-medium text-blue-700">
                                                {selectedForm.fields?.filter(f => f.required).length || 0} required fields
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedForm ? (
                                    <div className="space-y-8 max-w-3xl">
                                        {selectedForm.fields?.map((field, index) => (
                                            <div 
                                                key={field.name || index} 
                                                className="p-6 bg-white rounded-xl border border-gray-300 shadow-sm"
                                            >
                                                <Label htmlFor={field.name} className="text-lg font-semibold text-black mb-3 block">
                                                    {field.label}
                                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                                </Label>
                                                {renderField(field)}
                                                {field.placeholder && (
                                                    <p className="text-sm text-gray-700 mt-3 bg-gray-50 p-2 rounded-lg">
                                                        {field.placeholder}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {!viewMode && (
                                            <div className="flex gap-4 pt-6 border-t border-gray-300">
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={submitting}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-5 h-5 mr-3" />
                                                            Submit Form
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedForm(null);
                                                        setFormData({});
                                                        setViewMode(false);
                                                    }}
                                                    className="py-3 text-lg rounded-xl border-2 border-gray-300 hover:border-blue-400 transition-colors text-black"
                                                >
                                                    Change Form
                                                </Button>
                                            </div>
                                        )}

                                        {viewMode && (
                                            <div className="flex gap-4 pt-6 border-t border-gray-300">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedForm(null);
                                                        setFormData({});
                                                        setViewMode(false);
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-xl"
                                                >
                                                    Select Another Form
                                                </Button>
                                                <Link href="/employee/subtasks">
                                                    <Button variant="outline" className="py-3 text-lg rounded-xl border-2 border-gray-300 text-black">
                                                        Back to Tasks
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-gray-700">
                                        <FileText className="w-24 h-24 mx-auto mb-6 opacity-30" />
                                        <h3 className="text-xl font-semibold text-black mb-3">
                                            {activeTab === "available" ? "No Form Selected" : "No Submitted Form Selected"}
                                        </h3>
                                        <p className="text-gray-700 max-w-md mx-auto">
                                            {activeTab === "available" 
                                                ? progressInfo.remaining > 0
                                                    ? `Select a form to submit. Forms disappear once submitted.`
                                                    : "All required forms have been approved!"
                                                : "Select a submitted form from the sidebar to view your submission details and status."
                                            }
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}