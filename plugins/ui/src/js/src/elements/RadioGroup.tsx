import {
  RadioGroup as DHRadioGroup,
  RadioGroupProps as DHRadioGroupProps,
} from '@deephaven/components';
import { Orientation } from '@react-types/shared';
// TODO: Remove the above line and uncomment the following line after version bump
// import { Orientation } from '@deephaven/components'
import { SerializedFocusEventProps } from './model/SerializedPropTypes';
import { useFocusEventCallback } from './hooks/useFocusEventCallback';

export type SerializedRadioGroupProps = Omit<
  SerializedFocusEventProps<DHRadioGroupProps>,
  'orientation'
> & {
  orientation?: Orientation | Uppercase<Orientation>;
};

export function RadioGroup({
  onFocus: serializedOnFocus,
  onBlur: serializedOnBlur,
  orientation: orientationMaybeUppercase,
  ...props
}: SerializedRadioGroupProps): JSX.Element {
  const onFocus = useFocusEventCallback(serializedOnFocus);
  const onBlur = useFocusEventCallback(serializedOnBlur);
  const orientationLc = orientationMaybeUppercase?.toLowerCase() as
    | Orientation
    | undefined;

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
