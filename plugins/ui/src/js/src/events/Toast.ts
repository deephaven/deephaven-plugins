import { ToastQueue, ToastOptions } from '@deephaven/components';

export const TOAST_EVENT = 'toast.event';

export type ToastVariant = 'positive' | 'negative' | 'neutral' | 'info';

export type ToastParams = ToastOptions & {
  message: string;
  variant?: ToastVariant;
};

export function Toast(params: ToastParams): void {
  const { message, variant, ...options } = params;

  switch (variant) {
    case 'positive':
      ToastQueue.positive(message, options);
      break;
    case 'negative':
      ToastQueue.negative(message, options);
      break;
    case 'neutral':
      ToastQueue.neutral(message, options);
      break;
    case 'info':
      ToastQueue.info(message, options);
      break;
    default:
      throw new Error(`Unknown toast variant: ${variant}`);
  }
}

export default Toast;
