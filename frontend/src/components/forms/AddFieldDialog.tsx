'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/arc/dialog/dialog';
import { Button } from '@/components/arc/button/button';
import { Input } from '@/components/arc/input/input';
import { Select } from '@/components/arc/select/select';
import { Checkbox } from '@/components/arc/checkbox/checkbox';
import { Textarea } from '@/components/arc/textarea/textarea';
import { Plus } from 'lucide-react';
import { FormField, FieldType } from '@/types';
import { toast } from '@/lib/toast';

interface AddFieldDialogProps {
  onAddField: (field: FormField) => void;
}

const fieldTypeOptions = [
  { value: 'NAME', label: 'Name' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'ADDRESS', label: 'Address' },
  { value: 'SINGLE_LINE', label: 'Single line text' },
  { value: 'MULTI_LINE', label: 'Multi line text' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'RADIO', label: 'Radio buttons' },
  { value: 'CHECKBOX', label: 'Checkboxes' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
  { value: 'DATE', label: 'Date' },
  { value: 'RATING', label: 'Rating' },
  { value: 'FILE_UPLOAD', label: 'File upload' },
] satisfies { value: FieldType; label: string }[];

function isFieldType(value: string): value is FieldType {
  return fieldTypeOptions.some((option) => option.value === value);
}

export function AddFieldDialog({ onAddField }: AddFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const [fieldType, setFieldType] = useState<FieldType>('SINGLE_LINE');
  const [displayName, setDisplayName] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);
  const [choices, setChoices] = useState('');

  const needsChoices = ['DROPDOWN', 'RADIO', 'CHECKBOX', 'MULTIPLE_CHOICE'].includes(fieldType);

  const handleAddField = () => {
    if (!displayName.trim()) {
      toast.error('A question needs a name');
      return;
    }

    if (needsChoices && !choices.trim()) {
      toast.error('Add at least one option');
      return;
    }

    const newField: FormField = {
      fieldId: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      displayName: displayName.trim(),
      mand: required,
      placeholder: placeholder.trim() || undefined,
      choices: needsChoices ? choices.split('\n').filter(c => c.trim()).map(c => c.trim()) : undefined,
    };

    onAddField(newField);

    // Reset form
    setDisplayName('');
    setPlaceholder('');
    setRequired(false);
    setChoices('');
    setFieldType('SINGLE_LINE');
    setOpen(false);

    toast.success('Question added');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
          Add question
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Add a question"
        description="Choose a type, then name the question and set its options."
      >
        <div className="space-y-5">
          <Select
            id="fieldType"
            label="Question type"
            placeholder="Select question type"
            options={fieldTypeOptions}
            value={fieldType}
            onValueChange={(value) => {
              if (isFieldType(value)) setFieldType(value);
            }}
          />

          <Input
            id="displayName"
            label="Question *"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., Full name, Email address"
          />

          <Input
            id="placeholder"
            label="Placeholder (optional)"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Enter placeholder text"
          />

          {/* Choices/Options - Only for certain field types */}
          {needsChoices && (
            <Textarea
              id="choices"
              label="Options *"
              value={choices}
              onChange={(e) => setChoices(e.target.value)}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
              description="Enter each option on a new line"
            />
          )}

          <Checkbox
            id="required"
            label="Required question"
            checked={required}
            onCheckedChange={(checked) => setRequired(checked === true)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddField}>
            Add question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
