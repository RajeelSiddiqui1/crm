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
  Copy
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

  // Form builder state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: TextCursor, color: 'blue' },
    { type: 'email', label: 'Email Input', icon: EmailIcon, color: 'green' },
    { type: 'number', label: 'Number Input', icon: Hash, color: 'purple' },
    { type: 'date', label: 'Date Picker', icon: CalendarDays, color: 'orange' },
    { type: 'select', label: 'Dropdown', icon: List, color: 'pink' },
    { type: 'textarea', label: 'Text Area', icon: TextQuote, color: 'indigo' }
  ];

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user.role !== "Admin" && session.user.role !== "Manager")) {
      router.push("/login");
      return;
    }

    fetchForms();
  }, [session, status, router]);

  const fetchForms = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/forms");
      setForms(response.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch forms");
    } finally {
      setFetching(false);
    }
  };

  const addField = (fieldType) => {
    const newField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      label: `New ${fieldType} Field`,
      name: `field_${fields.length + 1}`,
      required: false,
      options: fieldType === 'select' ? ['Option 1', 'Option 2'] : [],
      foreignKey: false,
      depId: ''
    };
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

    if (fields.length === 0) {
      toast.error("Please add at least one field to the form");
      return;
    }

    setLoading(true);

    try {
      const formData = {
        title: formTitle,
        description: formDescription,
        fields: fields.map(({ id, ...field }) => field)
      };

      const response = await axios.post("/api/forms", formData);

      if (response.status === 201) {
        toast.success("Form created successfully!");
        resetFormBuilder();
        fetchForms();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create form");
    } finally {
      setLoading(false);
    }
  };

  const resetFormBuilder = () => {
    setFormTitle("");
    setFormDescription("");
    setFields([]);
    setSelectedField(null);
    setShowFormBuilder(false);
  };

  const duplicateForm = async (form) => {
    try {
      const response = await axios.post("/api/forms", {
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
      const response = await axios.delete(`/api/forms/${formId}`);
      
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
      {activeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader className="bg-white border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900">{activeForm.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {activeForm.description}
                  </CardDescription>
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
            <CardContent className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {activeForm.fields.map((field, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                      {field.foreignKey && (
                        <Badge variant="outline" className="text-xs">
                          Foreign Key
                        </Badge>
                      )}
                    </Label>
                    {renderPreviewField(field)}
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Form
          </Button>
        </div>

        {/* Form Builder */}
        {showFormBuilder && (
          <Card className="mb-8 border shadow-sm">
            <CardHeader className="bg-white border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900">Create New Form</CardTitle>
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
            <CardContent className="pt-6">
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
                    className="focus:border-blue-500"
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
                    className="focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Builder Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
                {/* Fields Palette */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Field Types</CardTitle>
                    <CardDescription>Click to add fields</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fieldTypes.map((fieldType) => {
                      const IconComponent = fieldType.icon;
                      return (
                        <div
                          key={fieldType.type}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
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
                <Card className="border shadow-sm lg:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Form Canvas</CardTitle>
                    <CardDescription>
                      {fields.length} field{fields.length !== 1 ? 's' : ''} added
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
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
                <Card className="mt-6 border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Field Properties</CardTitle>
                    <CardDescription>
                      Configure {selectedField.label} field
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Field Label</Label>
                          <Input
                            value={selectedField.label}
                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                            placeholder="Enter field label"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Field Name</Label>
                          <Input
                            value={selectedField.name}
                            onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                            placeholder="Enter field name"
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
                          <Label htmlFor="required">Required Field</Label>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="foreignKey"
                            checked={selectedField.foreignKey}
                            onChange={(e) => updateField(selectedField.id, { foreignKey: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="foreignKey">Foreign Key</Label>
                        </div>
                        {selectedField.foreignKey && (
                          <div className="space-y-2">
                            <Label>Department ID</Label>
                            <Input
                              value={selectedField.depId}
                              onChange={(e) => updateField(selectedField.id, { depId: e.target.value })}
                              placeholder="Enter department ID"
                            />
                          </div>
                        )}
                        {selectedField.type === 'select' && (
                          <div className="space-y-2">
                            <Label>Options (comma separated)</Label>
                            <Input
                              value={selectedField.options.join(', ')}
                              onChange={(e) => updateField(selectedField.id, { 
                                options: e.target.value.split(',').map(opt => opt.trim()) 
                              })}
                              placeholder="Option 1, Option 2, Option 3"
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
                  disabled={loading || !formTitle.trim() || fields.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Form"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetFormBuilder}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms List */}
        <Card className="shadow-sm border overflow-hidden">
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
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading forms...</span>
                </div>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-16">
                <TextCursor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Form Details</TableHead>
                      <TableHead className="font-semibold">Fields</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.map((form) => (
                      <TableRow key={form._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="border">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {form.title?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">
                                {form.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {form.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {form.fields.slice(0, 3).map((field, idx) => {
                              const IconComponent = getFieldIcon(field.type);
                              const color = getFieldColor(field.type);
                              return (
                                <Badge 
                                  key={idx}
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  {field.type}
                                </Badge>
                              );
                            })}
                            {form.fields.length > 3 && (
                              <Badge variant="outline" className="text-xs">
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => previewForm(form)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateForm(form)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteForm(form._id)}
                              className="text-gray-600 hover:text-red-600"
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
        return <Input type="text" placeholder={field.label} disabled />;
      case 'email':
        return <Input type="email" placeholder={field.label} disabled />;
      case 'number':
        return <Input type="number" placeholder={field.label} disabled />;
      case 'date':
        return <Input type="date" disabled />;
      case 'select':
        return (
          <select disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50">
            <option value="">Select an option</option>
            {field.options.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'textarea':
        return <textarea placeholder={field.label} disabled rows="3" className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" />;
      default:
        return <Input type="text" placeholder={field.label} disabled />;
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
            <IconComponent className="w-4 h-4" />
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
          {field.foreignKey && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
              Foreign Key
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-8 w-8 text-gray-400 hover:text-red-600"
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
function renderPreviewField(field) {
  switch (field.type) {
    case 'text':
      return <Input type="text" placeholder={`Enter ${field.label.toLowerCase()}`} />;
    case 'email':
      return <Input type="email" placeholder={`Enter ${field.label.toLowerCase()}`} />;
    case 'number':
      return <Input type="number" placeholder={`Enter ${field.label.toLowerCase()}`} />;
    case 'date':
      return <Input type="date" />;
    case 'select':
      return (
        <select className="w-full p-2 border border-gray-300 rounded-lg">
          <option value="">Select an option</option>
          {field.options.map((option, idx) => (
            <option key={idx} value={option}>{option}</option>
          ))}
        </select>
      );
    case 'textarea':
      return <textarea placeholder={`Enter ${field.label.toLowerCase()}`} rows="3" className="w-full p-2 border border-gray-300 rounded-lg" />;
    default:
      return <Input type="text" placeholder={`Enter ${field.label.toLowerCase()}`} />;
  }
}

// Helper functions
function getFieldIcon(fieldType) {
  const fieldTypes = {
    text: TextCursor,
    email: EmailIcon,
    number: Hash,
    date: CalendarDays,
    select: List,
    textarea: TextQuote
  };
  return fieldTypes[fieldType] || TextCursor;
}

function getFieldColor(fieldType) {
  const fieldColors = {
    text: 'blue',
    email: 'green',
    number: 'purple',
    date: 'orange',
    select: 'pink',
    textarea: 'indigo'
  };
  return fieldColors[fieldType] || 'gray';
}