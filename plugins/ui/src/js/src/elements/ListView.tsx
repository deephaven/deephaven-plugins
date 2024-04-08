import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
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

export type ListViewProps = (DHListViewProps | WrappedDHListViewJSApiProps) &
  SerializedListViewEventProps;

function ListView({ children, ...props }: ListViewProps) {
  const settings = useSelector(getSettings<RootState>);
  const listViewProps = useListViewProps(props);

  const isObjectView = isElementOfType(children, ObjectView);
  const table = useReExportedTable(children);

  if (isObjectView) {
    return (
      table && (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <DHListViewJSApi {...listViewProps} table={table} settings={settings} />
      )
    );
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHListView {...listViewProps}>{children}</DHListView>;
}

export default ListView;
