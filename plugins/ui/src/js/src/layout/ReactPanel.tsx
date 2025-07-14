import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import { nanoid } from 'nanoid';
import {
  LayoutUtils,
  PanelEvent,
  PanelIdContext,
  useLayoutManager,
  useListener,
} from '@deephaven/dashboard';
import {
  View,
  ViewProps,
  Flex,
  FlexProps,
  LoadingOverlay,
} from '@deephaven/components';
import Log from '@deephaven/log';
import { PersistentStateProvider } from '@deephaven/plugin';
import PortalPanel from './PortalPanel';
import { ReactPanelControl, useReactPanel } from './ReactPanelManager';
import { ReactPanelProps } from './LayoutUtils';
import { useParentItem } from './ParentItemContext';
import { ReactPanelContext, usePanelId } from './ReactPanelContext';
import { usePortalPanelManager } from './PortalPanelManagerContext';
import ReactPanelErrorBoundary from './ReactPanelErrorBoundary';
import useWidgetStatus from './useWidgetStatus';
import WidgetErrorView from '../widget/WidgetErrorView';
import { NestedPanelError } from '../errors';

const log = Log.module('@deephaven/js-plugin-ui/ReactPanel');

interface Props
  extends ReactPanelProps,
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
    >,
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
    > {}

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 * Will trigger an `onOpen` when the portal is opened, and `onClose` when closed.
 * Note that because the `PortalPanel` will be saved with the GoldenLayout config, it's possible there is already a panel that exists with the same ID.
 * In that case, the existing panel will be re-used.
 */
function ReactPanel({
  // Apply the same defaults as panel.py
  // but also defined here, incase the panel
  // is being implicitly created
  children,
  title,
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
}: Props): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const { metadata, onClose, onOpen, panelId, onDataChange, getInitialData } =
    useReactPanel();
  const portalManager = usePortalPanelManager();
  const portal = portalManager.get(panelId);
  const panelTitle = title ?? metadata?.name ?? '';
  const [initialData, setInitialData] = useState(getInitialData());
  const onErrorReset = useCallback(() => {
    // Not EMPTY_ARRAY, because we always want to trigger a re-render
    // in case a panel is reloaded and errors again
    setInitialData([]);
  }, []);

  // Tracks whether the panel is open and that we have emitted the onOpen event
  const isPanelOpenRef = useRef(false);
  // If there is already a portal that exists, then we're rehydrating from a dehydrated state
  // Initialize the `openedWidgetRef` accordingly on initialization
  const openedMetadataRef = useRef<ReactPanelControl['metadata']>(
    portal == null ? undefined : metadata
  );
  // Used to check if panelTitle was updated
  const prevPanelTitleRef = useRef<string>(panelTitle);

  // We want to regenerate the key every time the metadata changes, so that the portal is re-rendered
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contentKey = useMemo(() => nanoid(), [metadata]);

  const parent = useParentItem();
  const contextPanelId = usePanelId();
  if (contextPanelId != null) {
    throw new NestedPanelError(
      'ui.panel must be a top-level component or used within a dashboard layout.'
    );
  }
  const { eventHub } = layoutManager;

  useEffect(
    () => () => {
      if (isPanelOpenRef.current) {
        log.debug('Closing panel', panelId);
        LayoutUtils.closeComponent(parent, { id: panelId });
        isPanelOpenRef.current = false;
        onClose();
      }
    },
    [parent, onClose, panelId]
  );

  const handlePanelClosed = useCallback(
    closedPanelId => {
      if (closedPanelId === panelId && isPanelOpenRef.current) {
        log.debug('Panel closed', panelId);
        isPanelOpenRef.current = false;
        onClose();
      }
    },
    [onClose, panelId]
  );

  useListener(eventHub, PanelEvent.CLOSED, handlePanelClosed);

  useEffect(
    /**
     * Opens a panel in the layout if necessary. There are a few cases this is triggered:
     * 1. Panel has not been opened yet: we need to open the panel in this case.
     * 2. Panel metadata changes: we need to update the panel with the new metadata, show the panel in its current stack,
     *    and refresh the content with new state.
     * 3. Widget is being re-hydrated: we need to check if the panel ID is already open, and then use that existing portal.
     *    We don't need to focus in this case, as this is when a whole dashboard is being re-hydrated - not when the user is
     *    opening this widget in particular.
     */
    function openIfNecessary() {
      const itemConfig = { id: panelId };
      const existingStack = LayoutUtils.getStackForConfig(parent, itemConfig);
      if (existingStack == null) {
        const config = {
          type: 'react-component' as const,
          component: PortalPanel.displayName,
          props: {},
          title: panelTitle,
          id: panelId,
        };

        LayoutUtils.openComponent({ root: parent, config });
        log.debug('Opened panel', panelId, config);
      } else if (openedMetadataRef.current !== metadata) {
        const contentItem = LayoutUtils.getContentItemInStack(
          existingStack,
          itemConfig
        );
        if (contentItem != null) {
          existingStack.setActiveContentItem(contentItem);
        }
      }

      openedMetadataRef.current = metadata;
      if (!isPanelOpenRef.current) {
        // We don't need to send an opened signal again
        isPanelOpenRef.current = true;
        onOpen();
      }

      if (prevPanelTitleRef.current !== panelTitle) {
        prevPanelTitleRef.current = panelTitle;
        LayoutUtils.renameComponent(parent, itemConfig, panelTitle);
      }
    },
    [parent, metadata, onOpen, panelId, panelTitle]
  );
  const widgetStatus = useWidgetStatus();

  let renderedChildren: React.ReactNode;
  if (widgetStatus.status === 'loading') {
    renderedChildren = <LoadingOverlay />;
  } else if (widgetStatus.status === 'error') {
    renderedChildren = <WidgetErrorView error={widgetStatus.error} />;
  } else {
    renderedChildren = children;
  }

  return portal
    ? ReactDOM.createPortal(
        <ReactPanelContext.Provider value={panelId}>
          <PanelIdContext.Provider value={panelId}>
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
                  ? 'dh-react-panel'
                  : `${UNSAFE_className} dh-react-panel`
              }
            >
              <Flex
                UNSAFE_className="dh-inner-react-panel"
                wrap={wrap}
                direction={direction}
                justifyContent={justifyContent}
                alignContent={alignContent}
                alignItems={alignItems}
                gap={gap}
                rowGap={rowGap}
                columnGap={columnGap}
              >
                <ReactPanelErrorBoundary onReset={onErrorReset}>
                  {/**
                   * Don't render the children if there's an error with the widget. If there's an error with the widget, we can assume the children won't render properly,
                   * but we still want the panels to appear so things don't disappear/jump around.
                   */}
                  <PersistentStateProvider
                    initialState={initialData}
                    onChange={onDataChange}
                  >
                    {renderedChildren ?? null}
                  </PersistentStateProvider>
                </ReactPanelErrorBoundary>
              </Flex>
            </View>
          </PanelIdContext.Provider>
        </ReactPanelContext.Provider>,
        portal,
        contentKey
      )
    : null;
}

export default ReactPanel;
