import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import type { SelectionMode } from '@react-types/shared';
import { isElementOfType } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import {
  ListView as DHListView,
  ListViewProps as DHListViewProps,
} from '@deephaven/components';
import {
  ListView as DHListViewJSApi,
  ListViewProps as DHListViewJSApiProps,
} from '@deephaven/jsapi-components';
import {
  SerializedListViewEventProps,
  useListViewProps,
} from './useListViewProps';
import ObjectView, { ObjectViewProps } from './ObjectView';
import useReExportedTable from './useReExportedTable';

type WrappedDHListViewJSApiProps = Omit<DHListViewJSApiProps, 'table'> & {
  children: ReactElement<ObjectViewProps>;
};

type WrappedDHListViewProps = Omit<DHListViewProps, 'selectionMode'> & {
  // The spec specifies that selectionMode should be uppercase, but the Spectrum
  // prop is lowercase. We'll accept either to keep things more flexible.s
  selectionMode?: SelectionMode | Uppercase<SelectionMode>;
};

export type ListViewProps = (
  | WrappedDHListViewProps
  | WrappedDHListViewJSApiProps
) &
  SerializedListViewEventProps;

function ListView({ children, selectionMode, ...props }: ListViewProps) {
  const settings = useSelector(getSettings<RootState>);
  const listViewProps = useListViewProps(props);

  const isObjectView = isElementOfType(children, ObjectView);
  const table = useReExportedTable(children);

  const selectionModeLc = (selectionMode?.toLowerCase() ??
    'none') as SelectionMode;

  if (isObjectView) {
    return (
      table && (
        <DHListViewJSApi
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...listViewProps}
          selectionMode={selectionModeLc}
          table={table}
          settings={settings}
        />
      )
    );
  }

  return (
    <DHListView
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...listViewProps}
      selectionMode={selectionModeLc}
    >
      {children}
    </DHListView>
  );
}

export default ListView;
