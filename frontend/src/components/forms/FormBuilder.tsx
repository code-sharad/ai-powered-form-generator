'use client';

import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Form, FormField } from '@/types';
import { SortableFieldItem } from './SortableFieldItem';
import { AddFieldDialog } from './AddFieldDialog';
import { Button } from '@/components/arc/button/button';
import { Input } from '@/components/arc/input/input';
import { Textarea } from '@/components/arc/textarea/textarea';
import { EmptyState } from '@/components/arc/empty-state/empty-state';
import { Eye, ListChecks, Save } from 'lucide-react';
import { toast } from '@/lib/toast';

interface FormBuilderProps {
  initialForm: Form;
  onSave: (form: Partial<Form>) => Promise<void>;
  onPreview: () => void;
}

export function FormBuilder({ initialForm, onSave, onPreview }: FormBuilderProps) {
  const [formName, setFormName] = useState(initialForm.formName);
  const [description, setDescription] = useState(initialForm.description || '');
  const [fields, setFields] = useState<FormField[]>(initialForm.fields);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.fieldId === active.id);
        const newIndex = items.findIndex((item) => item.fieldId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setIsDirty(true);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.fieldId !== fieldId));
    setIsDirty(true);
    toast.success('Question deleted');
  };

  const handleUpdateField = (updatedField: FormField) => {
    setFields((prev) =>
      prev.map((f) => (f.fieldId === updatedField.fieldId ? updatedField : f))
    );
    setIsDirty(true);
    toast.success('Question updated');
  };

  const handleAddField = (newField: FormField) => {
    setFields((prev) => [...prev, newField]);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('The form needs a name');
      return;
    }

    if (fields.length === 0) {
      toast.error('Add at least one question');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        formName,
        description,
        fields,
      });
      setIsDirty(false);
      toast.success('Changes saved');
    } catch (error) {
      toast.error('Changes couldn’t be saved', 'Try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return <div className="questions-page">
    <section className="form-identity" aria-label="Form details">
      <span className="form-identity-mark" aria-hidden="true">{formName.trim().charAt(0).toUpperCase() || 'F'}</span>
      <div className="form-identity-fields">
        <Input
          id="formName"
          label="Form name"
          className="form-name-input"
          value={formName}
          onChange={(event) => { setFormName(event.target.value); setIsDirty(true); }}
          placeholder="Form name"
        />
        <Textarea
          id="description"
          label="Description (optional)"
          className="form-description-input"
          value={description}
          onChange={(event) => { setDescription(event.target.value); setIsDirty(true); }}
          placeholder="Tell people what this form is for"
          rows={2}
        />
      </div>
    </section>

    <section className="questions-panel" aria-labelledby="questions-heading">
      <header className="questions-head">
        <div>
          <h2 id="questions-heading">
            Questions
            <span className="questions-count">{fields.length}</span>
          </h2>
          <p>Drag to reorder, or focus the handle and use Space and arrow keys.</p>
        </div>
        {fields.length > 0 && <div className="questions-head-actions">
          <AddFieldDialog onAddField={handleAddField} />
        </div>}
      </header>

      {fields.length === 0
        ? <div className="questions-empty">
            <EmptyState
              icon={<ListChecks size={22} />}
              title="No questions yet"
              description="Add your first question, or describe the form to AI and start from its draft."
              action={<AddFieldDialog onAddField={handleAddField} />}
            />
          </div>
        : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((field) => field.fieldId)} strategy={verticalListSortingStrategy}>
              <ol className="question-list">
                {fields.map((field, index) => <SortableFieldItem
                  key={field.fieldId}
                  field={field}
                  index={index}
                  total={fields.length}
                  onDelete={handleDeleteField}
                  onUpdate={handleUpdateField}
                />)}
              </ol>
            </SortableContext>
          </DndContext>}

      <footer className="questions-footer">
        <span className="question-save-state" data-dirty={isDirty ? 'true' : 'false'}>
          {isDirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <div className="questions-actions">
          <Button variant="secondary" size="sm" onClick={onPreview}>
            <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} loading={isSaving} disabled={!isDirty}>
            <Save size={14} strokeWidth={1.75} aria-hidden="true" />
            Save changes
          </Button>
        </div>
      </footer>
    </section>
  </div>;
}
