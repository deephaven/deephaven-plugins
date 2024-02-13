import React, { useEffect, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type { Table, Widget } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import AgGridView from './AgGridView';

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

/**
 * Fetches an AgGrid widget from the server and fetches the underlying table provided by the widget.
 * Then passes the table to AgGridView to display the table in an AG Grid.
 */
export function AgGridWidget(
  props: WidgetComponentProps<Widget>
): JSX.Element | null {
  const dh = useApi();
  const { fetch } = props;
  const [table, setTable] = useState<Table>();

  /** First we load the widget object. This is the object that is sent from the server in AgGridMessageStream. */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      log.debug('Fetching widget');
      const widget: Widget = await fetch();
      const newTable = (await widget.exportedObjects[0].fetch()) as Table;
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

  return table != null ? <AgGridView table={table} /> : <LoadingOverlay />;
}

export default AgGridWidget;
