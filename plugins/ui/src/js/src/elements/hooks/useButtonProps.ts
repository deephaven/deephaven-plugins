import { usePressEventCallback } from './usePressEventCallback';
import { useFocusEventCallback } from './useFocusEventCallback';
import { useKeyboardEventCallback } from './useKeyboardEventCallback';
import { SerializedButtonEventProps } from '../model/SerializedPropTypes';
import { wrapTextChildren } from '../utils';

// returns SpectrumButtonProps
export function useButtonProps<T>(props: SerializedButtonEventProps<T>): T {
  const {
    onPress: propOnPress,
    onPressStart: propsOnPressStart,
    onPressEnd: propsOnPressEnd,
    onPressUp: propsOnPressUp,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
    children,
    ...otherProps
  } = props;

  const onPress = usePressEventCallback(propOnPress);
  const onPressStart = usePressEventCallback(propsOnPressStart);
  const onPressEnd = usePressEventCallback(propsOnPressEnd);
  const onPressUp = usePressEventCallback(propsOnPressUp);
  const onFocus = useFocusEventCallback(propOnFocus);
  const onBlur = useFocusEventCallback(propOnBlur);
  const onKeyDown = useKeyboardEventCallback(propOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(propOnKeyUp);

  return {
    onPress,
    onPressStart,
    onPressEnd,
    onPressUp,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    children: wrapTextChildren(children),
    ...otherProps,
  } as T;
}

export default useButtonProps;
