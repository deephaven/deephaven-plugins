import React from 'react';
import { type dh } from '@deephaven/jsapi-types';
import { type WidgetPanelProps } from '@deephaven/plugin';
import MatplotlibView from './MatplotlibView';

/**
 * This is just a wrapper panel around the MatplotlibView to make TS happy.
 * This can be removed when the DashboardPlugin legacy plugin is removed.
 */
function MatplotlibPanel(props: WidgetPanelProps<dh.Widget>): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <MatplotlibView {...props} />;
}

MatplotlibPanel.COMPONENT = 'MatPlotLibPanel';

export default MatplotlibPanel;
