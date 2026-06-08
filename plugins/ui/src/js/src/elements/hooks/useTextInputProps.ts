import { type FocusEvent, useCallback, useState } from 'react';
import { useFocusEventCallback } from './useFocusEventCallback';
import { useKeyboardEventCallback } from './useKeyboardEventCallback';
import { type SerializedTextInputEventProps } from '../model/SerializedPropTypes';
import useDebouncedOnChange from './useDebouncedOnChange';

// returns SpectrumTextAreaProps
export function useTextInputProps<T, V = string>(
  props: SerializedTextInputEventProps<T, V>,
  defaultValueFallback?: V
): T {
  const {
    defaultValue = defaultValueFallback,
    value: propValue,
    onChange: propOnChange,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
    ...otherProps
  } = props;
  // Track focus locally so we can avoid replacing the value out from under the
  // user while they are typing (see useDebouncedOnChange).
  const [isFocused, setIsFocused] = useState(false);
  const serializedOnFocus = useFocusEventCallback(propOnFocus);
  const serializedOnBlur = useFocusEventCallback(propOnBlur);
  const onFocus = useCallback(
    (e: FocusEvent) => {
      setIsFocused(true);
      serializedOnFocus?.(e);
    },
    [serializedOnFocus]
  );
  const onBlur = useCallback(
    (e: FocusEvent) => {
      setIsFocused(false);
      serializedOnBlur?.(e);
    },
    [serializedOnBlur]
  );
  const onKeyDown = useKeyboardEventCallback(propOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(propOnKeyUp);
  const [value, onChange] = useDebouncedOnChange(
    propValue,
    propOnChange,
    isFocused
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
