import { WidgetDescriptor } from '@deephaven/dashboard';
import { Widget, WidgetExportedObject } from '@deephaven/jsapi-types';

export type WidgetId = string;

export interface WidgetMessageDetails {
  getDataAsBase64(): string;
  getDataAsString(): string;
  exportedObjects: WidgetExportedObject[];
}

export type WidgetMessageEvent = CustomEvent<WidgetMessageDetails>;

export type WidgetFetch = (takeOwnership?: boolean) => Promise<Widget>;

export type WidgetData = {
  /** Panel IDs that are opened by this widget */
  panelIds?: readonly string[];
};

export type WidgetWrapper = {
  /** Function to fetch the widget instance from the server */
  fetch: WidgetFetch;

  /** ID of this widget */
  id: WidgetId;

  /** Descriptor for the widget. */
  widget: WidgetDescriptor;

  /** Data for the widget */
  data?: WidgetData;
};
