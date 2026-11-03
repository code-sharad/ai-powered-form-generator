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
  };

  const detail = meta.hasChoices
    ? `${field.choices?.length ?? 0} ${(field.choices?.length ?? 0) === 1 ? 'option' : 'options'}`
    : field.placeholder
      ? field.placeholder
      : meta.description;

  return (
    <li ref={setNodeRef} style={style} className={`question-row${isDragging ? ' is-dragging' : ''}`}>
      <button
        type="button"
        aria-label={`Reorder ${field.displayName}`}
        className="question-handle"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>

      <span className="question-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>

      <button
        type="button"
        ref={editButtonRef}
        className="question-main"
        onClick={() => setIsEditing(true)}
        aria-label={`Edit ${field.displayName}`}
        aria-haspopup="dialog"
        aria-expanded={isEditing}
      >
        <span className="question-icon" aria-hidden="true">
          <TypeIcon size={17} />
        </span>
        <span className="question-copy">
          <span className="question-title-row">
            <span className="question-title">{field.displayName || 'Untitled question'}</span>
            {field.mand && <span className="question-required"><i aria-hidden="true" />Required</span>}
          </span>
          <span className="question-meta">
            <span className="question-type">{meta.label}</span>
            <span className="question-dot" aria-hidden="true" />
            <span className="question-detail">{detail}</span>
          </span>
        </span>
        <Pencil className="question-edit" size={14} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="question-delete"
        onClick={() => onDelete(field.fieldId)}
        aria-label={`Delete ${field.displayName}`}
      >
        <Trash2 size={15} aria-hidden="true" />
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
    </li>
  );
}
