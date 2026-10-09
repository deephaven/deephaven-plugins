import { type PanelProps } from '@deephaven/dashboard';
import { type UriVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { createContext, useCallback, useMemo, useState } from 'react';
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

  /**
   * Triggered when a panel is opened
   * @param panelId The panelId of the opened panel
   * @param panelKey The serialized key path of the panel, if it has one
   * @returns False if another open panel has the same key, so this panel needs a new id
   */
  onOpen: (panelId: string, panelKey?: string) => boolean;

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
   * Get a unique panelId from the panel manager. This should be used to identify the panel in the layout.
   * @param panelKey The serialized key path of the panel. A keyed panel gets the same id on every load.
   */
  getPanelId: (panelKey?: string) => string;

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

  /**
   * Must be called when the panel is opened, before it's added to the layout
   * @returns False if another open panel has the same key. The panel re-renders with a new id and should open then.
   */
  onOpen: () => boolean;

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
 * Otherwise panelIds will be generated/rehydrated incorrectly.
 * @param panelKey The serialized key path of the panel, if it has one
 */
export function useReactPanel(panelKey?: string): ReactPanelControl {
  const {
    metadata,
    onClose,
    onOpen,
    onDataChange,
    getPanelId,
    getInitialData,
    isPanelOpen,
  } = useReactPanelManager();
  const assignedId = useMemo(
    () => getPanelId(panelKey),
    [getPanelId, panelKey]
  );
  // Replaces `assignedId` when another open panel already has the same key
  const [duplicateId, setDuplicateId] = useState<{
    assignedId: string;
    panelId: string;
  }>();
  const panelId =
    duplicateId?.assignedId === assignedId ? duplicateId.panelId : assignedId;

  return {
    metadata,
    onClose: useCallback(() => onClose(panelId), [onClose, panelId]),
    isOpen: useCallback(() => isPanelOpen(panelId), [isPanelOpen, panelId]),
    onOpen: useCallback(() => {
      const isOpened = onOpen(panelId, panelKey);
      if (!isOpened) {
        setDuplicateId({ assignedId, panelId: nanoid() });
      }
      return isOpened;
    }, [assignedId, onOpen, panelId, panelKey]),
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
