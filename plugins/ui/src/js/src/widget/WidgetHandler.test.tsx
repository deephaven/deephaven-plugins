import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useWidget } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { Operation } from 'fast-json-patch';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';
import { DocumentHandlerProps } from './DocumentHandler';
import {
  makeWidget,
  makeWidgetDescriptor,
  makeWidgetEventDocumentPatched,
  makeWidgetEventJsonRpcResponse,
} from './WidgetTestUtils';

const mockApi = { Widget: { EVENT_MESSAGE: 'message' } };
const defaultWidgetWrapper: ReturnType<typeof useWidget> = {
  widget: TestUtils.createMockProxy<dh.Widget>({
    addEventListener: jest
      .fn(() => jest.fn().mockName('cleanup'))
      .mockName('addEventListener'),
    getDataAsString: jest.fn(() => ''),
    exportedObjects: [],
  }),
  error: null,
};
let mockWidgetWrapper: ReturnType<typeof useWidget> = defaultWidgetWrapper;
jest.mock('@deephaven/jsapi-bootstrap', () => ({
  useApi: jest.fn(() => mockApi),
  useWidget: jest.fn(() => mockWidgetWrapper),
}));

const mockDocumentHandler = jest.fn((props: DocumentHandlerProps) => (
  <div>DocumentHandler</div>
));
jest.mock(
  './DocumentHandler',
  () => (props: DocumentHandlerProps) => mockDocumentHandler(props)
);

function makeWidgetHandler({
  widgetDescriptor: widget = makeWidgetDescriptor(),
  onClose = jest.fn(),
  initialData = undefined,
}: Partial<WidgetHandlerProps> = {}) {
  return (
    <WidgetHandler
      id="test-widget-handler"
      widgetDescriptor={widget}
      onClose={onClose}
      initialData={initialData}
    />
  );
}

beforeEach(() => {
  mockWidgetWrapper = defaultWidgetWrapper;
  mockDocumentHandler.mockClear();
});

it('mounts and unmounts', async () => {
  const { unmount } = render(makeWidgetHandler());
  unmount();
});

