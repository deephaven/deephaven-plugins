import React from 'react';
import { usePanelContentOverlay } from './usePanelContentOverlay';

/** A panel that uses the ReactPanelContentOverlayContext and if that content is set, renders it in a view with a partially transparent background */
export function ReactPanelContentOverlay(): JSX.Element | null {
  const overlayContent = usePanelContentOverlay();
  return overlayContent != null ? (
    <div className="dh-react-panel-overlay">{overlayContent}</div>
  ) : null;
}

export default ReactPanelContentOverlay;
