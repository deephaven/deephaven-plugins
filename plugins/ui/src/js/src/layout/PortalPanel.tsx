import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  type DashboardPanelProps,
  type WidgetDescriptor,
} from '@deephaven/dashboard';
import { CorePanel } from '@deephaven/dashboard-core-plugins';
import Log from '@deephaven/log';
import {
  type DocumentRenderedPayload,
  emitPortalClosed,
  emitPortalOpened,
  useDocumentRenderedListener,
} from './PortalPanelEvent';
import { getWidgetId } from './usePanelManager';
import PortalPanelTooltip from './PortalPanelTooltip';

const log = Log.module('@deephaven/js-plugin-ui/PortalPanel');

/**
 * Adds and tracks a panel to the GoldenLayout.
 * Takes an HTMLElement that can be used as a Portal in another component.
 */
function PortalPanel({
  glContainer,
  glEventHub,
  metadata,
}: DashboardPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { current } = ref;
    if (current == null) {
      return;
    }
    emitPortalOpened(glEventHub, { container: glContainer, element: current });

    return () => {
      emitPortalClosed(glEventHub, { container: glContainer });
    };
  }, [glContainer, glEventHub]);

  const widgetId = useMemo(
    () => (metadata != null ? getWidgetId(metadata as WidgetDescriptor) : null),
    [metadata]
  );

  const handleDocumentRendered = useCallback(
    ({ widgetId: renderedWidgetId }: DocumentRenderedPayload) => {
      // Only react to our own document, since panels from other documents may
      // share this event hub (e.g. a top-level dashboard).
      if (renderedWidgetId !== widgetId) {
        return;
      }
      // A claimed panel always has the portaled ReactPanel content as a child. An
      // empty container means the current document has no ReactPanel for this panel
      // (the saved layout had more panels than the document), so remove it instead
      // of leaving a blank panel. `remove` is used rather than `close` because
      // panels nested in a dashboard are not closable.
      if (ref.current?.childElementCount === 0) {
        log.debug('Removing unclaimed portal panel', glContainer);
        glContainer.parent?.remove();
      }
    },
    [glContainer, widgetId]
  );

  useDocumentRenderedListener(glEventHub, handleDocumentRendered);

  return (
    <CorePanel
      glContainer={glContainer}
      glEventHub={glEventHub}
      renderTabTooltip={() => <PortalPanelTooltip metadata={metadata} />}
    >
      <div className="ui-portal-panel" ref={ref} />
    </CorePanel>
  );
}

PortalPanel.displayName = '@deephaven/js-plugin-ui/PortalPanel';

export default PortalPanel;
