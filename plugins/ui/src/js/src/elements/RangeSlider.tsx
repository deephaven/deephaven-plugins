import {
  RangeSlider as DHCRangeSlider,
  type RangeSliderProps as DHCRangeSliderProps,
} from '@deephaven/components';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import { type SerializedInputElementProps } from './model';

export type SerializedRangeSliderProps = SerializedInputElementProps<
  DHCRangeSliderProps,
  { start: number; end: number }
>;

export function RangeSlider(props: SerializedRangeSliderProps): JSX.Element {
  const {
    defaultValue = { start: 0, end: 0 },
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
    <DHCRangeSlider value={value} onChange={onChange} {...otherProps} />
  );
}

RangeSlider.displayName = 'RangeSlider';

export default RangeSlider;
