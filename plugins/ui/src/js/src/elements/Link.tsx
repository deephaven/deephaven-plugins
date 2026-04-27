import React from 'react';
import {
  Link as SpectrumLink,
  type LinkProps as SpectrumLinkProps,
} from '@deephaven/components';
import { usePressEventCallback } from './hooks/usePressEventCallback';
import { useFocusEventCallback } from './hooks/useFocusEventCallback';
import { useKeyboardEventCallback } from './hooks/useKeyboardEventCallback';
import { type SerializedButtonEventProps } from './model/SerializedPropTypes';

export function Link(
  props: SerializedButtonEventProps<SpectrumLinkProps>
): JSX.Element {
  const {
    onPress: propOnPress,
    onPressStart: propOnPressStart,
    onPressEnd: propOnPressEnd,
    onPressUp: propOnPressUp,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
    ...otherProps
  } = props;

  const onPress = usePressEventCallback(propOnPress);
  const onPressStart = usePressEventCallback(propOnPressStart);
  const onPressEnd = usePressEventCallback(propOnPressEnd);
  const onPressUp = usePressEventCallback(propOnPressUp);
  const onFocus = useFocusEventCallback(propOnFocus);
  const onBlur = useFocusEventCallback(propOnBlur);
  const onKeyDown = useKeyboardEventCallback(propOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(propOnKeyUp);

  return (
    <SpectrumLink
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
      onPress={onPress}
      onPressStart={onPressStart}
      onPressEnd={onPressEnd}
      onPressUp={onPressUp}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    />
  );
}

Link.displayName = 'Link';

export default Link;
