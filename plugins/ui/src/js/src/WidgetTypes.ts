import { WidgetDefinition } from '@deephaven/dashboard';
import { Widget, WidgetExportedObject } from '@deephaven/jsapi-types';

export interface WidgetMessageDetails {
  getDataAsBase64(): string;
  getDataAsString(): string;
  exportedObjects: WidgetExportedObject[];
}

export type WidgetMessageEvent = CustomEvent<WidgetMessageDetails>;

export type WidgetFetch = (takeOwnership?: boolean) => Promise<Widget>;

export type WidgetWrapper = {
  definition: WidgetDefinition;
  fetch: WidgetFetch;
  id: string;
};
