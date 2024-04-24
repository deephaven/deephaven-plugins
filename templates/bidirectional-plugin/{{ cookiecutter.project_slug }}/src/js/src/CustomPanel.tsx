import React from 'react';
import { DashboardPanelProps } from '@deephaven/dashboard';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/{{ cookiecutter.py_kebab_case }}.CustomPanel');

/**
 * Displays a custom panel. Props passed in are determined by your `DashboardPlugin` that registers this panel.
 */
export function CustomPanel(props: DashboardPanelProps): JSX.Element {
  return <div className="custom-panel">This is a custom panel</div>;
}

CustomPanel.COMPONENT = '@deephaven/{{ cookiecutter.py_kebab_case }}.CustomPanel';

export default CustomPanel;
