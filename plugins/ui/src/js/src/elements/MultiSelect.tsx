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
  const { children, ...pickerProps } = useMultiSelectProps(props);

  const isObjectView =
    isElementOfType(children, ObjectView) ||
    isElementOfType(children, UriObjectView);
  const {
    widget: table,
    api,
    isLoading,
    error,
  } = useObjectViewObject<dh.Table>(children);

  if (isObjectView) {
    if (error != null) {
      const message = getErrorShortMessage(error);
      return (
        <DHMultiSelect
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...pickerProps}
          errorMessage={message}
          validationState="invalid"
        >
          {[]}
        </DHMultiSelect>
      );
    }
    if (isLoading || table == null || api == null) {
      return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <DHMultiSelect loadingState="loading" {...pickerProps}>
          {[]}
        </DHMultiSelect>
      );
    }
    return (
      <ApiContext.Provider value={api}>
        <DHMultiSelectJSApi
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...pickerProps}
          table={table}
          settings={settings}
        />
      </ApiContext.Provider>
    );
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHMultiSelect {...pickerProps}>{children}</DHMultiSelect>;
}

export default MultiSelect;
