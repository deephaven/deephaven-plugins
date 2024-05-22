import React from 'react';
import { act, render } from '@testing-library/react';
import type { dh } from '@deephaven/jsapi-types';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';
import { DocumentHandlerProps } from './DocumentHandler';
import {
  makeDocumentUpdatedJsonRpcString,
  makeSetStateResponse,
  makeWidget,
  makeWidgetDescriptor,
} from './WidgetTestUtils';

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

function makeWidgetHandler({
  fetch = () => Promise.resolve(makeWidget()),
  widget = makeWidgetDescriptor(),
  onClose = jest.fn(),
  initialData = undefined,
}: Partial<WidgetHandlerProps> = {}) {
  return (
    <WidgetHandler
      fetch={fetch}
      widget={widget}
      onClose={onClose}
      initialData={initialData}
    />
  );
}

beforeEach(() => {
  mockDocumentHandler.mockClear();
});

it('mounts and unmounts', async () => {
  const { unmount } = render(makeWidgetHandler());
  unmount();
});

it('updates the document when event is received', async () => {
  let fetchResolve: (value: dh.Widget | PromiseLike<dh.Widget>) => void;
  const fetchPromise = new Promise<dh.Widget>(resolve => {
    fetchResolve = resolve;
  });
  const fetch = jest.fn(() => fetchPromise);
  const widget = makeWidgetDescriptor();
  const cleanup = jest.fn();
  const mockAddEventListener = jest.fn(() => cleanup);
  const mockSendMessage = jest.fn();
  const initialData = { state: { fiz: 'baz' } };
  const initialDocument = { foo: 'bar' };
  const widgetObject = makeWidget({
    addEventListener: mockAddEventListener,
    getDataAsString: jest.fn(() => ''),
    sendMessage: mockSendMessage,
  });

  const { unmount } = render(makeWidgetHandler({ widget, fetch, initialData }));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(mockAddEventListener).not.toHaveBeenCalled();
  expect(mockDocumentHandler).not.toHaveBeenCalled();
  expect(mockSendMessage).not.toHaveBeenCalled();
  await act(async () => {
    fetchResolve!(widgetObject);
    await fetchPromise;
  });

  expect(mockAddEventListener).toHaveBeenCalledTimes(1);
  expect(mockDocumentHandler).not.toHaveBeenCalled();

  expect(mockSendMessage).toHaveBeenCalledWith(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'setState',
      params: [initialData.state],
    }),
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listener = (mockAddEventListener.mock.calls[0] as any)[1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call first
    listener({
      detail: {
        getDataAsString: jest.fn(() => makeSetStateResponse(1, {})),
        exportedObjects: [],
      },
    });

    // Then send the initial document update
    listener({
      detail: {
        getDataAsString: jest.fn(() =>
          makeDocumentUpdatedJsonRpcString(initialDocument)
        ),
        exportedObjects: [],
      },
    });
  });

  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      widget,
      children: initialDocument,
      initialData,
    })
  );

  const updatedDocument = { FOO: 'BAR' };

  mockDocumentHandler.mockClear();

  // Send the updated document
  await act(async () => {
    listener({
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
      widget,
      children: updatedDocument,
    })
  );

  expect(cleanup).not.toHaveBeenCalled();
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

it('updates the initial data only when fetch has changed', async () => {
  let fetchResolve1: (value: dh.Widget | PromiseLike<dh.Widget>) => void;
  const fetchPromise1 = new Promise<dh.Widget>(resolve => {
    fetchResolve1 = resolve;
  });
  const fetch1 = jest.fn(() => fetchPromise1);
  const widget1 = makeWidgetDescriptor();
  const cleanup = jest.fn();
  const addEventListener = jest.fn(() => cleanup);
  const sendMessage = jest.fn();
  const onClose = jest.fn();
  const data1 = { state: { fiz: 'baz' } };
  const document1 = { foo: 'bar' };
  const widgetObject1 = makeWidget({
    addEventListener,
    getDataAsString: jest.fn(() => ''),
    sendMessage,
  });

  const { rerender, unmount } = render(
    makeWidgetHandler({
      widget: widget1,
      fetch: fetch1,
      initialData: data1,
      onClose,
    })
  );
  expect(fetch1).toHaveBeenCalledTimes(1);
  expect(addEventListener).not.toHaveBeenCalled();
  expect(mockDocumentHandler).not.toHaveBeenCalled();
  expect(sendMessage).not.toHaveBeenCalled();
  await act(async () => {
    fetchResolve1!(widgetObject1);
    await fetchPromise1;
  });

  expect(addEventListener).toHaveBeenCalledTimes(1);
  expect(mockDocumentHandler).not.toHaveBeenCalled();

  expect(sendMessage).toHaveBeenCalledWith(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'setState',
      params: [data1.state],
    }),
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listener = (addEventListener.mock.calls[0] as any)[1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call first
    listener({
      detail: {
        getDataAsString: jest.fn(() => makeSetStateResponse(1, {})),
        exportedObjects: [],
      },
    });

    // Then send the initial document update
    listener({
      detail: {
        getDataAsString: jest.fn(() =>
          makeDocumentUpdatedJsonRpcString(document1)
        ),
        exportedObjects: [],
      },
    });
  });

  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      widget: widget1,
      children: document1,
      initialData: data1,
    })
  );

  let fetchResolve2: (value: dh.Widget | PromiseLike<dh.Widget>) => void;
  const fetchPromise2 = new Promise<dh.Widget>(resolve => {
    fetchResolve2 = resolve;
  });
  const widget2 = makeWidgetDescriptor();
  const document2 = { FOO: 'BAR' };
  const data2 = { state: { FIZ: 'BAZ' } };
  const fetch2 = jest.fn(() => fetchPromise2);
  const widgetObject2 = makeWidget({
    addEventListener,
    getDataAsString: jest.fn(() => ''),
    sendMessage,
  });

  addEventListener.mockClear();
  mockDocumentHandler.mockClear();
  sendMessage.mockClear();
  fetch1.mockClear();

  // Re-render with just initial data change. It should not set the state again
  rerender(
    makeWidgetHandler({
      widget: widget1,
      fetch: fetch1,
      initialData: data2,
      onClose,
    })
  );

  expect(fetch1).not.toHaveBeenCalled();
  expect(sendMessage).not.toHaveBeenCalled();

  // Re-render with the fetch changed, it should set the state with the updated data
  rerender(
    makeWidgetHandler({
      widget: widget2,
      fetch: fetch2,
      initialData: data2,
      onClose,
    })
  );

  await act(async () => {
    fetchResolve2!(widgetObject2);
    await fetchPromise2;
  });

  expect(fetch2).toHaveBeenCalledTimes(1);
  // Should have been called when the widget was updated
  expect(cleanup).toHaveBeenCalledTimes(1);
  cleanup.mockClear();

  // eslint-disable-next-line prefer-destructuring, @typescript-eslint/no-explicit-any
  listener = (addEventListener.mock.calls[0] as any)[1];

  expect(sendMessage).toHaveBeenCalledWith(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'setState',
      params: [data2.state],
    }),
    []
  );
  expect(sendMessage).toHaveBeenCalledTimes(1);

  // Send the initial document
  await act(async () => {
    // Respond to the setState call first
    listener({
      detail: {
        getDataAsString: jest.fn(() => makeSetStateResponse(1, {})),
        exportedObjects: [],
      },
    });

    // Then send the initial document update
    listener({
      detail: {
        getDataAsString: jest.fn(() =>
          makeDocumentUpdatedJsonRpcString(document2)
        ),
        exportedObjects: [],
      },
    });
  });

  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      widget: widget1,
      children: document2,
      initialData: data2,
    })
  );

  expect(cleanup).not.toHaveBeenCalled();
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
