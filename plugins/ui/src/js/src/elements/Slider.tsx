import {
  Slider as DHCSlider,
  SliderProps as DHCSliderProps,
} from '@deephaven/components';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import { SerializedInputElementProps } from './model';

export type SerializedSliderProps = SerializedInputElementProps<
  DHCSliderProps,
  number
>;

export function Slider(props: SerializedSliderProps): JSX.Element {
  const {
    defaultValue = 0,
    value: propValue,
    onChange: propOnChange,
    ...otherProps
  } = props;

  const [value, onChange] = useDebouncedOnChange(
    propValue ?? defaultValue,
    propOnChange
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCSlider value={value} onChange={onChange} {...otherProps} />
  );
}

Slider.displayName = 'Slider';

export default Slider;
