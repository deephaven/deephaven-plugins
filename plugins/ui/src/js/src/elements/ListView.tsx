import { useSelector } from 'react-redux';
import { isElementOfType } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { ListView as DHListView } from '@deephaven/components';
import { ListView as DHListViewJSApi } from '@deephaven/jsapi-components';
import { SerializedListViewProps, useListViewProps } from './useListViewProps';
import ObjectView from './ObjectView';
import useReExportedTable from './useReExportedTable';

function ListView(props: SerializedListViewProps): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { children, ...listViewProps } = useListViewProps(props);

  const isObjectView = isElementOfType(children, ObjectView);
  const table = useReExportedTable(children);

  if (isObjectView) {
    return (
      table && (
        <DHListViewJSApi
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...listViewProps}
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
    >
      {children}
    </DHListView>
  );
}

export default ListView;
