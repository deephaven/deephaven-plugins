import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from 'json-rpc-2.0';
import { DashboardPluginComponentProps } from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import {
  CALLABLE_KEY,
  ElementNode,
  ExportedObject,
  OBJECT_KEY,
  isCallableNode,
  isElementNode,
  isObjectNode,
} from './ElementUtils';

import ElementView from './ElementView';
import ObjectView from './ObjectView';
import { JsWidget } from './WidgetTypes';

const log = Log.module('@deephaven/js-plugin-ui/ElementHandler');

export interface DocumentHandlerProps {
  /** The root element to render */
  element: ElementNode;

  /** The layout to add panels to */
  layout: DashboardPluginComponentProps['layout'];
}

function DocumentHandler({ element, layout }: DocumentHandlerProps) {
  const dh = useApi();

  // TODO: Need to fill this all in... create LayoutPanels
  useEffect(
    function loadWidget() {
      let isCancelled = false;
      async function loadWidgetInternal() {
        const newWidget = await fetch();
        if (isCancelled) {
          return;
        }
        log.info('newWidget', newWidget);
        setWidget(newWidget);
      }
      loadWidgetInternal();
      return () => {
        isCancelled = true;
      };
    },
    [fetch]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {element}
    </div>
  );
}

DocumentHandler.displayName = '@deephaven/js-plugin-ui/DocumentHandler';

export default DocumentHandler;
