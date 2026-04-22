import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useWidget } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { PluginModuleMap, PluginsContext } from '@deephaven/plugin';
import { Operation } from 'fast-json-patch';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';
import { DocumentHandlerProps } from './DocumentHandler';
import {
  makeWidget,
  makeWidgetDescriptor,
  makeWidgetEventDocumentPatched,
  makeWidgetEventJsonRpcResponse,
  makeWidgetEventMethodEvent,
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
  api: jest.fn() as unknown as typeof dh,
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
  pluginsValue = new Map(),
}: Partial<WidgetHandlerProps> & {
  pluginsValue?: React.ProviderProps<PluginModuleMap | null>['value'];
} = {}): React.ReactElement {
  return (
    <PluginsContext.Provider value={pluginsValue}>
      <WidgetHandler
        id="test-widget-handler"
        widgetDescriptor={widget}
        onClose={onClose}
        initialData={initialData}
      />
    </PluginsContext.Provider>
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
    api: jest.fn() as unknown as typeof dh,
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
      params: [{ ...initialData.state, __queryParams: {} }],
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
    api: jest.fn() as unknown as typeof dh,
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
      params: [{ ...data1.state, __queryParams: {} }],
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
    api: jest.fn() as unknown as typeof dh,
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
      params: [{ ...data2.state, __queryParams: {} }],
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
    api: jest.fn() as unknown as typeof dh,
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
      params: [{ ...data1.state, __queryParams: {} }],
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

  mockWidgetWrapper = {
    widget: null,
    error: new Error('Test error'),
    api: null,
  };
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

/**
 * Helper to create a rendered widget with a listener ready to receive events.
 * Returns the listener, sendMessage mock, and unmount function.
 */
async function setupWidgetWithListener() {
  const widget = makeWidgetDescriptor();
  const cleanup = jest.fn();
  const mockAddEventListener = jest.fn(
    (() => cleanup) as dh.Widget['addEventListener']
  );
  const mockSendMessage = jest.fn();
  const initialData = { state: { test: 'value' } };
  mockWidgetWrapper = {
    widget: makeWidget({
      addEventListener: mockAddEventListener,
      getDataAsString: jest.fn(() => ''),
      sendMessage: mockSendMessage,
    }),
    error: null,
    api: jest.fn() as unknown as typeof dh,
  };

  const { unmount } = render(
    makeWidgetHandler({ widgetDescriptor: widget, initialData })
  );

  const listener = mockAddEventListener.mock.calls[0][1];

  // Respond to initial setState so the jsonClient is ready
  await act(async () => {
    listener(makeWidgetEventJsonRpcResponse(1));
  });

  // Clear mocks so we can assert on subsequent calls
  mockSendMessage.mockClear();

  return { listener, mockSendMessage, unmount };
}

describe('URL state in sendSetState', () => {
  it('includes __queryParams from window.location.search', async () => {
    // Set up URL with query params
    const url = new URL('http://localhost/test?foo=bar&baz=qux');
    Object.defineProperty(window, 'location', {
      value: url,
      writable: true,
    });

    const widget = makeWidgetDescriptor();
    const mockSendMessage = jest.fn();
    const initialData = { state: { key: 'val' } };
    mockWidgetWrapper = {
      widget: makeWidget({
        addEventListener: jest.fn(() => jest.fn()),
        getDataAsString: jest.fn(() => ''),
        sendMessage: mockSendMessage,
      }),
      error: null,
      api: jest.fn() as unknown as typeof dh,
    };

    const { unmount } = render(
      makeWidgetHandler({ widgetDescriptor: widget, initialData })
    );

    expect(mockSendMessage).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'setState',
        params: [
          {
            key: 'val',
            __queryParams: { foo: ['bar'], baz: ['qux'] },
          },
        ],
      }),
      []
    );

    unmount();

    // Reset location
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/'),
      writable: true,
    });
  });

  it('includes multi-value query params', async () => {
    const url = new URL('http://localhost/test?tag=python&tag=java');
    Object.defineProperty(window, 'location', {
      value: url,
      writable: true,
    });

    const widget = makeWidgetDescriptor();
    const mockSendMessage = jest.fn();
    mockWidgetWrapper = {
      widget: makeWidget({
        addEventListener: jest.fn(() => jest.fn()),
        getDataAsString: jest.fn(() => ''),
        sendMessage: mockSendMessage,
      }),
      error: null,
      api: jest.fn() as unknown as typeof dh,
    };

    const { unmount } = render(
      makeWidgetHandler({ widgetDescriptor: widget, initialData: undefined })
    );

    expect(mockSendMessage).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'setState',
        params: [{ __queryParams: { tag: ['python', 'java'] } }],
      }),
      []
    );

    unmount();

    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/'),
      writable: true,
    });
  });
});

describe('navigate event handling', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/app/widget/local/dashboard'),
      writable: true,
    });
    jest.spyOn(window.history, 'replaceState').mockImplementation(jest.fn());
    jest.spyOn(window.history, 'pushState').mockImplementation(jest.fn());
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    jest.restoreAllMocks();
  });

  it('uses replaceState by default', async () => {
    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          queryParams: 'page=1',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();

    unmount();
  });

  it('uses pushState when replace=false', async () => {
    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          queryParams: 'page=1',
          replace: false,
        })
      );
    });

    expect(window.history.pushState).toHaveBeenCalled();
    expect(window.history.replaceState).not.toHaveBeenCalled();

    unmount();
  });

  it('navigates with query params as string', async () => {
    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          queryParams: 'page=2&sort=name',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard?page=2&sort=name'
    );

    unmount();
  });

  it('navigates with query params as string with ? prefix', async () => {
    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          queryParams: '?foo=bar&baz=qux',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard?foo=bar&baz=qux'
    );

    unmount();
  });

  it('clears query params when empty string', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/app?existing=param'),
      writable: true,
    });

    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          queryParams: '',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/app');

    unmount();
  });

  it('re-sends state to backend after navigation', async () => {
    const { listener, mockSendMessage, unmount } =
      await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          queryParams: 'page=2',
        })
      );
    });

    // setUrlState should have been called to sync URL state back to Python
    expect(mockSendMessage).toHaveBeenCalled();
    const calls = mockSendMessage.mock.calls.map((c: unknown[]) =>
      JSON.parse(c[0] as string)
    );
    const urlStateCall = calls.find(
      (c: { method: string }) => c.method === 'setUrlState'
    );
    expect(urlStateCall).toBeDefined();
    expect(urlStateCall.params[0]).toHaveProperty('__queryParams');

    unmount();
  });

  it('handles multi-value query params in object form', async () => {
    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          queryParams: 'tag=python&tag=java',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard?tag=python&tag=java'
    );

    unmount();
  });
});

describe('popstate listener', () => {
  it('re-sends state on popstate event', async () => {
    const { mockSendMessage, unmount } = await setupWidgetWithListener();

    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // setUrlState should have been called
    expect(mockSendMessage).toHaveBeenCalled();
    const calls = mockSendMessage.mock.calls.map((c: unknown[]) =>
      JSON.parse(c[0] as string)
    );
    const urlStateCall = calls.find(
      (c: { method: string }) => c.method === 'setUrlState'
    );
    expect(urlStateCall).toBeDefined();
    expect(urlStateCall.params[0]).toHaveProperty('__queryParams');

    unmount();
  });

  it('cleans up popstate listener on unmount', async () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = await setupWidgetWithListener();
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
