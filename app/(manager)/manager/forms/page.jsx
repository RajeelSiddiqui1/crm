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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus,
    Search,
    FileText,
    Users,
    Calendar,
    User,
    X,
    Loader2,
    Building,
    Send,
    Eye,
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
    Lock,
    Hash,
    List,
    Clock,
    CalendarClock,
    CalendarDays,
    Type,
    TextQuote,
    GripVertical,
    UserCircle
} from "lucide-react";
import axios from "axios";

export default function ManagerFormsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [forms, setForms] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        clinetName: "", // Added clinetName field
        assignmentType: "single",
        assignedTo: "",
        multipleTeamLeadAssigned: [],
        teamLeadFeedback: ""
    });

    const [dynamicFormData, setDynamicFormData] = useState({});
    const [showPasswords, setShowPasswords] = useState({});
    const [dragOver, setDragOver] = useState({});

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "Manager") {
            router.push("/managerlogin");
            return;
        }

        fetchForms();
        fetchTeamLeads();
    }, [session, status, router]);

    const fetchForms = async () => {
        try {
            setFetching(true);
            const response = await axios.get(`/api/manager/forms`);
            if (response.status === 200) {
                setForms(response.data || []);
            }
        } catch (error) {
            console.error("Error fetching forms:", error);
            toast.error("Failed to fetch forms");
        } finally {
            setFetching(false);
        }
    };

    const fetchTeamLeads = async () => {
        try {
            const response = await axios.get(`/api/manager/teamlead`);
            if (response.status === 200) {
                setTeamLeads(response.data.teamLeads || []);
            }
        } catch (error) {
            console.error("Error fetching team leads:", error);
            toast.error("Failed to fetch team leads");
        }
    };

    const handleFormSelect = (form) => {
        setSelectedForm(form);
        setShowForm(true);
        // Initialize dynamic form data with default values
        const initialData = {};
        form.fields.forEach(field => {
            switch (field.type) {
                case 'checkbox':
                    initialData[field.name] = field.checked || false;
                    break;
                case 'toggle':
                    initialData[field.name] = field.checked || false;
                    break;
                case 'range':
                    initialData[field.name] = field.defaultValue || field.min || 0;
                    break;
                case 'rating':
                    initialData[field.name] = field.defaultRating || 0;
                    break;
                case 'file':
                    initialData[field.name] = null;
                    break;
                case 'date':
                    initialData[field.name] = field.defaultDate || '';
                    break;
                case 'time':
                    initialData[field.name] = field.defaultTime || '';
                    break;
                case 'datetime':
                    initialData[field.name] = field.defaultDateTime || '';
                    break;
                default:
                    initialData[field.name] = "";
            }
        });
        setDynamicFormData(initialData);
        setFormData({
            clinetName: "", // Reset clinetName when selecting new form
            assignmentType: "single",
            assignedTo: "",
            multipleTeamLeadAssigned: [],
            teamLeadFeedback: ""
        });
        setShowPasswords({});
        setDragOver({});
    };

    const handleDynamicFieldChange = (fieldName, value) => {
        setDynamicFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const togglePasswordVisibility = (fieldName) => {
        setShowPasswords(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    const handleAssignmentTypeChange = (type) => {
        setFormData({
            ...formData,
            assignmentType: type,
            assignedTo: type === "single" ? formData.assignedTo : "",
            multipleTeamLeadAssigned: type === "multiple" ? formData.multipleTeamLeadAssigned : []
        });
    };

    const handleMultipleTeamLeadToggle = (teamLeadId) => {
        setFormData(prev => {
            const isSelected = prev.multipleTeamLeadAssigned.includes(teamLeadId);
            return {
                ...prev,
                multipleTeamLeadAssigned: isSelected
                    ? prev.multipleTeamLeadAssigned.filter(id => id !== teamLeadId)
                    : [...prev.multipleTeamLeadAssigned, teamLeadId]
            };
        });
    };

    // File Upload Handlers
    const handleFileInputClick = (fieldName) => {
        document.getElementById(`file-input-${fieldName}`)?.click();
    };

   const handleFileChange = (fieldName, files) => {
  console.log("File selected for field:", fieldName);
  console.log("Files:", Array.from(files).map(f => ({
    name: f.name,
    size: f.size,
    type: f.type
  })));
  
  // Store the actual File objects
  handleDynamicFieldChange(fieldName, files);
  toast.success(`${files.length} file(s) selected`);
};
    const handleDragOver = (e, fieldName) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [fieldName]: true }));
    };

    const handleDragLeave = (e, fieldName) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [fieldName]: false }));
    };

    const handleDrop = (e, fieldName) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [fieldName]: false }));

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileChange(fieldName, files);
        }
    };

   const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Validate client name
  if (!formData.clinetName || formData.clinetName.trim() === "") {
    toast.error("Please enter client name");
    setLoading(false);
    return;
  }

  // Validate assignments
  if (formData.assignmentType === "single" && !formData.assignedTo) {
    toast.error("Please select a team lead");
    setLoading(false);
    return;
  }

  if (formData.assignmentType === "multiple" && formData.multipleTeamLeadAssigned.length === 0) {
    toast.error("Please select at least one team lead");
    setLoading(false);
    return;
  }

  // Validate required fields
  for (const field of selectedForm.fields) {
    if (field.required) {
      const value = dynamicFormData[field.name];
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        toast.error(`Please fill in ${field.label}`);
        setLoading(false);
        return;
      }
    }
  }

  try {
    // Create FormData object
    const formDataToSend = new FormData();
    
    // Add text fields
    formDataToSend.append("formId", selectedForm._id);
    formDataToSend.append("submittedBy", session.user.id);
    formDataToSend.append("clinetName", formData.clinetName.trim());
    formDataToSend.append("assignmentType", formData.assignmentType);
    formDataToSend.append("assignedTo", formData.assignedTo || "");
    formDataToSend.append("multipleTeamLeadAssigned", JSON.stringify(formData.multipleTeamLeadAssigned || []));
    
    // Prepare formData object for non-file fields
    const formDataObj = {};
    
    // Handle all form fields
    for (const field of selectedForm.fields) {
      const value = dynamicFormData[field.name];
      
      if (field.type === "file") {
        // File field - handle separately
        if (value && value.length > 0) {
          if (field.multiple) {
            // Multiple files
            const fileNames = [];
            for (let i = 0; i < value.length; i++) {
              formDataToSend.append(`files`, value[i]); // Append each file
              fileNames.push(value[i].name);
            }
            formDataObj[field.name] = fileNames;
          } else {
            // Single file
            formDataToSend.append("file", value[0]); // Main file field
            formDataObj[field.name] = value[0].name;
          }
        } else {
          formDataObj[field.name] = null;
        }
      } else {
        // Non-file field
        if (value !== undefined && value !== null) {
          formDataObj[field.name] = value;
        } else {
          formDataObj[field.name] = "";
        }
      }
    }
    
    // Add formData as JSON string
    formDataToSend.append("formData", JSON.stringify(formDataObj));
    
    // Debug: Check what's being sent
    console.log("=== DEBUG: FormData Contents ===");
    for (let pair of formDataToSend.entries()) {
      if (pair[0] === "file" || pair[0] === "files") {
        console.log(pair[0] + ": [FILE]", pair[1].name, pair[1].size, pair[1].type);
      } else {
        console.log(pair[0] + ":", pair[1]);
      }
    }
    console.log("formData JSON:", JSON.parse(formDataToSend.get("formData")));

    // Send to backend
    const response = await axios.post("/api/manager/forms", formDataToSend, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 201) {
      toast.success("Form submitted successfully!");
      resetForm();
      fetchForms();
      router.push("/manager/submissions");
    }
  } catch (error) {
    console.error("Submission error:", error);
    toast.error(
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Failed to submit form"
    );
  } finally {
    setLoading(false);
  }
};

    const resetForm = () => {
        setFormData({
            clinetName: "",
            assignmentType: "single",
            assignedTo: "",
            multipleTeamLeadAssigned: [],
            teamLeadFeedback: ""
        });
        setDynamicFormData({});
        setSelectedForm(null);
        setShowForm(false);
        setShowPasswords({});
        setDragOver({});
    };

    const renderFormField = (field) => {
        const fieldValue = dynamicFormData[field.name] || "";
        const isDragOver = dragOver[field.name] || false;

        switch (field.type) {
            case "text":
                return (
                    <div className="relative">
                        <Input
                            type="text"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                        />
                        <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "email":
                return (
                    <div className="relative">
                        <Input
                            type="email"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "number":
                return (
                    <div className="relative">
                        <Input
                            type="number"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                        />
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "tel":
                return (
                    <div className="relative">
                        <Input
                            type="tel"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                        />
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "url":
                return (
                    <div className="relative">
                        <Input
                            type="url"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                        />
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "password":
                return (
                    <div className="relative">
                        <Input
                            type={showPasswords[field.name] ? "text" : "password"}
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 pr-10"
                            required={field.required}
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field.name)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPasswords[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                );
            case "textarea":
                return (
                    <div className="relative">
                        <Textarea
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                            rows={4}
                        />
                        <TextQuote className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "select":
                return (
                    <div className="relative">
                        <Select
                            value={fieldValue}
                            onValueChange={(value) => handleDynamicFieldChange(field.name, value)}
                        >
                            <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10">
                                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option, index) => (
                                    <SelectItem key={index} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <List className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "date":
                return (
                    <div className="relative">
                        <Input
                            type="date"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                            min={field.minDate}
                            max={field.maxDate}
                        />
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "time":
                return (
                    <div className="relative">
                        <Input
                            type="time"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                            step={field.step || 900}
                            min={field.minTime}
                            max={field.maxTime}
                        />
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "datetime":
                return (
                    <div className="relative">
                        <Input
                            type="datetime-local"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                            min={field.minDateTime}
                            max={field.maxDateTime}
                        />
                        <CalendarClock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case "checkbox":
                return (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.checked)}
                            className="rounded border-gray-300 bg-white w-4 h-4"
                            required={field.required}
                        />
                        <Label className="text-gray-700">{field.label}</Label>
                    </div>
                );
            case "radio":
                return (
                    <div className="space-y-2">
                        {field.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name={field.name}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                                    className="rounded-full border-gray-300 bg-white w-4 h-4"
                                    required={field.required}
                                />
                                <Label className="text-gray-700">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case "range":
                return (
                    <div className="space-y-2">
                        <div className="relative">
                            <input
                                type="range"
                                min={field.min || 0}
                                max={field.max || 100}
                                step={field.step || 1}
                                value={fieldValue}
                                onChange={(e) => handleDynamicFieldChange(field.name, parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider pl-10"
                                required={field.required}
                            />
                            <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{field.min || 0}</span>
                            <span className="font-medium">{fieldValue}</span>
                            <span>{field.max || 100}</span>
                        </div>
                    </div>
                );
            case "file":
                const files = fieldValue;
                const fileCount = files ? (field.multiple ? files.length : 1) : 0;

                return (
                    <div className="space-y-3">
                        <Input
                            id={`file-input-${field.name}`}
                            type="file"
                            onChange={(e) => handleFileChange(field.name, e.target.files)}
                            className="hidden"
                            multiple={field.multiple}
                            accept={field.accept}
                            required={field.required && !fileCount}
                        />

                        <div
                            onClick={() => handleFileInputClick(field.name)}
                            onDragOver={(e) => handleDragOver(e, field.name)}
                            onDragLeave={(e) => handleDragLeave(e, field.name)}
                            onDrop={(e) => handleDrop(e, field.name)}
                            className={`
                                border-2 border-dashed rounded-lg p-6 text-center bg-white cursor-pointer transition-all duration-200
                                ${isDragOver
                                    ? 'border-blue-500 bg-blue-50 scale-105'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }
                            `}
                        >
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                            <p className={`text-sm font-medium ${isDragOver ? 'text-blue-700' : 'text-gray-600'}`}>
                                {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {field.multiple ? 'Multiple files allowed' : 'Single file only'} • {field.accept || 'Any file type'}
                            </p>
                        </div>

                        {fileCount > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 font-medium">
                                    Selected {fileCount} file{fileCount !== 1 ? 's' : ''}:
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {Array.from(files).map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-700 truncate max-w-xs">
                                                    {file.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFileInputClick(field.name)}
                                    className="text-xs"
                                >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Change Files
                                </Button>
                            </div>
                        )}
                    </div>
                );
            case "rating":
                return (
                    <div className="flex space-x-1 items-center">
                        <Star className="w-4 h-4 text-gray-400 mr-2" />
                        {Array.from({ length: field.maxRating || 5 }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleDynamicFieldChange(field.name, i + 1)}
                                className="focus:outline-none"
                            >
                                <Star
                                    className={`w-6 h-6 transition-colors ${i < fieldValue
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300 hover:text-yellow-200'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                );
            case "toggle":
                return (
                    <div className="flex items-center space-x-2">
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                        <button
                            type="button"
                            onClick={() => handleDynamicFieldChange(field.name, !fieldValue)}
                            className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fieldValue ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${fieldValue ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <Label className="text-gray-700">{fieldValue ? 'On' : 'Off'}</Label>
                    </div>
                );
            case "address":
                return (
                    <div className="space-y-3">
                        <div className="relative">
                            <Input
                                type="text"
                                value={fieldValue?.street || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, street: e.target.value })}
                                placeholder="Street address"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                required={field.required}
                            />
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="text"
                                value={fieldValue?.city || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, city: e.target.value })}
                                placeholder="City"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                required={field.required}
                            />
                            <Input
                                type="text"
                                value={fieldValue?.state || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, state: e.target.value })}
                                placeholder="State"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                required={field.required}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="text"
                                value={fieldValue?.zip || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, zip: e.target.value })}
                                placeholder="ZIP code"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                required={field.required}
                            />
                            <Input
                                type="text"
                                value={fieldValue?.country || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, country: e.target.value })}
                                placeholder="Country"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                required={field.required}
                            />
                        </div>
                    </div>
                );
            case "creditCard":
                return (
                    <div className="space-y-3">
                        <div className="relative">
                            <Input
                                type="text"
                                value={fieldValue?.cardNumber || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, cardNumber: e.target.value })}
                                placeholder="Card number"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                required={field.required}
                            />
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="text"
                                value={fieldValue?.expiry || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, expiry: e.target.value })}
                                placeholder="MM/YY"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                required={field.required}
                            />
                            <Input
                                type="text"
                                value={fieldValue?.cvv || ""}
                                onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, cvv: e.target.value })}
                                placeholder="CVC"
                                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                required={field.required}
                            />
                        </div>
                        <Input
                            type="text"
                            value={fieldValue?.nameOnCard || ""}
                            onChange={(e) => handleDynamicFieldChange(field.name, { ...fieldValue, nameOnCard: e.target.value })}
                            placeholder="Cardholder name"
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                            required={field.required}
                        />
                    </div>
                );
            default:
                return (
                    <div className="relative">
                        <Input
                            type="text"
                            value={fieldValue}
                            onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                            required={field.required}
                        />
                        <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
        }
    };

    const getFieldIcon = (fieldType) => {
        const fieldIcons = {
            text: Type,
            email: Mail,
            number: Hash,
            tel: Phone,
            url: Link,
            password: Lock,
            date: CalendarDays,
            time: Clock,
            datetime: CalendarClock,
            select: List,
            textarea: TextQuote,
            checkbox: CheckSquare,
            radio: Radio,
            range: SlidersHorizontal,
            file: Upload,
            rating: Star,
            toggle: ToggleLeft,
            address: MapPin,
            creditCard: CreditCard
        };
        return fieldIcons[fieldType] || Type;
    };

    const filteredForms = forms.filter(form =>
        form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            Form Management
                        </h1>
                        <p className="text-gray-800 mt-3 text-lg">
                            Create and assign forms to your team leads
                        </p>
                    </div>
                </div>

                <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden mb-8">
                    <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    Available Forms
                                </CardTitle>
                                <CardDescription className="text-gray-700 text-base">
                                    {forms.length} form{forms.length !== 1 ? 's' : ''} available
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Search forms..."
                                    className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11 text-base text-gray-900"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {fetching ? (
                            <div className="flex justify-center items-center py-16">
                                <div className="flex items-center gap-3 text-gray-800">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-lg">Loading forms...</span>
                                </div>
                            </div>
                        ) : filteredForms.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-gray-300 mb-4">
                                    <FileText className="w-20 h-20 mx-auto" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {forms.length === 0 ? "No forms available" : "No matches found"}
                                </h3>
                                <p className="text-gray-700 text-lg max-w-md mx-auto mb-6">
                                    {forms.length === 0
                                        ? "No forms have been created for your department yet."
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
                                            <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Fields</TableHead>
                                            <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Created</TableHead>
                                            <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredForms.map((form, index) => (
                                            <TableRow
                                                key={form._id}
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
                                                                {form.title}
                                                            </div>
                                                            <div className="text-sm text-gray-700 font-medium max-w-md">
                                                                {form.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {form.fields.slice(0, 3).map((field, idx) => {
                                                            const IconComponent = getFieldIcon(field.type);
                                                            return (
                                                                <Badge key={idx} variant="outline" className="text-xs text-gray-700 flex items-center gap-1">
                                                                    <IconComponent className="w-3 h-3" />
                                                                    {field.label}
                                                                </Badge>
                                                            );
                                                        })}
                                                        {form.fields.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs text-gray-700">
                                                                +{form.fields.length - 3} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                                        <Calendar className="w-5 h-5 text-blue-500" />
                                                        <span className="text-base font-medium">{formatDate(form.createdAt)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Button
                                                        onClick={() => handleFormSelect(form)}
                                                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105"
                                                        size="sm"
                                                    >
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Assign
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

                {showForm && selectedForm && (
                    <Card className="border-0 shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-white text-2xl">{selectedForm.title}</CardTitle>
                                    <CardDescription className="text-blue-100">
                                        {selectedForm.description}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={resetForm}
                                    className="h-8 w-8 text-white hover:bg-white/20"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Client Name Field (Compulsory) */}
                                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white/50">
                                    <Label htmlFor="clinetName" className="text-gray-800 font-semibold flex items-center gap-2">
                                        <UserCircle className="w-4 h-4 text-blue-600" />
                                        Client Name *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="clinetName"
                                            type="text"
                                            value={formData.clinetName}
                                            onChange={(e) => setFormData({ ...formData, clinetName: e.target.value })}
                                            placeholder="Enter client name"
                                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                                            required
                                        />
                                        <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        This is a required field for all form submissions
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Form Details</h3>
                                    {selectedForm.fields.map((field, index) => (
                                        <div key={field.name} className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white/50">
                                            <Label htmlFor={field.name} className="text-gray-800 font-semibold flex items-center gap-2">
                                                {getFieldIcon(field.type) && React.createElement(getFieldIcon(field.type), { className: "w-4 h-4" })}
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            {field.description && (
                                                <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                                            )}
                                            {renderFormField(field)}
                                            {field.placeholder && !field.description && (
                                                <p className="text-xs text-gray-500 mt-1">{field.placeholder}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Assignment Type Selection */}
                                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white/50">
                                    <Label className="text-gray-800 font-semibold">
                                        Assignment Type *
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.assignmentType === 'single'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            onClick={() => handleAssignmentTypeChange('single')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.assignmentType === 'single'
                                                    ? 'border-blue-500'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {formData.assignmentType === 'single' && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-5 h-5 text-gray-700" />
                                                        <span className="font-semibold text-gray-900">Single Team Lead</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Assign to one team lead
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.assignmentType === 'multiple'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            onClick={() => handleAssignmentTypeChange('multiple')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.assignmentType === 'multiple'
                                                    ? 'border-blue-500'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {formData.assignmentType === 'multiple' && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-gray-700" />
                                                        <span className="font-semibold text-gray-900">Multiple Team Leads</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Assign to multiple team leads
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Lead Assignment - Based on Type */}
                                {formData.assignmentType === 'single' ? (
                                    <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white/50">
                                        <Label htmlFor="assignedTo" className="text-gray-800 font-semibold">
                                            Select Team Lead *
                                        </Label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <select
                                                id="assignedTo"
                                                value={formData.assignedTo}
                                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200 shadow-sm appearance-none text-gray-900"
                                                required
                                            >
                                                <option value="">Select a team lead</option>
                                                {teamLeads.map((tl) => (
                                                    <option key={tl._id} value={tl._id}>
                                                        {tl.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            The form will be assigned to a single team lead
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white/50">
                                        <Label className="text-gray-800 font-semibold">
                                            Select Team Leads *
                                        </Label>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Select one or more team leads to assign this form
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2">
                                            {teamLeads.map((tl) => (
                                                <div
                                                    key={tl._id}
                                                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${formData.multipleTeamLeadAssigned.includes(tl._id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => handleMultipleTeamLeadToggle(tl._id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                                {tl.name?.charAt(0) || tl.email?.charAt(0) || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{tl.name}</div>
                                                            <div className="text-xs text-gray-500">{tl.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 border rounded flex items-center justify-center ${formData.multipleTeamLeadAssigned.includes(tl._id)
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {formData.multipleTeamLeadAssigned.includes(tl._id) && (
                                                            <CheckSquare className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {formData.multipleTeamLeadAssigned.length} team lead{formData.multipleTeamLeadAssigned.length !== 1 ? 's' : ''} selected
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-6">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-2.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                {formData.assignmentType === 'multiple' ? 'Assign to Multiple Leads' : 'Assign to Team Lead'}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetForm}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-2.5 transition-all duration-200 shadow-sm"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}