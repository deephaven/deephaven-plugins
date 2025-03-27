import { createContext, useContext } from 'react';

type PanelContextType = {
  panelId: string;
  addPanelState: (state: unknown) => void;
  trigger: () => void;
  isTracking: boolean;
  getInitialState: () => unknown;
};

/**
 * Context that holds the ID of the panel that we are currently in.
 */
export const ReactPanelContext = createContext<PanelContextType | null>(null);

/**
 * Gets the panel ID from the nearest panel context.
 * @returns The panel ID or null if not in a panel
 */
export function usePanelId(): string | null {
  return useContext(ReactPanelContext)?.panelId ?? null;
}
