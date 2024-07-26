import { PanelProps } from '@deephaven/dashboard';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { createContext, useCallback, useMemo } from 'react';

export type ReactPanelId = string;

/**
 * Manager for panels within a widget. This is used to manage the lifecycle of panels within a widget.
 */
export interface ReactPanelManager {
  /**
   * Metadata stored with the panel. Typically a descriptor of the widget opening the panel and used for hydration.
   * Updating the metadata will cause the panel to be re-opened, or replaced if it is closed.
   * Can also be used for rehydration.
   */
  metadata: PanelProps['metadata'];

  /**
   * Triggered when a panel is opened
   * @param panelId The panelId of the panel that was opened
   */
  onOpen: (panelId: ReactPanelId) => void;

  /**
   * Triggered when a panel is closed
   * @param panelId The panelId of the panel that was closed
   */
  onClose: (panelId: ReactPanelId) => void;

  /**
   * Get a unique panelId from the panel manager. This should be used to identify the panel in the layout.
   * This should be called once per panel when it is mounted
   * @returns A unique panelId
   */
  getPanelId: () => ReactPanelId;
}

/** Interface for using a react panel */
export interface ReactPanelControl {
  /**
   * Metadata stored with the panel. Typically a descriptor of the widget opening the panel and used for hydration.
   * Updating the metadata will cause the panel to be re-opened, or replaced if it is closed.
   * Can also be used for rehydration.
   */
  metadata: PanelProps['metadata'];

  /** Must be called when the panel is opened */
  onOpen: () => void;

  /** Must be called when the panel is closed */
  onClose: () => void;

  /** The panelId for this react panel */
  panelId: string;
}

export const ReactPanelManagerContext = createContext<ReactPanelManager | null>(
  null
);

export function useReactPanelManager(): ReactPanelManager {
  return useContextOrThrow(
    ReactPanelManagerContext,
    'No ReactPanelManager found, did you wrap in a ReactPanelManagerProvider.Context?'
  );
}

/**
 * Use the controls for a single react panel.
 */
export function useReactPanel(): ReactPanelControl {
  const { metadata, onClose, onOpen, getPanelId } = useReactPanelManager();
  const panelId = useMemo(() => getPanelId(), [getPanelId]);

  return {
    metadata,
    onClose: useCallback(() => onClose(panelId), [onClose, panelId]),
    onOpen: useCallback(() => onOpen(panelId), [onOpen, panelId]),
    panelId,
  };
}
