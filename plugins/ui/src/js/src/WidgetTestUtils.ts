import { WidgetDefinition } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/utils';
import type { Widget } from '@deephaven/jsapi-types';
import { WidgetWrapper } from './WidgetTypes';

export function makeDocumentUpdatedJsonRpc(
  document: Record<string, unknown> = {}
) {
  return {
    jsonrpc: '2.0',
    method: 'documentUpdated',
    params: [JSON.stringify(document)],
  };
}

export function makeDocumentUpdatedJsonRpcString(
  document: Record<string, unknown> = {}
) {
  return JSON.stringify(makeDocumentUpdatedJsonRpc(document));
}

export function makeWidgetDefinition({
  id = 'widget-id',
  type = 'widget-type',
  title = 'Widget Title',
} = {}): WidgetDefinition {
  return {
    id,
    type,
    title,
  };
}

export function makeWidget({
  addEventListener = jest.fn(() => jest.fn()),
  getDataAsString = () => makeDocumentUpdatedJsonRpcString(),
  exportedObjects = [],
}: Partial<Widget> = {}): Widget {
  return TestUtils.createMockProxy<Widget>({
    addEventListener,
    getDataAsString,
    exportedObjects,
  });
}

export function makeWidgetWrapper({
  definition = makeWidgetDefinition(),
  fetch = () => Promise.resolve(makeWidget()),
}: Partial<WidgetWrapper> = {}): WidgetWrapper {
  return {
    id: definition.id ?? 'widget-id',
    definition,
    fetch,
  };
}
