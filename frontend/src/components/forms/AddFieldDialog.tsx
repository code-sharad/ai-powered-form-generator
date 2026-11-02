'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { FormField, FieldType } from '@/types';
import toast from 'react-hot-toast';

interface AddFieldDialogProps {
  onAddField: (field: FormField) => void;
}

const fieldTypeOptions: { value: FieldType; label: string }[] = [
  { value: 'NAME', label: 'Name' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'ADDRESS', label: 'Address' },
  { value: 'SINGLE_LINE', label: 'Single Line Text' },
  { value: 'MULTI_LINE', label: 'Multi Line Text' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'RADIO', label: 'Radio Buttons' },
  { value: 'CHECKBOX', label: 'Checkboxes' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'DATE', label: 'Date' },
  { value: 'RATING', label: 'Rating' },
  { value: 'FILE_UPLOAD', label: 'File Upload' },
];

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
      toast.error('Field name is required');
      return;
    }

    if (needsChoices && !choices.trim()) {
      toast.error('Please provide options for this field type');
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

    toast.success('Field added successfully!');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 px-3 text-[12px] bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Field
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90svh] overflow-y-auto bg-card border-border text-foreground">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Add New Field
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-1">
            Create a new field for your form. Choose the field type and configure its properties.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-5">
          {/* Field Type */}
          <div className="space-y-2.5">
            <Label htmlFor="fieldType" className="text-[13px] font-medium text-foreground">
              Field Type
            </Label>
            <Select value={fieldType} onValueChange={(value) => setFieldType(value as FieldType)}>
              <SelectTrigger
                id="fieldType"
                className="h-10 bg-background border-input text-foreground text-[13px]"
              >
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {fieldTypeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-[13px] focus:bg-accent focus:text-primary"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Name */}
          <div className="space-y-2.5">
            <Label htmlFor="displayName" className="text-[13px] font-medium text-foreground">
              Field Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Full Name, Email Address"
              className="h-10 bg-background border-input text-foreground placeholder:text-muted-foreground text-[13px]"
            />
          </div>

          {/* Placeholder */}
          <div className="space-y-2.5">
            <Label htmlFor="placeholder" className="text-[13px] font-medium text-foreground">
              Placeholder <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="placeholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Enter placeholder text"
              className="h-10 bg-background border-input text-foreground placeholder:text-muted-foreground text-[13px]"
            />
          </div>

          {/* Choices/Options - Only for certain field types */}
          {needsChoices && (
            <div className="space-y-2.5">
              <Label htmlFor="choices" className="text-[13px] font-medium text-foreground">
                Options <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="choices"
                value={choices}
                onChange={(e) => setChoices(e.target.value)}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground text-[13px] resize-y"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter each option on a new line
              </p>
            </div>
          )}

          {/* Required Checkbox */}
          <div className="flex items-center space-x-2.5 pt-2">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked as boolean)}
              className="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label
              htmlFor="required"
              className="text-[13px] text-muted-foreground font-normal cursor-pointer"
            >
              Required field
            </Label>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-10 px-4 text-[13px] text-muted-foreground hover:text-primary hover:bg-accent border border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddField}
            className="h-10 px-4 text-[13px] bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            Add Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
