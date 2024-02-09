import { createContext, useContext } from 'react';

/**
 * Context that holds the ID of the panel that we are currently in.
 */
export const ReactPanelContext = createContext<string | null>(null);

/**
 * Gets the panel ID from the nearest panel context.
 * @returns The panel ID or null if not in a panel
 */
export function usePanelId() {
  return useContext(ReactPanelContext);
}
