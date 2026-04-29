import React from 'react';
import {
  View,
  type ViewProps,
  Flex,
  type FlexProps,
  LoadingOverlay,
} from '@deephaven/components';
import useWidgetStatus from '../layout/useWidgetStatus';
import WidgetErrorView from './WidgetErrorView';

type DefaultPanelContentProps = React.PropsWithChildren<
  Pick<
    ViewProps,
    | 'backgroundColor'
    | 'padding'
    | 'paddingTop'
    | 'paddingBottom'
    | 'paddingStart'
    | 'paddingEnd'
    | 'paddingX'
    | 'paddingY'
    | 'overflow'
    | 'UNSAFE_style'
    | 'UNSAFE_className'
  > &
    Pick<
      FlexProps,
      | 'wrap'
      | 'direction'
      | 'justifyContent'
      | 'alignContent'
      | 'alignItems'
      | 'gap'
      | 'rowGap'
      | 'columnGap'
    >
>;

/**
 * Default content wrapper used when a deephaven.ui widget is opened directly
 * (e.g. via the WidgetPlugin) without rendering its own GoldenLayout panel.
 * This is used both when the root children are bare (non-layout) elements and
 * when the root is a single `ui.panel` whose hosting `WidgetPanel` already
 * provides a layout slot. The core `WidgetPanel` does not provide any padding
 * or react to the widget's loading/error state, so this wrapper supplies
 * those behaviors and forwards layout/style props to mirror `ReactPanel`.
 */
function DefaultPanelContent({
  children,
  backgroundColor,
  direction = 'column',
  wrap,
  overflow = 'auto',
  justifyContent,
  alignContent,
  alignItems = 'start',
  gap = 'size-100',
  rowGap,
  columnGap,
  padding = 'size-100',
  paddingTop,
  paddingBottom,
  paddingStart,
  paddingEnd,
  paddingX,
  paddingY,
  UNSAFE_style,
  UNSAFE_className,
}: DefaultPanelContentProps): JSX.Element {
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
      backgroundColor={backgroundColor}
      padding={padding}
      paddingTop={paddingTop}
      paddingBottom={paddingBottom}
      paddingStart={paddingStart}
      paddingEnd={paddingEnd}
      paddingX={paddingX}
      paddingY={paddingY}
      overflow={overflow}
      UNSAFE_style={UNSAFE_style}
      UNSAFE_className={
        UNSAFE_className == null
          ? 'dh-default-panel-content'
          : `${UNSAFE_className} dh-default-panel-content`
      }
    >
      <Flex
        UNSAFE_className="dh-inner-react-panel"
        direction={direction}
        wrap={wrap}
        justifyContent={justifyContent}
        alignContent={alignContent}
        alignItems={alignItems}
        gap={gap}
        rowGap={rowGap}
        columnGap={columnGap}
      >
        {content}
      </Flex>
    </View>
  );
}

export default DefaultPanelContent;
