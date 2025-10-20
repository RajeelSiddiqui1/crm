import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import FormField from './FormField';

const fieldTypes = [
  { type: 'text', label: 'Text Input' },
  { type: 'email', label: 'Email Input' },
  { type: 'number', label: 'Number Input' },
  { type: 'date', label: 'Date Picker' },
  { type: 'select', label: 'Dropdown' },
  { type: 'textarea', label: 'Text Area' }
];

export default function FormBuilder({ onSaveForm }) {
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);

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

  const handleSave = async () => {
    const formData = {
      title: formTitle,
      description: formDescription,
      fields: fields.map(({ id, ...field }) => field)
    };
    
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        alert('Form saved successfully!');
        setFormTitle('');
        setFormDescription('');
        setFields([]);
        setSelectedField(null);
        onSaveForm && onSaveForm();
      }
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  return (
    <div className="form-builder">
      <div className="builder-header">
        <input
          type="text"
          placeholder="Form Title"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          className="form-title-input"
        />
        <textarea
          placeholder="Form Description"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          className="form-description-input"
        />
      </div>

      <div className="builder-container">
        <div className="fields-palette">
          <h3>Available Fields</h3>
          {fieldTypes.map(fieldType => (
            <div
              key={fieldType.type}
              className="field-type"
              onClick={() => addField(fieldType.type)}
            >
              {fieldType.label}
            </div>
          ))}
        </div>

        <div className="form-canvas">
          <h3>Form Canvas</h3>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields} strategy={verticalListSortingStrategy}>
              {fields.map((field) => (
                <FormField
                  key={field.id}
                  field={field}
                  isSelected={selectedField?.id === field.id}
                  onSelect={() => setSelectedField(field)}
                  onUpdate={(updates) => updateField(field.id, updates)}
                  onRemove={() => removeField(field.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          {fields.length === 0 && (
            <div className="empty-canvas">
              Drag and drop fields here to build your form
            </div>
          )}
        </div>

        <div className="field-properties">
          <h3>Field Properties</h3>
          {selectedField ? (
            <div className="properties-panel">
              <div className="property-group">
                <label>Label:</label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                />
              </div>
              
              <div className="property-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                />
              </div>
              
              <div className="property-group">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                  />
                  Required Field
                </label>
              </div>

              <div className="property-group">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedField.foreignKey}
                    onChange={(e) => updateField(selectedField.id, { foreignKey: e.target.checked })}
                  />
                  Foreign Key
                </label>
              </div>

              {selectedField.foreignKey && (
                <div className="property-group">
                  <label>Department ID:</label>
                  <input
                    type="text"
                    value={selectedField.depId}
                    onChange={(e) => updateField(selectedField.id, { depId: e.target.value })}
                    placeholder="Enter department ID"
                  />
                </div>
              )}

              {selectedField.type === 'select' && (
                <div className="property-group">
                  <label>Options (comma separated):</label>
                  <input
                    type="text"
                    value={selectedField.options.join(', ')}
                    onChange={(e) => updateField(selectedField.id, { 
                      options: e.target.value.split(',').map(opt => opt.trim()) 
                    })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              Select a field to edit its properties
            </div>
          )}
        </div>
      </div>

      <div className="builder-actions">
        <button onClick={handleSave} disabled={!formTitle || fields.length === 0}>
          Save Form
        </button>
      </div>
    </div>
  );
}