import { useSelector } from 'react-redux';
import {
  ComboBox as DHComboBox,
  ComboBoxProps as DHComboBoxProps,
} from '@deephaven/components';
import {
  ComboBox as DHComboBoxJSApi,
  ComboBoxProps as DHComboBoxJSApiProps,
} from '@deephaven/jsapi-components';
import { isElementOfType } from '@deephaven/react-hooks';
import type { dh } from '@deephaven/jsapi-types';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { getSettings, RootState } from '@deephaven/redux';
import {
  SerializedPickerProps,
  usePickerProps,
  WrappedDHPickerJSApiProps,
} from './hooks/usePickerProps';
import ObjectView from './ObjectView';
import { useObjectViewObject } from './hooks/useObjectViewObject';
import UriObjectView from './UriObjectView';
import { getErrorShortMessage } from '../widget/WidgetErrorUtils';

export function ComboBox(
  props: SerializedPickerProps<
    DHComboBoxProps | WrappedDHPickerJSApiProps<DHComboBoxJSApiProps>
  >
): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { children, ...pickerProps } = usePickerProps(props);

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
        <DHComboBox
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...pickerProps}
          errorMessage={message}
          validationState="invalid"
        >
          {[]}
        </DHComboBox>
      );
    }
    if (isLoading || table == null || api == null) {
      return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <DHComboBox loadingState="loading" {...pickerProps}>
          {[]}
        </DHComboBox>
      );
    }
    return (
      <ApiContext.Provider value={api}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <DHComboBoxJSApi {...pickerProps} table={table} settings={settings} />
      </ApiContext.Provider>
    );
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHComboBox {...pickerProps}>{children}</DHComboBox>;
}

export default ComboBox;
