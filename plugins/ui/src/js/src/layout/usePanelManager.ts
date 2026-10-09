import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { nanoid } from 'nanoid';
import {
  LayoutManagerContext,
  LayoutUtils,
  type WidgetDescriptor,
} from '@deephaven/dashboard';
import { type UriVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { EMPTY_ARRAY, EMPTY_FUNCTION } from '@deephaven/utils';
import { type ReactPanelManager } from './ReactPanelManager';
import { useWidgetStatus } from './useWidgetStatus';
import {
  type ReadonlyWidgetData,
  type WidgetData,
  type WidgetDataUpdate,
} from '../widget/WidgetTypes';

const log = Log.module('@deephaven/js-plugin-ui/usePanelManager');

const EMPTY_OBJECT = Object.freeze({});

export interface UsePanelManagerProps {
  /** Definition of the widget used to create this document. Used for titling panels if necessary. */
  widget: WidgetDescriptor | UriVariableDescriptor;

  /**
   * Data state to use when loading the widget.
   * When the data state is updated, the new state is emitted via the `onDataChange` callback.
   */
  initialData?: ReadonlyWidgetData;

  /** Triggered when the data in the document changes */
  onDataChange?: (data: WidgetDataUpdate) => void;

  /** Triggered when all panels opened from this document have closed */
  onClose?: () => void;
}

/**
 * Hook to create a ReactPanelManager for managing panels within a document.
 * Handles panel lifecycle (open/close), data persistence, and panel ID generation.
 *
 * @param props - Configuration for the panel manager
 * @returns A ReactPanelManager instance for use with ReactPanelManagerContext
 */
export function usePanelManager({
  widget,
  initialData = EMPTY_OBJECT,
  onDataChange = EMPTY_FUNCTION,
  onClose,
}: UsePanelManagerProps): ReactPanelManager {
  const panelIdIndex = useRef(0);

  // Using `useState` here to initialize the data only once.
  // We don't want to use `useMemo`, because we only want it to be initialized once with the `initialData` (uncontrolled)
  // We don't want to use `useRef`, because we only want to run `structuredClone` once, and you can't pass an
  // initialization function into `useRef` like you can with `useState`
  const [widgetData] = useState<WidgetData>(() => structuredClone(initialData));

  // Panel id for each key path. Starts from the saved map and remembers ids given to new keys this session.
  const [keyIds] = useState(
    () => new Map(Object.entries(widgetData.panelKeyMap ?? {}))
  );

  // Without any saved keys, keyed panels take positional ids so adding keys to a script doesn't move anything
  const [hasSavedKeys] = useState(() => keyIds.size > 0);

  // Saved ids handed out by position. Excludes keyed ids so an unkeyed panel can't take a keyed panel's slot.
  const [positionalIds] = useState(() => {
    const keyedIds = new Set(keyIds.values());
    return (widgetData.panelIds ?? []).filter(id => !keyedIds.has(id));
  });

  // Key path of each open keyed panel, by panel id
  const openPanelKeys = useRef(new Map<string, string>());

  // Accumulates the latest state for every panel. `widgetData` only holds the
  // initial data (used for rehydration lookups) and is never updated, so we
  // cannot merge into it - doing so would make each panel's update drop the
  // other panels' updates, and only the most recently updated panel would be
  // persisted.
  const panelStatesRef = useRef<Record<string, unknown[]>>({
    ...widgetData.panelStates,
  });

  // panelIds that are currently opened within this document. This list is tracked by the `onOpen`/`onClose` call on the `ReactPanelManager` from a child component.
  // Note that the initial widget data provided will be the `panelIds` for this document to use; this array is what is actually opened currently.
  const panelIds = useRef<string[]>([]);

  // Flag to signal the panel counts have changed in the last render
  // We may need to check if we need to close this widget if all panels are closed
  const [isPanelsDirty, setPanelsDirty] = useState(false);

  // Not every document renders inside a layout (e.g. an inline UIComponent)
  const layoutManager = useContext(LayoutManagerContext);
  // Before the document is ready, open panels may be rehydration placeholders for every saved id
  const isDocumentReady = useWidgetStatus().status === 'ready';
  // Changes `getPanelId` once, so every placeholder still mounted gets its id from the document
  const hasBeenReadyRef = useRef(false);
  if (isDocumentReady) {
    hasBeenReadyRef.current = true;
  }
  const hasBeenReady = hasBeenReadyRef.current;
  const placeholderIdIndex = useRef(0);
  const hasRemovedOrphans = useRef(false);

  const id = useMemo(
    () =>
      typeof widget === 'string'
        ? widget
        : `${widget.id}-${widget.name}-${widget.type}`,
    [widget]
  );

  const handleOpen = useCallback(
    (panelId: string, panelKey?: string) => {
      if (panelIds.current.includes(panelId)) {
        if (panelKey == null) {
          throw new Error('Duplicate panel opens received');
        }
        log.warn(
          'Widget',
          id,
          'has more than one panel with key',
          panelKey,
          '- opening it as a new panel'
        );
        return false;
      }

      panelIds.current.push(panelId);
      if (panelKey != null && keyIds.get(panelKey) === panelId) {
        openPanelKeys.current.set(panelId, panelKey);
      }
      log.debug('Panel opened, open count', panelIds.current.length);

      setPanelsDirty(true);
      return true;
    },
    [id, keyIds, panelIds]
  );

  const handleClose = useCallback(
    (panelId: string) => {
      const panelIndex = panelIds.current.indexOf(panelId);
      if (panelIndex === -1) {
        throw new Error('Panel close received for unknown panel');
      }

      panelIds.current.splice(panelIndex, 1);
      openPanelKeys.current.delete(panelId);
      log.debug('Panel closed, open count', panelIds.current.length);

      setPanelsDirty(true);
    },
    [panelIds]
  );

  const handleDataChange = useCallback(
    (panelId: string, panelData: unknown[]) => {
      panelStatesRef.current = {
        ...panelStatesRef.current,
        [panelId]: panelData,
      };
      onDataChange({
        panelStates: { ...panelStatesRef.current },
      });
    },
    [onDataChange]
  );

  /**
   * On the first sync once the document is ready, every panel it renders has opened, so
   * any other saved panel is from a layout that had more panels than the document now has.
   * Remove it and its state, and stop handing out its id so a later panel can't inherit it.
   */
  const removeOrphanedPanels = useCallback(() => {
    const savedIds = widgetData.panelIds ?? [];
    panelIdIndex.current = Math.max(panelIdIndex.current, positionalIds.length);
    const openIds = new Set(panelIds.current);
    panelStatesRef.current = Object.fromEntries(
      Object.entries(panelStatesRef.current).filter(([panelId]) =>
        openIds.has(panelId)
      )
    );
    if (layoutManager == null) {
      return;
    }
    savedIds
      .filter(savedId => !openIds.has(savedId))
      .forEach(orphanId => {
        const config = { id: orphanId };
        const stack = LayoutUtils.getStackForConfig(layoutManager.root, config);
        log.debug('Removing orphaned panel', orphanId);
        // `remove` rather than `close`, since panels in a nested dashboard aren't closable
        LayoutUtils.getContentItemInStack(stack, config)?.remove();
      });
  }, [layoutManager, positionalIds, widgetData]);

  /**
   * When there are changes made to panels in a render cycle, check if they've all been closed and fire an `onClose` event if they are.
   * Otherwise, fire an `onDataChange` event with the updated panelIds that are open.
   */
  useEffect(
    function syncOpenPanels() {
      if (!isPanelsDirty) {
        return;
      }

      setPanelsDirty(false);

      // Check if all the panels in this widget are closed
      // We do it outside of the `handleClose` function in case a new panel opens up in the same render cycle
      log.debug2('Widget', id, 'open panel count', panelIds.current.length);
      if (panelIds.current.length === 0) {
        log.debug('Widget', id, 'closed all panels, triggering onClose');
        onClose?.();
      } else {
        if (!hasRemovedOrphans.current && isDocumentReady) {
          hasRemovedOrphans.current = true;
          removeOrphanedPanels();
        }
        const panelKeyMap = Object.fromEntries(
          [...openPanelKeys.current].map(([panelId, panelKey]) => [
            panelKey,
            panelId,
          ])
        );
        onDataChange({
          ...widgetData,
          panelStates: { ...panelStatesRef.current },
          panelIds: [...panelIds.current],
          panelKeyMap:
            Object.keys(panelKeyMap).length > 0 ? panelKeyMap : undefined,
        });
      }
    },
    [
      isPanelsDirty,
      id,
      isDocumentReady,
      onClose,
      onDataChange,
      removeOrphanedPanels,
      widgetData,
    ]
  );

  const getPositionalId = useCallback(() => {
    // Note that if the order of unkeyed panels changes, they appear in each other's place in the layout.
    const panelId = positionalIds[panelIdIndex.current];
    panelIdIndex.current += 1;
    return panelId;
  }, [positionalIds]);

  const getPanelId = useCallback(
    (panelKey?: string) => {
      if (panelKey == null) {
        if (!hasBeenReady) {
          // Placeholders are unkeyed and hold every saved id in order, keyed ones included
          const placeholderId =
            widgetData.panelIds?.[placeholderIdIndex.current] ?? nanoid();
          if (
            placeholderIdIndex.current >= (widgetData.panelIds ?? []).length
          ) {
            // Lets the document's first unkeyed panel keep a new widget's loading placeholder
            positionalIds.push(placeholderId);
          }
          placeholderIdIndex.current += 1;
          return placeholderId;
        }
        return getPositionalId() ?? nanoid();
      }

      // Same id every time, so a repeated or discarded render can't change it. Duplicates are found on open.
      let panelId = keyIds.get(panelKey);
      if (panelId == null) {
        panelId = (hasSavedKeys ? undefined : getPositionalId()) ?? nanoid();
        keyIds.set(panelKey, panelId);
      }
      return panelId;
    },
    [
      getPositionalId,
      hasBeenReady,
      hasSavedKeys,
      keyIds,
      positionalIds,
      widgetData,
    ]
  );

  // The latest state, so a panel that remounts, e.g. when it moves, keeps it
  const getInitialData = useCallback(
    (panelId: string) =>
      panelStatesRef.current[panelId] ?? (EMPTY_ARRAY as unknown as unknown[]),
    []
  );

  const isPanelOpen = useCallback(
    (panelId: string) => panelIds.current.includes(panelId),
    []
  );

  const panelManager = useMemo(
    () => ({
      metadata: widget,
      onOpen: handleOpen,
      onClose: handleClose,
      onDataChange: handleDataChange,
      getPanelId,
      getInitialData,
      isPanelOpen,
    }),
    [
      widget,
      getPanelId,
      handleClose,
      handleOpen,
      handleDataChange,
      getInitialData,
      isPanelOpen,
    ]
  );

  return panelManager;
}

export default usePanelManager;
