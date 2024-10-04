import { useFocusEventCallback } from './useFocusEventCallback';
import { useKeyboardEventCallback } from './useKeyboardEventCallback';
import { SerializedTextInputEventProps } from '../model/SerializedPropTypes';
import useDebouncedOnChange from './useDebouncedOnChange';

// returns SpectrumTextAreaProps
export function useTextInputProps<T>(
  props: SerializedTextInputEventProps<T>
): T {
  const {
    defaultValue = '',
    value: propValue,
    onChange: propOnChange,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
    ...otherProps
  } = props;
  const onFocus = useFocusEventCallback(propOnFocus);
  const onBlur = useFocusEventCallback(propOnBlur);
  const onKeyDown = useKeyboardEventCallback(propOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(propOnKeyUp);
  const [value, onChange] = useDebouncedOnChange(
    propValue ?? defaultValue,
    propOnChange
  );

  return {
    defaultValue,
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    ...otherProps,
  } as T;
}

export default useTextInputProps;
