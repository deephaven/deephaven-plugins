import React, { useCallback, useMemo, useRef } from 'react';
import shortid from 'shortid';
import { WidgetDescriptor } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { ReactPanelManagerContext } from '../layout/ReactPanelManager';
import { getRootChildren } from './DocumentUtils';
import { WidgetData } from './WidgetTypes';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

export type DocumentHandlerProps = React.PropsWithChildren<{
  /** Definition of the widget used to create this document. Used for titling panels if necessary. */
  widget: WidgetDescriptor;

  /** Data that was saved previously when this widget was opened */
  data?: WidgetData;

  /** Triggered when the data in the document changes */
  onDataChange?: (data: WidgetData) => void;

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
  data = {},
  onDataChange = EMPTY_FUNCTION,
  onClose,
}: DocumentHandlerProps) {
  log.debug('Rendering document', widget);
  const panelOpenCountRef = useRef(0);
  const panelIdIndex = useRef(0);
  const documentData = useRef(data);

  // We initialize the data and store it in a ref so that we don't try and re-load the data every time the component re-renders
  const initializeData = useCallback(() => {
    if (documentData.current == null) {
      documentData.current = {};
    }
    if (documentData.current.panelIds == null) {
      documentData.current.panelIds = [];
    }
  }, [documentData]);

  const handleOpen = useCallback(
    (panelId: string) => {
      panelOpenCountRef.current += 1;
      log.debug('Panel opened, open count', panelOpenCountRef.current);

      initializeData();
      const newPanelIds = [...(documentData.current.panelIds ?? []), panelId];
      documentData.current.panelIds = newPanelIds;
      onDataChange(documentData.current);
    },
    [initializeData, onDataChange]
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

      initializeData();
      const newPanelIds = [...(documentData.current.panelIds ?? [])].filter(
        id => id !== panelId
      );
      documentData.current.panelIds = newPanelIds;
      onDataChange(documentData.current);
    },
    [initializeData, onClose, onDataChange]
  );

  const getPanelId = useCallback(() => {
    const panelId =
      documentData.current.panelIds?.[panelIdIndex.current] ?? shortid();
    panelIdIndex.current += 1;
    return panelId;
  }, []);

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
