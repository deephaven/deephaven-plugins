import React from 'react';
import { DashboardPanelProps } from '@deephaven/dashboard';
import { ElementNode } from './ElementUtils';
import ElementView from './ElementView';

export interface ElementPanelProps extends DashboardPanelProps {
  element: ElementNode;
}

function ElementPanel({ element }: ElementPanelProps): React.ReactNode {
  return <ElementView element={element} />;
}

ElementPanel.displayName = '@deephaven/js-plugin-ui/ElementPanel';

export default ElementPanel;
