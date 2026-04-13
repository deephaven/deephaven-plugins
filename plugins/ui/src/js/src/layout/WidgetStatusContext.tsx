import { WidgetDescriptor } from '@deephaven/dashboard';
import { UriVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import { createContext } from 'react';

export type WidgetStatusLoading = {
  status: 'loading';
  descriptor: WidgetDescriptor | UriVariableDescriptor;
};

export type WidgetStatusError = {
  status: 'error';
  descriptor: WidgetDescriptor | UriVariableDescriptor;
  error: NonNullable<unknown>;
};

export type WidgetStatusReady = {
  status: 'ready';
  descriptor: WidgetDescriptor | UriVariableDescriptor;
};

export type WidgetStatus =
  | WidgetStatusLoading
  | WidgetStatusError
  | WidgetStatusReady;

/** Status of the widget within this context */
export const WidgetStatusContext = createContext<WidgetStatus | null>(null);

export default WidgetStatusContext;
