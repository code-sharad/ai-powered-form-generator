'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormField } from '@/types';
import { FieldEditorSheet } from './FieldEditorSheet';
import { getFieldTypeMeta } from './fieldTypeMeta';

interface SortableFieldItemProps {
  field: FormField;
  index: number;
  total: number;
  onDelete: (fieldId: string) => void;
  onUpdate: (field: FormField) => void;
}

export function SortableFieldItem({ field, index, total, onDelete, onUpdate }: SortableFieldItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const meta = getFieldTypeMeta(field.type);
  const TypeIcon = meta.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const detail = meta.hasChoices
    ? `${field.choices?.length ?? 0} ${(field.choices?.length ?? 0) === 1 ? 'option' : 'options'}`
    : field.placeholder
      ? `Placeholder: ${field.placeholder}`
      : meta.description;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`form-field-card${isEditing ? ' is-editing' : ''}`}
    >
      <button
        type="button"
        aria-label={`Reorder ${field.displayName}`}
        className="form-field-drag"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={17} />
      </button>

      <button
        type="button"
        ref={editButtonRef}
        className="form-field-card-main"
        onClick={() => setIsEditing(true)}
        aria-label={`Edit ${field.displayName}`}
        aria-haspopup="dialog"
        aria-expanded={isEditing}
      >
        <span className="form-field-type-icon" aria-hidden="true">
          <TypeIcon size={17} />
        </span>
        <span className="form-field-card-copy">
          <span className="form-field-card-title-row">
            <span className="form-field-card-title">{field.displayName || 'Untitled question'}</span>
            {field.mand && <span className="form-field-required">Required</span>}
          </span>
          <span className="form-field-card-meta">
            <span className="form-field-card-type">{meta.label}</span>
            <span className="form-field-card-dot" aria-hidden="true" />
            <span className="form-field-card-detail">{detail}</span>
          </span>
        </span>
        <span className="form-field-card-edit" aria-hidden="true"><Pencil size={14} /></span>
      </button>

      <button
        type="button"
        className="form-field-delete"
        onClick={() => onDelete(field.fieldId)}
        aria-label={`Delete ${field.displayName}`}
      >
        <Trash2 size={15} />
      </button>

      <FieldEditorSheet
        field={field}
        open={isEditing}
        index={index}
        total={total}
        returnFocusRef={editButtonRef}
        onOpenChange={setIsEditing}
        onSave={onUpdate}
      />
    </div>
  );
}
