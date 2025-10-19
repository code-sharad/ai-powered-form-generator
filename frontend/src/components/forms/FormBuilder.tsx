'use client';

import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
      <Card className="bg-[#0a0a0a] border-[#333333] rounded-lg">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <Label htmlFor="formName" className="text-[13px] font-medium text-white">
              Form Name
            </Label>
            <Input
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter form name"
              className="h-10 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus:ring-0 text-[13px]"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-[13px] font-medium text-white">
              Description <span className="text-[#666666] font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this form"
              rows={3}
              className="bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus:ring-0 text-[13px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fields Editor */}
      <Card className="bg-[#0a0a0a] border-[#333333] rounded-lg">
        <CardHeader className="border-b border-[#333333] p-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base font-semibold text-white mb-1">
                Form Fields
              </CardTitle>
              <CardDescription className="text-[13px] text-[#a1a1a1]">
                Drag to reorder, click to edit
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <AddFieldDialog onAddField={handleAddField} />
              <Button
                variant="ghost"
                onClick={onPreview}
                className="h-8 px-3 text-[13px] text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] border border-[#333333]"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {fields.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#333333] mb-4">
                <Save className="h-5 w-5 text-[#666666]" />
              </div>
              <p className="text-[13px] text-[#a1a1a1]">
                No fields yet. Use AI to generate fields or add them manually.
              </p>
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={fields.map((f) => f.fieldId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {fields.map((field) => (
                    <SortableFieldItem
                      key={field.fieldId}
                      field={field}
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
          className="h-9 px-4 text-[13px] text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] border border-[#333333]"
        >
          <Eye className="mr-1.5 h-4 w-4" />
          Preview Form
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-9 px-4 text-[13px] bg-white text-black hover:bg-[#fafafa] font-medium disabled:opacity-50"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
