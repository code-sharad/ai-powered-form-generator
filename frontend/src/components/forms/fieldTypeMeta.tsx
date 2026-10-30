import {
  AlignLeft,
  CalendarDays,
  ChevronDown,
  CircleDot,
  ListChecks,
  Mail,
  MapPin,
  PenLine,
  Phone,
  SquareCheck,
  Star,
  TextCursorInput,
  Type,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import type { FieldType } from '@/types';

export interface FieldTypeMeta {
  value: FieldType;
  label: string;
  description: string;
  icon: LucideIcon;
  hasChoices?: boolean;
  hasPlaceholder?: boolean;
}

export const FIELD_TYPE_META: FieldTypeMeta[] = [
  { value: 'SINGLE_LINE', label: 'Short answer', description: 'One line of text', icon: Type, hasPlaceholder: true },
  { value: 'MULTI_LINE', label: 'Long answer', description: 'A longer written response', icon: AlignLeft, hasPlaceholder: true },
  { value: 'NAME', label: 'Name', description: 'A person’s name', icon: TextCursorInput, hasPlaceholder: true },
  { value: 'EMAIL', label: 'Email', description: 'A validated email address', icon: Mail, hasPlaceholder: true },
  { value: 'PHONE', label: 'Phone', description: 'A phone number', icon: Phone, hasPlaceholder: true },
  { value: 'ADDRESS', label: 'Address', description: 'A postal address', icon: MapPin, hasPlaceholder: true },
  { value: 'DROPDOWN', label: 'Dropdown', description: 'Pick one option from a menu', icon: ChevronDown, hasChoices: true, hasPlaceholder: true },
  { value: 'RADIO', label: 'Radio buttons', description: 'Pick one visible option', icon: CircleDot, hasChoices: true },
  { value: 'CHECKBOX', label: 'Checkboxes', description: 'Pick one or more options', icon: SquareCheck, hasChoices: true },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice', description: 'Choose from compact pills', icon: ListChecks, hasChoices: true },
  { value: 'DATE', label: 'Date', description: 'A calendar date', icon: CalendarDays },
  { value: 'RATING', label: 'Rating', description: 'A one-to-five score', icon: Star },
  { value: 'FILE_UPLOAD', label: 'File upload', description: 'Attach a document or image', icon: Upload },
  { value: 'SIGNATURE', label: 'Signature', description: 'A written signature', icon: PenLine },
];

export function getFieldTypeMeta(type: FieldType): FieldTypeMeta {
  return FIELD_TYPE_META.find((meta) => meta.value === type) ?? FIELD_TYPE_META[0];
}
