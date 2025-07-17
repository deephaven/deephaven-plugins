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
import { getSettings, RootState } from '@deephaven/redux';
import {
  SerializedPickerProps,
  usePickerProps,
  WrappedDHPickerJSApiProps,
} from './hooks/usePickerProps';
import ObjectView from './ObjectView';
import { useReExportedTable } from './hooks/useReExportedTable';
import UriObjectView from './UriObjectView';

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
  const table = useReExportedTable(children);

  if (isObjectView) {
    return (
      table && (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <DHComboBoxJSApi {...pickerProps} table={table} settings={settings} />
      )
    );
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHComboBox {...pickerProps}>{children}</DHComboBox>;
}

export default ComboBox;
