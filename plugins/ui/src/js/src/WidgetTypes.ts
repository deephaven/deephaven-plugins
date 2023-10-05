import { WidgetDefinition } from '@deephaven/dashboard';
import { ExportedObject } from './ElementUtils';

export interface WidgetMessageDetails {
  getDataAsBase64(): string;
  getDataAsString(): string;
  exportedObjects: ExportedObject[];
}

export interface WidgetMessageEvent {
  detail: WidgetMessageDetails;
}

export interface JsWidget extends WidgetMessageDetails {
  addEventListener: (
    type: string,
    listener: (event: WidgetMessageEvent) => void
  ) => () => void;
  sendMessage: (message: string, args: unknown[]) => void;
}

export type WidgetFetch = () => Promise<JsWidget>;

export type WidgetWrapper = {
  definition: WidgetDefinition;
  fetch: WidgetFetch;
};
