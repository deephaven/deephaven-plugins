/**
 * Handles document events for one widget.
 */
import React, { useCallback } from 'react';
import { WidgetDescriptor } from '@deephaven/dashboard';
import { Widget } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { ReadonlyWidgetData, WidgetDataUpdate, WidgetId } from './WidgetTypes';
import WidgetHandler from './WidgetHandler';

const log = Log.module('@deephaven/js-plugin-ui/DashboardWidgetHandler');

export interface DashboardWidgetHandlerProps {
  /** ID of this widget */
  id: WidgetId;

  /** Widget for this to handle */
  widget: WidgetDescriptor;

  /** Fetch the widget instance */
  fetch: () => Promise<Widget>;

  /** Widget data to display */
  initialData?: ReadonlyWidgetData;

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
}: DashboardWidgetHandlerProps) {
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

  return (
    <WidgetHandler
      onDataChange={handleDataChange}
      onClose={handleClose}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

DashboardWidgetHandler.displayName =
  '@deephaven/js-plugin-ui/DashboardWidgetHandler';

export default DashboardWidgetHandler;
