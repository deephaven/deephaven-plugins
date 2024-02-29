import React from 'react';
import {
  Picker as DHPicker,
  PickerProps as DHPickerProps,
} from '@deephaven/components';

function Picker(props: DHPickerProps) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHPicker {...props} />;
}

export default Picker;
