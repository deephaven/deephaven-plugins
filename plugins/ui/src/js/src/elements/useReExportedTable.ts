import { ReactNode } from 'react';
import { useTableClose } from '@deephaven/jsapi-components';
import type { dh } from '@deephaven/jsapi-types';
import { isElementOfType, usePromiseFactory } from '@deephaven/react-hooks';
import ObjectView from './ObjectView';
import { fetchReexportedTable } from './ElementUtils';

export function useReExportedTable(node: ReactNode): dh.Table | null {
  const isObjectView = isElementOfType(node, ObjectView);

  const maybeExportedTable =
    isObjectView && node.props.object.type === 'Table'
      ? node.props.object
      : null;

  const { data: table } = usePromiseFactory(fetchReexportedTable, [
    maybeExportedTable,
  ]);

  useTableClose(table);

  return table;
}

export default useReExportedTable;
