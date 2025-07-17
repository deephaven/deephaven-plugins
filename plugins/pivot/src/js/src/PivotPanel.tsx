import React from 'react';
import { type dh } from '@deephaven/jsapi-types';
import { type WidgetPanelProps } from '@deephaven/plugin';
import PivotWidget from './PivotWidget';

/**
 * This is just a wrapper panel around the PivotWidget to make TS happy.
 * This can be removed when the DashboardPlugin legacy plugin is removed.
 */
function PivotPanel(props: WidgetPanelProps<dh.Widget>): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <PivotWidget {...props} />;
}

PivotPanel.COMPONENT = 'PivotPanel';

export default PivotPanel;
