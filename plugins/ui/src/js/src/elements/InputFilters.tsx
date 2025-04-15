import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@deephaven/redux';
import {
  getInputFiltersForDashboard,
  InputFilterEvent,
} from '@deephaven/dashboard-core-plugins';
import { FilterChangeEvent } from '@deephaven/dashboard-core-plugins/dist/FilterPlugin';
import { useLayoutManager } from '@deephaven/dashboard';
import { nanoid } from 'nanoid';
// import { usePrevious } from '@deephaven/react-hooks';
// import { useParentItem } from '../layout/ParentItemContext';

type Column = {
  name: string;
  type: string;
};

// const usePrevious = (value: any, initialValue: any): any => {
//   const ref = useRef(initialValue);
//   useEffect(() => {
//     ref.current = value;
//   });
//   return ref.current;
// };

// const useEffectDebugger = (
//   effectHook: any,
//   dependencies: any,
//   dependencyNames = []
// ) => {
//   const previousDeps = usePrevious(dependencies, []);

//   const changedDeps = dependencies.reduce(
//     (accum: any, dependency: any, index: any) => {
//       if (dependency !== previousDeps[index]) {
//         const keyName = dependencyNames[index] || index;
//         return {
//           ...accum,
//           [keyName]: {
//             before: previousDeps[index],
//             after: dependency,
//           },
//         };
//       }

//       return accum;
//     },
//     {}
//   );

//   if (Object.keys(changedDeps).length) {
//     console.log('[use-effect-debugger] ', changedDeps);
//   }

//   useEffect(effectHook, dependencies);
// };

export interface InputFiltersProps {
  onChange?: (event: FilterChangeEvent[]) => void;
  onFilters?: (filters: string[]) => void;
  columns?: Column[];
}

export function InputFilters(props: InputFiltersProps): JSX.Element {
  const { onChange, onFilters, columns } = props;
  const { eventHub } = useLayoutManager();
  const inputFilters = useSelector(
    (state: RootState) => getInputFiltersForDashboard(state, 'default') // todo: use the correct dashboard id
  );

  const columnsString = JSON.stringify(columns);
  const columnsMemo = useMemo(() => columns, [columnsString]);

  useEffect(() => {
    const id = nanoid();
    eventHub.emit(InputFilterEvent.COLUMNS_CHANGED, id, columnsMemo);
    return () => {
      eventHub.emit(InputFilterEvent.COLUMNS_CHANGED, id, []);
    };
  }, [columnsMemo, eventHub]);

  // If onChange is provided, call it with all of the input filters
  useEffect(() => {
    if (onChange) {
      onChange(inputFilters);
    }
  }, [inputFilters, onChange]);

  // If onFilters is provided, call it with the filters for the columns
  useEffect(() => {
    if (onFilters) {
      const inputFiltersForColumns = columnsMemo
        ? inputFilters.filter(filter =>
            columnsMemo.some(column => column.name === filter.name)
          )
        : inputFilters;
      const filters = inputFiltersForColumns
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(filter => `${filter.name}=\`${filter.value}\``); // TODO use some util to do this?
      onFilters(filters);
    }
  }, [inputFilters, onFilters, columnsMemo]);

  return <div>{JSON.stringify(inputFilters)}</div>;
}

export default InputFilters;
