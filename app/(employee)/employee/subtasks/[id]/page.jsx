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
import { Loader2, ArrowLeft, FileText, CheckCircle, ClipboardList, Users, Calendar, Eye, Clock, AlertCircle, RefreshCw, Target, Filter, Timer, CalendarDays } from "lucide-react";
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
    const [currentTime, setCurrentTime] = useState("");
    const [distinctAvailableForms, setDistinctAvailableForms] = useState([]);

    useEffect(() => {
        if (status === "loading") return;
        if (!session || session.user.role !== "Employee") {
            router.push("/employeelogin");
            return;
        }
        fetchAllData();
        
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: true 
            }));
        };
        
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [session, status, router, subtaskId]);

    useEffect(() => {
        if (activeTab === "completed") {
            fetchCompletedForms();
        }
    }, [filter, activeTab]);

    // Filter out duplicate forms from availableForms
    useEffect(() => {
        if (availableForms.length > 0) {
            // Get unique forms by formId
            const uniqueFormsMap = new Map();
            availableForms.forEach(form => {
                if (!uniqueFormsMap.has(form._id)) {
                    uniqueFormsMap.set(form._id, form);
                }
            });
            setDistinctAvailableForms(Array.from(uniqueFormsMap.values()));
        } else {
            setDistinctAvailableForms([]);
        }
    }, [availableForms]);

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
                const forms = Array.isArray(response.data) ? response.data : [];
                
                // Debug log to see what's coming from API
                console.log("Raw available forms from API:", forms);
                console.log("Number of forms:", forms.length);
                console.log("Form IDs:", forms.map(f => ({ id: f._id, title: f.title })));
                
                setAvailableForms(forms);
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
                const forms = Array.isArray(response.data) ? response.data : [];
                setCompletedForms(forms);
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
            form = distinctAvailableForms.find(f => f._id === formId);
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
        if (progress.completed >= progress.required) {
            toast.error(`You have already completed ${progress.required} forms. No more submissions allowed.`);
            return;
        }
        
        setSubmitting(true);
        try {
            const response = await axios.post("/api/employee/submission", {
                formId: selectedForm._id,
                subtaskId: subtaskId,
                formData: formData
            });
            
            if (response.status === 201) {
                toast.success("Form submitted successfully!");
                setSubmitted(true);
                await fetchAllData();
                
                const newProgress = getProgressInfo();
                if (newProgress.remaining === 0) {
                    toast.success("Congratulations! You have completed all required forms!");
                }
            }
        } catch (error) {
            console.error("Form submission error:", error.response?.data);
            toast.error(error.response?.data?.error || "Failed to submit form");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "rejected":
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-600" />;
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
                return "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200";
            case "rejected":
                return "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200";
            default:
                return "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200";
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
                    <div className="relative">
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
                            className={`mt-2 bg-white border-2 border-gray-200 focus:border-blue-400 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        />
                        {field.type === "date" && (
                            <CalendarDays className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        )}
                    </div>
                );
            case "time":
                return (
                    <div className="relative">
                        <Input
                            id={field.name}
                            type="time"
                            placeholder={field.placeholder || "Select time"}
                            value={fieldValue}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            required={field.required}
                            readOnly={isReadOnly}
                            className={`mt-2 bg-white border-2 border-gray-200 focus:border-blue-400 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        />
                        <Clock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                            <Timer className="w-4 h-4" />
                            Current time: {currentTime}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const now = new Date();
                                    const timeString = now.toTimeString().slice(0,5);
                                    handleInputChange(field.name, timeString);
                                }}
                                className="ml-2 text-xs"
                                disabled={isReadOnly}
                            >
                                Use Current Time
                            </Button>
                        </div>
                    </div>
                );
            case "datetime":
                return (
                    <div className="relative">
                        <Input
                            id={field.name}
                            type="datetime-local"
                            placeholder={field.placeholder || "Select date and time"}
                            value={fieldValue}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            required={field.required}
                            readOnly={isReadOnly}
                            className={`mt-2 bg-white border-2 border-gray-200 focus:border-blue-400 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        />
                        <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
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
                        className={`mt-2 bg-white border-2 border-gray-200 focus:border-blue-400 transition-all rounded-xl min-h-[120px] text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    />
                );
            case "select":
                return (
                    <Select
                        value={fieldValue}
                        onValueChange={(value) => handleInputChange(field.name, value)}
                        disabled={isReadOnly}
                    >
                        <SelectTrigger className={`mt-2 bg-white border-2 border-gray-200 focus:border-blue-400 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}>
                            <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-2 border-gray-200 rounded-xl">
                            {field.options?.map((option, index) => (
                                <SelectItem key={index} value={option} className="p-3 hover:bg-gray-50 cursor-pointer">
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
                        className="mt-2 space-y-3"
                        disabled={isReadOnly}
                    >
                        {field.options?.map((option, index) => (
                            <div key={index} className={`flex items-center space-x-4 p-4 rounded-xl border-2 ${isReadOnly ? "bg-gray-50 border-gray-300" : "bg-white border-gray-200 hover:border-blue-300"} transition-all`}>
                                <RadioGroupItem 
                                    value={option} 
                                    id={`${field.name}-${index}`} 
                                    className="text-blue-600 h-6 w-6"
                                    disabled={isReadOnly}
                                />
                                <Label htmlFor={`${field.name}-${index}`} className="font-medium text-black text-lg cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case "checkbox":
                return (
                    <div className="space-y-3 mt-2">
                        {field.options?.map((option, index) => (
                            <div key={index} className={`flex items-center space-x-4 p-4 rounded-xl border-2 ${isReadOnly ? "bg-gray-50 border-gray-300" : "bg-white border-gray-200 hover:border-blue-300"} transition-all`}>
                                <Checkbox
                                    id={`${field.name}-${index}`}
                                    checked={Array.isArray(formData[field.name]) && formData[field.name].includes(option)}
                                    onCheckedChange={(checked) => 
                                        handleArrayInputChange(field.name, option, checked)
                                    }
                                    className="text-blue-600 h-6 w-6"
                                    disabled={isReadOnly}
                                />
                                <Label htmlFor={`${field.name}-${index}`} className="font-medium text-black text-lg cursor-pointer">
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
                        className={`mt-2 bg-white border-2 border-gray-200 focus:border-blue-400 transition-all rounded-xl p-4 text-black text-lg ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    />
                );
        }
    };

    const progressInfo = getProgressInfo();

    if (status === "loading" || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <ClipboardList className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-black">Loading Submission Portal</h3>
                        <p className="text-gray-700">Preparing your workspace...</p>
                        <div className="flex items-center gap-2 justify-center mt-4">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            <span className="text-blue-600 font-medium">Fetching forms and task details</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "Employee") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
                <div className="text-center p-10 bg-white rounded-2xl shadow-2xl border-2 border-red-200 max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-black mb-3">Access Restricted</h2>
                    <p className="text-gray-700 mb-8">Employee authorization required to access this page.</p>
                    <Link href="/login">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg">
                            Sign In as Employee
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-6">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/employee/subtasks">
                            <Button variant="outline" size="icon" className="rounded-xl border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all h-12 w-12 shadow-sm">
                                <ArrowLeft className="w-6 h-6 text-black" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-black bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                                Task Submission Portal
                            </h1>
                            <p className="text-gray-700 mt-2 flex items-center gap-3">
                                <ClipboardList className="w-5 h-5" />
                                Complete the form for your assigned task
                                <span className="ml-4 flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    <Clock className="w-4 h-4" />
                                    {currentTime}
                                </span>
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={fetchAllData} 
                        variant="outline" 
                        disabled={fetching}
                        className="flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white px-6 py-3 rounded-xl shadow-lg transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {subtaskDetails && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Submission Progress
                                    </span>
                                    <span className="text-xl font-bold text-blue-700">
                                        {progressInfo.completed}/{progressInfo.required}
                                    </span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-3">
                                    <div 
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-700"
                                        style={{ width: `${progressInfo.progress}%` }}
                                    ></div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
                                        <div className="text-2xl font-bold text-green-700">{progressInfo.completed}</div>
                                        <div className="text-sm text-green-600">Approved</div>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-200">
                                        <div className="text-2xl font-bold text-orange-700">{progressInfo.remaining}</div>
                                        <div className="text-sm text-orange-600">Remaining</div>
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-blue-600">
                                    <p>• You need {progressInfo.required} approved submissions</p>
                                    <p>• Each form can be submitted multiple times</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Task Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <FileText className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="font-medium text-black">{subtaskDetails.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Users className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="text-gray-700">{session.user.department}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Target className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="text-gray-700">Required: {subtaskDetails.lead || 1} approvals</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                                    <Timer className="w-5 h-5" />
                                    Forms Summary
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Available Forms:</span>
                                        <Badge className="bg-blue-100 text-blue-700">
                                            {distinctAvailableForms.length} distinct form(s)
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Total Submissions:</span>
                                        <Badge className="bg-purple-100 text-purple-700">
                                            {completedForms.length}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-2">
                                        <p>• Submit forms multiple times to reach {subtaskDetails.lead || 1} approvals</p>
                                        <p>• Only approved submissions count toward progress</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {error && (
                    <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white mb-8 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-800 text-lg">Failed to Load Forms</h3>
                                    <p className="text-red-700">{error}</p>
                                </div>
                                <Button 
                                    onClick={fetchAllData} 
                                    variant="outline" 
                                    className="border-red-300 text-red-700 hover:bg-red-100 px-6 py-3"
                                >
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {submitted ? (
                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white max-w-2xl mx-auto shadow-2xl">
                        <CardContent className="p-12 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle className="w-14 h-14 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-green-800 mb-4">
                                Submission Complete!
                            </h2>
                            <p className="text-green-700 mb-6 text-xl">
                                Your form has been successfully submitted
                            </p>
                            <p className="text-green-600 mb-10">
                                The task manager will review your submission shortly
                            </p>
                            <div className="flex gap-6 justify-center">
                                <Button 
                                    onClick={() => {
                                        setSubmitted(false);
                                        setSelectedForm(null);
                                        setFormData({});
                                        setActiveTab("completed");
                                    }} 
                                    variant="outline" 
                                    className="border-green-300 text-green-700 hover:bg-green-50 px-8 py-4 text-lg rounded-xl"
                                >
                                    View Submissions
                                </Button>
                                <Link href="/employee/subtasks">
                                    <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-4 text-lg rounded-xl">
                                        Back to Tasks
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        <Card className="xl:col-span-1 border-2 border-gray-300 bg-gradient-to-b from-white to-blue-50/20 shadow-xl">
                            <CardHeader className="pb-6">
                                <CardTitle className="flex items-center gap-4 text-black text-2xl">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <FileText className="w-7 h-7 text-blue-600" />
                                    </div>
                                    Forms
                                </CardTitle>
                                <CardDescription className="text-gray-700 text-lg">
                                    {progressInfo.remaining > 0 
                                        ? `${progressInfo.remaining} more approval(s) needed` 
                                        : "All forms approved!"
                                    }
                                </CardDescription>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                                    <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-gray-800 to-gray-900 p-1 rounded-xl">
                                        <TabsTrigger value="available" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-lg  ">
                                            Available ({distinctAvailableForms.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-lg ">
                                            Submitted ({completedForms.length})
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardHeader>
                            <CardContent>
                                {activeTab === "completed" && (
                                    <div className="mb-6">
                                        <Label className="text-lg font-bold text-black mb-3 flex items-center gap-3">
                                            <Filter className="w-5 h-5" />
                                            Filter by Status
                                        </Label>
                                        <Select value={filter} onValueChange={setFilter}>
                                            <SelectTrigger className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white border-gray-700 rounded-xl py-6 text-lg">
                                                <SelectValue placeholder="All submissions" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-2 border-gray-200 rounded-xl">
                                                <SelectItem value="all">All Submissions</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="late">Late Submissions</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {activeTab === "available" ? (
                                        distinctAvailableForms.length === 0 ? (
                                            <div className="text-center py-10 text-gray-700">
                                                {progressInfo.remaining > 0 ? (
                                                    <>
                                                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                                                        <p className="font-bold text-black text-xl">No forms available</p>
                                                        <p className="text-gray-600 mt-2">Contact your manager for more forms</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                                                        <p className="font-bold text-black text-xl">All forms approved!</p>
                                                        <p className="text-gray-600 mt-2">No available forms to submit</p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            distinctAvailableForms.map((form) => (
                                                <button
                                                    key={form._id}
                                                    onClick={() => handleFormSelect(form._id)}
                                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
                                                        selectedForm?._id === form._id 
                                                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-lg' 
                                                        : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="font-bold text-black text-lg mb-2">
                                                        {form.title}
                                                    </div>
                                                    <div className="text-gray-700 line-clamp-2 mb-3">
                                                        {form.description || "No description provided"}
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-blue-600">
                                                            {form.fields?.length || 0} fields
                                                        </span>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                            Can submit multiple times
                                                        </span>
                                                        {selectedForm?._id === form._id && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                                                                <span className="text-sm text-blue-600 font-medium">Selected</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        )
                                    ) : (
                                        completedForms.length === 0 ? (
                                            <div className="text-center py-10 text-gray-700">
                                                <Clock className="w-16 h-16 mx-auto mb-4 opacity-40" />
                                                <p className="font-bold text-black text-xl">No submissions yet</p>
                                                <p className="text-gray-600 mt-2">Submit forms from Available tab</p>
                                            </div>
                                        ) : (
                                            completedForms.map((form) => (                                                
                                                <button
                                                    key={form.submissionId}
                                                    onClick={() => handleFormSelect(form._id, true)}
                                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
                                                        selectedForm?._id === form._id 
                                                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-lg' 
                                                        : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="font-bold text-black text-lg mb-2 flex items-center gap-3">
                                                        {form.title}
                                                        {getStatusIcon(form.status)}
                                                        {isLateSubmission(form.submittedAt) && form.status === "pending" && (
                                                            <Badge className="bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 px-3 py-1">Late</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-700 line-clamp-2 mb-3">
                                                        {form.description || "No description provided"}
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${getStatusColor(form.status)}`}>
                                                            {getStatusText(form.status)}
                                                        </span>
                                                        {selectedForm?._id === form._id && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                                                                <span className="text-sm text-blue-600 font-medium">Viewing</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        Submitted: {new Date(form.submittedAt).toLocaleDateString()}
                                                        <span className="ml-2">
                                                            {new Date(form.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="xl:col-span-3 border-2 border-gray-300 bg-gradient-to-b from-white to-purple-50/20 shadow-2xl">
                            <CardHeader className="pb-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-3xl text-black flex items-center gap-4 mb-4">
                                            {selectedForm ? (
                                                <>
                                                    <div className="w-4 h-12 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                                                    {selectedForm.title}
                                                    {viewMode && (
                                                        <span className="text-lg bg-gradient-to-r from-green-100 to-green-50 text-green-800 px-4 py-2 rounded-full flex items-center gap-2">
                                                            <Eye className="w-4 h-4" />
                                                            View Mode
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                "Select a Form"
                                            )}
                                        </CardTitle>
                                        <CardDescription className="text-gray-700 text-xl">
                                            {selectedForm 
                                                ? viewMode 
                                                    ? "Viewing your submitted form. This form cannot be edited."
                                                    : "Please fill out all required fields below"
                                                : activeTab === "available" 
                                                    ? `Choose one of ${distinctAvailableForms.length} form(s) to begin your submission`
                                                    : "Select a submitted form to view your submission"
                                            }
                                        </CardDescription>
                                        {selectedForm && !viewMode && (
                                            <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                                                <p>✓ You can submit this form multiple times</p>
                                                <p>✓ Each submission counts toward your {progressInfo.required} required approvals</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedForm && !viewMode && (
                                        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-full border-2 border-blue-200">
                                            <span className="text-lg font-bold text-blue-700">
                                                {selectedForm.fields?.filter(f => f.required).length || 0} required fields
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedForm ? (
                                    <div className="space-y-10 max-w-4xl">
                                        {selectedForm.fields?.map((field, index) => (
                                            <div 
                                                key={field.name || index} 
                                                className="p-8 bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <Label htmlFor={field.name} className="text-2xl font-bold text-black">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-2">*</span>}
                                                    </Label>
                                                    <Badge className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-4 py-2">
                                                        {field.type}
                                                    </Badge>
                                                </div>
                                                {renderField(field)}
                                                {field.placeholder && (
                                                    <p className="text-gray-700 mt-6 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl text-lg">
                                                        {field.placeholder}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {!viewMode && (
                                            <div className="flex gap-6 pt-10 border-t-2 border-gray-300">
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={submitting}
                                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-8 text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader2 className="w-8 h-8 mr-4 animate-spin" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-8 h-8 mr-4" />
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
                                                    className="py-8 text-2xl font-bold rounded-2xl border-2 border-gray-300 hover:border-blue-400 transition-colors text-black hover:bg-gray-50"
                                                >
                                                    Change Form
                                                </Button>
                                            </div>
                                        )}

                                        {viewMode && (
                                            <div className="flex gap-6 pt-10 border-t-2 border-gray-300">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedForm(null);
                                                        setFormData({});
                                                        setViewMode(false);
                                                    }}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-8 text-2xl font-bold rounded-2xl"
                                                >
                                                    Select Another Form
                                                </Button>
                                                <Link href="/employee/subtasks">
                                                    <Button variant="outline" className="py-8 text-2xl font-bold rounded-2xl border-2 border-gray-300 text-black hover:bg-gray-50">
                                                        Back to Tasks
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-gray-700">
                                        <FileText className="w-32 h-32 mx-auto mb-8 opacity-30" />
                                        <h3 className="text-3xl font-bold text-black mb-6">
                                            {activeTab === "available" ? "No Form Selected" : "No Submitted Form Selected"}
                                        </h3>
                                        <p className="text-gray-700 max-w-2xl mx-auto text-xl mb-10">
                                            {activeTab === "available" 
                                                ? progressInfo.remaining > 0
                                                    ? `Select one of ${distinctAvailableForms.length} form(s) to submit. You can submit the same form multiple times.`
                                                    : "All required forms have been approved!"
                                                : "Select a submitted form from the sidebar to view your submission details and status."
                                            }
                                        </p>
                                        <div className="flex justify-center gap-6">
                                            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
                                                <FileText className="w-12 h-12 text-blue-500 mb-3" />
                                                <div className="font-bold text-blue-700">Select Form</div>
                                            </div>
                                            <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border-2 border-green-200">
                                                <ClipboardList className="w-12 h-12 text-green-500 mb-3" />
                                                <div className="font-bold text-green-700">Fill Details</div>
                                            </div>
                                            <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200">
                                                <CheckCircle className="w-12 h-12 text-purple-500 mb-3" />
                                                <div className="font-bold text-purple-700">Submit</div>
                                            </div>
                                        </div>
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