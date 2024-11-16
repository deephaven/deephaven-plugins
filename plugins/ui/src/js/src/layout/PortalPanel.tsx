import React, { useEffect, useRef, useState } from 'react';
import { DashboardPanelProps } from '@deephaven/dashboard';
import { Panel } from '@deephaven/dashboard-core-plugins';
import { LoadingOverlay } from '@deephaven/components';
import { emitPortalClosed, emitPortalOpened } from './PortalPanelEvent';

/**
 * Adds and tracks a panel to the GoldenLayout.
 * Takes an HTMLElement that can be used as a Portal in another component.
 */
function PortalPanel({
  glContainer,
  glEventHub,
}: DashboardPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [contentHasMounted, setContentHasMounted] = useState(false);

  useEffect(() => {
    const { current } = ref;
    if (current == null) {
      return;
    }

    // When the page loads, this component loads from golden-layout, but the content
    // does not load until the components are rendered on the server.
    // Show a loading overlay until the content is mounted to handle its own loading state
    const mutationObserver = new MutationObserver((mutationList, observer) => {
      mutationList.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          setContentHasMounted(true);
          observer.disconnect();
        }
      });
    });
    mutationObserver.observe(current, { childList: true });

    emitPortalOpened(glEventHub, { container: glContainer, element: current });

    return () => {
      mutationObserver.disconnect();
      emitPortalClosed(glEventHub, { container: glContainer });
    };
  }, [glContainer, glEventHub]);

  return (
    <Panel glContainer={glContainer} glEventHub={glEventHub}>
      <div className="ui-portal-panel" ref={ref}>
        {!contentHasMounted ? <LoadingOverlay /> : null}
      </div>
    </Panel>
  );
}

PortalPanel.displayName = '@deephaven/js-plugin-ui/PortalPanel';

export default PortalPanel;
