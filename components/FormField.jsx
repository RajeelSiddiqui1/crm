import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function FormField({ field, isSelected, onSelect, onUpdate, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderFieldInput = () => {
    switch (field.type) {
      case 'text':
        return <input type="text" placeholder={field.label} disabled />;
      case 'email':
        return <input type="email" placeholder={field.label} disabled />;
      case 'number':
        return <input type="number" placeholder={field.label} disabled />;
      case 'date':
        return <input type="date" disabled />;
      case 'select':
        return (
          <select disabled>
            <option value="">Select an option</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'textarea':
        return <textarea placeholder={field.label} disabled rows="3" />;
      default:
        return <input type="text" placeholder={field.label} disabled />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`form-field ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="field-header">
        <span className="field-label">
          {field.label} {field.required && <span className="required">*</span>}
          {field.foreignKey && <span className="foreign-key">FK</span>}
        </span>
        <button
          className="remove-field"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      </div>
      {renderFieldInput()}
    </div>
  );
}