import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { type useWidget } from '@deephaven/jsapi-bootstrap';
import { type dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { type PluginModuleMap, PluginsContext } from '@deephaven/plugin';
import { type Operation } from 'fast-json-patch';
import WidgetHandler, { type WidgetHandlerProps } from './WidgetHandler';
import { type DocumentHandlerProps } from './DocumentHandler';
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

  // Verify setState was called with component state and appState
  expect(mockSendMessage).toHaveBeenCalledTimes(1);
  const setStatePayload = JSON.parse(
    mockSendMessage.mock.calls[0][0] as string
  );
  expect(setStatePayload.method).toBe('setState');
  expect(setStatePayload.params[0]).toMatchObject({
    ...initialData.state,
  });
  expect(setStatePayload.params[1]).toHaveProperty('url');
  expect(typeof setStatePayload.params[1].url).toBe('string');

  const listener = mockAddEventListener.mock.calls[0][1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call
    listener(makeWidgetEventJsonRpcResponse(0));
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
  // Verify setState was called with component state and appState
  const setStatePayload1 = JSON.parse(sendMessage.mock.calls[0][0] as string);
  expect(setStatePayload1.method).toBe('setState');
  expect(setStatePayload1.params[0]).toMatchObject({
    ...data1.state,
  });
  expect(setStatePayload1.params[1]).toHaveProperty('url');

  let listener = addEventListener.mock.calls[0][1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call
    listener(makeWidgetEventJsonRpcResponse(0));

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

  const setStatePayload2 = JSON.parse(sendMessage.mock.calls[0][0] as string);
  expect(setStatePayload2.method).toBe('setState');
  expect(setStatePayload2.params[0]).toMatchObject({
    ...data2.state,
  });
  expect(setStatePayload2.params[1]).toHaveProperty('url');
  expect(sendMessage).toHaveBeenCalledTimes(1);

  // Send the initial document
  await act(async () => {
    // Respond to the setState call
    listener(makeWidgetEventJsonRpcResponse(0));

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
  const setStatePayloadErr = JSON.parse(sendMessage.mock.calls[0][0] as string);
  expect(setStatePayloadErr.method).toBe('setState');
  expect(setStatePayloadErr.params[0]).toMatchObject({
    ...data1.state,
  });
  expect(setStatePayloadErr.params[1]).toHaveProperty('url');

  const listener = mockAddEventListener.mock.calls[0][1];

  // Send the initial document
  await act(async () => {
    // Respond to the setState call
    listener(makeWidgetEventJsonRpcResponse(0));

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
    listener(makeWidgetEventJsonRpcResponse(0));
  });

  // Clear mocks so we can assert on subsequent calls
  mockSendMessage.mockClear();

  return { listener, mockSendMessage, unmount };
}

describe('URL state sent separately', () => {
  it('sends setState with appState containing URL, and setUrlState on navigation', async () => {
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

    // Only setState is called on init, with appState as second arg
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    const statePayload = JSON.parse(mockSendMessage.mock.calls[0][0] as string);
    expect(statePayload.method).toBe('setState');
    expect(statePayload.params[0]).toMatchObject({ key: 'val' });
    expect(statePayload.params[0]).not.toHaveProperty('__url');
    expect(statePayload.params[1]).toEqual({
      url: 'http://localhost/test?foo=bar&baz=qux',
    });

    unmount();

    // Reset location
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
    expect(typeof urlStateCall.params[0]).toBe('string');

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

  it('navigates with path', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL(
        'http://localhost/app/widget/local/dashboard/-/old-page?q=1#sec'
      ),
      writable: true,
    });

    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          path: '/new-page',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/new-page'
    );

    unmount();
  });

  it('navigates with fragment', async () => {
    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          fragment: 'section-2',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard#section-2'
    );

    unmount();
  });

  it('clears fragment when empty string', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/app/widget/local/dashboard#old-frag'),
      writable: true,
    });

    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          fragment: '',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard'
    );

    unmount();
  });

  it('navigates with path, query params, and fragment', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/app/widget/local/dashboard/-/old'),
      writable: true,
    });

    const { listener, unmount } = await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          path: '/settings',
          queryParams: '?tab=1',
          fragment: 'top',
        })
      );
    });

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/app/widget/local/dashboard/-/settings?tab=1#top'
    );

    unmount();
  });

  it('sends URL state after navigation', async () => {
    const { listener, mockSendMessage, unmount } =
      await setupWidgetWithListener();

    await act(async () => {
      listener(
        makeWidgetEventMethodEvent('navigate.event', {
          path: '/page',
          queryParams: 'x=1',
          fragment: 'sec',
        })
      );
    });

    const calls = mockSendMessage.mock.calls.map((c: unknown[]) =>
      JSON.parse(c[0] as string)
    );
    const urlStateCall = calls.find(
      (c: { method: string }) => c.method === 'setUrlState'
    );
    expect(urlStateCall).toBeDefined();
    expect(typeof urlStateCall.params[0]).toBe('string');

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
    const calls2 = mockSendMessage.mock.calls.map((c: unknown[]) =>
      JSON.parse(c[0] as string)
    );
    const urlStateCall2 = calls2.find(
      (c: { method: string }) => c.method === 'setUrlState'
    );
    expect(urlStateCall2).toBeDefined();
    expect(typeof urlStateCall2.params[0]).toBe('string');

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
