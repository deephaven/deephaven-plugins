import React from 'react';
import {
  Picker as DHPicker,
  PickerProps as DHPickerProps,
} from '@deephaven/components';
import { SerializePickerEventProps, usePickerProps } from './usePickerProps';

function Picker(props: DHPickerProps & SerializePickerEventProps) {
  const pickerProps = usePickerProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHPicker {...pickerProps} />;
}

export default Picker;
