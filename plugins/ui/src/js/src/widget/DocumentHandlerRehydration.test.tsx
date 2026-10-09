import React from 'react';
import { TestUtils } from '@deephaven/test-utils';
import { render } from '@testing-library/react';
import DashboardWidgetHandler from './DashboardWidgetHandler';
import DocumentHandler from './DocumentHandler';
import { type WidgetHandlerProps } from './WidgetHandler';
import { getComponentForElement, WIDGET_ELEMENT } from './WidgetUtils';
import { makeWidgetDescriptor } from './WidgetTestUtils';
import { ELEMENT_NAME } from '../elements/model/ElementConstants';
import WidgetStatusContext, {
  type WidgetStatus,
} from '../layout/WidgetStatusContext';
import { type ReadonlyWidgetData } from './WidgetTypes';

const mockPanelEvents: string[] = [];

jest.mock('../layout/ReactPanel', () => {
  const { useEffect, useRef } = jest.requireActual('react');
  const { useReactPanel } = jest.requireActual('../layout/ReactPanelManager');
  const { getPanelKey, usePanelKeyScope } = jest.requireActual(
    '../layout/PanelKeyScopeContext'
  );
  return {
    __esModule: true,
    default: function MockReactPanel({
      title,
      __dhKey,
    }: {
      title?: string;
      __dhKey?: string;
    }) {
      const { panelId, onOpen, onClose } = useReactPanel(
        getPanelKey(usePanelKeyScope(), __dhKey)
      );
      const mountTitle = useRef(title ?? 'placeholder').current;
      useEffect(() => {
        const isOpened: boolean = onOpen();
        if (!isOpened) {
          return undefined;
        }
        mockPanelEvents.push(`open ${mountTitle} ${panelId}`);
        return () => {
          mockPanelEvents.push(`close ${mountTitle} ${panelId}`);
          onClose();
        };
      }, [mountTitle, onClose, onOpen, panelId]);
      return null;
    },
  };
});

jest.mock('../layout/Dashboard', () => ({
  __esModule: true,
  default: function MockDashboard({
    children,
  }: React.PropsWithChildren<object>) {
    return children;
  },
}));

const mockWidgetHandler = jest.fn((props: WidgetHandlerProps) => null);
jest.mock(
  './WidgetHandler',
  () => (props: WidgetHandlerProps) => mockWidgetHandler(props)
);

const widget = makeWidgetDescriptor({ type: WIDGET_ELEMENT });
const unkeyedData: ReadonlyWidgetData = { panelIds: ['saved-a', 'saved-b'] };
const keyedData: ReadonlyWidgetData = {
  panelIds: ['saved-a', 'saved-b'],
  panelKeyMap: {
    [JSON.stringify(['a'])]: 'saved-a',
    [JSON.stringify(['b'])]: 'saved-b',
  },
};

function makePanel(title: string, key?: string): React.ReactNode {
  return getComponentForElement({
    __dhElemName: ELEMENT_NAME.panel,
    props: key == null ? { title } : { title, key },
  });
}

function makeDocument(children: React.ReactNode): React.ReactNode {
  return getComponentForElement({
    __dhElemName: 'test-component',
    props: { children },
  });
}

function makeDashboard(children: React.ReactNode): React.ReactNode {
  return makeDocument(
    getComponentForElement({
      __dhElemName: ELEMENT_NAME.dashboard,
      props: { children },
    })
  );
}

/** The panels DashboardWidgetHandler renders before the document arrives */
function makePlaceholders(initialData: ReadonlyWidgetData): React.ReactNode {
  mockWidgetHandler.mockClear();
  render(
    <DashboardWidgetHandler
      id="test-id"
      widgetDescriptor={widget}
      initialData={initialData}
    />
  );
  return mockWidgetHandler.mock.calls[0][0].renderEmptyDocument?.();
}

function makeHandler(
  initialData: ReadonlyWidgetData,
  status: WidgetStatus['status'],
  children: React.ReactNode
): JSX.Element {
  const widgetStatus = { status, descriptor: widget } as WidgetStatus;
  return (
    <WidgetStatusContext.Provider value={widgetStatus}>
      <DocumentHandler widget={widget} initialData={initialData}>
        {children}
      </DocumentHandler>
    </WidgetStatusContext.Provider>
  );
}

function renderRehydration(
  initialData: ReadonlyWidgetData,
  document: React.ReactNode
): void {
  const { rerender } = render(
    makeHandler(initialData, 'loading', makePlaceholders(initialData))
  );
  expect(mockPanelEvents).toEqual([
    'open placeholder saved-a',
    'open placeholder saved-b',
  ]);

  mockPanelEvents.length = 0;
  rerender(makeHandler(initialData, 'ready', document));
}

beforeEach(() => {
  mockPanelEvents.length = 0;
  // The unkeyed documents trigger React's missing key warning
  TestUtils.disableConsoleOutput('error');
});

describe('unkeyed panels', () => {
  it('reuses the placeholders when the document root is a list of panels', () => {
    renderRehydration(
      unkeyedData,
      makeDocument([makePanel('A'), makePanel('B')])
    );
    expect(mockPanelEvents).toEqual([]);
  });

  it('gives the saved ids to the panels replacing the placeholders when the document root is a dashboard', () => {
    renderRehydration(
      unkeyedData,
      makeDashboard([makePanel('A'), makePanel('B')])
    );
    expect(mockPanelEvents).toEqual([
      'close placeholder saved-a',
      'close placeholder saved-b',
      'open A saved-a',
      'open B saved-b',
    ]);
  });
});

describe('keyed panels', () => {
  it('gives the saved ids to the panels replacing the placeholders when the document root is a list of panels', () => {
    renderRehydration(
      keyedData,
      makeDocument([makePanel('B', 'b'), makePanel('A', 'a')])
    );
    expect(mockPanelEvents).toEqual([
      'close placeholder saved-a',
      'close placeholder saved-b',
      'open B saved-b',
      'open A saved-a',
    ]);
  });

  it('gives a reused placeholder the id of the panel that took it over', () => {
    renderRehydration(
      {
        panelIds: ['saved-a', 'saved-b'],
        panelKeyMap: { [JSON.stringify(['a'])]: 'saved-a' },
      },
      // The unkeyed panel reuses the placeholder holding the keyed panel's id
      makeDocument([makePanel('B'), makePanel('A', 'a')])
    );
    expect([...mockPanelEvents].sort()).toEqual(
      [
        'close placeholder saved-a',
        'close placeholder saved-b',
        'open placeholder saved-b',
        'open A saved-a',
      ].sort()
    );
  });

  it('gives the saved ids to the panels replacing the placeholders when the document root is a dashboard', () => {
    renderRehydration(
      keyedData,
      makeDashboard([
        makePanel('New'),
        makePanel('B', 'b'),
        makePanel('A', 'a'),
      ])
    );
    expect(mockPanelEvents).toEqual([
      'close placeholder saved-a',
      'close placeholder saved-b',
      expect.stringMatching(/^open New (?!saved-)/),
      'open B saved-b',
      'open A saved-a',
    ]);
  });
});
