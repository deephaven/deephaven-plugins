import { type WidgetDescriptor } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import type { dh } from '@deephaven/jsapi-types';
import { type Operation } from 'fast-json-patch';
import {
  METHOD_DOCUMENT_ERROR,
  METHOD_DOCUMENT_PATCHED,
  METHOD_EVENT,
  type WidgetError,
  type WidgetMessageEvent,
} from './WidgetTypes';

export function makeDocumentPatchedJsonRpc(patch: Operation[] = []): {
  jsonrpc: string;
  method: string;
  params: [Operation[]];
} {
  return {
    jsonrpc: '2.0',
    method: METHOD_DOCUMENT_PATCHED,
    params: [patch],
  };
}

export function makeJsonRpcResponseString(id: number, result = ''): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id,
    result,
  });
}

export function makeDocumentPatchedJsonRpcString(
  patch: Operation[] = []
): string {
  return JSON.stringify(makeDocumentPatchedJsonRpc(patch));
}

export function makeWidgetEvent(data = ''): WidgetMessageEvent {
  return new CustomEvent('message', {
    detail: {
      getDataAsBase64: () => '',
      getDataAsString: () => data,
      exportedObjects: [],
    },
  });
}

export function makeWidgetEventJsonRpcResponse(
  id: number,
  response = ''
): WidgetMessageEvent {
  return makeWidgetEvent(makeJsonRpcResponseString(id, response));
}

export function makeWidgetEventDocumentPatched(
  patch: Operation[] = []
): WidgetMessageEvent {
  return makeWidgetEvent(makeDocumentPatchedJsonRpcString(patch));
}

export function makeWidgetEventDocumentError(
  error: Partial<WidgetError> = {}
): WidgetMessageEvent {
  const widgetError: WidgetError = {
    name: 'Error',
    message: 'Document error',
    ...error,
  };
  return makeWidgetEvent(
    JSON.stringify({
      jsonrpc: '2.0',
      method: METHOD_DOCUMENT_ERROR,
      params: [JSON.stringify(widgetError)],
    })
  );
}

export function makeWidgetDescriptor({
  id = 'widget-id',
  type = 'widget-type',
  name = 'Widget Name',
} = {}): WidgetDescriptor {
  return {
    id,
    type,
    name,
  };
}

export function makeWidget({
  addEventListener = jest.fn(() => jest.fn()),
  getDataAsString = () => makeDocumentPatchedJsonRpcString(),
  exportedObjects = [],
  sendMessage = jest.fn(),
}: Partial<dh.Widget> = {}): dh.Widget {
  return TestUtils.createMockProxy<dh.Widget>({
    addEventListener,
    getDataAsString,
    exportedObjects,
    sendMessage,
  });
}

export function makeWidgetEventMethodEvent(
  name: string,
  payload: Record<string, unknown>
): WidgetMessageEvent {
  return makeWidgetEvent(
    JSON.stringify({
      jsonrpc: '2.0',
      method: METHOD_EVENT,
      params: [name, JSON.stringify(payload)],
    })
  );
}
