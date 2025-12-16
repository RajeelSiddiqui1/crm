"use client";
import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import {
  GripVertical,
  Trash2,
  Edit2,
  Plus,
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronDown,
  Upload,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import axios from 'axios';

// Field Types Available
const fieldTypes = [
  { id: 'text', label: 'Text Input', icon: <Type className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  { id: 'number', label: 'Number Input', icon: <Hash className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  { id: 'email', label: 'Email Input', icon: <Mail className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  { id: 'phone', label: 'Phone Number', icon: <Phone className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700' },
  { id: 'date', label: 'Date Picker', icon: <Calendar className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
  { id: 'textarea', label: 'Text Area', icon: <FileText className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'select', label: 'Dropdown', icon: <ChevronDown className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'file', label: 'File Upload', icon: <Upload className="h-4 w-4" />, color: 'bg-pink-100 text-pink-700' },
];

// Sortable Field Item Component
function SortableFieldItem({ field, index, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldType = fieldTypes.find(ft => ft.id === field.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'border-blue-400' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className={`p-2 rounded ${fieldType?.color || 'bg-gray-100'}`}>
            {fieldType?.icon || <Type className="h-4 w-4" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{field.label}</span>
              {field.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {field.type}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {field.placeholder || `Field: ${field.name}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(index)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(index)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Field Editor Component
function FieldEditor({ field, index, onSave, onCancel }) {
  const [formData, setFormData] = useState(field || {
    type: 'text',
    label: '',
    name: '',
    required: false,
    placeholder: '',
    options: [],
    validation: {}
  });

  const [newOption, setNewOption] = useState({ label: '', value: '' });

  const handleSave = () => {
    if (!formData.label.trim()) {
      toast.error('Field label is required');
      return;
    }
    
    if (!formData.name.trim()) {
      formData.name = formData.label.toLowerCase().replace(/\s+/g, '_');
    }
    
    onSave(formData);
  };

  const addOption = () => {
    if (!newOption.label.trim() || !newOption.value.trim()) {
      toast.error('Both label and value are required for options');
      return;
    }
    
    setFormData({
      ...formData,
      options: [...formData.options, newOption]
    });
    setNewOption({ label: '', value: '' });
  };

  const removeOption = (optionIndex) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== optionIndex)
    });
  };

  return (
    <Card className="border-2 border-blue-300">
      <CardHeader>
        <CardTitle className="text-lg">
          {field ? 'Edit Field' : 'Add New Field'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Field Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    {type.icon}
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Field Label *</Label>
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="e.g., Customer Name"
          />
        </div>

        <div className="space-y-2">
          <Label>Field Name (auto-generated)</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., customer_name"
          />
          <p className="text-xs text-gray-500">
            Used for data processing. Auto-generated from label if left empty.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Placeholder Text</Label>
          <Input
            value={formData.placeholder}
            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
            placeholder="e.g., Enter customer name"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <Label>Required Field</Label>
        </div>

        {formData.type === 'select' && (
          <div className="space-y-3">
            <Label>Dropdown Options</Label>
            <div className="space-y-2">
              {formData.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={option.label} readOnly />
                  <Input value={option.value} readOnly />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(idx)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Option label"
                value={newOption.label}
                onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
              />
              <Input
                placeholder="Option value"
                value={newOption.value}
                onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
              />
              <Button type="button" onClick={addOption}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {(formData.type === 'number' || formData.type === 'text') && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum {formData.type === 'number' ? 'Value' : 'Length'}</Label>
              <Input
                type="number"
                value={formData.validation?.min || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  validation: { ...formData.validation, min: e.target.value ? Number(e.target.value) : undefined }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum {formData.type === 'number' ? 'Value' : 'Length'}</Label>
              <Input
                type="number"
                value={formData.validation?.max || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  validation: { ...formData.validation, max: e.target.value ? Number(e.target.value) : undefined }
                })}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save Field
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Form Builder Component
export default function FormBuilder({ 
  subtaskId, 
  initialFields = [], 
  onFieldsChange,
  formTitle: initialFormTitle,
  formDescription: initialFormDescription 
}) {
  const [fields, setFields] = useState(initialFields);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formTitle, setFormTitle] = useState(initialFormTitle || '');
  const [formDescription, setFormDescription] = useState(initialFormDescription || '');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (onFieldsChange) {
      onFieldsChange(fields, formTitle, formDescription);
    }
  }, [fields, formTitle, formDescription]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      name: `${type}_${Date.now()}`,
      required: false,
      placeholder: `Enter ${type}`,
      options: type === 'select' ? [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ] : [],
      validation: {}
    };
    
    setFields([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const editField = (index) => {
    setEditingIndex(index);
  };

  const deleteField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const saveField = (updatedField) => {
    const newFields = [...fields];
    if (editingIndex !== null && editingIndex < fields.length) {
      newFields[editingIndex] = { ...newFields[editingIndex], ...updatedField };
    } else {
      newFields.push({ ...updatedField, id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` });
    }
    setFields(newFields);
    setEditingIndex(null);
  };

  const previewForm = () => {
    return (
      <div className="space-y-4">
        {formTitle && (
          <div>
            <h3 className="text-xl font-bold text-gray-900">{formTitle}</h3>
            {formDescription && (
              <p className="text-gray-600 mt-1">{formDescription}</p>
            )}
          </div>
        )}
        
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === 'text' && (
              <Input
                id={field.name}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
            
            {field.type === 'number' && (
              <Input
                id={field.name}
                type="number"
                placeholder={field.placeholder}
                required={field.required}
                min={field.validation?.min}
                max={field.validation?.max}
              />
            )}
            
            {field.type === 'email' && (
              <Input
                id={field.name}
                type="email"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
            
            {field.type === 'phone' && (
              <Input
                id={field.name}
                type="tel"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
            
            {field.type === 'date' && (
              <Input
                id={field.name}
                type="date"
                required={field.required}
              />
            )}
            
            {field.type === 'textarea' && (
              <Textarea
                id={field.name}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
              />
            )}
            
            {field.type === 'select' && (
              <Select required={field.required}>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option, idx) => (
                    <SelectItem key={idx} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {field.type === 'file' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
                <Input
                  id={field.name}
                  type="file"
                  className="hidden"
                  required={field.required}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => document.getElementById(field.name)?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Available Fields */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Fields</CardTitle>
              <p className="text-sm text-gray-600">Drag fields to the form builder</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {fieldTypes.map((fieldType) => (
                  <button
                    key={fieldType.id}
                    onClick={() => addField(fieldType.id)}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow ${fieldType.color}`}
                  >
                    <div className="mb-2">{fieldType.icon}</div>
                    <span className="text-sm font-medium">{fieldType.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Form Title</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Customer Information Form"
                />
              </div>
              <div className="space-y-2">
                <Label>Form Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g., Please fill out this form with customer details"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Fields:</span>
                <Badge variant="outline">{fields.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Required Fields:</span>
                <Badge variant="destructive">
                  {fields.filter(f => f.required).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle - Form Builder */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Form Builder</CardTitle>
                <Badge variant={fields.length > 0 ? "default" : "outline"}>
                  {fields.length} Field{fields.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Drag to reorder fields. Click on a field to edit.
              </p>
            </CardHeader>
            <CardContent>
              {editingIndex !== null ? (
                <FieldEditor
                  field={fields[editingIndex]}
                  index={editingIndex}
                  onSave={saveField}
                  onCancel={() => setEditingIndex(null)}
                />
              ) : fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Fields Added Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Drag fields from the left panel or click on field types to start building your form
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {fieldTypes.slice(0, 4).map((fieldType) => (
                      <Button
                        key={fieldType.id}
                        variant="outline"
                        onClick={() => addField(fieldType.id)}
                        className="gap-2"
                      >
                        {fieldType.icon}
                        Add {fieldType.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                  >
                    <SortableContext
                      items={fields.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {fields.map((field, index) => (
                          <SortableFieldItem
                            key={field.id}
                            field={field}
                            index={index}
                            onEdit={editField}
                            onDelete={deleteField}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Form Preview</h4>
                    </div>
                    <div className="text-sm text-blue-700">
                      Your form will look like this to employees. You can continue adding or editing fields.
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom - Form Preview */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Preview</CardTitle>
            <p className="text-sm text-gray-600">
              This is how the form will appear to assigned employees
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl mx-auto p-6 border rounded-lg bg-gray-50">
              {previewForm()}
              <div className="mt-6 pt-6 border-t">
                <Button className="w-full">
                  Submit Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}