import React from 'react';
import {
  Button,
  Content,
  ContextualHelp,
  CopyButton,
  Flex,
  Heading,
  Icon,
  IllustratedMessage,
  Text,
} from '@deephaven/components';
import { vsWarning } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  getErrorAction,
  getErrorMessage,
  getErrorName,
  getErrorShortMessage,
  getErrorStack,
} from './WidgetErrorUtils';

/** Component that display an error message. Will automatically show a button for more info and an action button if the error has an Action defined */
export function WidgetErrorView({
  error,
}: {
  error: NonNullable<unknown>;
}): JSX.Element {
  const name = getErrorName(error);
  const shortMessage = getErrorShortMessage(error);
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);
  const action = getErrorAction(error);

  return (
    <IllustratedMessage UNSAFE_className="ui-widget-error-view">
      <Icon size="XXL" marginBottom="size-100">
        <FontAwesomeIcon icon={vsWarning} />
      </Icon>
      <Heading UNSAFE_className="ui-text-wrap-balance">{name}</Heading>
      <Content>
        <Flex direction="column" gap="size-150">
          <Text UNSAFE_className="ui-text-wrap-balance">
            {shortMessage}
            <ContextualHelp variant="info">
              <Heading>
                {name}{' '}
                <CopyButton
                  copy={() => `${name}\n\n${message}\n\n${stack}`.trim()}
                />
              </Heading>
              <Content>
                <Text UNSAFE_className="ui-monospace-text">
                  {`${message}\n\n${stack}`.trim()}
                </Text>
              </Content>
            </ContextualHelp>
          </Text>
          {action != null && (
            <Button kind="tertiary" onClick={action.action}>
              {action.title}
            </Button>
          )}
        </Flex>
      </Content>
    </IllustratedMessage>
  );
}

export default WidgetErrorView;
