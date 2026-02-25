import React from 'react';
import { WidgetDescriptor } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { ReactPanelManagerContext } from '../layout/ReactPanelManager';
import { usePanelManager } from '../layout/usePanelManager';
import { getRootChildren } from './DocumentUtils';
import { ReadonlyWidgetData, WidgetDataUpdate } from './WidgetTypes';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

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
  initialData,
  onDataChange,
  onClose,
}: DocumentHandlerProps): JSX.Element {
  log.debug('Rendering document', widget);

  const panelManager = usePanelManager({
    widget,
    initialData,
    onDataChange,
    onClose,
  });

  return (
    <ReactPanelManagerContext.Provider value={panelManager}>
      {getRootChildren(children, widget)}
    </ReactPanelManagerContext.Provider>
  );
}

DocumentHandler.displayName = '@deephaven/js-plugin-ui/DocumentHandler';

export default DocumentHandler;
