import React from 'react';
import { act, render } from '@testing-library/react';
import type { Widget } from '@deephaven/jsapi-types';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';
import { DocumentHandlerProps } from './DocumentHandler';
import {
  makeDocumentUpdatedJsonRpcString,
  makeWidget,
  makeWidgetDescriptor,
  makeWidgetWrapper,
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
  let fetchResolve: (value: Widget | PromiseLike<Widget>) => void;
  const fetchPromise = new Promise<Widget>(resolve => {
    fetchResolve = resolve;
  });
  const fetch = jest.fn(() => fetchPromise);
  const widget = makeWidgetDescriptor();
  const cleanup = jest.fn();
  const mockAddEventListener = jest.fn(() => cleanup);
  const initialDocument = { foo: 'bar' };
  const widgetObject = makeWidget({
    addEventListener: mockAddEventListener,
    getDataAsString: jest.fn(() =>
      makeDocumentUpdatedJsonRpcString(initialDocument)
    ),
  });
  const wrapper = makeWidgetWrapper({ widget, fetch });
  const { unmount } = render(makeWidgetHandler({ widget: wrapper }));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(mockAddEventListener).not.toHaveBeenCalled();
  expect(mockDocumentHandler).not.toHaveBeenCalled();
  await act(async () => {
    fetchResolve!(widgetObject);
    await fetchPromise;
  });

  expect(mockAddEventListener).toHaveBeenCalledTimes(1);
  expect(mockDocumentHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      widget,
      children: initialDocument,
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
      widget,
      children: updatedDocument,
    })
  );

  expect(cleanup).not.toHaveBeenCalled();
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
