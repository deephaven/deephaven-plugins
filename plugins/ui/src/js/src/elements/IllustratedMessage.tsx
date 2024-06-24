import React from 'react';
import {
  IllustratedMessage as DHCAIllustratedMessage,
  IllustratedMessageProps as DHCAIllustratedMessageProps,
  Icon,
} from '@deephaven/components';
import { isElementOfType } from '@deephaven/react-hooks';

export function IllustratedMessage(
  props: DHCAIllustratedMessageProps
): JSX.Element {
  const { children, ...otherProps } = props;

  if (children === undefined) return <DHCAIllustratedMessage {...props} />;

  const childrenClone = React.Children.toArray(children);
  const newChildren = React.Children.map(childrenClone, element => {
    if (isElementOfType(element, Icon) === true) {
      if (element.props.size === undefined) element.props.size = 'XL';
      if (
        element.props.margin === undefined &&
        element.props.marginY === undefined &&
        element.props.marginBottom === undefined
      ) {
        element.props.marginBottom = 'size-10';
      }
    }

    return element;
  });

  return (
    <DHCAIllustratedMessage {...otherProps}>
      {newChildren}
    </DHCAIllustratedMessage>
  );
}

export default IllustratedMessage;
