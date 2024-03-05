import React from 'react';
import {
  Picker as DHPicker,
  PickerProps as DHPickerProps,
} from '@deephaven/components';
import { SerializedPickerEventProps, usePickerProps } from './usePickerProps';

function Picker(props: DHPickerProps & SerializedPickerEventProps) {
  const pickerProps = usePickerProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHPicker {...pickerProps} />;
}

export default Picker;
