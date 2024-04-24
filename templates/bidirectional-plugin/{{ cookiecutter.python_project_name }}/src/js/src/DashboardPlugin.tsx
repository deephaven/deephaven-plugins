import React, { useCallback } from 'react';
import {
  DashboardPluginComponentProps,
  useDashboardPanel,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import CustomPanel from './CustomPanel';
import {
  IrisGridEvent,
  IrisGridPanel,
} from '@deephaven/dashboard-core-plugins';
import { RowDataMap } from '@deephaven/jsapi-utils';

// We need to inline our styles so they appear correctly
import styles from './CustomPanel.scss?inline';

/**
 * Create your own logger module to easily identify where logs are being printed from.
 */
const log = Log.module('{{ cookiecutter.javascript_project_name }}.DashboardPlugin');

/**
 * Specify a plugin matching an expected custom object type to react to when that object type is opened.
 */
export const VARIABLE_TYPE = '{{ cookiecutter.__registered_object_name }}';

/**
 * Dashboard Plugin. Registers with a dashboard. The rendered component will be rendered atop the dashboard layout.
 * Register custom components and listeners to open your own panels.
 * @param props The props passed in from the Dashboard
 * @returns A rendered dashboard component
 */
export const DashboardPlugin = (
  props: DashboardPluginComponentProps
): JSX.Element => {
  const { layout } = props;

  /** Register our custom panel to open when an object of `VARIABLE_TYPE` is created */
  useDashboardPanel({
    dashboardProps: props,
    componentName: CustomPanel.COMPONENT,
    component: CustomPanel,
    supportedTypes: VARIABLE_TYPE,
  });

  /**
   * Call back for use when data is selected.
   * We declare this using `useCallback` so that it does not trigger re-renders when passed into `useListener`.
   */
  const handleDataSelected = useCallback(
    (panel: typeof IrisGridPanel, data: RowDataMap) => {
      log.info('Data selected', data);
    },
    []
  );

  /**
   * Listen for when data is selected in a grid panel
   */
  useListener(layout.eventHub, IrisGridEvent.DATA_SELECTED, handleDataSelected);

  /**
   * Return a view here if you want something overlaid on top of the dashboard.
   * Also add the `style` tag to inline the styles.
   */
  return <style>{styles}</style>;
};

export default DashboardPlugin;
