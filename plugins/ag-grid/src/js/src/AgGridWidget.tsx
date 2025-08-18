import { useEffect, useMemo, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { getSettings, RootState } from '@deephaven/redux';
import { useSelector } from 'react-redux';
import { themeQuartz } from '@ag-grid-community/theming';
import type { AgGridReactProps } from '@ag-grid-community/react';
import { ViewportRowModelModule } from '@ag-grid-enterprise/viewport-row-model';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import AgGridView from './AgGridView';
import AgGridDhTheme from './AgGridDhTheme';
import AgGridTableType from './AgGridTableType';

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

function isCorePlusDhType(api: typeof DhType): api is typeof CorePlusDhType {
  return (api as typeof CorePlusDhType).coreplus != null;
}

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
  const [table, setTable] = useState<AgGridTableType>();

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
      modules: [
        RowGroupingModule,
        ViewportRowModelModule,
        ColumnsToolPanelModule,
        ServerSideRowModelModule,
      ],
      defaultColDef: {
        filterParams: {
          buttons: ['reset', 'apply'],
        },
      },
      rowSelection: {
        mode: 'multiRow',
        checkboxes: false,
        headerCheckbox: false,
        enableClickSelection: true,
      },
      suppressCellFocus: true,
      theme,
      rowHeight: themeParams.rowHeight as number,
      rowStyle: {
        // Displays numbers as monospace figures. Keeps decimal alignment.
        fontVariantNumeric: 'tabular-nums',
      },
    }),
    [theme, themeParams]
  );

  /** First we load the widget object. This is the object that is sent from the server in AgGridMessageStream. */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      log.debug('Fetching widget');
      const widget: DhType.Widget = await fetch();
      log.debug('Fetched widget of type', widget.type);
      switch (widget.type) {
        case 'deephaven.ag_grid.AgGrid': {
          const newTable =
            (await widget.exportedObjects[0].fetch()) as DhType.Table;
          if (!cancelled) {
            log.info('Loaded table', newTable);
            setTable(newTable);
          }
          break;
        }
        case 'PivotTable': {
          if (!isCorePlusDhType(dh)) {
            throw new Error(
              'PivotTable widget is only supported in Core Plus builds'
            );
          }
          if (!cancelled) {
            const pivotTable = new dh.coreplus.pivot.PivotTable(widget);
            setTable(pivotTable);
          }
          break;
        }
        default:
          throw new Error(`Unsupported widget type: ${widget.type}`);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  return table != null ? (
    <div className="ui-table-container">
      <AgGridView table={table} settings={settings} agGridProps={agGridProps} />
    </div>
  ) : (
    <LoadingOverlay />
  );
}

export default AgGridWidget;
