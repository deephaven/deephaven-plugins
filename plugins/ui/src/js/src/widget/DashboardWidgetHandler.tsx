/**
 * Handles document events for one widget.
 */
import React, { useCallback } from 'react';
import Log from '@deephaven/log';
import { WidgetDataUpdate, WidgetId } from './WidgetTypes';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';
import { WIDGET_ELEMENT } from './WidgetUtils';
import ReactPanel from '../layout/ReactPanel';

const log = Log.module('@deephaven/js-plugin-ui/DashboardWidgetHandler');

export interface DashboardWidgetHandlerProps
  extends Omit<WidgetHandlerProps, 'onClose' | 'onDataChange'> {
  /** ID of this widget instance */
  id: WidgetId;

  /** Triggered when all panels opened from this widget have closed */
  onClose?: (widgetId: WidgetId) => void;

  /** Triggered when the data in the widget changes */
  onDataChange?: (widgetId: WidgetId, data: WidgetDataUpdate) => void;
}

function DashboardWidgetHandler({
  id,
  onClose,
  onDataChange,
  ...otherProps
}: DashboardWidgetHandlerProps): JSX.Element {
  const handleClose = useCallback(() => {
    log.debug('handleClose', id);
    onClose?.(id);
  }, [onClose, id]);

  const handleDataChange = useCallback(
    (data: WidgetDataUpdate) => {
      log.debug('handleDataChange', id, data);
      onDataChange?.(id, data);
    },
    [onDataChange, id]
  );

  const { initialData, widgetDescriptor } = otherProps;

  const renderEmptyDocument = useCallback(() => {
    // Document hasn't been initialized yet. Display a loading spinner if applicable.
    if (
      typeof widgetDescriptor === 'object' &&
      widgetDescriptor.type === WIDGET_ELEMENT
    ) {
      // Rehydration. Mount ReactPanels for each panelId in the initial data
      // so loading spinners or widget errors are shown
      if (initialData?.panelIds != null && initialData.panelIds.length > 0) {
        // Do not add a key here
        // When the real document mounts, it doesn't use keys and will cause a remount
        // which triggers the DocumentHandler to think the panels were closed and messes up the layout
        // eslint-disable-next-line react/jsx-key
        return initialData.panelIds.map(() => <ReactPanel />);
      }
      // Default to a single panel so we can immediately show a loading spinner
      return <ReactPanel />;
    }

    return null;
    // We only want to update this callback when the widgetDescriptor changes, not every time the initialData changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetDescriptor]);

  return (
    <WidgetHandler
      id={id}
      onDataChange={handleDataChange}
      onClose={handleClose}
      renderEmptyDocument={renderEmptyDocument}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

DashboardWidgetHandler.displayName =
  '@deephaven/js-plugin-ui/DashboardWidgetHandler';

export default DashboardWidgetHandler;
