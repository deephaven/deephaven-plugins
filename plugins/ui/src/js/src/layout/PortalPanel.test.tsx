import React from 'react';
import { act, render } from '@testing-library/react';
import { type WidgetDescriptor } from '@deephaven/dashboard';
import PortalPanel from './PortalPanel';
import { emitDocumentRendered } from './PortalPanelEvent';
import { getWidgetId } from './usePanelManager';

// Render CorePanel as a passthrough so the test focuses on PortalPanel's own logic.
jest.mock('@deephaven/dashboard-core-plugins', () => ({
  CorePanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const descriptor: WidgetDescriptor = {
  id: 'widget-id',
  name: 'widget-name',
  type: 'widget-type',
};
const widgetId = getWidgetId(descriptor);

/** Minimal synchronous event hub supporting on/off/emit. */
function makeEventHub() {
  const listeners = new Map<string, Set<(p: unknown) => void>>();
  return {
    on: jest.fn((event: string, handler: (p: unknown) => void) => {
      const set = listeners.get(event) ?? new Set();
      set.add(handler);
      listeners.set(event, set);
    }),
    off: jest.fn((event: string, handler: (p: unknown) => void) => {
      listeners.get(event)?.delete(handler);
    }),
    emit: jest.fn((event: string, payload: unknown) => {
      listeners.get(event)?.forEach(handler => handler(payload));
    }),
  };
}

function makeGlContainer(panelId = 'panel-id') {
  return {
    _config: { id: panelId },
    parent: { remove: jest.fn() },
  };
}

function renderPortalPanel(
  glContainer: ReturnType<typeof makeGlContainer>,
  glEventHub: ReturnType<typeof makeEventHub>,
  metadata: WidgetDescriptor | undefined = descriptor
) {
  return render(
    <PortalPanel
      localDashboardId="test-dashboard-id"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      glContainer={glContainer as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      glEventHub={glEventHub as any}
      metadata={metadata}
    />
  );
}

it('removes itself when its document renders without it', () => {
  const glContainer = makeGlContainer('orphan');
  const glEventHub = makeEventHub();
  renderPortalPanel(glContainer, glEventHub);

  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emitDocumentRendered(glEventHub as any, { widgetId, panelIds: ['alive'] });
  });

  expect(glContainer.parent.remove).toHaveBeenCalledTimes(1);
});

it('keeps itself when its panel is open, even before content is portaled in', () => {
  const glContainer = makeGlContainer('alive');
  const glEventHub = makeEventHub();
  const { container } = renderPortalPanel(glContainer, glEventHub);

  expect(container.querySelector('.ui-portal-panel')).toBeEmptyDOMElement();

  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emitDocumentRendered(glEventHub as any, { widgetId, panelIds: ['alive'] });
  });

  expect(glContainer.parent.remove).not.toHaveBeenCalled();
});

it('ignores document-rendered events from a different document', () => {
  const glContainer = makeGlContainer('orphan');
  const glEventHub = makeEventHub();
  renderPortalPanel(glContainer, glEventHub);

  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emitDocumentRendered(glEventHub as any, {
      widgetId: 'some-other-widget',
      panelIds: [],
    });
  });

  expect(glContainer.parent.remove).not.toHaveBeenCalled();
});
