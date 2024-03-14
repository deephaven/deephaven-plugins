import React, { useCallback, useMemo, useRef, useState } from 'react';
import shortid from 'shortid';
import { WidgetDescriptor } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { ReactPanelManagerContext } from '../layout/ReactPanelManager';
import { getRootChildren } from './DocumentUtils';
import {
  ReadonlyWidgetData,
  WidgetData,
  WidgetDataUpdate,
} from './WidgetTypes';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

const EMPTY_OBJECT = Object.freeze({});

export type DocumentHandlerProps = React.PropsWithChildren<{
  /** Definition of the widget used to create this document. Used for titling panels if necessary. */
  widget: WidgetDescriptor;

  /**
   * Data state to use when loading the widget.
   * When the data state is updated, the new state is emitted via the `onDataChange` callback.
   */
  initialData?: ReadonlyWidgetData;

  /** Triggered when the data in the document changes */
  onDataChange?: (data: WidgetDataUpdate) => void;

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
  initialData: data = EMPTY_OBJECT,
  onDataChange = EMPTY_FUNCTION,
  onClose,
}: DocumentHandlerProps) {
  log.debug('Rendering document', widget);
  const panelOpenCountRef = useRef(0);
  const panelIdIndex = useRef(0);
  const [widgetData] = useState<WidgetData>(() => structuredClone(data));

  const handleOpen = useCallback(
    (panelId: string) => {
      panelOpenCountRef.current += 1;
      log.debug('Panel opened, open count', panelOpenCountRef.current);

      if (widgetData.panelIds == null) {
        widgetData.panelIds = [];
      }
      widgetData.panelIds?.push(panelId);
      onDataChange(widgetData);
    },
    [onDataChange, widgetData]
  );

  const handleClose = useCallback(
    (panelId: string) => {
      panelOpenCountRef.current -= 1;
      if (panelOpenCountRef.current < 0) {
        throw new Error('Panel open count is negative');
      }
      log.debug('Panel closed, open count', panelOpenCountRef.current);
      if (panelOpenCountRef.current === 0) {
        onClose?.();
        return;
      }

      widgetData.panelIds = (widgetData.panelIds ?? [])?.filter(
        id => id !== panelId
      );
      onDataChange(widgetData);
    },
    [onClose, onDataChange, widgetData]
  );

  const getPanelId = useCallback(() => {
    // On rehydration, yield known IDs first
    // If there are no more known IDs, generate a new one.
    // This can happen if the document hasn't been opened before, or if it's rehydrated and a new panel is added.
    // Note that if the order of panels changes, the worst case scenario is that panels appear in the wrong location in the layout.
    const panelId = widgetData.panelIds?.[panelIdIndex.current] ?? shortid();
    panelIdIndex.current += 1;
    return panelId;
  }, [widgetData]);

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
