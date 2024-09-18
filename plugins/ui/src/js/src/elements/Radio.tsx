import {
  Radio as DHRadio,
  RadioProps as DHRadioProps,
} from '@deephaven/components';
import {
  SerializedFocusEventProps,
  SerializedKeyboardEventProps,
} from './model/SerializedPropTypes';
import { useFocusEventCallback } from './hooks/useFocusEventCallback';
import { useKeyboardEventCallback } from './hooks/useKeyboardEventCallback';

export type SerializedRadioProps = SerializedFocusEventProps<
  SerializedKeyboardEventProps<DHRadioProps>
>;

export function Radio({
  onFocus: serializedOnFocus,
  onBlur: serializedOnBlur,
  onKeyDown: serializedOnKeyDown,
  onKeyUp: serializedOnKeyUp,
  value: valueProp,
  children,
  ...props
}: SerializedRadioProps): JSX.Element {
  const onFocus = useFocusEventCallback(serializedOnFocus);
  const onBlur = useFocusEventCallback(serializedOnBlur);
  const onKeyDown = useKeyboardEventCallback(serializedOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(serializedOnKeyUp);

  const value = valueProp ?? (typeof children === 'string' ? children : '');

  return (
    <DHRadio
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      value={value as string}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      {children}
    </DHRadio>
  );
}

export default Radio;
