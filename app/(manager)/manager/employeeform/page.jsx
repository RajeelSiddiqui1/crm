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
import {
    Plus,
    Search,
    Mail,
    Calendar,
    User,
    X,
    Loader2,
    Users,
    Building,
    GripVertical,
    TextCursor,
    Mail as EmailIcon,
    Hash,
    CalendarDays,
    Clock,
    CalendarClock,
    List,
    TextQuote,
    Trash2,
    Eye,
    Download,
    Copy,
    Edit,
    FileText,
    Upload,
    ToggleLeft,
    SlidersHorizontal,
    Star,
    CheckSquare,
    Radio,
    Link,
    Phone,
    MapPin,
    CreditCard,
    Lock,
    EyeOff,
    Eye as EyeOn,
    MoveVertical,
    Settings,
    Filter,
    ArrowUpDown,
    MoreVertical,
    Share2,
    BarChart3,
    Grid,
    List as ListIcon,
    ChevronLeft,
    ChevronRight,
    Save,
    Zap,
    Sparkles,
    Palette,
    Type,
    Layers,
    Layout,
    Eye as PreviewEye
} from "lucide-react";
import axios from "axios";

export default function FormBuilderPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeForm, setActiveForm] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [fetchingDepartments, setFetchingDepartments] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
    const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "name"
    const [filterStatus, setFilterStatus] = useState("all"); // "all", "published", "draft"
    const [formResponses, setFormResponses] = useState({});
    const [isDragging, setIsDragging] = useState(false);
    const [dragItemIndex, setDragItemIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Form builder state
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [fields, setFields] = useState([]);
    const [selectedField, setSelectedField] = useState(null);
    const [editingForm, setEditingForm] = useState(null);
    const [formStatus, setFormStatus] = useState("draft"); // "draft", "published"
    const [formTheme, setFormTheme] = useState("default"); // "default", "dark", "blue", "green"

    // Updated field types with time and datetime
    const fieldTypes = [
        { type: 'text', label: 'Text Input', icon: TextCursor, color: 'blue', category: 'basic' },
        { type: 'email', label: 'Email Input', icon: EmailIcon, color: 'green', category: 'basic' },
        { type: 'number', label: 'Number Input', icon: Hash, color: 'purple', category: 'basic' },
        { type: 'tel', label: 'Phone Number', icon: Phone, color: 'teal', category: 'basic' },
        { type: 'url', label: 'URL Input', icon: Link, color: 'blue', category: 'basic' },
        { type: 'password', label: 'Password', icon: Lock, color: 'red', category: 'basic' },
        { type: 'date', label: 'Date Picker', icon: CalendarDays, color: 'orange', category: 'date' },
        { type: 'time', label: 'Time Picker', icon: Clock, color: 'amber', category: 'date' },
        { type: 'datetime', label: 'Date & Time', icon: CalendarClock, color: 'violet', category: 'date' },
        { type: 'select', label: 'Dropdown', icon: List, color: 'pink', category: 'choice' },
        { type: 'textarea', label: 'Text Area', icon: TextQuote, color: 'indigo', category: 'text' },
        { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'green', category: 'choice' },
        { type: 'radio', label: 'Radio Buttons', icon: Radio, color: 'purple', category: 'choice' },
        { type: 'range', label: 'Range Slider', icon: SlidersHorizontal, color: 'orange', category: 'input' },
        { type: 'file', label: 'File Upload', icon: Upload, color: 'cyan', category: 'media' },
        { type: 'rating', label: 'Star Rating', icon: Star, color: 'yellow', category: 'rating' },
        { type: 'toggle', label: 'Toggle Switch', icon: ToggleLeft, color: 'blue', category: 'choice' },
        { type: 'address', label: 'Address', icon: MapPin, color: 'red', category: 'advanced' },
        { type: 'creditCard', label: 'Credit Card', icon: CreditCard, color: 'indigo', category: 'advanced' },
        { type: 'color', label: 'Color Picker', icon: Palette, color: 'pink', category: 'advanced' }
    ];

    const fieldCategories = [
        { id: 'all', label: 'All Fields', icon: Grid },
        { id: 'basic', label: 'Basic Inputs', icon: TextCursor },
        { id: 'date', label: 'Date & Time', icon: CalendarClock },
        { id: 'choice', label: 'Choice Fields', icon: CheckSquare },
        { id: 'text', label: 'Text Areas', icon: TextQuote },
        { id: 'media', label: 'Media & Files', icon: Upload },
        { id: 'advanced', label: 'Advanced', icon: Zap }
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        if (status === "loading") return;

        if (!session || (session.user.role !== "Manager")) {
            router.push("/managerlogin");
            return;
        }

        fetchForms();
        fetchDepartments();
        fetchFormResponses();
    }, [session, status, router]);

    const fetchForms = async () => {
        try {
            setFetching(true);
            const response = await axios.get("/api/manager/managerforms");
            setForms(response.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to fetch forms");
        } finally {
            setFetching(false);
        }
    };

    const fetchFormResponses = async () => {
        try {
            // Fetch responses for all forms
            const responses = {};
            for (const form of forms) {
                const response = await axios.get(`/api/manager/managerforms/${form._id}/responses`);
                responses[form._id] = response.data?.length || 0;
            }
            setFormResponses(responses);
        } catch (error) {
            console.error("Failed to fetch responses:", error);
        }
    };

    const fetchDepartments = async () => {
        try {
            setFetchingDepartments(true);
            const response = await axios.get("/api/manager/department");

            let departmentsData = [];

            if (Array.isArray(response.data)) {
                departmentsData = response.data;
            } else if (response.data && Array.isArray(response.data.departments)) {
                departmentsData = response.data.departments;
            } else if (response.data && Array.isArray(response.data.data)) {
                departmentsData = response.data.data;
            } else if (response.data && typeof response.data === 'object') {
                departmentsData = [response.data];
            }

            setDepartments(departmentsData);

        } catch (error) {
            console.error("Department fetch error:", error);
            toast.error("Failed to fetch departments");
            setDepartments([]);
        } finally {
            setFetchingDepartments(false);
        }
    };

    const addField = (fieldType) => {
        const baseField = {
            id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: fieldType,
            label: `New ${fieldTypes.find(f => f.type === fieldType)?.label || fieldType} Field`,
            name: `field_${fields.length + 1}`.toLowerCase().replace(/\s+/g, '_'),
            required: false,
            placeholder: `Enter ${fieldTypes.find(f => f.type === fieldType)?.label.toLowerCase() || fieldType}`,
            helpText: "",
            width: "full", // "full", "half", "third"
            validation: {
                minLength: null,
                maxLength: null,
                pattern: null,
                min: null,
                max: null
            }
        };

        let newField = { ...baseField };

        // Add type-specific properties
        switch (fieldType) {
            case 'select':
            case 'radio':
                newField.options = ['Option 1', 'Option 2', 'Option 3'];
                break;
            case 'range':
                newField.min = 0;
                newField.max = 100;
                newField.step = 1;
                newField.defaultValue = 50;
                break;
            case 'rating':
                newField.maxRating = 5;
                newField.defaultRating = 0;
                break;
            case 'file':
                newField.multiple = false;
                newField.accept = '*/*';
                newField.maxSize = 5; // MB
                break;
            case 'checkbox':
                newField.checked = false;
                break;
            case 'toggle':
                newField.checked = false;
                break;
            case 'date':
                newField.minDate = '';
                newField.maxDate = '';
                newField.defaultDate = '';
                break;
            case 'time':
                newField.minTime = '';
                newField.maxTime = '';
                newField.defaultTime = '';
                newField.step = 900; // 15 minutes default
                break;
            case 'datetime':
                newField.minDateTime = '';
                newField.maxDateTime = '';
                newField.defaultDateTime = '';
                break;
            case 'color':
                newField.defaultColor = '#3b82f6';
                break;
            default:
                break;
        }

        setFields([...fields, newField]);
        setSelectedField(newField);
    };

    const updateField = (fieldId, updates) => {
        setFields(fields.map(field =>
            field.id === fieldId ? { ...field, ...updates } : field
        ));
        if (selectedField && selectedField.id === fieldId) {
            setSelectedField({ ...selectedField, ...updates });
        }
    };

    const removeField = (fieldId) => {
        setFields(fields.filter(field => field.id !== fieldId));
        if (selectedField && selectedField.id === fieldId) {
            setSelectedField(null);
        }
    };

    // Drag and drop functionality
    const handleDragStart = (index) => {
        setDragItemIndex(index);
        setIsDragging(true);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (dragItemIndex !== null && dragOverIndex !== null && dragItemIndex !== dragOverIndex) {
            const newFields = [...fields];
            const [draggedItem] = newFields.splice(dragItemIndex, 1);
            newFields.splice(dragOverIndex, 0, draggedItem);
            setFields(newFields);
        }
        setDragItemIndex(null);
        setDragOverIndex(null);
        setIsDragging(false);
    };

    const handleSaveForm = async () => {
        if (!formTitle.trim()) {
            toast.error("Please enter a form title");
            return;
        }

        if (!selectedDepartment) {
            toast.error("Please select a department");
            return;
        }

        if (fields.length === 0) {
            toast.error("Please add at least one field to the form");
            return;
        }

        setLoading(true);

        try {
            const formData = {
                title: formTitle,
                description: formDescription,
                depId: selectedDepartment,
                fields: fields.map(({ id, ...field }) => field),
                status: formStatus,
                theme: formTheme,
                settings: {
                    allowMultipleSubmissions: false,
                    collectEmail: false,
                    sendNotifications: true
                }
            };

            let response;
            if (editingForm) {
                response = await axios.put(`/api/manager/managerforms/${editingForm._id}`, formData);
            } else {
                response = await axios.post("/api/manager/managerforms", formData);
            }

            if (response.status === 200 || response.status === 201) {
                toast.success(`Form ${editingForm ? 'updated' : 'created'} successfully!`, {
                    description: `Form "${formTitle}" is now ${formStatus === 'published' ? 'live' : 'in draft'}.`
                });
                resetFormBuilder();
                fetchForms();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to ${editingForm ? 'update' : 'create'} form`);
        } finally {
            setLoading(false);
        }
    };

    // Get single form by ID
    const getFormById = async (formId) => {
        try {
            const response = await axios.get(`/api/manager/managerforms/${formId}`);
            return response.data;
        } catch (error) {
            toast.error("Failed to fetch form details");
            throw error;
        }
    };

    const resetFormBuilder = () => {
        setFormTitle("");
        setFormDescription("");
        setSelectedDepartment("");
        setFields([]);
        setSelectedField(null);
        setShowFormBuilder(false);
        setEditingForm(null);
        setFormStatus("draft");
        setFormTheme("default");
    };

    const editForm = async (form) => {
        try {
            const formDetails = await getFormById(form._id);
            setFormTitle(formDetails.title);
            setFormDescription(formDetails.description || "");
            setSelectedDepartment(formDetails.depId?._id || formDetails.depId);
            setFields(formDetails.fields.map((field, index) => ({
                ...field,
                id: `field-${Date.now()}-${index}`
            })));
            setFormStatus(formDetails.status || "draft");
            setFormTheme(formDetails.theme || "default");
            setEditingForm(formDetails);
            setShowFormBuilder(true);
        } catch (error) {
            toast.error("Failed to load form for editing");
        }
    };

    const duplicateForm = async (form) => {
        try {
            setLoading(true);
            const response = await axios.post("/api/manager/managerforms", {
                ...form,
                title: `${form.title} (Copy)`,
                status: "draft",
                _id: undefined,
                createdAt: undefined,
                updatedAt: undefined
            });

            if (response.status === 201) {
                toast.success("Form duplicated successfully!");
                fetchForms();
            }
        } catch (error) {
            toast.error("Failed to duplicate form");
        } finally {
            setLoading(false);
        }
    };

    const deleteForm = async (formId) => {
        if (!confirm("Are you sure you want to delete this form? This action cannot be undone.")) return;

        try {
            setLoading(true);
            const response = await axios.delete(`/api/manager/managerforms/${formId}`);

            if (response.status === 200) {
                toast.success("Form deleted successfully!");
                fetchForms();
            }
        } catch (error) {
            toast.error("Failed to delete form");
        } finally {
            setLoading(false);
        }
    };

    const publishForm = async (formId) => {
        try {
            setLoading(true);
            const response = await axios.put(`/api/manager/managerforms/${formId}`, {
                status: "published"
            });

            if (response.status === 200) {
                toast.success("Form published successfully!");
                fetchForms();
            }
        } catch (error) {
            toast.error("Failed to publish form");
        } finally {
            setLoading(false);
        }
    };

    const unpublishForm = async (formId) => {
        try {
            setLoading(true);
            const response = await axios.put(`/api/manager/managerforms/${formId}`, {
                status: "draft"
            });

            if (response.status === 200) {
                toast.success("Form unpublished successfully!");
                fetchForms();
            }
        } catch (error) {
            toast.error("Failed to unpublish form");
        } finally {
            setLoading(false);
        }
    };

    const copyFormLink = (formId) => {
        const link = `${window.location.origin}/forms/${formId}`;
        navigator.clipboard.writeText(link)
            .then(() => toast.success("Form link copied to clipboard!"))
            .catch(() => toast.error("Failed to copy link"));
    };

    const previewForm = (form) => {
        setActiveForm(form);
    };

    const closePreview = () => {
        setActiveForm(null);
    };

    const downloadResponses = async (formId) => {
        try {
            const response = await axios.get(`/api/manager/managerforms/${formId}/responses/export`);
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `form-responses-${formId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Responses downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download responses");
        }
    };

    const filteredForms = forms.filter(form => {
        const matchesSearch = form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || form.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Sort forms
    const sortedForms = [...filteredForms].sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return new Date(b.createdAt) - new Date(a.createdAt);
            case "oldest":
                return new Date(a.createdAt) - new Date(b.createdAt);
            case "name":
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
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

    const getFieldIcon = (fieldType) => {
        const field = fieldTypes.find(f => f.type === fieldType);
        return field ? field.icon : TextCursor;
    };

    const getFieldColor = (fieldType) => {
        const field = fieldTypes.find(f => f.type === fieldType);
        return field ? field.color : 'gray';
    };

    // Get department name by ID
    const getDepartmentName = (depId) => {
        if (!depId) return 'No Department';
        if (typeof depId === 'object') return depId.name || 'Unknown Department';
        if (!Array.isArray(departments)) return 'Unknown Department';
        const department = departments.find(dept => dept._id === depId);
        return department ? department.name : 'Unknown Department';
    };

    // Safe departments array for mapping
    const safeDepartments = Array.isArray(departments) ? departments : [];

    // Filter field types by category
    const filteredFieldTypes = selectedCategory === 'all' 
        ? fieldTypes 
        : fieldTypes.filter(field => field.category === selectedCategory);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    <span className="text-gray-700 font-medium">Loading Form Builder...</span>
                </div>
            </div>
        );
    }

    if (!session || (session.user.role !== "Admin" && session.user.role !== "Manager")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
            <Toaster position="top-right" />

            {/* Form Preview Modal */}
            {activeForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <Card className="border-0 shadow-2xl rounded-2xl bg-white">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-white text-2xl flex items-center gap-2">
                                            <PreviewEye className="w-6 h-6" /> Preview: {activeForm.title}
                                        </CardTitle>
                                        <CardDescription className="text-blue-100 mt-2">
                                            {activeForm.description}
                                        </CardDescription>
                                        <div className="flex gap-2 mt-3">
                                            <Badge className="bg-white/20 text-white border-0">
                                                <Building className="w-3 h-3 mr-1" />
                                                {getDepartmentName(activeForm.depId)}
                                            </Badge>
                                            <Badge className={activeForm.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                                {activeForm.status === 'published' ? 'Published' : 'Draft'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-3 text-white hover:bg-white/20 rounded-full"
                                            onClick={() => copyFormLink(activeForm._id)}
                                        >
                                            <Share2 className="w-4 h-4 mr-1" /> Copy Link
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={closePreview}
                                            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 overflow-y-auto">
                                <div className="space-y-6">
                                    {activeForm.fields.map((field, index) => (
                                        <div key={index} className="space-y-3 p-4 rounded-xl bg-gray-50/50 border border-gray-200">
                                            <Label className="flex items-center gap-2 text-gray-800 font-medium">
                                                {field.label}
                                                {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            <PreviewFieldComponent field={field} />
                                            {field.helpText && (
                                                <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                                        Submit Form
                                    </Button>
                                    <Button variant="outline" onClick={closePreview} className="border-gray-300">
                                        Close
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            Dynamic Form Builder
                        </h1>
                        <p className="text-gray-600 mt-2 max-w-2xl">
                            Create, customize and manage dynamic forms with drag & drop interface
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {forms.filter(f => f.status === 'published').length} Published
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                {forms.filter(f => f.status === 'draft').length} Drafts
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                {Object.values(formResponses).reduce((a, b) => a + b, 0)} Total Responses
                            </Badge>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => setShowFormBuilder(!showFormBuilder)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                            size="lg"
                        >
                            {showFormBuilder ? (
                                <>
                                    <X className="w-5 h-5 mr-2" /> Close Builder
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 mr-2" /> Create New Form
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={fetchForms}
                            className="border-gray-300 hover:bg-gray-50"
                            size="lg"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Form Builder */}
                {showFormBuilder && (
                    <Card className="mb-8 border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl text-gray-900">
                                        {editingForm ? '✏️ Edit Form' : '🚀 Create New Form'}
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 mt-2">
                                        Drag and drop fields to build your form • Real-time preview
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={formStatus === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                        {formStatus === 'published' ? 'Published' : 'Draft'}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={resetFormBuilder}
                                        className="h-9 w-9 text-gray-500 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Form Header */}
                            <div className="space-y-6 mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-medium flex items-center gap-2">
                                            <TextCursor className="w-4 h-4" /> Form Title *
                                        </Label>
                                        <Input
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="Enter form title (e.g., Employee Registration)"
                                            className="focus:border-blue-500 bg-white shadow-sm h-11"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-medium flex items-center gap-2">
                                            <Building className="w-4 h-4" /> Select Department *
                                        </Label>
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm h-11"
                                            required
                                        >
                                            <option value="">Select a Department</option>
                                            {safeDepartments.map((dept) => (
                                                <option key={dept._id} value={dept._id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                                        <TextQuote className="w-4 h-4" /> Description
                                    </Label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Enter form description (optional)"
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm min-h-[80px]"
                                        rows="2"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-medium">Form Status</Label>
                                        <select
                                            value={formStatus}
                                            onChange={(e) => setFormStatus(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-medium">Theme</Label>
                                        <select
                                            value={formTheme}
                                            onChange={(e) => setFormTheme(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700"
                                        >
                                            <option value="default">Default</option>
                                            <option value="dark">Dark</option>
                                            <option value="blue">Blue</option>
                                            <option value="green">Green</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Builder Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
                                {/* Fields Palette */}
                                <Card className="border-0 shadow-lg rounded-xl bg-white lg:col-span-1">
                                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
                                        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                            <Layers className="w-5 h-5" /> Field Library
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">Drag or click to add fields</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3 bg-white max-h-[600px] overflow-y-auto">
                                        {/* Category Filter */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {fieldCategories.map((category) => {
                                                const IconComponent = category.icon;
                                                return (
                                                    <button
                                                        key={category.id}
                                                        onClick={() => setSelectedCategory(category.id)}
                                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.id
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        <IconComponent className="w-3 h-3 inline mr-1" />
                                                        {category.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Field Types */}
                                        <div className="space-y-2">
                                            {filteredFieldTypes.map((fieldType) => {
                                                const IconComponent = fieldType.icon;
                                                const colorMap = {
                                                    blue: 'bg-blue-100 text-blue-600',
                                                    green: 'bg-green-100 text-green-600',
                                                    purple: 'bg-purple-100 text-purple-600',
                                                    teal: 'bg-teal-100 text-teal-600',
                                                    red: 'bg-red-100 text-red-600',
                                                    orange: 'bg-orange-100 text-orange-600',
                                                    amber: 'bg-amber-100 text-amber-600',
                                                    violet: 'bg-violet-100 text-violet-600',
                                                    pink: 'bg-pink-100 text-pink-600',
                                                    indigo: 'bg-indigo-100 text-indigo-600',
                                                    cyan: 'bg-cyan-100 text-cyan-600',
                                                    yellow: 'bg-yellow-100 text-yellow-600'
                                                };
                                                return (
                                                    <div
                                                        key={fieldType.type}
                                                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 bg-white hover:shadow-sm group draggable-field"
                                                        draggable
                                                        onDragStart={() => addField(fieldType.type)}
                                                        onClick={() => addField(fieldType.type)}
                                                    >
                                                        <div className={`p-2 rounded-lg ${colorMap[fieldType.color] || 'bg-gray-100 text-gray-600'}`}>
                                                            <IconComponent className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="font-medium text-gray-700 group-hover:text-blue-700">
                                                                {fieldType.label}
                                                            </span>
                                                        </div>
                                                        <MoveVertical className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Form Canvas */}
                                <Card className="border-0 shadow-lg rounded-xl lg:col-span-2 bg-white">
                                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                                    <Layout className="w-5 h-5" /> Form Canvas
                                                </CardTitle>
                                                <CardDescription className="text-gray-600">
                                                    {fields.length} field{fields.length !== 1 ? 's' : ''} added • Drag to reorder
                                                </CardDescription>
                                            </div>
                                            {fields.length > 0 && (
                                                <div className="flex gap-2">
                                                    <Badge className="bg-blue-100 text-blue-700">
                                                        <Eye className="w-3 h-3 mr-1" /> Preview
                                                    </Badge>
                                                    <Badge variant="outline" className="border-gray-300">
                                                        Auto-save
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div 
                                            className={`space-y-4 min-h-[500px] p-2 ${isDragging ? 'border-2 border-dashed border-blue-300 bg-blue-50/20 rounded-lg' : ''}`}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDragEnd}
                                        >
                                            {fields.map((field, index) => (
                                                <div
                                                    key={field.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(index)}
                                                    onDragOver={(e) => handleDragOver(e, index)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`transition-all duration-200 ${dragOverIndex === index ? 'transform scale-[1.02]' : ''}`}
                                                >
                                                    <FormFieldItem
                                                        field={field}
                                                        isSelected={selectedField?.id === field.id}
                                                        onSelect={() => setSelectedField(field)}
                                                        onUpdate={(updates) => updateField(field.id, updates)}
                                                        onRemove={() => removeField(field.id)}
                                                        index={index}
                                                    />
                                                </div>
                                            ))}

                                            {fields.length === 0 && (
                                                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50/30">
                                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                                        <Sparkles className="w-10 h-10 text-blue-400" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-gray-700 mb-3">
                                                        Start building your form
                                                    </h3>
                                                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                                                        Drag fields from the library or click to add them to your form
                                                    </p>
                                                    <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
                                                        <div className="px-4 py-2 bg-white rounded-lg border shadow-sm">
                                                            <MoveVertical className="w-4 h-4 inline mr-2" /> Drag & Drop
                                                        </div>
                                                        <div className="px-4 py-2 bg-white rounded-lg border shadow-sm">
                                                            <Type className="w-4 h-4 inline mr-2" /> Click to Add
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Field Properties Panel */}
                                <Card className="border-0 shadow-lg rounded-xl bg-white lg:col-span-1">
                                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
                                        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                            <Settings className="w-5 h-5" /> Properties
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">
                                            {selectedField ? `Editing: ${selectedField.label}` : 'Select a field to edit'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 max-h-[600px] overflow-y-auto">
                                        {selectedField ? (
                                            <FieldProperties 
                                                field={selectedField} 
                                                onUpdate={(updates) => updateField(selectedField.id, updates)} 
                                            />
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p className="font-medium">No field selected</p>
                                                <p className="text-sm mt-1">Click on a field in the canvas to edit its properties</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t">
                                <Button
                                    onClick={handleSaveForm}
                                    disabled={loading || !formTitle.trim() || !selectedDepartment || fields.length === 0}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 py-6 text-lg font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            {editingForm ? 'Updating Form...' : 'Saving Form...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" />
                                            {editingForm ? 'Update Form' : 'Save Form'}
                                        </>
                                    )}
                                </Button>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={resetFormBuilder}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-6 text-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => previewForm({
                                            title: formTitle,
                                            description: formDescription,
                                            depId: selectedDepartment,
                                            fields: fields,
                                            status: formStatus
                                        })}
                                        className="py-6 text-lg"
                                        disabled={fields.length === 0}
                                    >
                                        <Eye className="w-5 h-5 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Forms List Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Your Forms</h2>
                        <p className="text-gray-600">Manage and track all your created forms</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search forms..."
                                className="pl-10 bg-white border-gray-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                            
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name A-Z</option>
                            </select>
                            
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                                className="h-10 w-10"
                            >
                                {viewMode === "grid" ? <ListIcon className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Forms Grid/List View */}
                {fetching ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-lg">Loading your forms...</span>
                        </div>
                    </div>
                ) : sortedForms.length === 0 ? (
                    <Card className="shadow-lg border-0 rounded-2xl overflow-hidden bg-white">
                        <CardContent className="py-24 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <FileText className="w-12 h-12 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {forms.length === 0 ? "No forms created yet" : "No matches found"}
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto mb-8 text-lg">
                                {forms.length === 0
                                    ? "Start building your first form to collect data efficiently."
                                    : "Try adjusting your filters or search terms."
                                }
                            </p>
                            {forms.length === 0 && (
                                <Button
                                    onClick={() => setShowFormBuilder(true)}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg px-8 py-6 text-lg"
                                >
                                    <Plus className="w-6 h-6 mr-3" />
                                    Create Your First Form
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : viewMode === "grid" ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedForms.map((form) => (
                            <FormCard 
                                key={form._id} 
                                form={form} 
                                onEdit={editForm}
                                onDuplicate={duplicateForm}
                                onDelete={deleteForm}
                                onPreview={previewForm}
                                onPublish={publishForm}
                                onUnpublish={unpublishForm}
                                onCopyLink={copyFormLink}
                                onDownloadResponses={downloadResponses}
                                responses={formResponses[form._id] || 0}
                                getDepartmentName={getDepartmentName}
                            />
                        ))}
                    </div>
                ) : (
                    // Table View
                    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden bg-white">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-gray-50 to-white">
                                        <TableRow className="border-b border-gray-200">
                                            <TableHead className="font-bold text-gray-900">Form Details</TableHead>
                                            <TableHead className="font-bold text-gray-900">Department</TableHead>
                                            <TableHead className="font-bold text-gray-900">Status</TableHead>
                                            <TableHead className="font-bold text-gray-900">Fields</TableHead>
                                            <TableHead className="font-bold text-gray-900">Responses</TableHead>
                                            <TableHead className="font-bold text-gray-900">Created</TableHead>
                                            <TableHead className="font-bold text-gray-900 text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedForms.map((form, index) => (
                                            <TableRow key={form._id} className="hover:bg-gray-50/50 border-b border-gray-100 group">
                                                <TableCell>
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="border-2 border-white shadow-md h-12 w-12">
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold">
                                                                {form.title?.[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-blue-700">
                                                                {form.title}
                                                            </div>
                                                            <div className="text-gray-500 text-sm mt-1 line-clamp-1">
                                                                {form.description || "No description"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0">
                                                        {getDepartmentName(form.depId)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={form.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                                        {form.status === 'published' ? 'Published' : 'Draft'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {form.fields.slice(0, 3).map((field, idx) => {
                                                            const IconComponent = getFieldIcon(field.type);
                                                            return (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="outline"
                                                                    className="text-xs bg-white text-gray-700 border-gray-200"
                                                                >
                                                                    <IconComponent className="w-3 h-3 mr-1" />
                                                                    {field.type}
                                                                </Badge>
                                                            );
                                                        })}
                                                        {form.fields.length > 3 && (
                                                            <Badge className="text-xs bg-gray-100 text-gray-600">
                                                                +{form.fields.length - 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="w-4 h-4 text-blue-500" />
                                                        <span className="font-bold">{formResponses[form._id] || 0}</span>
                                                        <span className="text-gray-500 text-sm">responses</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-600">
                                                        {formatDate(form.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => previewForm(form)}
                                                            className="h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Preview"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => editForm(form)}
                                                            className="h-8 w-8 text-gray-600 hover:text-green-600 hover:bg-green-50"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        {form.status === 'published' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => unpublishForm(form._id)}
                                                                className="h-8 w-8 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50"
                                                                title="Unpublish"
                                                            >
                                                                <EyeOff className="w-4 h-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => publishForm(form._id)}
                                                                className="h-8 w-8 text-gray-600 hover:text-green-600 hover:bg-green-50"
                                                                title="Publish"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => downloadResponses(form._id)}
                                                            className="h-8 w-8 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                                                            title="Download Responses"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => duplicateForm(form)}
                                                            className="h-8 w-8 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                                                            title="Duplicate"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteForm(form._id)}
                                                            className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination (if needed) */}
                {sortedForms.length > 0 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <Button variant="outline" size="sm" disabled>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Page</span>
                            <span className="font-bold text-gray-900">1</span>
                            <span className="text-gray-600">of</span>
                            <span className="font-bold text-gray-900">1</span>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Form Card Component for Grid View
function FormCard({ form, onEdit, onDuplicate, onDelete, onPreview, onPublish, onUnpublish, onCopyLink, onDownloadResponses, responses, getDepartmentName }) {
    const [showMore, setShowMore] = useState(false);
    
    return (
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg text-gray-900 line-clamp-1">{form.title}</CardTitle>
                        <CardDescription className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {form.description || "No description"}
                        </CardDescription>
                    </div>
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMore(!showMore)}
                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                        {showMore && (
                            <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            onPreview(form);
                                            setShowMore(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Eye className="w-4 h-4" /> Preview
                                    </button>
                                    <button
                                        onClick={() => {
                                            onEdit(form);
                                            setShowMore(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            onCopyLink(form._id);
                                            setShowMore(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Share2 className="w-4 h-4" /> Copy Link
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDuplicate(form);
                                            setShowMore(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Copy className="w-4 h-4" /> Duplicate
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDownloadResponses(form._id);
                                            setShowMore(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Download className="w-4 h-4" /> Download Responses
                                    </button>
                                    <div className="border-t my-1"></div>
                                    <button
                                        onClick={() => {
                                            onDelete(form._id);
                                            setShowMore(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <Badge className={form.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {form.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getDepartmentName(form.depId)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* Fields Summary */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Fields ({form.fields?.length || 0})</span>
                            <span className="text-xs text-gray-500">Drag & drop</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {form.fields?.slice(0, 5).map((field, idx) => {
                                const IconComponent = getFieldIcon(field.type);
                                return (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs bg-white text-gray-700 border-gray-200"
                                    >
                                        <IconComponent className="w-3 h-3 mr-1" />
                                        {field.type}
                                    </Badge>
                                );
                            })}
                            {form.fields?.length > 5 && (
                                <Badge className="text-xs bg-gray-100 text-gray-600">
                                    +{form.fields.length - 5}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Response Stats */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{responses}</div>
                                <div className="text-xs text-gray-500">Responses</div>
                            </div>
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                            Last updated: {new Date(form.updatedAt || form.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {form.status === 'published' ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUnpublish(form._id)}
                                className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                            >
                                <EyeOff className="w-4 h-4 mr-2" /> Unpublish
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPublish(form._id)}
                                className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                            >
                                <Eye className="w-4 h-4 mr-2" /> Publish
                            </Button>
                        )}
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onPreview(form)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Eye className="w-4 h-4 mr-2" /> Preview
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Form Field Component
function FormFieldItem({ field, isSelected, onSelect, onUpdate, onRemove, index }) {
    const IconComponent = getFieldIcon(field.type);

    const renderFieldInput = () => {
        switch (field.type) {
            case 'text':
                return <Input type="text" placeholder={field.placeholder || field.label} disabled className="bg-gray-50/50 border-gray-200" />;
            case 'email':
                return <Input type="email" placeholder={field.placeholder || field.label} disabled className="bg-gray-50/50 border-gray-200" />;
            case 'number':
                return <Input type="number" placeholder={field.placeholder || field.label} disabled className="bg-gray-50/50 border-gray-200" />;
            case 'tel':
                return <Input type="tel" placeholder={field.placeholder || field.label} disabled className="bg-gray-50/50 border-gray-200" />;
            case 'url':
                return <Input type="url" placeholder={field.placeholder || field.label} disabled className="bg-gray-50/50 border-gray-200" />;
            case 'password':
                return (
                    <div className="relative">
                        <Input type="password" placeholder={field.placeholder || field.label} disabled className="bg-gray-50/50 border-gray-200 pr-10" />
                        <EyeOff className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case 'date':
                return (
                    <div className="relative">
                        <Input type="date" disabled className="bg-gray-50/50 border-gray-200" />
                        <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case 'time':
                return (
                    <div className="relative">
                        <Input type="time" disabled className="bg-gray-50/50 border-gray-200" />
                        <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case 'datetime':
                return (
                    <div className="relative">
                        <Input type="datetime-local" disabled className="bg-gray-50/50 border-gray-200" />
                        <CalendarClock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case 'select':
                return (
                    <select disabled className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 text-gray-700">
                        <option value="">Select an option</option>
                        {field.options?.map((option, idx) => (
                            <option key={idx} value={option}>{option}</option>
                        ))}
                    </select>
                );
            case 'textarea':
                return <textarea
                    placeholder={field.placeholder || field.label}
                    disabled
                    rows="3"
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 text-gray-700"
                />;
            case 'checkbox':
                return (
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            disabled
                            className="rounded border-gray-300 bg-gray-100 h-5 w-5"
                        />
                        <Label className="text-gray-700 font-medium">{field.label}</Label>
                    </div>
                );
            case 'radio':
                return (
                    <div className="space-y-2.5">
                        {field.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name={field.name}
                                    disabled
                                    className="rounded-full border-gray-300 bg-gray-100 h-5 w-5"
                                />
                                <Label className="text-gray-700">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case 'range':
                return (
                    <div className="space-y-3">
                        <input
                            type="range"
                            min={field.min || 0}
                            max={field.max || 100}
                            step={field.step || 1}
                            defaultValue={field.defaultValue || 50}
                            disabled
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{field.min || 0}</span>
                            <span className="font-medium">Value: {field.defaultValue || 50}</span>
                            <span>{field.max || 100}</span>
                        </div>
                    </div>
                );
            case 'file':
                return (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50/30">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-2">
                            {field.multiple ? 'Multiple files allowed' : 'Single file only'} • {field.accept || 'Any file type'}
                        </p>
                    </div>
                );
            case 'rating':
                return (
                    <div className="flex space-x-1">
                        {Array.from({ length: field.maxRating || 5 }, (_, i) => (
                            <Star
                                key={i}
                                className={`w-7 h-7 ${i < (field.defaultRating || 0)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                );
            case 'toggle':
                return (
                    <div className="flex items-center space-x-4">
                        <div className={`relative inline-block w-14 h-7 rounded-full ${field.checked ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${field.checked ? 'transform translate-x-8' : 'transform translate-x-1'
                                }`} />
                        </div>
                        <Label className="text-gray-700 font-medium">{field.checked ? 'Enabled' : 'Disabled'}</Label>
                    </div>
                );
            case 'address':
                return (
                    <div className="space-y-3">
                        <Input type="text" placeholder="Street address" disabled className="bg-gray-50/50 border-gray-200" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input type="text" placeholder="City" disabled className="bg-gray-50/50 border-gray-200" />
                            <Input type="text" placeholder="State" disabled className="bg-gray-50/50 border-gray-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input type="text" placeholder="ZIP code" disabled className="bg-gray-50/50 border-gray-200" />
                            <Input type="text" placeholder="Country" disabled className="bg-gray-50/50 border-gray-200" />
                        </div>
                    </div>
                );
            case 'creditCard':
                return (
                    <div className="space-y-3">
                        <div className="relative">
                            <Input type="text" placeholder="Card number" disabled className="bg-gray-50/50 border-gray-200 pl-12" />
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input type="text" placeholder="MM/YY" disabled className="bg-gray-50/50 border-gray-200" />
                            <Input type="text" placeholder="CVC" disabled className="bg-gray-50/50 border-gray-200" />
                        </div>
                        <Input type="text" placeholder="Cardholder name" disabled className="bg-gray-50/50 border-gray-200" />
                    </div>
                );
            case 'color':
                return (
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-lg border border-gray-300" 
                            style={{ backgroundColor: field.defaultColor || '#3b82f6' }}
                        />
                        <Input type="text" placeholder="#3b82f6" disabled className="bg-gray-50/50 border-gray-200" />
                    </div>
                );
            default:
                return <Input type="text" placeholder={field.placeholder || field.label} disabled className="bg-gray-50/50 border-gray-200" />;
        }
    };

    return (
        <div
            className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${isSelected
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'
                }`}
            onClick={onSelect}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                            <IconComponent className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            {field.label}
                            {field.required && (
                                <Badge className="bg-red-100 text-red-600 border-0 text-xs px-2 py-0.5">Required</Badge>
                            )}
                        </div>
                        <div className="text-sm text-gray-500 font-mono mt-1">{field.name}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-2 cursor-move hover:bg-gray-100 rounded-lg" draggable>
                        <MoveVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            {renderFieldInput()}
            {field.helpText && (
                <p className="text-sm text-gray-500 mt-2">{field.helpText}</p>
            )}
        </div>
    );
}

// Field Properties Component
function FieldProperties({ field, onUpdate }) {
    return (
        <div className="space-y-6">
            {/* Basic Properties */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Field Label</Label>
                    <Input
                        value={field.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                        placeholder="Enter field label"
                        className="bg-white border-gray-300"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Field Name</Label>
                    <Input
                        value={field.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="Enter field name"
                        className="bg-white border-gray-300 font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Placeholder Text</Label>
                    <Input
                        value={field.placeholder || ''}
                        onChange={(e) => onUpdate({ placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                        className="bg-white border-gray-300"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Help Text</Label>
                    <Input
                        value={field.helpText || ''}
                        onChange={(e) => onUpdate({ helpText: e.target.value })}
                        placeholder="Help text for users"
                        className="bg-white border-gray-300"
                    />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div>
                        <Label htmlFor="required" className="text-gray-700 font-medium cursor-pointer">
                            Required Field
                        </Label>
                        <p className="text-sm text-gray-500">User must fill this field</p>
                    </div>
                    <input
                        type="checkbox"
                        id="required"
                        checked={field.required}
                        onChange={(e) => onUpdate({ required: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                    />
                </div>
            </div>

            {/* Type-specific Properties */}
            {(field.type === 'select' || field.type === 'radio') && (
                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Options</Label>
                    <textarea
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => onUpdate({
                            options: e.target.value.split('\n').filter(opt => opt.trim())
                        })}
                        placeholder="Enter each option on a new line"
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 min-h-[120px] font-mono"
                    />
                    <p className="text-sm text-gray-500">One option per line</p>
                </div>
            )}

            {field.type === 'range' && (
                <div className="space-y-4">
                    <Label className="text-gray-700 font-medium">Range Settings</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Min</Label>
                            <Input
                                type="number"
                                value={field.min || 0}
                                onChange={(e) => onUpdate({ min: parseInt(e.target.value) || 0 })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Max</Label>
                            <Input
                                type="number"
                                value={field.max || 100}
                                onChange={(e) => onUpdate({ max: parseInt(e.target.value) || 100 })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Step</Label>
                            <Input
                                type="number"
                                value={field.step || 1}
                                onChange={(e) => onUpdate({ step: parseInt(e.target.value) || 1 })}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {field.type === 'date' && (
                <div className="space-y-4">
                    <Label className="text-gray-700 font-medium">Date Settings</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Min Date</Label>
                            <Input
                                type="date"
                                value={field.minDate || ''}
                                onChange={(e) => onUpdate({ minDate: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Max Date</Label>
                            <Input
                                type="date"
                                value={field.maxDate || ''}
                                onChange={(e) => onUpdate({ maxDate: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {field.type === 'time' && (
                <div className="space-y-4">
                    <Label className="text-gray-700 font-medium">Time Settings</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Min Time</Label>
                            <Input
                                type="time"
                                value={field.minTime || ''}
                                onChange={(e) => onUpdate({ minTime: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Max Time</Label>
                            <Input
                                type="time"
                                value={field.maxTime || ''}
                                onChange={(e) => onUpdate({ maxTime: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Time Step (minutes)</Label>
                        <select
                            value={field.step || 900}
                            onChange={(e) => onUpdate({ step: parseInt(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                        >
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                            <option value="600">10 minutes</option>
                            <option value="900">15 minutes</option>
                            <option value="1800">30 minutes</option>
                            <option value="3600">1 hour</option>
                        </select>
                    </div>
                </div>
            )}

            {field.type === 'datetime' && (
                <div className="space-y-4">
                    <Label className="text-gray-700 font-medium">Date & Time Settings</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Min Date/Time</Label>
                            <Input
                                type="datetime-local"
                                value={field.minDateTime || ''}
                                onChange={(e) => onUpdate({ minDateTime: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Max Date/Time</Label>
                            <Input
                                type="datetime-local"
                                value={field.maxDateTime || ''}
                                onChange={(e) => onUpdate({ maxDateTime: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {field.type === 'file' && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="multiple"
                            checked={field.multiple || false}
                            onChange={(e) => onUpdate({ multiple: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="multiple" className="text-gray-700 font-medium">
                            Allow Multiple Files
                        </Label>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-gray-700">Max File Size (MB)</Label>
                        <Input
                            type="number"
                            value={field.maxSize || 5}
                            onChange={(e) => onUpdate({ maxSize: parseInt(e.target.value) })}
                            className="bg-white"
                            min="1"
                            max="100"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-gray-700">Accepted File Types</Label>
                        <select
                            value={field.accept || '*/*'}
                            onChange={(e) => onUpdate({ accept: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                        >
                            <option value="*/*">All Files</option>
                            <option value="image/*">Images Only</option>
                            <option value=".pdf,.doc,.docx">Documents</option>
                            <option value=".jpg,.jpeg,.png,.gif">Images (JPG, PNG, GIF)</option>
                        </select>
                    </div>
                </div>
            )}

            {field.type === 'rating' && (
                <div className="space-y-4">
                    <Label className="text-gray-700 font-medium">Rating Settings</Label>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Label className="text-sm text-gray-600">Max Stars</Label>
                            <Input
                                type="number"
                                value={field.maxRating || 5}
                                onChange={(e) => onUpdate({ maxRating: parseInt(e.target.value) })}
                                min="1"
                                max="10"
                                className="bg-white"
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-sm text-gray-600">Default</Label>
                            <Input
                                type="number"
                                value={field.defaultRating || 0}
                                onChange={(e) => onUpdate({ defaultRating: parseInt(e.target.value) })}
                                min="0"
                                max={field.maxRating || 5}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Field Width */}
            <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Field Width</Label>
                <select
                    value={field.width || "full"}
                    onChange={(e) => onUpdate({ width: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                >
                    <option value="full">Full Width</option>
                    <option value="half">Half Width</option>
                    <option value="third">One Third</option>
                </select>
            </div>
        </div>
    );
}

// Preview Field Component
function PreviewFieldComponent({ field }) {
    const [showPassword, setShowPassword] = useState(false);
    const [rating, setRating] = useState(field.defaultRating || 0);
    const [isChecked, setIsChecked] = useState(field.checked || false);
    const [isToggleOn, setIsToggleOn] = useState(field.checked || false);
    const [selectedColor, setSelectedColor] = useState(field.defaultColor || '#3b82f6');

    const widthClass = {
        full: 'w-full',
        half: 'w-full md:w-1/2',
        third: 'w-full md:w-1/3'
    }[field.width || 'full'];

    const renderField = () => {
        switch (field.type) {
            case 'text':
                return <Input type="text" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className={`${widthClass} bg-white border-gray-300 h-11`} />;
            case 'email':
                return <Input type="email" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className={`${widthClass} bg-white border-gray-300 h-11`} />;
            case 'number':
                return <Input type="number" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className={`${widthClass} bg-white border-gray-300 h-11`} />;
            case 'tel':
                return <Input type="tel" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className={`${widthClass} bg-white border-gray-300 h-11`} />;
            case 'url':
                return <Input type="url" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className={`${widthClass} bg-white border-gray-300 h-11`} />;
            case 'password':
                return (
                    <div className={`relative ${widthClass}`}>
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="bg-white border-gray-300 h-11 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeOn className="w-5 h-5" />}
                        </button>
                    </div>
                );
            case 'date':
                return (
                    <div className={`relative ${widthClass}`}>
                        <Input type="date" className="bg-white border-gray-300 h-11" min={field.minDate} max={field.maxDate} />
                        <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                );
            case 'time':
                return (
                    <div className={`relative ${widthClass}`}>
                        <Input type="time" className="bg-white border-gray-300 h-11" step={field.step || 900} min={field.minTime} max={field.maxTime} />
                        <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                );
            case 'datetime':
                return (
                    <div className={`relative ${widthClass}`}>
                        <Input type="datetime-local" className="bg-white border-gray-300 h-11" min={field.minDateTime} max={field.maxDateTime} />
                        <CalendarClock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                );
            case 'select':
                return (
                    <select className={`${widthClass} p-3 border border-gray-300 rounded-lg bg-white text-gray-700 h-11`}>
                        <option value="">Select an option</option>
                        {field.options?.map((option, idx) => (
                            <option key={idx} value={option}>{option}</option>
                        ))}
                    </select>
                );
            case 'textarea':
                return <textarea
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    rows="3"
                    className={`${widthClass} p-3 border border-gray-300 rounded-lg bg-white text-gray-700`}
                />;
            case 'checkbox':
                return (
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="rounded border-gray-300 bg-white h-5 w-5 text-blue-600"
                        />
                        <Label className="text-gray-700 font-medium">{field.label}</Label>
                    </div>
                );
            case 'radio':
                return (
                    <div className="space-y-2.5">
                        {field.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name={field.name}
                                    className="rounded-full border-gray-300 bg-white h-5 w-5 text-blue-600"
                                />
                                <Label className="text-gray-700">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case 'range':
                return (
                    <div className={`${widthClass} space-y-3`}>
                        <input
                            type="range"
                            min={field.min || 0}
                            max={field.max || 100}
                            step={field.step || 1}
                            defaultValue={field.defaultValue || 50}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{field.min || 0}</span>
                            <span className="font-medium">Value: {field.defaultValue || 50}</span>
                            <span>{field.max || 100}</span>
                        </div>
                    </div>
                );
            case 'file':
                return (
                    <div className={`${widthClass} border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-white cursor-pointer hover:border-gray-400 transition-colors`}>
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-2">
                            {field.multiple ? 'Multiple files allowed' : 'Single file only'} • Max {field.maxSize || 5}MB • {field.accept || 'Any file type'}
                        </p>
                    </div>
                );
            case 'rating':
                return (
                    <div className="flex space-x-1">
                        {Array.from({ length: field.maxRating || 5 }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setRating(i + 1)}
                                className="focus:outline-none transform hover:scale-110 transition-transform"
                            >
                                <Star
                                    className={`w-8 h-8 transition-colors ${i < rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300 hover:text-yellow-300'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                );
            case 'toggle':
                return (
                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={() => setIsToggleOn(!isToggleOn)}
                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isToggleOn ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isToggleOn ? 'translate-x-7' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <Label className="text-gray-700 font-medium">{isToggleOn ? 'Enabled' : 'Disabled'}</Label>
                    </div>
                );
            case 'address':
                return (
                    <div className="space-y-3">
                        <Input type="text" placeholder="Street address" className="bg-white border-gray-300 h-11" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input type="text" placeholder="City" className="bg-white border-gray-300 h-11" />
                            <Input type="text" placeholder="State" className="bg-white border-gray-300 h-11" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input type="text" placeholder="ZIP code" className="bg-white border-gray-300 h-11" />
                            <Input type="text" placeholder="Country" className="bg-white border-gray-300 h-11" />
                        </div>
                    </div>
                );
            case 'creditCard':
                return (
                    <div className="space-y-3">
                        <div className="relative">
                            <Input type="text" placeholder="Card number" className="bg-white border-gray-300 h-11 pl-12" />
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input type="text" placeholder="MM/YY" className="bg-white border-gray-300 h-11" />
                            <Input type="text" placeholder="CVC" className="bg-white border-gray-300 h-11" />
                        </div>
                        <Input type="text" placeholder="Cardholder name" className="bg-white border-gray-300 h-11" />
                    </div>
                );
            case 'color':
                return (
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-12 h-12 cursor-pointer rounded-lg border border-gray-300"
                        />
                        <Input
                            type="text"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="bg-white border-gray-300 h-11 font-mono"
                        />
                    </div>
                );
            default:
                return <Input type="text" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className={`${widthClass} bg-white border-gray-300 h-11`} />;
        }
    };

    return (
        <div className={widthClass}>
            {renderField()}
            {field.helpText && (
                <p className="text-sm text-gray-500 mt-2">{field.helpText}</p>
            )}
        </div>
    );
}

// Helper functions
function getFieldIcon(fieldType) {
    const fieldTypes = {
        text: TextCursor,
        email: EmailIcon,
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
        creditCard: CreditCard,
        color: Palette
    };
    return fieldTypes[fieldType] || TextCursor;
}

function getFieldColor(fieldType) {
    const fieldColors = {
        text: 'blue',
        email: 'green',
        number: 'purple',
        tel: 'teal',
        url: 'blue',
        password: 'red',
        date: 'orange',
        time: 'amber',
        datetime: 'violet',
        select: 'pink',
        textarea: 'indigo',
        checkbox: 'green',
        radio: 'purple',
        range: 'orange',
        file: 'cyan',
        rating: 'yellow',
        toggle: 'blue',
        address: 'red',
        creditCard: 'indigo',
        color: 'pink'
    };
    return fieldColors[fieldType] || 'gray';
}

// Missing icon component
const RefreshCw = ({ className = "w-4 h-4" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
    </svg>
);