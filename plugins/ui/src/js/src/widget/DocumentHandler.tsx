import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import shortid from 'shortid';
import { WidgetDescriptor } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { EMPTY_ARRAY, EMPTY_FUNCTION } from '@deephaven/utils';
import {
  ReactPanelId,
  ReactPanelManagerContext,
} from '../layout/ReactPanelManager';
import { getRootChildren } from './DocumentUtils';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

export type DocumentHandlerProps = React.PropsWithChildren<{
  /** Definition of the widget used to create this document. Used for titling panels if necessary. */
  widget: WidgetDescriptor;

  /**
   * Data state to use when loading the widget.
   * When the data state is updated, the new state is emitted via the `onDataChange` callback.
   */
  initialPanelIds?: readonly ReactPanelId[];

  /** Triggered when the panels that are open change */
  onPanelsChange?: (panelIds: readonly ReactPanelId[]) => void;

  /** Triggered when all panels opened from this document have closed */
  onClose?: () => void;
}>;

/**
 * Handles rendering a document for one widget.
 * The document is a tree of elements. From the root node, the children are either all panels (opening more than one panel),
 * or all non-panels, which will automatically be wrapped in one panel.
 * Responsible for opening any panels or dashboards specified in the document.
 */
function DocumentHandler({
  children,
  widget,
  initialPanelIds: initialPanelIdsProp = EMPTY_ARRAY,
  onPanelsChange = EMPTY_FUNCTION,
  onClose,
}: DocumentHandlerProps): JSX.Element {
  log.debug('Rendering document', widget);
  const panelOpenCountRef = useRef(0);
  const panelIdIndex = useRef(0);

  // Using `useState` here to initialize the data only once.
  // We don't want to use `useMemo`, because we only want it to be initialized once with the `initialData` (uncontrolled)
  // We don't want to use `useRef`, because we only want to run `structuredClone` once, and you can't pass an
  // initialization function into `useRef` like you can with `useState`
  const [initialPanelIds] = useState(() => initialPanelIdsProp);

  // panelIds that are currently opened within this document. This list is tracked by the `onOpen`/`onClose` call on the `ReactPanelManager` from a child component.
  // Note that the initial widget data provided will be the `panelIds` for this document to use; this array is what is actually opened currently.
  const [panelIds] = useState<string[]>([]);

  // Flag to signal the panel counts have changed in the last render
  // We may need to check if we need to close this widget if all panels are closed
  const [isPanelsDirty, setPanelsDirty] = useState(false);

  const handleOpen = useCallback(
    (panelId: string) => {
      if (panelIds.includes(panelId)) {
        throw new Error('Duplicate panel opens received');
      }

      panelOpenCountRef.current += 1;
      log.debug('Panel opened, open count', panelOpenCountRef.current);

      panelIds.push(panelId);

      setPanelsDirty(true);
    },
    [panelIds]
  );

  const handleClose = useCallback(
    (panelId: string) => {
      const panelIndex = panelIds.indexOf(panelId);
      if (panelIndex === -1) {
        throw new Error('Panel close received for unknown panel');
      }
      panelOpenCountRef.current -= 1;
      if (panelOpenCountRef.current < 0) {
        throw new Error('Panel open count is negative');
      }
      log.debug('Panel closed, open count', panelOpenCountRef.current);

      panelIds.splice(panelIndex, 1);

      setPanelsDirty(true);
    },
    [panelIds]
  );

  useEffect(
    function checkOpenPanelCount() {
      if (!isPanelsDirty) {
        return;
      }

      setPanelsDirty(false);

      // Check if all the panels in this widget are closed
      // We do it outside of the `handleClose` function in case a new panel opens up in the same render cycle
      log.debug2(
        'Widget',
        widget.id,
        'open panel count',
        panelOpenCountRef.current
      );
      if (panelOpenCountRef.current === 0) {
        log.debug('Widget', widget.id, 'closed all panels, triggering onClose');
        onClose?.();
      } else {
        onPanelsChange(panelIds);
      }
    },
    [isPanelsDirty, onClose, onPanelsChange, panelIds, widget.id]
  );

  const getPanelId = useCallback(() => {
    // On rehydration, yield known IDs first
    // If there are no more known IDs, generate a new one.
    // This can happen if the document hasn't been opened before, or if it's rehydrated and a new panel is added.
    // Note that if the order of panels changes, the worst case scenario is that panels appear in the wrong location in the layout.
    const panelId = initialPanelIds[panelIdIndex.current] ?? shortid();
    panelIdIndex.current += 1;
    return panelId;
  }, [initialPanelIds]);

  const panelManager = useMemo(
    () => ({
      metadata: widget,
      onOpen: handleOpen,
      onClose: handleClose,
      getPanelId,
    }),
    [widget, getPanelId, handleClose, handleOpen]
  );

  return (
    <ReactPanelManagerContext.Provider value={panelManager}>
      {getRootChildren(children, widget)}
    </ReactPanelManagerContext.Provider>
  );
}

DocumentHandler.displayName = '@deephaven/js-plugin-ui/DocumentHandler';

export default DocumentHandler;
