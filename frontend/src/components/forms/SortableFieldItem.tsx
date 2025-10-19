'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Trash2, Edit, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface SortableFieldItemProps {
  field: FormField;
  onDelete: (fieldId: string) => void;
  onUpdate: (field: FormField) => void;
}

export function SortableFieldItem({ field, onDelete, onUpdate }: SortableFieldItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedField, setEditedField] = useState(field);

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
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(editedField);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedField(field);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-[#0a0a0a] border-[#333333] hover:border-[#444444] transition-colors p-5">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-[#666666] hover:text-[#a1a1a1] transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Field Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-[13px] font-medium text-white mb-2 block">
                    Field Label
                  </Label>
                  <Input
                    value={editedField.displayName}
                    onChange={(e) =>
                      setEditedField({ ...editedField, displayName: e.target.value })
                    }
                    placeholder="Field label"
                    className="h-9 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus:ring-0 text-[13px]"
                  />
                </div>
                <div>
                  <Label className="text-[13px] font-medium text-white mb-2 block">
                    Placeholder
                  </Label>
                  <Input
                    value={editedField.placeholder || ''}
                    onChange={(e) =>
                      setEditedField({ ...editedField, placeholder: e.target.value })
                    }
                    placeholder="Placeholder text"
                    className="h-9 bg-[#1a1a1a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus:ring-0 text-[13px]"
                  />
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox
                    id={`required-${field.fieldId}`}
                    checked={editedField.mand}
                    onCheckedChange={(checked) =>
                      setEditedField({ ...editedField, mand: checked as boolean })
                    }
                    className="border-[#333333] data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                  <Label
                    htmlFor={`required-${field.fieldId}`}
                    className="text-[13px] text-[#a1a1a1] cursor-pointer"
                  >
                    Required field
                  </Label>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-[15px] font-semibold text-white truncate">
                    {field.displayName}
                  </h4>
                  {field.mand && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[13px] text-[#a1a1a1]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#666666]">Type:</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#333333] rounded">
                      {field.type}
                    </span>
                  </div>
                  {field.placeholder && (
                    <>
                      <span className="text-[#333333]">•</span>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[#666666]">Placeholder:</span>
                        <span className="truncate">{field.placeholder}</span>
                      </div>
                    </>
                  )}
                </div>
                {field.choices && field.choices.length > 0 && (
                  <div className="flex items-start gap-1.5 text-[13px]">
                    <span className="text-[#666666] shrink-0">Options:</span>
                    <span className="text-[#a1a1a1] line-clamp-2">
                      {field.choices.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSave}
                  className="h-8 w-8 hover:bg-green-500/10 hover:text-green-400 border border-[#333333] hover:border-green-500/20"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-8 w-8 hover:bg-[#1a1a1a] text-[#a1a1a1] hover:text-white border border-[#333333]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 hover:bg-[#1a1a1a] text-[#a1a1a1] hover:text-white border border-[#333333]"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(field.fieldId)}
                  className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400 text-[#a1a1a1] border border-[#333333] hover:border-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
