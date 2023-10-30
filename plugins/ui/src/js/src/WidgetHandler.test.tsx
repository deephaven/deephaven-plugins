import React from 'react';
import { WidgetDefinition } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/utils';
import { act, render } from '@testing-library/react';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';
import { JsWidget, WidgetWrapper } from './WidgetTypes';
import { DocumentHandlerProps } from './DocumentHandler';

const mockApi = { Widget: { EVENT_MESSAGE: 'message' } };
jest.mock('@deephaven/jsapi-bootstrap', () => ({
  useApi: jest.fn(() => mockApi),
}));

const mockDocumentHandler = jest.fn((props: DocumentHandlerProps) => (
  <div>DocumentHandler</div>
));
jest.mock(
  './DocumentHandler',
  () => (props: DocumentHandlerProps) => mockDocumentHandler(props)
);

function makeDocumentUpdatedJsonRpc(document: Record<string, unknown> = {}) {
  return {
    jsonrpc: '2.0',
    method: 'documentUpdated',
    params: [document],
  };
}

function makeDocumentUpdatedJsonRpcString(
  document: Record<string, unknown> = {}
) {
  return JSON.stringify(makeDocumentUpdatedJsonRpc(document));
}

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

function makeWidget({
  addEventListener = jest.fn(() => jest.fn()),
  getDataAsString = () => makeDocumentUpdatedJsonRpcString(),
}: Partial<JsWidget> = {}): JsWidget {
  return TestUtils.createMockProxy<JsWidget>({
    addEventListener,
    getDataAsString,
  });
}

function makeWidgetWrapper({
  definition = makeWidgetDefinition(),
  fetch = () => Promise.resolve(makeWidget()),
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

beforeEach(() => {
  mockDocumentHandler.mockClear();
});

it('mounts and unmounts', async () => {
  const { unmount } = render(makeWidgetHandler());
  unmount();
});

it('updates the document when event is received', async () => {
  let fetchResolve: (value: JsWidget | PromiseLike<JsWidget>) => void;
  const fetchPromise = new Promise<JsWidget>(resolve => {
    fetchResolve = resolve;
  });
  const fetch = jest.fn(() => fetchPromise);
  const definition = makeWidgetDefinition();
  const cleanup = jest.fn();
  const mockAddEventListener = jest.fn(() => cleanup);
  const initialDocument = { foo: 'bar' };
  const widget = makeWidget({
    addEventListener: mockAddEventListener,
    getDataAsString: jest.fn(() =>
      makeDocumentUpdatedJsonRpcString(initialDocument)
    ),
  });
  const wrapper = makeWidgetWrapper({ definition, fetch });
  const { unmount } = render(makeWidgetHandler({ widget: wrapper }));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(mockAddEventListener).not.toHaveBeenCalled();
  expect(mockDocumentHandler).not.toHaveBeenCalled();
  await act(async () => {
    fetchResolve!(widget);
    await fetchPromise;
  });

  expect(mockAddEventListener).toHaveBeenCalledTimes(1);
  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      definition,
      element: initialDocument,
    })
  );

  mockDocumentHandler.mockClear();

  const updatedDocument = { fiz: 'baz' };

  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockAddEventListener.mock.calls[0] as any)[1]({
      detail: {
        getDataAsString: jest.fn(() =>
          makeDocumentUpdatedJsonRpcString(updatedDocument)
        ),
        exportedObjects: [],
      },
    });
  });
  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      definition,
      element: updatedDocument,
    })
  );

  expect(cleanup).not.toHaveBeenCalled();
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
