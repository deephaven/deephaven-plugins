import { useSelector } from 'react-redux';
import { Picker as DHPicker } from '@deephaven/components';
import { Picker as DHPickerJSApi } from '@deephaven/jsapi-components';
import { isElementOfType } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { SerializedPickerProps, usePickerProps } from './usePickerProps';
import ObjectView from './ObjectView';
import useReExportedTable from './useReExportedTable';

function Picker(props: SerializedPickerProps): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { children, ...pickerProps } = usePickerProps(props);

  const isObjectView = isElementOfType(children, ObjectView);
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
