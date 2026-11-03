import { useState } from 'react';
import Image from 'next/image';
import { FormField } from '@/types';
import { Checkbox } from '@/components/arc/checkbox/checkbox';
import { DatePicker } from '@/components/arc/date-picker/date-picker';
import { Input } from '@/components/arc/input/input';
import { RadioGroup } from '@/components/arc/radio-group/radio-group';
import { Rating } from '@/components/arc/rating/rating';
import { Select } from '@/components/arc/select/select';
import { Textarea } from '@/components/arc/textarea/textarea';
import { Button } from '@/components/arc/button/button';
import { uploadService } from '@/services/uploadService';
import { Upload, X, FileIcon, Loader2, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/toast';

interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  cloudinaryPublicId: string;
  url: string;
  uploadedAt: string;
}

interface DynamicFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

/** Types whose control has no error slot, so the message is rendered beside it. */
const ERROR_BESIDE_CONTROL = new Set<FormField['type']>([
  'DATE',
  'DROPDOWN',
  'RADIO',
  'CHECKBOX',
  'RATING',
  'FILE_UPLOAD',
]);

const pad = (value: number) => String(value).padStart(2, '0');

/** The stored contract is a YYYY-MM-DD string; the picker works in the respondent's local time. */
function toLocalDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/** Reads the calendar's local date back into YYYY-MM-DD without routing through UTC. */
function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
  const fileInputId = `${field.fieldId}-file`;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Type guards and helpers
  const stringValue = (value as string) || '';
  const fileValue = value as UploadedFile | null;
  const arrayValue = (Array.isArray(value) ? value : []) as string[];
  const ratingValue = typeof value === 'number' ? value : 0;
  const choices = field.choices ?? [];
  const choiceOptions = choices.map((choice) => ({ value: choice, label: choice }));
  const label = `${field.displayName}${field.mand ? ' *' : ''}`;

  const uploadFile = async (file: File) => {
    if (isUploading) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Uploading...');

    try {
      const result = await uploadService.uploadToCloudinary(file, {
        folder: 'form-submissions',
        resourceType: 'auto',
      });

      setUploadProgress('Upload complete!');
      onChange({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        cloudinaryPublicId: result.publicId,
        url: result.url,
        uploadedAt: new Date().toISOString(),
      });

      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  const preventFileDropNavigation = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleRemoveFile = () => {
    onChange(null);
    setUploadProgress('');
  };

  const renderField = () => {
    switch (field.type) {
      case 'NAME':
      case 'SINGLE_LINE':
        return (
          <Input
            label={label}
            placeholder={field.placeholder || field.displayName}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            error={error}
          />
        );

      case 'EMAIL':
        return (
          <Input
            label={label}
            type="email"
            placeholder={field.placeholder || 'example@email.com'}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            error={error}
          />
        );

      case 'PHONE':
        return (
          <Input
            label={label}
            type="tel"
            placeholder={field.placeholder || '+1 (555) 000-0000'}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            error={error}
          />
        );

      case 'MULTI_LINE':
        return (
          <Textarea
            label={label}
            placeholder={field.placeholder || field.displayName}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            rows={4}
            error={error}
          />
        );

      case 'DATE':
        return (
          <DatePicker
            label={label}
            value={toLocalDate(stringValue)}
            onChange={(date) => onChange(date ? toDateString(date) : '')}
          />
        );

      case 'DROPDOWN':
        return (
          <Select
            label={label}
            options={choiceOptions}
            placeholder={field.placeholder || 'Choose an option'}
            value={stringValue}
            onValueChange={onChange}
          />
        );

      case 'RADIO':
        return (
          <RadioGroup
            label={label}
            name={field.fieldId}
            options={choiceOptions}
            value={stringValue}
            onValueChange={onChange}
          />
        );

      case 'CHECKBOX':
        // Handle both single checkbox and multiple checkboxes
        if (choices.length === 0) {
          // Single checkbox (e.g., "I agree to terms")
          const boolValue = value === true || value === 'true';
          return (
            <fieldset className="pf-choice-group">
              <legend className="pf-choice-legend">{label}</legend>
              <Checkbox
                id={`${field.fieldId}-checkbox`}
                label={field.placeholder || field.displayName}
                checked={boolValue}
                onCheckedChange={(checked) => onChange(checked === true)}
              />
            </fieldset>
          );
        }

        // Multiple checkboxes with choices
        return (
          <fieldset className="pf-choice-group">
            <legend className="pf-choice-legend">{label}</legend>
            {choices.map((choice, idx) => (
              <Checkbox
                key={idx}
                id={`${field.fieldId}-${idx}`}
                label={choice}
                checked={arrayValue.includes(choice)}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    onChange([...arrayValue, choice]);
                  } else {
                    onChange(arrayValue.filter((v) => v !== choice));
                  }
                }}
              />
            ))}
          </fieldset>
        );

      case 'RATING':
        return (
          <Rating
            label={label}
            value={ratingValue}
            onChange={(next) => onChange(next)}
            max={5}
            allowClear={false}
          />
        );

      case 'ADDRESS':
        return (
          <Textarea
            label={label}
            placeholder={field.placeholder || 'Enter your full address'}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            rows={3}
            error={error}
          />
        );

      case 'FILE_UPLOAD':
        return (
          <div className="pf-field-stack">
            <p className="pf-field-label">{label}</p>
            {!fileValue ? (
              <div
                className="pf-dropzone"
                onDragEnter={preventFileDropNavigation}
                onDragOver={preventFileDropNavigation}
                onDrop={handleFileDrop}
              >
                <input
                  type="file"
                  id={fileInputId}
                  className="pf-visually-hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                />
                <label htmlFor={fileInputId} className="pf-dropzone-label">
                  {isUploading ? (
                    <>
                      <Loader2 className="pf-dropzone-icon pf-spin" aria-hidden="true" />
                      <span className="pf-dropzone-title">{uploadProgress}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="pf-dropzone-icon" aria-hidden="true" />
                      <span className="pf-dropzone-title">Click to upload or drag and drop</span>
                      <span className="pf-dropzone-note">PDF, DOC, DOCX, XLS, XLSX, images (max 10MB)</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="pf-file-card">
                <span className="pf-file-thumb">
                  {fileValue.fileType?.startsWith('image/') ? (
                    <Image src={fileValue.url} alt="" width={40} height={40} className="pf-file-image" />
                  ) : (
                    <FileIcon size={22} aria-hidden="true" />
                  )}
                </span>
                <span className="pf-file-copy">
                  <span className="pf-file-name">{fileValue.fileName}</span>
                  <span className="pf-file-meta">
                    {(fileValue.fileSize / 1024).toFixed(1)} KB
                    <CheckCircle size={12} aria-hidden="true" className="pf-file-check" />
                    Uploaded
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  aria-label="Remove file"
                >
                  <X size={15} />
                </Button>
              </div>
            )}
            {fileValue?.url && (
              <a href={fileValue.url} target="_blank" rel="noopener noreferrer" className="pf-file-link">View file</a>
            )}
          </div>
        );

      default:
        return (
          <Input
            label={label}
            placeholder={field.placeholder || field.displayName}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            error={error}
          />
        );
    }
  };

  return (
    <div className="pf-field" id={field.fieldId}>
      {renderField()}
      {error && ERROR_BESIDE_CONTROL.has(field.type) && (
        <p className="pf-field-error">{error}</p>
      )}
    </div>
  );
}
