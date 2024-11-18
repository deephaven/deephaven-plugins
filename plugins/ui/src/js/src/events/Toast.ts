import { ToastQueue, ToastOptions } from '@deephaven/components';

export const TOAST_EVENT = 'toast.event';

export function Toast(message: string, options?: ToastOptions): void {
  ToastQueue.positive(message, options);
}

export default Toast;
