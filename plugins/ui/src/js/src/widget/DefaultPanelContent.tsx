import React from 'react';
import { View, Flex, LoadingOverlay } from '@deephaven/components';
import useWidgetStatus from '../layout/useWidgetStatus';
import WidgetErrorView from './WidgetErrorView';

/**
 * Default content wrapper used when a deephaven.ui widget is opened directly
 * (e.g. via the WidgetPlugin) without an explicit `ui.panel` or `ui.dashboard`
 * wrapper. The widget is rendered inside the core `WidgetPanel`, which does not
 * provide any padding or react to the widget's loading/error state, so this
 * wrapper supplies those behaviors.
 */
function DefaultPanelContent({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const widgetStatus = useWidgetStatus();

  let content: React.ReactNode;
  if (widgetStatus.status === 'loading') {
    content = <LoadingOverlay />;
  } else if (widgetStatus.status === 'error') {
    content = <WidgetErrorView error={widgetStatus.error} />;
  } else {
    content = children;
  }

  return (
    <View
      height="100%"
      width="100%"
      padding="size-100"
      overflow="auto"
      UNSAFE_className="dh-default-panel-content"
    >
      <Flex direction="column" alignItems="start" gap="size-100">
        {content}
      </Flex>
    </View>
  );
}

export default DefaultPanelContent;
