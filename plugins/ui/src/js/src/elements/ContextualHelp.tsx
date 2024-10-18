import {
  ContextualHelp as DHCContextualHelp,
  ContextualHelpProps as DHCContextualHelpProps,
  Heading,
  Content,
  Footer,
} from '@deephaven/components';
import { isElementOfType } from '@deephaven/react-hooks';
import { ReactNode } from 'react';

export type SerializedContextualHelpProps = Omit<
  DHCContextualHelpProps,
  'children'
> & {
  heading: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
};

export function ContextualHelp(
  props: SerializedContextualHelpProps
): JSX.Element {
  const { heading, content, footer, ...otherProps } = props;

  return (
    /* eslint-disable-next-line react/jsx-props-no-spreading */
    <DHCContextualHelp {...otherProps}>
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
      {footer != null &&
        (isElementOfType(footer, Footer) ? footer : <Footer>{footer}</Footer>)}
    </DHCContextualHelp>
  );
}

export default ContextualHelp;
