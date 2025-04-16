import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@deephaven/redux';
import {
  getInputFiltersForDashboard,
  InputFilterEvent,
} from '@deephaven/dashboard-core-plugins';
import { FilterChangeEvent } from '@deephaven/dashboard-core-plugins/dist/FilterPlugin';
import { useLayoutManager } from '@deephaven/dashboard';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { nanoid } from 'nanoid';
import { useDashboardId } from '../DashboardContext';

export interface InputFiltersProps {
  onChange?: (event: FilterChangeEvent[]) => void;
  onFilters?: (filters: string[]) => void;
  table: DhType.WidgetExportedObject;
  columnNames?: string[];
}

// TODO from UITable, make common
function useThrowError(): [
  throwError: (error: unknown) => void,
  clearError: () => void,
] {
  const [error, setError] = useState<unknown>(null);
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  if (error != null) {
    // Re-throw the error so that the error boundary can catch it
    if (typeof error === 'string') {
      throw new Error(error);
    }
    throw error;
  }

  return [setError, clearError];
}

function useTableColumns(
  exportedTable: DhType.WidgetExportedObject
): DhType.Column[] | undefined {
  const [columns, setColumns] = useState<DhType.Column[]>();
  const [throwError, clearError] = useThrowError();

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadColumns() {
      try {
        const reexportedTable = await exportedTable.reexport();
        const table = (await reexportedTable.fetch()) as DhType.Table;
        setColumns(table.columns);
        if (!isCancelled) {
          clearError();
          setColumns(table.columns);
        }
      } catch (e) {
        if (!isCancelled) {
          // Errors thrown from an async useEffect are not caught
          // by the component's error boundary
          throwError(e);
        }
      }
    }
    loadColumns();
    return () => {
      isCancelled = true;
    };
  }, [exportedTable, clearError, throwError]);

  return columns;
}

export function InputFilters(props: InputFiltersProps): JSX.Element {
  const { onChange, onFilters, table: exportedTable, columnNames } = props;
  const dashboardId = useDashboardId();
  console.log('DG dashboardId', dashboardId);
  const { eventHub } = useLayoutManager();
  const inputFilters = useSelector((state: RootState) =>
    getInputFiltersForDashboard(state, dashboardId)
  );

  const tableColumns = useTableColumns(exportedTable);
  const columnsString = JSON.stringify(columnNames);
  const columns = useMemo(
    () =>
      columnNames
        ? tableColumns?.filter(column => columnNames.includes(column.name))
        : tableColumns,
    [tableColumns, columnsString]
  );

  useEffect(() => {
    const id = nanoid();
    eventHub.emit(InputFilterEvent.COLUMNS_CHANGED, id, columns);
    return () => {
      eventHub.emit(InputFilterEvent.COLUMNS_CHANGED, id, []);
    };
  }, [columns, eventHub]);

  // If onChange is provided, call it with all of the input filters
  useEffect(() => {
    if (onChange) {
      onChange(inputFilters);
    }
  }, [inputFilters, onChange]);

  // If onFilters is provided, call it with the filters for the columns
  useEffect(() => {
    if (onFilters) {
      const inputFiltersForColumns = columns
        ? inputFilters.filter(filter =>
            columns.some(column => column.name === filter.name)
          )
        : inputFilters;
      const filters = inputFiltersForColumns
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(filter => `${filter.name}=\`${filter.value}\``); // TODO use some util to do this?
      onFilters(filters);
    }
  }, [inputFilters, onFilters, columns]);

  return <div>{JSON.stringify(inputFilters)}</div>;
}

export default InputFilters;
