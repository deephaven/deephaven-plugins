import React from 'react';
import { type dh } from '@deephaven/jsapi-types';
import { type WidgetPanelProps } from '@deephaven/plugin';
import SimplePivotWidget from './SimplePivotWidget';

/**
 * This is just a wrapper panel around the SimplePivotWidget to make TS happy.
 * This can be removed when the DashboardPlugin legacy plugin is removed.
 */
function SimplePivotPanel(props: WidgetPanelProps<dh.Widget>): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <SimplePivotWidget {...props} />;
}

SimplePivotPanel.COMPONENT = 'SimplePivotPanel';

export default SimplePivotPanel;
