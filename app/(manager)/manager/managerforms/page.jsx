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
    Eye as EyeOn
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

    // Form builder state
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [fields, setFields] = useState([]);
    const [selectedField, setSelectedField] = useState(null);
    const [editingForm, setEditingForm] = useState(null);

    // Updated field types with time and datetime
    const fieldTypes = [
        { type: 'text', label: 'Text Input', icon: TextCursor, color: 'blue' },
        { type: 'email', label: 'Email Input', icon: EmailIcon, color: 'green' },
        { type: 'number', label: 'Number Input', icon: Hash, color: 'purple' },
        { type: 'tel', label: 'Phone Number', icon: Phone, color: 'teal' },
        { type: 'url', label: 'URL Input', icon: Link, color: 'blue' },
        { type: 'password', label: 'Password', icon: Lock, color: 'red' },
        { type: 'date', label: 'Date Picker', icon: CalendarDays, color: 'orange' },
        { type: 'time', label: 'Time Picker', icon: Clock, color: 'amber' },
        { type: 'datetime', label: 'Date & Time', icon: CalendarClock, color: 'violet' },
        { type: 'select', label: 'Dropdown', icon: List, color: 'pink' },
        { type: 'textarea', label: 'Text Area', icon: TextQuote, color: 'indigo' },
        { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'green' },
        { type: 'radio', label: 'Radio Buttons', icon: Radio, color: 'purple' },
        { type: 'range', label: 'Range Slider', icon: SlidersHorizontal, color: 'orange' },
        { type: 'file', label: 'File Upload', icon: Upload, color: 'cyan' },
        { type: 'rating', label: 'Star Rating', icon: Star, color: 'yellow' },
        { type: 'toggle', label: 'Toggle Switch', icon: ToggleLeft, color: 'blue' },
        { type: 'address', label: 'Address', icon: MapPin, color: 'red' },
        { type: 'creditCard', label: 'Credit Card', icon: CreditCard, color: 'indigo' }
    ];

    useEffect(() => {
        if (status === "loading") return;

        if (!session || (session.user.role !== "Admin" && session.user.role !== "Manager")) {
            router.push("/managerlogin");
            return;
        }

        fetchForms();
        fetchDepartments();
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
            id: `field-${Date.now()}`,
            type: fieldType,
            label: `New ${fieldTypes.find(f => f.type === fieldType)?.label || fieldType} Field`,
            name: `field_${fields.length + 1}`,
            required: false,
            placeholder: `Enter ${fieldTypes.find(f => f.type === fieldType)?.label.toLowerCase() || fieldType}`
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
                fields: fields.map(({ id, ...field }) => field)
            };

            let response;
            if (editingForm) {
                response = await axios.put(`/api/manager/managerforms/${editingForm._id}`, formData);
            } else {
                response = await axios.post("/api/manager/managerforms", formData);
            }

            if (response.status === 200 || response.status === 201) {
                toast.success(`Form ${editingForm ? 'updated' : 'created'} successfully!`);
                resetFormBuilder();
                fetchForms();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to ${editingForm ? 'update' : 'create'} form`);
        } finally {
            setLoading(false);
        }
    };

    // Update form function
    const updateForm = async (formId, formData) => {
        try {
            const response = await axios.put(`/api/manager/managerforms/${formId}`, formData);

            if (response.status === 200) {
                toast.success("Form updated successfully!");
                fetchForms();
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update form");
            throw error;
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
            setEditingForm(formDetails);
            setShowFormBuilder(true);
        } catch (error) {
            toast.error("Failed to load form for editing");
        }
    };

    const duplicateForm = async (form) => {
        try {
            const response = await axios.post("/api/manager/managerforms", {
                ...form,
                title: `${form.title} (Copy)`,
                _id: undefined
            });

            if (response.status === 201) {
                toast.success("Form duplicated successfully!");
                fetchForms();
            }
        } catch (error) {
            toast.error("Failed to duplicate form");
        }
    };

    const deleteForm = async (formId) => {
        if (!confirm("Are you sure you want to delete this form?")) return;

        try {
            const response = await axios.delete(`/api/manager/managerforms/${formId}`);

            if (response.status === 200) {
                toast.success("Form deleted successfully!");
                fetchForms();
            }
        } catch (error) {
            toast.error("Failed to delete form");
        }
    };

    const previewForm = (form) => {
        setActiveForm(form);
    };

    const closePreview = () => {
        setActiveForm(null);
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

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="flex items-center gap-3 bg-white p-6 rounded-xl shadow-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-700 font-medium">Loading Dashboard...</span>
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
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white shadow-2xl border-0 rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-white text-2xl">{activeForm.title}</CardTitle>
                                    <CardDescription className="text-blue-100 mt-2">
                                        {activeForm.description}
                                    </CardDescription>
                                    {activeForm.depId && (
                                        <Badge className="mt-3 bg-white/20 text-white border-0">
                                            <Building className="w-3 h-3 mr-1" />
                                            Department: {getDepartmentName(activeForm.depId)}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={closePreview}
                                    className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
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
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            Dynamic Form Builder
                        </h1>
                        <p className="text-gray-600 mt-2 max-w-2xl">
                            Create, customize and manage dynamic forms with drag & drop interface and real-time preview
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowFormBuilder(!showFormBuilder)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {showFormBuilder ? 'Close Builder' : 'Create New Form'}
                    </Button>
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={resetFormBuilder}
                                    className="h-9 w-9 text-gray-500 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Form Header */}
                            <div className="space-y-6 mb-8 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        {fetchingDepartments && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Loading departments...
                                            </p>
                                        )}
                                        {safeDepartments.length === 0 && !fetchingDepartments && (
                                            <p className="text-sm text-red-500">No departments found. Please create departments first.</p>
                                        )}
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
                            </div>

                            {/* Builder Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
                                {/* Fields Palette */}
                                <Card className="border-0 shadow-lg rounded-xl bg-white">
                                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
                                        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                            <GripVertical className="w-5 h-5" /> Field Types
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">Click to add fields</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 p-3 bg-white max-h-[600px] overflow-y-auto">
                                        {fieldTypes.map((fieldType) => {
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
                                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 bg-white hover:shadow-sm group"
                                                    onClick={() => addField(fieldType.type)}
                                                >
                                                    <div className={`p-2 rounded-lg ${colorMap[fieldType.color] || 'bg-gray-100 text-gray-600'}`}>
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-gray-700 group-hover:text-blue-700">
                                                        {fieldType.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>

                                {/* Form Canvas */}
                                <Card className="border-0 shadow-lg rounded-xl lg:col-span-2 bg-white">
                                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                                    <TextCursor className="w-5 h-5" /> Form Canvas
                                                </CardTitle>
                                                <CardDescription className="text-gray-600">
                                                    {fields.length} field{fields.length !== 1 ? 's' : ''} added • Drag to reorder
                                                </CardDescription>
                                            </div>
                                            {fields.length > 0 && (
                                                <Badge className="bg-blue-100 text-blue-700">
                                                    Preview Mode
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="space-y-4 min-h-[500px] p-2">
                                            {fields.map((field, index) => (
                                                <FormFieldItem
                                                    key={field.id}
                                                    field={field}
                                                    isSelected={selectedField?.id === field.id}
                                                    onSelect={() => setSelectedField(field)}
                                                    onUpdate={(updates) => updateField(field.id, updates)}
                                                    onRemove={() => removeField(field.id)}
                                                    index={index}
                                                />
                                            ))}

                                            {fields.length === 0 && (
                                                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50/30">
                                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <TextCursor className="w-10 h-10 text-blue-400" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-gray-700 mb-3">
                                                        Your canvas is empty
                                                    </h3>
                                                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                                                        Start building your form by adding fields from the palette on the left
                                                    </p>
                                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                                        <span className="px-3 py-1 bg-white rounded-full border">Click to add</span>
                                                        <span className="px-3 py-1 bg-white rounded-full border">Drag & drop</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Field Properties */}
                            {selectedField && (
                                <Card className="mt-6 border-0 shadow-lg rounded-xl bg-white animate-in slide-in-from-bottom-5 duration-300">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                                    ⚙️ Field Properties
                                                </CardTitle>
                                                <CardDescription className="text-gray-600">
                                                    Configure <span className="font-semibold text-blue-600">{selectedField.label}</span> field
                                                </CardDescription>
                                            </div>
                                            <Badge className={`${selectedField.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {selectedField.required ? 'Required' : 'Optional'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                                                        <TextCursor className="w-4 h-4" /> Field Label
                                                    </Label>
                                                    <Input
                                                        value={selectedField.label}
                                                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                                        placeholder="Enter field label"
                                                        className="bg-white border-gray-300 focus:border-blue-500 h-11"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                                                        <Hash className="w-4 h-4" /> Field Name
                                                    </Label>
                                                    <Input
                                                        value={selectedField.name}
                                                        onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                                                        placeholder="Enter field name (no spaces)"
                                                        className="bg-white border-gray-300 focus:border-blue-500 h-11 font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                                                        <TextQuote className="w-4 h-4" /> Placeholder Text
                                                    </Label>
                                                    <Input
                                                        value={selectedField.placeholder || ''}
                                                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                                        placeholder="Enter placeholder text"
                                                        className="bg-white border-gray-300 focus:border-blue-500 h-11"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        id="required"
                                                        checked={selectedField.required}
                                                        onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                                                    />
                                                    <div>
                                                        <Label htmlFor="required" className="text-gray-700 font-medium cursor-pointer">
                                                            Required Field
                                                        </Label>
                                                        <p className="text-sm text-gray-500">User must fill this field</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                {/* Type-specific properties */}
                                                {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-700 font-medium flex items-center gap-2">
                                                            <List className="w-4 h-4" /> Options
                                                        </Label>
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={selectedField.options?.join('\n') || ''}
                                                                onChange={(e) => updateField(selectedField.id, {
                                                                    options: e.target.value.split('\n').filter(opt => opt.trim())
                                                                })}
                                                                placeholder="Enter each option on a new line"
                                                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[120px] font-mono"
                                                            />
                                                            <p className="text-sm text-gray-500">One option per line</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedField.type === 'range' && (
                                                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                        <Label className="text-gray-700 font-medium">Range Settings</Label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Min</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.min || 0}
                                                                    onChange={(e) => updateField(selectedField.id, { min: parseInt(e.target.value) })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Max</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.max || 100}
                                                                    onChange={(e) => updateField(selectedField.id, { max: parseInt(e.target.value) })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Step</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.step || 1}
                                                                    onChange={(e) => updateField(selectedField.id, { step: parseInt(e.target.value) })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedField.type === 'file' && (
                                                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                        <div className="flex items-center space-x-3">
                                                            <input
                                                                type="checkbox"
                                                                id="multiple"
                                                                checked={selectedField.multiple || false}
                                                                onChange={(e) => updateField(selectedField.id, { multiple: e.target.checked })}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="multiple" className="text-gray-700 font-medium">
                                                                Allow Multiple Files
                                                            </Label>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700">Accepted File Types</Label>
                                                            <select
                                                                value={selectedField.accept || '*/*'}
                                                                onChange={(e) => updateField(selectedField.id, { accept: e.target.value })}
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

                                                {selectedField.type === 'rating' && (
                                                    <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                        <Label className="text-gray-700 font-medium">Rating Settings</Label>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1">
                                                                <Label className="text-sm text-gray-600">Max Stars</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.maxRating || 5}
                                                                    onChange={(e) => updateField(selectedField.id, { maxRating: parseInt(e.target.value) })}
                                                                    min="1"
                                                                    max="10"
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <Label className="text-sm text-gray-600">Default</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.defaultRating || 0}
                                                                    onChange={(e) => updateField(selectedField.id, { defaultRating: parseInt(e.target.value) })}
                                                                    min="0"
                                                                    max={selectedField.maxRating || 5}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Date, Time, and Datetime properties */}
                                                {selectedField.type === 'date' && (
                                                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                        <Label className="text-gray-700 font-medium">Date Settings</Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Min Date</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={selectedField.minDate || ''}
                                                                    onChange={(e) => updateField(selectedField.id, { minDate: e.target.value })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Max Date</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={selectedField.maxDate || ''}
                                                                    onChange={(e) => updateField(selectedField.id, { maxDate: e.target.value })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-600">Default Date</Label>
                                                            <Input
                                                                type="date"
                                                                value={selectedField.defaultDate || ''}
                                                                onChange={(e) => updateField(selectedField.id, { defaultDate: e.target.value })}
                                                                className="bg-white h-9"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedField.type === 'time' && (
                                                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                        <Label className="text-gray-700 font-medium">Time Settings</Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Min Time</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={selectedField.minTime || ''}
                                                                    onChange={(e) => updateField(selectedField.id, { minTime: e.target.value })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Max Time</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={selectedField.maxTime || ''}
                                                                    onChange={(e) => updateField(selectedField.id, { maxTime: e.target.value })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-600">Time Step (minutes)</Label>
                                                            <select
                                                                value={selectedField.step || 900}
                                                                onChange={(e) => updateField(selectedField.id, { step: parseInt(e.target.value) })}
                                                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700 h-9"
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

                                                {selectedField.type === 'datetime' && (
                                                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                        <Label className="text-gray-700 font-medium">Date & Time Settings</Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Min Date/Time</Label>
                                                                <Input
                                                                    type="datetime-local"
                                                                    value={selectedField.minDateTime || ''}
                                                                    onChange={(e) => updateField(selectedField.id, { minDateTime: e.target.value })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-gray-600">Max Date/Time</Label>
                                                                <Input
                                                                    type="datetime-local"
                                                                    value={selectedField.maxDateTime || ''}
                                                                    onChange={(e) => updateField(selectedField.id, { maxDateTime: e.target.value })}
                                                                    className="bg-white h-9"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Show field type badge */}
                                                <div className="p-3 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-blue-100 text-blue-600`}>
                                                            {React.createElement(getFieldIcon(selectedField.type), { className: "w-4 h-4" })}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Field Type</p>
                                                            <p className="text-lg font-bold text-gray-900">{selectedField.type.toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-6 mt-6 border-t">
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
                                            <CheckSquare className="w-5 h-5 mr-2" />
                                            {editingForm ? 'Update Form' : 'Save Form'}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={resetFormBuilder}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-6 text-lg"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Forms List */}
                <Card className="shadow-xl border-0 rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <FileText className="w-7 h-7 text-blue-600" /> Your Forms
                                </CardTitle>
                                <CardDescription className="text-gray-600 mt-2">
                                    {forms.length} form{forms.length !== 1 ? 's' : ''} created • Search and manage all forms
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Search forms by title or description..."
                                    className="pl-12 bg-white border-gray-300 rounded-full h-12 shadow-sm focus:border-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {fetching ? (
                            <div className="flex justify-center items-center py-24">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="text-lg">Loading your forms...</span>
                                </div>
                            </div>
                        ) : filteredForms.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <FileText className="w-12 h-12 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {forms.length === 0 ? "No forms created yet" : "No matches found"}
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto mb-8 text-lg">
                                    {forms.length === 0
                                        ? "Start building your first form to collect data efficiently."
                                        : "Try adjusting your search terms or create a new form."
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
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-gray-50 to-white">
                                        <TableRow className="border-b border-gray-200">
                                            <TableHead className="w-16 font-bold text-gray-900 text-center">#</TableHead>
                                            <TableHead className="font-bold text-gray-900">Form Details</TableHead>
                                            <TableHead className="font-bold text-gray-900">Department</TableHead>
                                            <TableHead className="font-bold text-gray-900">Fields</TableHead>
                                            <TableHead className="font-bold text-gray-900">Created</TableHead>
                                            <TableHead className="font-bold text-gray-900 text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredForms.map((form, index) => (
                                            <TableRow key={form._id} className="hover:bg-gray-50/50 border-b border-gray-100 group">
                                                <TableCell className="text-center">
                                                    <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
                                                        {index + 1}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="border-2 border-white shadow-md h-14 w-14">
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-lg font-bold">
                                                                {form.title?.[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700">
                                                                {form.title}
                                                            </div>
                                                            <div className="text-gray-500 mt-1 line-clamp-1">
                                                                {form.description || "No description provided"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 px-3 py-1.5">
                                                        <Building className="w-3 h-3 mr-2" />
                                                        {getDepartmentName(form.depId)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {form.fields.slice(0, 4).map((field, idx) => {
                                                            const IconComponent = getFieldIcon(field.type);
                                                            return (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="outline"
                                                                    className="text-xs bg-white text-gray-700 border-gray-200 shadow-sm"
                                                                >
                                                                    <IconComponent className="w-3 h-3 mr-1" />
                                                                    {field.type}
                                                                </Badge>
                                                            );
                                                        })}
                                                        {form.fields.length > 4 && (
                                                            <Badge className="text-xs bg-gray-100 text-gray-600">
                                                                +{form.fields.length - 4} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3 text-gray-600">
                                                        <Calendar className="w-5 h-5 text-blue-500" />
                                                        <div>
                                                            <div className="font-medium">{formatDate(form.createdAt)}</div>
                                                            <div className="text-sm text-gray-400">
                                                                {new Date(form.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => previewForm(form)}
                                                            className="h-10 w-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                                            title="Preview"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => editForm(form)}
                                                            className="h-10 w-10 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => duplicateForm(form)}
                                                            className="h-10 w-10 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                                                            title="Duplicate"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteForm(form._id)}
                                                            className="h-10 w-10 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
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
        </div>
    );
}

// Preview Field Component
function PreviewFieldComponent({ field }) {
    const [showPassword, setShowPassword] = useState(false);
    const [rating, setRating] = useState(field.defaultRating || 0);
    const [isChecked, setIsChecked] = useState(field.checked || false);
    const [isToggleOn, setIsToggleOn] = useState(field.checked || false);

    switch (field.type) {
        case 'text':
            return <Input type="text" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white border-gray-300 h-11" />;
        case 'email':
            return <Input type="email" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white border-gray-300 h-11" />;
        case 'number':
            return <Input type="number" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white border-gray-300 h-11" />;
        case 'tel':
            return <Input type="tel" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white border-gray-300 h-11" />;
        case 'url':
            return <Input type="url" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white border-gray-300 h-11" />;
        case 'password':
            return (
                <div className="relative">
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
                <div className="relative">
                    <Input type="date" className="bg-white border-gray-300 h-11" />
                    <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            );
        case 'time':
            return (
                <div className="relative">
                    <Input type="time" className="bg-white border-gray-300 h-11" step={field.step || 900} />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            );
        case 'datetime':
            return (
                <div className="relative">
                    <Input type="datetime-local" className="bg-white border-gray-300 h-11" />
                    <CalendarClock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            );
        case 'select':
            return (
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 h-11">
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
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700"
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
                <div className="space-y-3">
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
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-white cursor-pointer hover:border-gray-400 transition-colors">
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
        default:
            return <Input type="text" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white border-gray-300 h-11" />;
    }
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
        creditCard: CreditCard
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
        creditCard: 'indigo'
    };
    return fieldColors[fieldType] || 'gray';
}