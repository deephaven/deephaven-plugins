import React from 'react';
import { PanelProps } from '@deephaven/dashboard';
import MatplotlibView, { MatplotlibViewProps } from './MatplotlibView';

export type MatplotlibPanelProps = MatplotlibViewProps & PanelProps;

/**
 * Displays a rendered matplotlib from the server
 */
export function MatplotlibPanel(
  props: MatplotlibPanelProps
): JSX.Element | null {
  const { fetch } = props;
  return <MatplotlibView fetch={fetch} />;
}

MatplotlibPanel.COMPONENT = 'MatplotlibPanel';

export default MatplotlibPanel;
