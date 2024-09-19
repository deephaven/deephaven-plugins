import { useFocusEventCallback } from './useFocusEventCallback';
import { useKeyboardEventCallback } from './useKeyboardEventCallback';
import { SerializedTextAreaEventProps } from '../model/SerializedPropTypes';
import { wrapTextChildren } from '../utils';
import useDebouncedOnChange from './useDebouncedOnChange';

// returns SpectrumTextAreaProps
export function useTextAreaProps<T>(props: SerializedTextAreaEventProps<T>): T {
  const {
    defaultValue = '',
    value: propValue,
    onChange: propOnChange,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
    children,
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
    children: wrapTextChildren(children),
    ...otherProps,
  } as T;
}

export default useTextAreaProps;
