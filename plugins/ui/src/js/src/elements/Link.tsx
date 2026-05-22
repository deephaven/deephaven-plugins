import React, { useCallback } from 'react';
import {
  Link as SpectrumLink,
  type LinkProps as SpectrumLinkProps,
} from '@deephaven/components';
import { type NavigateParams } from '../events/Navigate';
import { useNavigateContext } from '../events/NavigateContext';
import { usePressEventCallback } from './hooks/usePressEventCallback';
import { useFocusEventCallback } from './hooks/useFocusEventCallback';
import { useKeyboardEventCallback } from './hooks/useKeyboardEventCallback';
import { type SerializedButtonEventProps } from './model/SerializedPropTypes';

type LinkProps = SerializedButtonEventProps<SpectrumLinkProps> & {
  /** Navigation params for SPA routing. When set, pressing the link triggers navigation instead of a full page load. */
  navigate?: NavigateParams;
};

export function Link(props: LinkProps): JSX.Element {
  const {
    navigate: navigateParams,
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

  const navigateContext = useNavigateContext();
  const onPressStart = usePressEventCallback(propOnPressStart);
  const onPressEnd = usePressEventCallback(propOnPressEnd);
  const onPressUp = usePressEventCallback(propOnPressUp);
  const onFocus = useFocusEventCallback(propOnFocus);
  const onBlur = useFocusEventCallback(propOnBlur);
  const onKeyDown = useKeyboardEventCallback(propOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(propOnKeyUp);
  const baseOnPress = usePressEventCallback(propOnPress);

  const onPress = useCallback(
    (e: Parameters<NonNullable<typeof baseOnPress>>[0]) => {
      if (navigateParams != null && navigateContext != null) {
        navigateContext(navigateParams);
      }
      baseOnPress?.(e);
    },
    [navigateParams, navigateContext, baseOnPress]
  );

  return (
    <SpectrumLink
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
      onPress={
        navigateParams != null || baseOnPress != null ? onPress : undefined
      }
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
