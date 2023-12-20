import React, { useEffect, useMemo, useState } from 'react';
import {
  DehydratedQuickFilter,
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
  IrisGridUtils
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { View } from '@adobe/react-spectrum';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

export interface TableObjectProps {
  /** Table object to render */
  object: Table;

  /** Props to add to the IrisGrid instance */
  irisGridProps?: Partial<IrisGridProps>;

  /** Quick filters to add to the grid */
  filters?: Record<string, string>;
}

/**
 * Displays an IrisGrid for a Deephaven Table object.
 */
export function TableObject({
  irisGridProps,
  object,
  filters,
}: TableObjectProps) {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const { columns } = object;

  const hydratedQuickFilters = useMemo(() => {
    let quickFilters;

    if (filters !== undefined && model !== undefined && columns !== null) {
      log.debug('Hydrating filters', filters);

      const dehydratedQuickFilters: DehydratedQuickFilter[] = [];
      quickFilters = {};
      const utils = new IrisGridUtils(dh);

      Object.entries(filters).forEach(([columnName, filter]) => {
        const columnIndex = model.getColumnIndexByName(columnName);
        if (columnIndex !== undefined) {
          dehydratedQuickFilters.push([columnIndex, { text: filter }]);
        }
      });

      quickFilters = utils.hydrateQuickFilters(columns, dehydratedQuickFilters);
    }
    return quickFilters;
  }, [filters, model, columns, dh]);

  useEffect(() => {
    async function loadModel() {
      const newModel = await IrisGridModelFactory.makeModel(dh, object);
      setModel(newModel);
    }
    loadModel();
  }, [dh, irisGridProps, object]);

  return (
    <View flexGrow={1} flexShrink={1} overflow="hidden" position="relative">
      {model && (
        <IrisGrid
          model={model}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...irisGridProps}
          quickFilters={hydratedQuickFilters}
        />
      )}
    </View>
  );
}

TableObject.displayName = 'TableObject';

export default TableObject;
