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

    const fieldTypes = [
        { type: 'text', label: 'Text Input', icon: TextCursor, color: 'blue' },
        { type: 'email', label: 'Email Input', icon: EmailIcon, color: 'green' },
        { type: 'number', label: 'Number Input', icon: Hash, color: 'purple' },
        { type: 'tel', label: 'Phone Number', icon: Phone, color: 'teal' },
        { type: 'url', label: 'URL Input', icon: Link, color: 'blue' },
        { type: 'password', label: 'Password', icon: Lock, color: 'red' },
        { type: 'date', label: 'Date Picker', icon: CalendarDays, color: 'orange' },
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
            router.push("/login");
            return;
        }

        fetchForms();
        fetchDepartments();
    }, [session, status, router]);

    const fetchForms = async () => {
        try {
            setFetching(true);
            const response = await axios.get("/api/admin/forms");
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
            const response = await axios.get("/api/admin/department");

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
                newfield.defaultRating = 0;
                break;
            case 'file':
                newField.multiple = false;
                newField.accept = '*/*';
                break;
            case 'checkbox':
                newField.checked = false;
                break;
            case 'toggle':
                newfield.checked = false;
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
                response = await axios.put(`/api/admin/forms/${editingForm._id}`, formData);
            } else {
                response = await axios.post("/api/admin/forms", formData);
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
            const response = await axios.put(`/api/admin/forms/${formId}`, formData);

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
            const response = await axios.get(`/api/admin/forms/${formId}`);
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
            const response = await axios.post("/api/admin/forms", {
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
            const response = await axios.delete(`/api/admin/forms/${formId}`);

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
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    if (!session || (session.user.role !== "Admin" && session.user.role !== "Manager")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Toaster position="top-right" />

            {/* Form Preview Modal */}
            {/* Form Preview Modal */}
            {activeForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white">
                        <CardHeader className="bg-white border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-gray-900">{activeForm.title}</CardTitle>
                                    <CardDescription className="text-gray-600">
                                        {activeForm.description}
                                    </CardDescription>
                                    {activeForm.depId && (
                                        <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                                            Department: {getDepartmentName(activeForm.depId)}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={closePreview}
                                    className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 overflow-y-auto bg-white">
                            <div className="space-y-4">
                                {activeForm.fields.map((field, index) => (
                                    <div key={index} className="space-y-2">
                                        <Label className="flex items-center gap-2 text-gray-700">
                                            {field.label}
                                            {field.required && <span className="text-red-500">*</span>}
                                        </Label>
                                        {/* FIXED: Use PreviewFieldComponent instead of renderPreviewField */}
                                        <PreviewFieldComponent field={field} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-6 pt-6 border-t">
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                    Submit Form
                                </Button>
                                <Button variant="outline" onClick={closePreview}>
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
                        <h1 className="text-3xl font-bold text-gray-900">
                            Form Builder
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Create and manage dynamic forms with drag & drop
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowFormBuilder(!showFormBuilder)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        size="lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Form
                    </Button>
                </div>

                {/* Form Builder */}
                {showFormBuilder && (
                    <Card className="mb-8 border border-gray-200 shadow-sm bg-white">
                        <CardHeader className="bg-white border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-gray-900">
                                        {editingForm ? 'Edit Form' : 'Create New Form'}
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Drag and drop fields to build your form
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={resetFormBuilder}
                                    className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 bg-white">
                            {/* Form Header */}
                            <div className="space-y-6 mb-8">
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium">
                                        Form Title *
                                    </Label>
                                    <Input
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="Enter form title"
                                        className="focus:border-blue-500 bg-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium">
                                        Description
                                    </Label>
                                    <Input
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Enter form description"
                                        className="focus:border-blue-500 bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium">
                                        Select Department *
                                    </Label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                                        <p className="text-sm text-gray-500">Loading departments...</p>
                                    )}
                                    {safeDepartments.length === 0 && !fetchingDepartments && (
                                        <p className="text-sm text-red-500">No departments found. Please create departments first.</p>
                                    )}
                                </div>
                            </div>

                            {/* Builder Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
                                {/* Fields Palette */}
                                <Card className="border border-gray-200 shadow-sm bg-white">
                                    <CardHeader className="pb-4 bg-white">
                                        <CardTitle className="text-lg text-gray-900">Field Types</CardTitle>
                                        <CardDescription className="text-gray-600">Click to add fields</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 bg-white max-h-[500px] overflow-y-auto">
                                        {fieldTypes.map((fieldType) => {
                                            const IconComponent = fieldType.icon;
                                            return (
                                                <div
                                                    key={fieldType.type}
                                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors bg-white"
                                                    onClick={() => addField(fieldType.type)}
                                                >
                                                    <div className={`p-2 rounded-lg bg-${fieldType.color}-100 text-${fieldType.color}-600`}>
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-gray-700">
                                                        {fieldType.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>

                                {/* Form Canvas */}
                                <Card className="border border-gray-200 shadow-sm lg:col-span-2 bg-white">
                                    <CardHeader className="pb-4 bg-white">
                                        <CardTitle className="text-lg text-gray-900">Form Canvas</CardTitle>
                                        <CardDescription className="text-gray-600">
                                            {fields.length} field{fields.length !== 1 ? 's' : ''} added
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="bg-white">
                                        <div className="space-y-4 min-h-[400px]">
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
                                                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                                    <TextCursor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <h3 className="text-lg font-semibold text-gray-500 mb-2">
                                                        No fields added yet
                                                    </h3>
                                                    <p className="text-gray-400">
                                                        Click on field types to add them to your form
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Field Properties */}
                            {selectedField && (
                                <Card className="mt-6 border border-gray-200 shadow-sm bg-white">
                                    <CardHeader className="bg-white">
                                        <CardTitle className="text-lg text-gray-900">Field Properties</CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Configure {selectedField.label} field
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="bg-white">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700">Field Label</Label>
                                                    <Input
                                                        value={selectedField.label}
                                                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                                        placeholder="Enter field label"
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700">Field Name</Label>
                                                    <Input
                                                        value={selectedField.name}
                                                        onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                                                        placeholder="Enter field name"
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700">Placeholder</Label>
                                                    <Input
                                                        value={selectedField.placeholder || ''}
                                                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                                        placeholder="Enter placeholder text"
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="required"
                                                        checked={selectedField.required}
                                                        onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <Label htmlFor="required" className="text-gray-700">Required Field</Label>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {/* Type-specific properties */}
                                                {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-700">Options (comma separated)</Label>
                                                        <Input
                                                            value={selectedField.options?.join(', ') || ''}
                                                            onChange={(e) => updateField(selectedField.id, {
                                                                options: e.target.value.split(',').map(opt => opt.trim())
                                                            })}
                                                            placeholder="Option 1, Option 2, Option 3"
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                )}

                                                {selectedField.type === 'range' && (
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700">Min</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedField.min || 0}
                                                                onChange={(e) => updateField(selectedField.id, { min: parseInt(e.target.value) })}
                                                                className="bg-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700">Max</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedField.max || 100}
                                                                onChange={(e) => updateField(selectedField.id, { max: parseInt(e.target.value) })}
                                                                className="bg-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700">Step</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedField.step || 1}
                                                                onChange={(e) => updateField(selectedField.id, { step: parseInt(e.target.value) })}
                                                                className="bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedField.type === 'file' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="multiple"
                                                                checked={selectedField.multiple || false}
                                                                onChange={(e) => updateField(selectedField.id, { multiple: e.target.checked })}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="multiple" className="text-gray-700">Allow Multiple Files</Label>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700">Accepted File Types</Label>
                                                            <Input
                                                                value={selectedField.accept || '*/*'}
                                                                onChange={(e) => updateField(selectedField.id, { accept: e.target.value })}
                                                                placeholder=".jpg,.png,.pdf or image/*, application/pdf"
                                                                className="bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedField.type === 'rating' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-700">Maximum Rating</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedField.maxRating || 5}
                                                            onChange={(e) => updateField(selectedField.id, { maxRating: parseInt(e.target.value) })}
                                                            min="1"
                                                            max="10"
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                )}
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {editingForm ? 'Updating...' : 'Saving...'}
                                        </>
                                    ) : (
                                        editingForm ? 'Update Form' : 'Save Form'
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={resetFormBuilder}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Forms List */}
                <Card className="shadow-sm border border-gray-200 overflow-hidden bg-white">
                    <CardHeader className="bg-white border-b">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Your Forms
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                    {forms.length} form{forms.length !== 1 ? 's' : ''} created
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search forms..."
                                    className="pl-10 bg-white border-gray-300"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {fetching ? (
                            <div className="flex justify-center items-center py-16 bg-white">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Loading forms...</span>
                                </div>
                            </div>
                        ) : filteredForms.length === 0 ? (
                            <div className="text-center py-16 bg-white">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {forms.length === 0 ? "No forms yet" : "No matches found"}
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto mb-6">
                                    {forms.length === 0
                                        ? "Get started by creating your first dynamic form."
                                        : "Try adjusting your search terms."
                                    }
                                </p>
                                {forms.length === 0 && (
                                    <Button
                                        onClick={() => setShowFormBuilder(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create First Form
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto bg-white">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="w-12 font-semibold text-gray-900 text-center">#</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Form Details</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Department</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Fields</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Created</TableHead>
                                            <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredForms.map((form, index) => (
                                            <TableRow key={form._id} className="hover:bg-gray-50/50 border-b border-gray-100">
                                                <TableCell className="text-center text-sm text-gray-500 font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="border border-gray-200 h-10 w-10">
                                                            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                                                {form.title?.[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {form.title}
                                                            </div>
                                                            <div className="text-sm text-gray-500 line-clamp-1">
                                                                {form.description || "No description"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {getDepartmentName(form.depId)}
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
                                                                    className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                                                                >
                                                                    <IconComponent className="w-3 h-3 mr-1" />
                                                                    {field.type}
                                                                </Badge>
                                                            );
                                                        })}
                                                        {form.fields.length > 3 && (
                                                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                                                                +{form.fields.length - 3} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-sm">{formatDate(form.createdAt)}</span>
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
                return <Input type="text" placeholder={field.placeholder || field.label} disabled className="bg-gray-50" />;
            case 'email':
                return <Input type="email" placeholder={field.placeholder || field.label} disabled className="bg-gray-50" />;
            case 'number':
                return <Input type="number" placeholder={field.placeholder || field.label} disabled className="bg-gray-50" />;
            case 'tel':
                return <Input type="tel" placeholder={field.placeholder || field.label} disabled className="bg-gray-50" />;
            case 'url':
                return <Input type="url" placeholder={field.placeholder || field.label} disabled className="bg-gray-50" />;
            case 'password':
                return (
                    <div className="relative">
                        <Input type="password" placeholder={field.placeholder || field.label} disabled className="bg-gray-50 pr-10" />
                        <EyeOff className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                );
            case 'date':
                return <Input type="date" disabled className="bg-gray-50" />;
            case 'select':
                return (
                    <select disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
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
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />;
            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            disabled
                            className="rounded border-gray-300 bg-gray-100"
                        />
                        <Label className="text-gray-700">{field.label}</Label>
                    </div>
                );
            case 'radio':
                return (
                    <div className="space-y-2">
                        {field.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name={field.name}
                                    disabled
                                    className="rounded-full border-gray-300 bg-gray-100"
                                />
                                <Label className="text-gray-700">{option}</Label>
                            </div>
                        ))}
                    </div>
                );
            case 'range':
                return (
                    <div className="space-y-2">
                        <input
                            type="range"
                            min={field.min || 0}
                            max={field.max || 100}
                            step={field.step || 1}
                            defaultValue={field.defaultValue || 50}
                            disabled
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{field.min || 0}</span>
                            <span>{field.max || 100}</span>
                        </div>
                    </div>
                );
            case 'file':
                return (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">
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
                                className={`w-6 h-6 ${i < (field.defaultRating || 0)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                );
            case 'toggle':
                return (
                    <div className="flex items-center space-x-2">
                        <div className={`relative inline-block w-12 h-6 rounded-full ${field.checked ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.checked ? 'transform translate-x-7' : 'transform translate-x-1'
                                }`} />
                        </div>
                        <Label className="text-gray-700">{field.checked ? 'On' : 'Off'}</Label>
                    </div>
                );
            case 'address':
                return (
                    <div className="space-y-2">
                        <Input type="text" placeholder="Street address" disabled className="bg-gray-50" />
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="text" placeholder="City" disabled className="bg-gray-50" />
                            <Input type="text" placeholder="State" disabled className="bg-gray-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="text" placeholder="ZIP code" disabled className="bg-gray-50" />
                            <Input type="text" placeholder="Country" disabled className="bg-gray-50" />
                        </div>
                    </div>
                );
            case 'creditCard':
                return (
                    <div className="space-y-2">
                        <Input type="text" placeholder="Card number" disabled className="bg-gray-50" />
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="text" placeholder="MM/YY" disabled className="bg-gray-50" />
                            <Input type="text" placeholder="CVC" disabled className="bg-gray-50" />
                        </div>
                        <Input type="text" placeholder="Cardholder name" disabled className="bg-gray-50" />
                    </div>
                );
            default:
                return <Input type="text" placeholder={field.placeholder || field.label} disabled className="bg-gray-50" />;
        }
    };

    return (
        <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
            onClick={onSelect}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                            <IconComponent className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="font-medium text-gray-800">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="text-sm text-gray-500">{field.name}</div>
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
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>
            {renderFieldInput()}
        </div>
    );
}

// Helper function to render preview fields
// Replace the renderPreviewField function with this PreviewFieldComponent
function PreviewFieldComponent({ field }) {
    const [showPassword, setShowPassword] = useState(false);
    const [rating, setRating] = useState(field.defaultRating || 0);
    const [isChecked, setIsChecked] = useState(field.checked || false);

    switch (field.type) {
        case 'text':
            return <Input type="text" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white" />;
        case 'email':
            return <Input type="email" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white" />;
        case 'number':
            return <Input type="number" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white" />;
        case 'tel':
            return <Input type="tel" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white" />;
        case 'url':
            return <Input type="url" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white" />;
        case 'password':
            return (
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="bg-white pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <EyeOn className="w-4 h-4" />}
                    </button>
                </div>
            );
        case 'date':
            return <Input type="date" className="bg-white" />;
        case 'select':
            return (
                <select className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700">
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
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700"
            />;
        case 'checkbox':
            return (
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        className="rounded border-gray-300 bg-white"
                    />
                    <Label className="text-gray-700">{field.label}</Label>
                </div>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    {field.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name={field.name}
                                className="rounded-full border-gray-300 bg-white"
                            />
                            <Label className="text-gray-700">{option}</Label>
                        </div>
                    ))}
                </div>
            );
        case 'range':
            return (
                <div className="space-y-2">
                    <input
                        type="range"
                        min={field.min || 0}
                        max={field.max || 100}
                        step={field.step || 1}
                        defaultValue={field.defaultValue || 50}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{field.min || 0}</span>
                        <span>{field.max || 100}</span>
                    </div>
                </div>
            );
        case 'file':
            return (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">
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
                            className="focus:outline-none"
                        >
                            <Star
                                className={`w-6 h-6 transition-colors ${i < rating
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300 hover:text-yellow-200'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            );
        case 'toggle':
            return (
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => setIsChecked(!isChecked)}
                        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isChecked ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isChecked ? 'translate-x-6' : 'translate-x-0'
                                }`}
                        />
                    </button>
                    <Label className="text-gray-700">{isChecked ? 'On' : 'Off'}</Label>
                </div>
            );
        case 'address':
            return (
                <div className="space-y-2">
                    <Input type="text" placeholder="Street address" className="bg-white" />
                    <div className="grid grid-cols-2 gap-2">
                        <Input type="text" placeholder="City" className="bg-white" />
                        <Input type="text" placeholder="State" className="bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input type="text" placeholder="ZIP code" className="bg-white" />
                        <Input type="text" placeholder="Country" className="bg-white" />
                    </div>
                </div>
            );
        case 'creditCard':
            return (
                <div className="space-y-2">
                    <Input type="text" placeholder="Card number" className="bg-white" />
                    <div className="grid grid-cols-2 gap-2">
                        <Input type="text" placeholder="MM/YY" className="bg-white" />
                        <Input type="text" placeholder="CVC" className="bg-white" />
                    </div>
                    <Input type="text" placeholder="Cardholder name" className="bg-white" />
                </div>
            );
        default:
            return <Input type="text" placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="bg-white" />;
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