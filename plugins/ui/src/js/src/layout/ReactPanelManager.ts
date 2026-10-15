import { type PanelProps } from '@deephaven/dashboard';
import { type UriVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { createContext, useCallback, useState } from 'react';
import { nanoid } from 'nanoid';

/**
 * Manager for panels within a widget. This is used to manage the lifecycle of panels within a widget.
 */
export interface ReactPanelManager {
  /**
   * Metadata stored with the panel. Typically a descriptor of the widget opening the panel and used for hydration.
   * Updating the metadata will cause the panel to be re-opened, or replaced if it is closed.
   * Can also be used for rehydration.
   */
  metadata: PanelProps['metadata'] | UriVariableDescriptor;

  /** Triggered when a panel is opened */
  onOpen: (panelId: string) => void;

  /** Triggered when a panel is closed */
  onClose: (panelId: string) => void;

  /**
   * Must be called when client data that should be persisted is changed.
   * @param panelId The panelId for the changed data
   * @param data The data to persist. Must be JSON serializable.
   */
  onDataChange: (panelId: string, data: unknown[]) => void;

  /**
   * Gets the initial persisted data for a panel.
   * @param panelId The panelId for the data to be retrieved.
   * @returns Data that was persisted for the panelId.
   */
  getInitialData: (panelId: string) => unknown[];

  /**
   * Whether a panel with this id is open
   * @param panelId The panelId to check
   */
  isPanelOpen: (panelId: string) => boolean;
}

/** Interface for using a react panel */
export interface ReactPanelControl {
  /**
   * Metadata stored with the panel. Typically a descriptor of the widget opening the panel and used for hydration.
   * Updating the metadata will cause the panel to be re-opened, or replaced if it is closed.
   * Can also be used for rehydration.
   */
  metadata: PanelProps['metadata'] | UriVariableDescriptor;

  /** Must be called when the panel is opened, before it's added to the layout */
  onOpen: () => void;

  /** Must be called when the panel is closed */
  onClose: () => void;

  /** Whether a panel with this panel's id is open, e.g. one that replaced it in the same commit */
  isOpen: () => boolean;

  /**
   * Must be called when client data that should be persisted is changed.
   * @param data The data to persist. Must be JSON serializable.
   */
  onDataChange: (data: unknown[]) => void;

  /**
   * Gets the initial persisted data for a panel.
   * @returns Data that was persisted for the panel.
   */
  getInitialData: () => unknown[];

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
 * DO NOT call this hook anywhere except once in ReactPanel.
 * Use the controls for a single react panel.
 * @param assignedId The id the panel manager gave the panel. A panel outside a managed layout gets a new id.
 */
export function useReactPanel(assignedId?: string): ReactPanelControl {
  const {
    metadata,
    onClose,
    onOpen,
    onDataChange,
    getInitialData,
    isPanelOpen,
  } = useReactPanelManager();
  const [newId] = useState(() => nanoid());
  const panelId = assignedId ?? newId;

  return {
    metadata,
    onClose: useCallback(() => onClose(panelId), [onClose, panelId]),
    isOpen: useCallback(() => isPanelOpen(panelId), [isPanelOpen, panelId]),
    onOpen: useCallback(() => onOpen(panelId), [onOpen, panelId]),
    onDataChange: useCallback(
      (data: unknown[]) => onDataChange(panelId, data),
      [onDataChange, panelId]
    ),
    getInitialData: useCallback(
      () => getInitialData(panelId),
      [getInitialData, panelId]
    ),
    panelId,
  };
}
