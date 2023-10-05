import React, { useEffect, useRef } from 'react';
import { DashboardPanelProps } from '@deephaven/dashboard';

export interface PortalPanelProps extends DashboardPanelProps {
  /** The element to render in the panel */
  element: HTMLElement;
}

/**
 * Adds and tracks a panel to the GoldenLayout.
 * Takes an HTMLElement that can be used as a Portal in another component.
 */
function PortalPanel({ element }: PortalPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { current } = ref;
    if (current == null) {
      return;
    }

    console.log('MJB PortalPanel adding element to panel');
    current.appendChild(element);
    return () => {
      console.log('MJB PortalPanel removing element from panel');
      current.removeChild(element);
    };
  }, [element, ref]);
  return <div ref={ref} />;
}

PortalPanel.displayName = '@deephaven/js-plugin-ui/PortalPanel';

export default PortalPanel;
