/**
 * Handles document events for one widget.
 */
import React, { useCallback } from 'react';
import Log from '@deephaven/log';
import { WidgetDataUpdate, WidgetId } from './WidgetTypes';
import WidgetHandler, { WidgetHandlerProps } from './WidgetHandler';

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

  return (
    <WidgetHandler
      id={id}
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
