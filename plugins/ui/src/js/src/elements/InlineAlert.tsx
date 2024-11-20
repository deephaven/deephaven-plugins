import React, { ReactNode } from 'react';
import {
  Content,
  InlineAlert as DHCInlineAlert,
  InlineAlertProps as DHCInlineAlertProps,
  Heading,
} from '@deephaven/components';
import { isElementOfType } from '@deephaven/react-hooks';

export type SerializedInlineAlertProps = Omit<
  DHCInlineAlertProps,
  'children'
> & {
  heading: ReactNode;
  content: ReactNode;
};

export function InlineAlert(props: SerializedInlineAlertProps): JSX.Element {
  const { heading, content, ...otherProps } = props;

  return (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <DHCInlineAlert {...otherProps}>
      {heading != null &&
        (isElementOfType(heading, Heading) ? (
          heading
        ) : (
          <Heading>{heading}</Heading>
        ))}
      {content != null &&
        (isElementOfType(content, Content) ? (
          content
        ) : (
          <Content>{content}</Content>
        ))}
    </DHCInlineAlert>
  );
}

InlineAlert.displayName = 'InlineAlert';
export default InlineAlert;
