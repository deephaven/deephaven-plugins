import { createContext, useContext } from 'react';

export type ReactPanelManager = {
  /**
   * Metadata to pass to all the panels.
   * Updating the metadata will cause the panel to be re-opened, or replaced if it is closed.
   * Can also be used for rehydration.
   */
  metadata: Record<string, unknown>;

  /** Triggered when a panel is opened */
  onOpen: (panelId: string) => void;

  /** Triggered when a panel is closed */
  onClose: (panelId: string) => void;
};

export const ReactPanelManagerContext = createContext<ReactPanelManager>({
  metadata: { name: '', type: '' },
  onOpen: () => undefined,
  onClose: () => undefined,
});

export function useReactPanelManager(): ReactPanelManager {
  return useContext(ReactPanelManagerContext);
}
