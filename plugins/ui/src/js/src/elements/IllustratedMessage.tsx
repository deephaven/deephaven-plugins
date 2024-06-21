import {
  IllustratedMessage as DHCAIllustratedMessage,
  IllustratedMessageProps as DHCAIllustratedMessageProps,
  Icon,
} from '@deephaven/components';
import { isElementOfType } from '@deephaven/react-hooks';
import React from 'react';

export function IllustratedMessage(
  props: DHCAIllustratedMessageProps
): JSX.Element {
  const { children, ...otherProps } = props;

  const newChildren = React.Children.map(children, child => {
    const isIcon = isElementOfType(child, Icon);
    if (isIcon) {
      if (child.props.size === undefined) child.props.size = 'XL';
      if (
        child.props.margin === undefined &&
        child.props.marginY === undefined &&
        child.props.marginBottom === undefined
      ) {
        child.props.marginBottom = 'size-10';
      }
    }

    return child;
  });

  return (
    <DHCAIllustratedMessage {...otherProps}>
      {newChildren}
    </DHCAIllustratedMessage>
  );
}

export default IllustratedMessage;
