import { useState } from 'react';
import Image from 'next/image';
import { FormField } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { uploadService } from '@/services/uploadService';
import { Upload, X, FileIcon, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

export function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Type guards and helpers
  const stringValue = (value as string) || '';
  const fileValue = value as UploadedFile | null;
  const arrayValue = (Array.isArray(value) ? value : []) as string[];
  const numberValue = value as number;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Uploading...');

    try {
      // Upload to Cloudinary
      const result = await uploadService.uploadToCloudinary(file, {
        folder: 'form-submissions',
        resourceType: 'auto',
      });

      setUploadProgress('Upload complete!');

      // Store the upload result
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
            placeholder={field.placeholder || field.displayName}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
          />
        );

      case 'EMAIL':
        return (
          <Input
            type="email"
            placeholder={field.placeholder || 'example@email.com'}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
          />
        );

      case 'PHONE':
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || '+1 (555) 000-0000'}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
          />
        );

      case 'MULTI_LINE':
        return (
          <Textarea
            placeholder={field.placeholder || field.displayName}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            rows={4}
          />
        );

      case 'DATE':
        return (
          <Input
            type="date"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
          />
        );

      case 'DROPDOWN':
        return (
          <Select value={stringValue} onValueChange={onChange} required={field.mand}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.displayName}`} />
            </SelectTrigger>
            <SelectContent>
              {field.choices?.map((choice, idx) => (
                <SelectItem key={idx} value={choice}>
                  {choice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'RADIO':
        return (
          <RadioGroup value={stringValue} onValueChange={onChange} required={field.mand}>
            {field.choices?.map((choice, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={choice} id={`${field.fieldId}-${idx}`} />
                <Label htmlFor={`${field.fieldId}-${idx}`}>{choice}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'CHECKBOX':
        // Handle both single checkbox and multiple checkboxes
        if (!field.choices || field.choices.length === 0) {
          // Single checkbox (e.g., "I agree to terms")
          const boolValue = value === true || value === 'true';
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.fieldId}
                checked={boolValue}
                onCheckedChange={(checked) => onChange(checked)}
              />
              <Label
                htmlFor={field.fieldId}
                className="text-sm font-normal cursor-pointer"
              >
                {field.placeholder || field.displayName}
              </Label>
            </div>
          );
        }

        // Multiple checkboxes with choices
        return (
          <div className="space-y-2">
            {field.choices.map((choice, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.fieldId}-${idx}`}
                  checked={arrayValue.includes(choice)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...arrayValue, choice]);
                    } else {
                      onChange(arrayValue.filter((v) => v !== choice));
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.fieldId}-${idx}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {choice}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'RATING':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange(rating)}
                className={`w-10 h-10 rounded-full border-2 transition-colors ${numberValue === rating
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-gray-300 hover:border-primary'
                  }`}
              >
                {rating}
              </button>
            ))}
          </div>
        );

      case 'ADDRESS':
        return (
          <Textarea
            placeholder={field.placeholder || 'Enter your full address'}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
            rows={3}
          />
        );

      case 'FILE_UPLOAD':
        return (
          <div className="space-y-3">
            {!fileValue ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id={field.fieldId}
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                />
                <label
                  htmlFor={field.fieldId}
                  className="cursor-pointer flex flex-col items-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                      <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, XLS, XLSX, Images (Max 10MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      {fileValue.fileType?.startsWith('image/') ? (
                        <div className="relative h-10 w-10">
                          <Image
                            src={fileValue.url}
                            alt={fileValue.fileName}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ) : (
                        <FileIcon className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {fileValue.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{(fileValue.fileSize / 1024).toFixed(1)} KB</span>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Uploaded</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {fileValue.url && (
                  <a
                    href={fileValue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    View file
                  </a>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            placeholder={field.placeholder || field.displayName}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.mand}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.fieldId}>
        {field.displayName}
        {field.mand && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
