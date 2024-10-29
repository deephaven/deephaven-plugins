import { WidgetDescriptor } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import type { dh } from '@deephaven/jsapi-types';
import { WidgetMessageEvent } from './WidgetTypes';

export function makeDocumentUpdatedJsonRpc(
  document: Record<string, unknown> = {}
): { jsonrpc: string; method: string; params: string[] } {
  return {
    jsonrpc: '2.0',
    method: 'documentUpdated',
    params: [JSON.stringify(document)],
  };
}

export function makeJsonRpcResponseString(id: number, result = ''): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id,
    result,
  });
}

export function makeDocumentUpdatedJsonRpcString(
  document: Record<string, unknown> = {}
): string {
  return JSON.stringify(makeDocumentUpdatedJsonRpc(document));
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

export function makeWidgetEventDocumentUpdated(
  document: Record<string, unknown> = {}
): WidgetMessageEvent {
  return makeWidgetEvent(makeDocumentUpdatedJsonRpcString(document));
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
  getDataAsString = () => makeDocumentUpdatedJsonRpcString(),
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
