import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JSONRPCClient } from 'json-rpc-2.0';
import { type ChartPanelProps } from '@deephaven/dashboard-core-plugins';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import {
  CALLABLE_KEY,
  ExportedObject,
  OBJECT_KEY,
  isCallableNode,
  isElementNode,
  isObjectNode,
} from './ElementUtils';
import ElementView from './ElementView';
import ObjectView from './ObjectView';

const log = Log.module('@deephaven/js-plugin-ui/ElementPanel');

export interface WidgetMessageDetails {
  getDataAsBase64(): string;
  getDataAsString(): string;
  exportedObjects: ExportedObject[];
}

export interface JsWidget extends WidgetMessageDetails {
  addEventListener: (
    type: string,
    listener: (event: unknown) => void
  ) => () => void;
  sendMessage: (message: string, args: unknown[]) => void;
}

export interface ElementPanelProps extends ChartPanelProps {
  fetch(): Promise<JsWidget>;
}

function ElementPanel(props: ElementPanelProps) {
  const { fetch } = props;
  const dh = useApi();

  const [widget, setWidget] = useState<JsWidget>();
  const [element, setElement] = useState<React.ReactNode>();

  const jsonClient = useMemo(
    () =>
      new JSONRPCClient(request => {
        log.info('Sending request', request);

        widget?.sendMessage(JSON.stringify(request), []);
      }),
    [widget]
  );

  const makeElement = useCallback(
    (details: WidgetMessageDetails): React.ReactNode => {
      const data = details.getDataAsString();
      log.debug2('Widget data is', data);
      const root = JSON.parse(data, (key, value) => {
        // Need to re-hydrate any objects that are defined
        if (isCallableNode(value)) {
          // Replace this object with a function that will call this callable on the server
          return (...args: unknown[]) => {
            const callableId = value[CALLABLE_KEY];
            log.warn('XXX Callable called', callableId, ...args);
            // TODO: Actually listen for a response from the server and return it async
            jsonClient.request(callableId, args);
          };
        }
        if (isObjectNode(value)) {
          // Replace this node with the exported object
          const exportedObject = details.exportedObjects[value[OBJECT_KEY]];
          log.info(
            "XXX ObjectNode's on key",
            key,
            'exporting object',
            exportedObject
          );

          // TODO: Only export the object view if it's being rendered as a child or is the root...
          // Should probably just return it as just the object here, then parse the tree after looking for all exported objects rendered as nodes...
          return <ObjectView object={exportedObject} />;
        }
        if (isElementNode(value)) {
          return <ElementView element={value} />;
        }

        return value;
      });
      // Returned:
      log.info('XXX Widget parsed', root);
      return root;
    },
    [jsonClient]
  );

  const reloadObjects = useCallback(async () => {
    if (widget == null) {
      return;
    }

    const newElement = makeElement(widget);
    log.info('Loaded Element', newElement);
    setElement(newElement);
  }, [makeElement, widget]);

  const reloadWidget = useCallback(async () => {
    const widgetInfo = await fetch();
    log.info('widgetInfo', widgetInfo);
    setWidget(widgetInfo);
  }, [fetch]);

  useEffect(() => {
    if (widget == null) {
      return;
    }
    reloadObjects();
    return widget.addEventListener(dh.Widget.EVENT_MESSAGE, async event => {
      log.info('event is', event);

      const newElement = makeElement(
        (event as any).detail as WidgetMessageDetails
      );
      log.info('Updated Element', newElement);
      setElement(newElement);
    });
  }, [dh, makeElement, reloadObjects, reloadWidget, widget]);

  useEffect(() => {
    reloadWidget();
  }, [reloadWidget]);

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

ElementPanel.displayName = '@deephaven/js-plugin-ui/ElementPanel';

export default ElementPanel;
