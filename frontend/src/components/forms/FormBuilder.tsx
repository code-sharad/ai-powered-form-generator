'use client';

import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Form, FormField } from '@/types';
import { SortableFieldItem } from './SortableFieldItem';
import { AddFieldDialog } from './AddFieldDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.fieldId === active.id);
        const newIndex = items.findIndex((item) => item.fieldId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.fieldId !== fieldId));
    toast.success('Field deleted');
  };

  const handleUpdateField = (updatedField: FormField) => {
    setFields((prev) =>
      prev.map((f) => (f.fieldId === updatedField.fieldId ? updatedField : f))
    );
    toast.success('Field updated');
  };

  const handleAddField = (newField: FormField) => {
    setFields((prev) => [...prev, newField]);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Form name is required');
      return;
    }

    if (fields.length === 0) {
      toast.error('Add at least one field');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        formName,
        description,
        fields,
      });
      toast.success('Form saved successfully!');
    } catch (error) {
      toast.error('Failed to save form');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Form Settings */}
      <Card className="bg-card border-border rounded-xl shadow-none">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <Label htmlFor="formName" className="text-[13px] font-medium text-foreground">
              Form Name
            </Label>
            <Input
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter form name"
              className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground text-[13px]"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-[13px] font-medium text-foreground">
              Description <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this form"
              rows={3}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground text-[13px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fields Editor */}
      <Card className="bg-card border-border rounded-xl shadow-none">
        <CardHeader className="border-b border-border p-5 sm:p-6">
          <div className="flex flex-wrap gap-4 justify-between items-start">
            <div>
              <CardTitle className="text-base font-semibold text-foreground mb-1">
                Form Fields
              </CardTitle>
              <CardDescription className="text-[12px] text-muted-foreground">
                Drag to reorder, or focus the handle and use Space and arrow keys.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <AddFieldDialog onAddField={handleAddField} />
              <Button
                variant="ghost"
                onClick={onPreview}
                className="h-9 px-3 text-[12px] text-muted-foreground hover:text-primary hover:bg-accent border border-border"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {fields.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent border border-border mb-4">
                <Save className="h-5 w-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground">
                No fields yet. Use AI to generate fields or add them manually.
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={fields.map((f) => f.fieldId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <SortableFieldItem
                      key={field.fieldId}
                      field={field}
                      index={index}
                      total={fields.length}
                      onDelete={handleDeleteField}
                      onUpdate={handleUpdateField}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          onClick={onPreview}
          className="h-10 px-4 text-[13px] text-muted-foreground hover:text-primary hover:bg-accent border border-border"
        >
          <Eye className="mr-1.5 h-4 w-4" />
          Preview Form
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-10 px-4 text-[13px] bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