it('updates the document when event is received', async () => {
  const widget = makeWidgetDescriptor();
  const cleanup = jest.fn();
  const mockAddEventListener = jest.fn(
    (() => cleanup) as dh.Widget['addEventListener']
  );
  const mockSendMessage = jest.fn();
  const initialData = { state: { fiz: 'baz' } };
  mockWidgetWrapper = {
    widget: makeWidget({
      addEventListener: mockAddEventListener,
      getDataAsString: jest.fn(() => ''),
      sendMessage: mockSendMessage,
    }),
    error: null,
  };

  const { unmount } = render(
    makeWidgetHandler({ widgetDescriptor: widget, initialData })
  );
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

  const listener = mockAddEventListener.mock.calls[0][1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call first
    listener(makeWidgetEventJsonRpcResponse(1));
  });

  function testPatch(patch: Operation[], expected: Record<string, unknown>) {
    mockDocumentHandler.mockClear();
    act(() => {
      // Send an updated document event to the listener of the widget
      listener(makeWidgetEventDocumentPatched(patch));
    });
    expect(mockDocumentHandler).toHaveBeenCalledTimes(1);
    const [props] = mockDocumentHandler.mock.calls[0];
    expect(props.widget).toBe(widget);
    expect(props.initialData).toBe(initialData);
    expect(props.children).toStrictEqual(expected);
  }

  testPatch([{ op: 'add', path: '/foo', value: 'bar' }], { foo: 'bar' });

  testPatch([{ op: 'add', path: '/fiz', value: 'baz' }], {
    foo: 'bar',
    fiz: 'baz',
  });
  testPatch([{ op: 'remove', path: '/fiz' }], { foo: 'bar' });
  testPatch([{ op: 'replace', path: '/foo', value: 'boo' }], {
    foo: 'boo',
  });
  testPatch(
    [
      { op: 'add', path: '/bar', value: 'baz' },
      { op: 'replace', path: '/foo', value: 'zoo' },
    ],
    {
      foo: 'zoo',
      bar: 'baz',
    }
  );

  expect(cleanup).not.toHaveBeenCalled();
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

it('updates the initial data only when widget has changed', async () => {
  const widget1 = makeWidgetDescriptor();
  const cleanup = jest.fn();
  const addEventListener = jest.fn(
    (() => cleanup) as dh.Widget['addEventListener']
  );
  const sendMessage = jest.fn();
  const onClose = jest.fn();
  const data1 = { state: { fiz: 'baz' } };
  const document1 = { foo: 'bar' };
  const patch1: Operation[] = [{ op: 'add', path: '/foo', value: 'bar' }];
  mockWidgetWrapper = {
    widget: makeWidget({
      addEventListener,
      getDataAsString: jest.fn(() => ''),
      sendMessage,
    }),
    error: null,
  };

  const { rerender, unmount } = render(
    makeWidgetHandler({
      widgetDescriptor: widget1,
      initialData: data1,
      onClose,
    })
  );
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

  let listener = addEventListener.mock.calls[0][1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call first
    listener(makeWidgetEventJsonRpcResponse(1));

    // Then send the initial document update
    listener(makeWidgetEventDocumentPatched(patch1));
  });

  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      widget: widget1,
      children: document1,
      initialData: data1,
    })
  );

  const data2 = { state: { FIZ: 'BAZ' } };

  addEventListener.mockClear();
  mockDocumentHandler.mockClear();
  sendMessage.mockClear();

  // Re-render with just initial data change. It should not set the state again
  rerender(
    makeWidgetHandler({
      widgetDescriptor: widget1,
      initialData: data2,
      onClose,
    })
  );

  expect(sendMessage).not.toHaveBeenCalled();

  const widget2 = makeWidgetDescriptor();
  const document2 = { foo: 'bar', FOO: 'BAR' };
  const patch2: Operation[] = [{ op: 'add', path: '/FOO', value: 'BAR' }];
  mockWidgetWrapper = {
    widget: makeWidget({
      addEventListener,
      getDataAsString: jest.fn(() => ''),
      sendMessage,
    }),
    error: null,
  };

  // Re-render with the widget descriptor changed, it should set the state with the updated data
  rerender(
    makeWidgetHandler({
      widgetDescriptor: widget2,
      initialData: data2,
      onClose,
    })
  );

  // Should have been called when the widget was updated
  expect(cleanup).toHaveBeenCalledTimes(1);
  cleanup.mockClear();

  // eslint-disable-next-line prefer-destructuring
  listener = addEventListener.mock.calls[0][1];

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
    listener(makeWidgetEventJsonRpcResponse(1));

    // Then send the initial document update
    listener(makeWidgetEventDocumentPatched(patch2));
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

it('handles rendering widget error if widget is null (query disconnected)', async () => {
  const widget1 = makeWidgetDescriptor();
  const cleanup = jest.fn();
  const mockAddEventListener = jest.fn(
    (() => cleanup) as dh.Widget['addEventListener']
  );
  const sendMessage = jest.fn();
  const data1 = { state: { fiz: 'baz' } };
  const document1 = { foo: 'bar' };
  const patch1: Operation[] = [{ op: 'add', path: '/foo', value: 'bar' }];
  mockWidgetWrapper = {
    widget: makeWidget({
      addEventListener: mockAddEventListener,
      getDataAsString: jest.fn(() => ''),
      sendMessage,
    }),
    error: null,
  };

  const { rerender, unmount } = render(
    makeWidgetHandler({
      widgetDescriptor: widget1,
      initialData: data1,
    })
  );
  expect(mockAddEventListener).toHaveBeenCalledTimes(1);
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

  const listener = mockAddEventListener.mock.calls[0][1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call first
    listener(makeWidgetEventJsonRpcResponse(1));

    // Then send the initial document update
    listener(makeWidgetEventDocumentPatched(patch1));
  });

  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      widget: widget1,
      children: document1,
      initialData: data1,
    })
  );

  mockAddEventListener.mockClear();
  mockDocumentHandler.mockClear();
  sendMessage.mockClear();

  mockWidgetWrapper = { widget: null, error: new Error('Test error') };
  mockDocumentHandler.mockImplementation(props => (
    <div className="test-document-handler">{props.children}</div>
  ));

  rerender(
    makeWidgetHandler({
      widgetDescriptor: widget1,
      initialData: data1,
    })
  );

  expect(mockDocumentHandler).toHaveBeenCalledTimes(1);
  const [props] = mockDocumentHandler.mock.calls[0];
  expect(props.widget).toBe(widget1);
  expect(props.initialData).toBe(data1);
  expect(screen.getByText('Test error')).toBeVisible();

  unmount();
});
