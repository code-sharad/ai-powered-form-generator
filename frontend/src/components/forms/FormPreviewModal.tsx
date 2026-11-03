'use client';

import { Form } from '@/types';
import { FormRenderer } from './FormRenderer';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import '@/app/builder.css';

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
      <DialogContent
        title="Form preview"
        description="This is how your form will appear to respondents."
        className="preview-dialog"
      >
        <div className="pf pf-preview">
          <FormRenderer form={form} onSubmit={handlePreviewSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
