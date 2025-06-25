import type { dh } from '@deephaven/jsapi-types';

export type WidgetId = string;

export interface WidgetMessageDetails {
  getDataAsBase64: () => string;
  getDataAsString: () => string;
  exportedObjects: dh.WidgetExportedObject[];
}

export type WidgetMessageEvent = dh.Event<WidgetMessageDetails>;

export type WidgetFetch = (takeOwnership?: boolean) => Promise<dh.Widget>;

export type WidgetData = {
  /** Panel IDs that are opened by this widget */
  panelIds?: string[];

  /** State of the widget on the Python side */
  state?: Record<string, unknown>;

  panelStates?: Record<string, unknown[]>;
};

export type ReadonlyWidgetData = Readonly<WidgetData>;

/** Contains an update for widget data. Only the keys that are updated are passed. */
export type WidgetDataUpdate = Partial<ReadonlyWidgetData>;

export function isWidgetError(value: unknown): value is WidgetError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'name' in value
  );
}

export type WidgetAction = {
  title: string;
  action: () => void;
};

export function isWidgetAction(value: unknown): value is WidgetAction {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    'action' in value
  );
}

/** Widget error details */
export type WidgetError = {
  /** Message to display of the error */
  message: string;

  /** Name of the error */
  name: string;

  /** Stack trace of the error */
  stack?: string;

  /** Specific error code */
  code?: number;

  /** An action to take to recover from the error */
  action?: WidgetAction;
};

/** Message containing a patch to apply to the previous document. Assumes we start with an initial empty document. */
export const METHOD_DOCUMENT_PATCHED = 'documentPatched';

/** Message containing a document error */
export const METHOD_DOCUMENT_ERROR = 'documentError';

/** Message containing an event */
export const METHOD_EVENT = 'event';
