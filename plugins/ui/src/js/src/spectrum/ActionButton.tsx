import React from 'react';
import {
  ActionButton as SpectrumActionButton,
  SpectrumActionButtonProps,
} from '@adobe/react-spectrum';
import { mapSpectrumProps } from './mapSpectrumProps';
import {
  SerializedPressEventCallback,
  usePressEventCallback,
} from './usePressEventCallback';
import {
  SerializedFocusEventCallback,
  useFocusEventCallback,
} from './useFocusEventCallback';
import {
  SerializedKeyboardEventCallback,
  useKeyboardEventCallback,
} from './useKeyboardEventCallback';

function ActionButton(
  props: SpectrumActionButtonProps & {
    /** Handler that is called when the press is released over the target. */
    onPress?: SerializedPressEventCallback;

    /** Handler that is called when a press interaction starts. */
    onPressStart?: SerializedPressEventCallback;
    /**
     * Handler that is called when a press interaction ends, either
     * over the target or when the pointer leaves the target.
     */
    onPressEnd?: SerializedPressEventCallback;

    /**
     * Handler that is called when a press is released over the target, regardless of
     * whether it started on the target or not.
     */
    onPressUp?: SerializedPressEventCallback;

    /** Handler that is called when the element receives focus. */
    onFocus?: SerializedFocusEventCallback;

    /** Handler that is called when the element loses focus. */
    onBlur?: SerializedFocusEventCallback;

    /** Handler that is called when a key is pressed */
    onKeyDown?: SerializedKeyboardEventCallback;

    /** Handler that is called when a key is released */
    onKeyUp?: SerializedKeyboardEventCallback;
  }
) {
  const {
    onPress: propOnPress,
    onPressStart: propsOnPressStart,
    onPressEnd: propsOnPressEnd,
    onPressUp: propsOnPressUp,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
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

  return (
    <SpectrumActionButton
      onPress={onPress}
      onPressStart={onPressStart}
      onPressEnd={onPressEnd}
      onPressUp={onPressUp}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...mapSpectrumProps(otherProps)}
    />
  );
}

export default ActionButton;
