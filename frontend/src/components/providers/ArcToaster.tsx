'use client';

import { useEffect } from 'react';
import { ToastStack, ToastStackProvider, useToastStack } from '@/components/arc/toast-stack/toast-stack';
import { bindToastApi } from '@/lib/toast';

function ToastBridge() {
  const stack = useToastStack();
  useEffect(() => {
    bindToastApi(stack);
    return () => bindToastApi(null);
  }, [stack]);
  return null;
}

export function ArcToaster() {
  return <ToastStackProvider>
    <ToastBridge />
    <ToastStack label="Formora notifications" position="bottom-right" />
  </ToastStackProvider>;
}
