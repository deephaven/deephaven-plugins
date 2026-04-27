import { useSelector } from 'react-redux';
import { MultiSelect as DHMultiSelect } from '@deephaven/components';
import { MultiSelect as DHMultiSelectJSApi } from '@deephaven/jsapi-components';
import { isElementOfType } from '@deephaven/react-hooks';
import type { dh } from '@deephaven/jsapi-types';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { getSettings, RootState } from '@deephaven/redux';
import {
  SerializedMultiSelectProps,
  useMultiSelectProps,
} from './hooks/useMultiSelectProps';
import ObjectView from './ObjectView';
import { useObjectViewObject } from './hooks/useObjectViewObject';
import UriObjectView from './UriObjectView';
import { getErrorShortMessage } from '../widget/WidgetErrorUtils';

export function MultiSelect(
  props: SerializedMultiSelectProps
): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { children, ...multiSelectProps } = useMultiSelectProps(props);

  const isObjectView =
    isElementOfType(children, ObjectView) ||
    isElementOfType(children, UriObjectView);
  const { widget: table, api, error } = useObjectViewObject<dh.Table>(children);

  if (isObjectView) {
    if (error != null) {
      const message = getErrorShortMessage(error);
      return (
        <DHMultiSelect
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...multiSelectProps}
          errorMessage={message}
          validationState="invalid"
        >
          {[]}
        </DHMultiSelect>
      );
    }
    // Don't gate on `isLoading` as it flips true on server round-trips and
    // would unmount/remount the spectrum MultiSelect, closing any open
    // popover.
    if (table == null || api == null) {
      return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <DHMultiSelect loadingState="loading" {...multiSelectProps}>
          {[]}
        </DHMultiSelect>
      );
    }
    return (
      <ApiContext.Provider value={api}>
        <DHMultiSelectJSApi
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...multiSelectProps}
          table={table}
          settings={settings}
        />
      </ApiContext.Provider>
    );
  }

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHMultiSelect {...multiSelectProps}>{children}</DHMultiSelect>
  );
}

export default MultiSelect;
