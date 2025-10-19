'use client';

import { Form } from '@/types';
import { FormRenderer } from './FormRenderer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FormPreviewModalProps {
  form: Form | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FormPreviewModal({ form, isOpen, onClose }: FormPreviewModalProps) {
  if (!form) return null;

  const handlePreviewSubmit = async (responses: Record<string, unknown>) => {
    console.log('Preview submission:', responses);
    // In preview mode, just log the data
    return Promise.resolve();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
          <DialogDescription>
            This is how your form will appear to users
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <FormRenderer form={form} onSubmit={handlePreviewSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
