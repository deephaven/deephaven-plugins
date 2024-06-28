import { WidgetDescriptor } from '@deephaven/dashboard';
import { createContext } from 'react';

export type WidgetStatusLoading = {
  status: 'loading';
  descriptor: WidgetDescriptor;
};

export type WidgetStatusError = {
  status: 'error';
  descriptor: WidgetDescriptor;
  error: NonNullable<unknown>;
};

export type WidgetStatusReady = {
  status: 'ready';
  descriptor: WidgetDescriptor;
};

export type WidgetStatus =
  | WidgetStatusLoading
  | WidgetStatusError
  | WidgetStatusReady;

/** Status of the widget within this context */
export const WidgetStatusContext = createContext<WidgetStatus | null>(null);

export default WidgetStatusContext;
