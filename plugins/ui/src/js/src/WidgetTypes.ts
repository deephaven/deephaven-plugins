import { WidgetDefinition } from '@deephaven/dashboard';
import { JsWidget, WidgetExportedObject } from '@deephaven/jsapi-types';

export interface WidgetMessageDetails {
  getDataAsBase64(): string;
  getDataAsString(): string;
  exportedObjects: WidgetExportedObject[];
}

export type WidgetMessageEvent = CustomEvent<WidgetMessageDetails>;

export type WidgetFetch = () => Promise<JsWidget>;

export type WidgetWrapper = {
  definition: WidgetDefinition;
  fetch: WidgetFetch;
  id: string;
};
