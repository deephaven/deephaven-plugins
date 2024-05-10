import { useContext } from 'react';
import { ReactPanelContentOverlayContext } from './ReactPanelContentOverlayContext';

/**
 * Gets the overlay content from the nearest panel context.
 * @returns The overlay content or null if not in a panel
 */
export function usePanelContentOverlay(): React.ReactNode | null {
  return useContext(ReactPanelContentOverlayContext);
}

export default usePanelContentOverlay;
