import {
  RadioGroup as DHRadioGroup,
  RadioGroupProps as DHRadioGroupProps,
} from '@deephaven/components';
import { SerializedFocusEventProps } from './SerializedPropTypes';
import { useFocusEventCallback } from './spectrum/useFocusEventCallback';

export type SerializedRadioGroupProps =
  SerializedFocusEventProps<DHRadioGroupProps>;

function RadioGroup({
  onFocus: serializedOnFocus,
  onBlur: serializedOnBlur,
  ...props
}: SerializedRadioGroupProps): JSX.Element {
  const onFocus = useFocusEventCallback(serializedOnFocus);
  const onBlur = useFocusEventCallback(serializedOnBlur);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHRadioGroup {...props} onFocus={onFocus} onBlur={onBlur} />;
}

export default RadioGroup;
