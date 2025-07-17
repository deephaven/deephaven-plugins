import { useSelector } from 'react-redux';
import {
  Picker as DHPicker,
  PickerProps as DHPickerProps,
} from '@deephaven/components';
import {
  Picker as DHPickerJSApi,
  PickerProps as DHPickerJSApiProps,
} from '@deephaven/jsapi-components';
import { isElementOfType } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import {
  SerializedPickerProps,
  usePickerProps,
  WrappedDHPickerJSApiProps,
} from './hooks/usePickerProps';
import ObjectView from './ObjectView';
import useReExportedTable from './hooks/useReExportedTable';
import UriObjectView from './UriObjectView';

export function Picker(
  props: SerializedPickerProps<
    DHPickerProps | WrappedDHPickerJSApiProps<DHPickerJSApiProps>
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
        <DHPickerJSApi {...pickerProps} table={table} settings={settings} />
      )
    );
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHPicker {...pickerProps}>{children}</DHPicker>;
}

export default Picker;
