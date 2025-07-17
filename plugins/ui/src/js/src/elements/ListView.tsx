import { useSelector } from 'react-redux';
import { isElementOfType } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { ListView as DHListView } from '@deephaven/components';
import { ListView as DHListViewJSApi } from '@deephaven/jsapi-components';
import { assertNotNull } from '@deephaven/utils';
import {
  SerializedListViewProps,
  useListViewProps,
} from './hooks/useListViewProps';
import ObjectView from './ObjectView';
import useReExportedTable from './hooks/useReExportedTable';
import UriObjectView from './UriObjectView';

export function ListView(props: SerializedListViewProps): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { children, ...listViewProps } = useListViewProps(props);

  const isObjectView =
    isElementOfType(children, ObjectView) ||
    isElementOfType(children, UriObjectView);
  const table = useReExportedTable(children);

  assertNotNull(children, 'Children must be defined for list_view.');

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
