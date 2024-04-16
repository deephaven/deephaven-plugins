import type { dh } from '@deephaven/jsapi-types';

export type WidgetId = string;

export interface WidgetMessageDetails {
  getDataAsBase64: () => string;
  getDataAsString: () => string;
  exportedObjects: dh.WidgetExportedObject[];
}

export type WidgetMessageEvent = CustomEvent<WidgetMessageDetails>;

export type WidgetFetch = (takeOwnership?: boolean) => Promise<dh.Widget>;

export type WidgetData = {
  /** Panel IDs that are opened by this widget */
  panelIds?: string[];

  /** State of the widget on the Python side */
  state?: Record<string, unknown>;
};

export type ReadonlyWidgetData = Readonly<WidgetData>;

/** Contains an update for widget data. Only the keys that are updated are passed. */
export type WidgetDataUpdate = Partial<ReadonlyWidgetData>;
