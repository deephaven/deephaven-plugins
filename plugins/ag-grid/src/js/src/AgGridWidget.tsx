import { useEffect, useMemo, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { getSettings, RootState } from '@deephaven/redux';
import { useSelector } from 'react-redux';
import { themeQuartz } from '@ag-grid-community/theming';
import type { AgGridReactProps } from '@ag-grid-community/react';
import AgGridView from './AgGridView';
import AgGridDhTheme from './AgGridDhTheme';

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

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
  const [table, setTable] = useState<DhType.Table>();

  const gridDensity = settings?.gridDensity;
  const theme = useMemo(
    () => themeQuartz.withParams(AgGridDhTheme.getThemeParams(gridDensity)),
    [gridDensity]
  );

  const agGridProps: AgGridReactProps = useMemo(
    () => ({
      suppressCellFocus: true,
      rowSelection: {
        mode: 'multiRow',
        checkboxes: false,
        headerCheckbox: false,
        enableClickSelection: true,
      },
      theme,
    }),
    [theme]
  );

  /** First we load the widget object. This is the object that is sent from the server in AgGridMessageStream. */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      log.debug('Fetching widget');
      const widget: DhType.Widget = await fetch();
      const newTable =
        (await widget.exportedObjects[0].fetch()) as DhType.Table;
      if (!cancelled) {
        log.info('AgGridView loaded table', newTable);
        setTable(newTable);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  return table != null ? (
    <AgGridView table={table} settings={settings} agGridProps={agGridProps} />
  ) : (
    <LoadingOverlay />
  );
}

export default AgGridWidget;
