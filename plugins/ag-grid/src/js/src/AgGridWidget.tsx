import { useMemo } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { getSettings, RootState } from '@deephaven/redux';
import { useSelector } from 'react-redux';
import { themeQuartz } from '@ag-grid-community/theming';
import type { AgGridReactProps } from '@ag-grid-community/react';
import AgGridView from './AgGridView';
import AgGridDhTheme from './AgGridDhTheme';
import { getDefaultProps } from './utils';
import useWidgetFetch from './hooks/useWidgetFetch';

/**
 * Fetches an AgGrid widget from the server and fetches the underlying table provided by the widget.
 * Then passes the table to AgGridView to display the table in an AG Grid.
 */
export function AgGridWidget(
  props: WidgetComponentProps<DhType.Widget>
): JSX.Element {
  const dh = useApi();
  const settings = useSelector(getSettings<RootState>);
  const { fetch } = props;

  const gridDensity = settings?.gridDensity;

  const themeParams = useMemo(
    () => AgGridDhTheme.getThemeParams(gridDensity),
    [gridDensity]
  );

  const theme = useMemo(
    () => themeQuartz.withParams(themeParams),
    [themeParams]
  );

  const agGridProps: AgGridReactProps = useMemo(
    () => ({
      ...getDefaultProps(),
      theme,
      rowHeight: themeParams.rowHeight as number,
    }),
    [theme, themeParams]
  );

  const table = useWidgetFetch(dh, fetch);

  return table != null ? (
    <div className="ui-table-container">
      <AgGridView table={table} settings={settings} agGridProps={agGridProps} />
    </div>
  ) : (
    <LoadingOverlay />
  );
}

export default AgGridWidget;
