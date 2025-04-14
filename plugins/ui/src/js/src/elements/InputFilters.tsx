import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@deephaven/redux';
import { getInputFiltersForDashboard } from '@deephaven/dashboard-core-plugins';
import { FilterChangeEvent } from '@deephaven/dashboard-core-plugins/dist/FilterPlugin';

export interface InputFiltersProps {
  onChange?: (event: FilterChangeEvent[]) => void;
  onFilters?: (filters: string[]) => void;
  columns?: string[];
}

export function InputFilters(props: InputFiltersProps): JSX.Element {
  const { onChange, onFilters, columns } = props;
  const inputFilters = useSelector(
    (state: RootState) => getInputFiltersForDashboard(state, 'default') // todo: use the correct dashboard id
  );

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
        ? inputFilters.filter(filter => columns.includes(filter.name))
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
