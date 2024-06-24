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

  /* eslint-disable-next-line react/jsx-props-no-spreading */
  if (children === undefined) return <DHCAIllustratedMessage {...props} />;

  const newChildren = React.Children.map(children, element => {
    if (isElementOfType(element, Icon) === true) {
      const size = element.props.size ?? 'XL';
      const marginBottom =
        element.props.margin ??
        element.props.marginY ??
        element.props.marginBottom ??
        'size-10';

      return React.cloneElement(element, {
        ...element.props,
        size,
        marginBottom,
      });
    }

    return element;
  });

  return (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <DHCAIllustratedMessage {...otherProps}>
      {newChildren}
    </DHCAIllustratedMessage>
  );
}

export default IllustratedMessage;
