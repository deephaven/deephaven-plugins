import {
  Radio as DHRadio,
  RadioProps as DHRadioProps,
} from '@deephaven/components';
import {
  SerializedFocusEventProps,
  SerializedKeyboardEventProps,
} from './SerializedPropTypes';
import { useFocusEventCallback } from './spectrum/useFocusEventCallback';
import { useKeyboardEventCallback } from './spectrum/useKeyboardEventCallback';

export type SerializedRadioProps = SerializedFocusEventProps<
  SerializedKeyboardEventProps<DHRadioProps>
>;

function Radio({
  onFocus: serializedOnFocus,
  onBlur: serializedOnBlur,
  onKeyDown: serializedOnKeyDown,
  onKeyUp: serializedOnKeyUp,
  ...props
}: SerializedRadioProps): JSX.Element {
  const onFocus = useFocusEventCallback(serializedOnFocus);
  const onBlur = useFocusEventCallback(serializedOnBlur);
  const onKeyDown = useKeyboardEventCallback(serializedOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(serializedOnKeyUp);

  return (
    <DHRadio
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    />
  );
}

export default Radio;
