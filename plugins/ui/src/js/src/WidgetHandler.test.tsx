import React from 'react';
import { WidgetDefinition } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/utils';
import { render } from '@testing-library/react';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';
import { JsWidget, WidgetWrapper } from './WidgetTypes';

jest.mock('@deephaven/jsapi-bootstrap', () => ({
  useApi: jest.fn(() => ({
    Widget: { EVENT_MESSAGE: 'message' },
  })),
}));
jest.mock(
  './DocumentHandler',
  () =>
    function mockDocumentHandler() {
      return <div>Document Handler</div>;
    }
);

function makeWidgetDefinition({
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

function makeWidgetWrapper({
  definition = makeWidgetDefinition(),
  fetch = () =>
    Promise.resolve(
      TestUtils.createMockProxy<JsWidget>({
        addEventListener: jest.fn(() => jest.fn()),
        getDataAsString: () =>
          '{"jsonrpc":"2.0","method":"documentUpdated","params":[{}]}',
      })
    ),
}: Partial<WidgetWrapper> = {}): WidgetWrapper {
  return {
    id: definition.id ?? 'widget-id',
    definition,
    fetch,
  };
}

function makeWidgetHandler({
  widget = makeWidgetWrapper(),
  onClose = jest.fn(),
}: Partial<WidgetHandlerProps> = {}) {
  return <WidgetHandler widget={widget} onClose={onClose} />;
}

it('mounts and unmounts', async () => {
  const { unmount } = render(makeWidgetHandler());
  unmount();
});
