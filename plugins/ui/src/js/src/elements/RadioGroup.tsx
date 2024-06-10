import {
  RadioGroup as DHRadioGroup,
  RadioGroupProps as DHRadioGroupProps,
} from '@deephaven/components';
import { Orientation } from '@react-types/shared';
import { SerializedFocusEventProps } from './SerializedPropTypes';
import { useFocusEventCallback } from './spectrum/useFocusEventCallback';

export type SerializedRadioGroupProps = Omit<
  SerializedFocusEventProps<DHRadioGroupProps>,
  'orientation'
> & {
  orientation?: Orientation | Uppercase<Orientation>;
};

function RadioGroup({
  onFocus: serializedOnFocus,
  onBlur: serializedOnBlur,
  orientation: orientationMaybeUppercase,
  ...props
}: SerializedRadioGroupProps): JSX.Element {
  const onFocus = useFocusEventCallback(serializedOnFocus);
  const onBlur = useFocusEventCallback(serializedOnBlur);
  const orientationLc = orientationMaybeUppercase?.toLowerCase() as Orientation;

  return (
    <DHRadioGroup
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      onFocus={onFocus}
      onBlur={onBlur}
      orientation={orientationLc}
    />
  );
}

export default RadioGroup;
