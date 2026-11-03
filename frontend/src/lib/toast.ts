import type { ToastStackApi, ToastType } from '@/components/arc/toast-stack/toast-stack';

/**
 * Thin facade over Arc's toast stack so call sites keep the short
 * `toast.success('Saved')` shape. The stack mounts once in Providers and
 * registers its API here; a toast fired before that mount waits for it.
 */
let api: ToastStackApi | null = null;
const waiting: Array<(api: ToastStackApi) => void> = [];

export function bindToastApi(next: ToastStackApi | null) {
  api = next;
  if (next) waiting.splice(0).forEach(run => run(next));
}

function show(type: ToastType, title: string, description?: string) {
  const run = (stack: ToastStackApi) => { stack.toast({ type, title, description }); };
  if (api) run(api);
  else waiting.push(run);
}

export const toast = {
  success: (title: string, description?: string) => show('success', title, description),
  error: (title: string, description?: string) => show('error', title, description),
  info: (title: string, description?: string) => show('info', title, description),
  dismiss: (id?: string) => api?.dismiss(id),
};
