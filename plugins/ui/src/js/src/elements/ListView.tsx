import { useSelector } from 'react-redux';
import { isElementOfType } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { ListView as DHListView } from '@deephaven/components';
import { ListView as DHListViewJSApi } from '@deephaven/jsapi-components';
import type { dh } from '@deephaven/jsapi-types';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { assertNotNull } from '@deephaven/utils';
import {
  SerializedListViewProps,
  useListViewProps,
} from './hooks/useListViewProps';
import ObjectView from './ObjectView';
import { useObjectViewObject } from './hooks/useObjectViewObject';
import UriObjectView from './UriObjectView';
import WidgetErrorView from '../widget/WidgetErrorView';

export function ListView(props: SerializedListViewProps): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { children, ...listViewProps } = useListViewProps(props);

  const isObjectView =
    isElementOfType(children, ObjectView) ||
    isElementOfType(children, UriObjectView);
  const {
    widget: table,
    api,
    isLoading,
    error,
  } = useObjectViewObject<dh.Table>(children);

  assertNotNull(children, 'Children must be defined for list_view.');

  if (isObjectView) {
    if (error != null) {
      return <WidgetErrorView error={error} />;
    }
    if (isLoading || table == null || api == null) {
      return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <DHListView loadingState="loading" {...listViewProps}>
          {[]}
        </DHListView>
      );
    }
    return (
      <ApiContext.Provider value={api}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <DHListViewJSApi {...listViewProps} table={table} settings={settings} />
      </ApiContext.Provider>
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
