import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from 'json-rpc-2.0';
import {
  DashboardPluginComponentProps,
  WidgetDefinition,
} from '@deephaven/dashboard';
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
import LayoutPanel from './LayoutPanel';

const log = Log.module('@deephaven/js-plugin-ui/ElementHandler');

export interface DocumentHandlerProps {
  definition: WidgetDefinition;

  /** The root element to render */
  element: ElementNode;

  /** The layout to add panels to */
  layout: DashboardPluginComponentProps['layout'];
}

function DocumentHandler({
  definition,
  element,
  layout,
}: DocumentHandlerProps) {
  // TODO: Check for different panels, dashboards, etc.
  return (
    <LayoutPanel
      layout={layout}
      title={definition.title ?? definition.id ?? definition.type}
    >
      <ElementView element={element} />
    </LayoutPanel>
  );
}

DocumentHandler.displayName = '@deephaven/js-plugin-ui/DocumentHandler';

export default DocumentHandler;
