import React, { useCallback, useState } from 'react';
import {
  Slider as DHCSlider,
  SliderProps as DHCSliderProps,
} from '@deephaven/components';
import { useDebouncedCallback } from '@deephaven/react-hooks';

const VALUE_CHANGE_DEBOUNCE = 250;

const EMPTY_FUNCTION = () => undefined;

function Slider(props: DHCSliderProps): JSX.Element {
  const {
    defaultValue = 0,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = props;

  const [value, setValue] = useState(propValue ?? defaultValue);

  const debouncedOnChange = useDebouncedCallback(
    propOnChange,
    VALUE_CHANGE_DEBOUNCE
  );

  const onChange = useCallback(
    newValue => {
      setValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCSlider value={value} onChange={onChange} {...otherProps} />
  );
}

Slider.displayName = 'Slider';

export default Slider;
