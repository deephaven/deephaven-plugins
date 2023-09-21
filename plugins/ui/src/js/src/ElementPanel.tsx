import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from 'json-rpc-2.0';
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

export interface WidgetMessageEvent {
  detail: WidgetMessageDetails;
}

export interface JsWidget extends WidgetMessageDetails {
  addEventListener: (
    type: string,
    listener: (event: WidgetMessageEvent) => void
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

  // Bi-directional communication as defined in https://www.npmjs.com/package/json-rpc-2.0
  const jsonClient = useMemo(
    () =>
      widget != null
        ? new JSONRPCServerAndClient(
            new JSONRPCServer(),
            new JSONRPCClient(request => {
              log.info('Sending request', request);
              widget.sendMessage(JSON.stringify(request), []);
            })
          )
        : null,
    [widget]
  );

  /**
   * Parse the data from the server, replacing any callable nodes with functions that call the server.
   */
  const parseData = useCallback(
    (data: string, exportedObjects: ExportedObject[]) =>
      JSON.parse(data, (key, value) => {
        // Need to re-hydrate any objects that are defined
        if (isCallableNode(value)) {
          const callableId = value[CALLABLE_KEY];
          log.info('Registering callableId', callableId);
          return async (...args: unknown[]) => {
            log.debug('Callable called', callableId, ...args);
            return jsonClient?.request(callableId, args);
          };
        }
        if (isObjectNode(value)) {
          // Replace this node with the exported object
          const exportedObject = exportedObjects[value[OBJECT_KEY]];

          // TODO: Only export the object view if it's being rendered as a child or is the root...
          // Should probably just return it as just the object here, then parse the tree after looking for all exported objects rendered as nodes...
          // Or get ElementView to handle it instead...
          return <ObjectView object={exportedObject} />;
        }
        if (isElementNode(value)) {
          return <ElementView element={value} />;
        }

        return value;
      }),
    [jsonClient]
  );

  useEffect(
    function initMethods() {
      if (jsonClient == null) {
        return;
      }

      log.info('Adding methods to jsonClient');
      jsonClient.addMethod(
        'documentUpdated',
        async (newDocument: React.ReactNode) => {
          log.info('documentUpdated', newDocument);
          setElement(newDocument);
        }
      );

      return () => {
        jsonClient.rejectAllPendingRequests('Widget was changed');
      };
    },
    [jsonClient]
  );

  useEffect(() => {
    if (widget == null) {
      return;
    }
    function receiveData(data: string, exportedObjects: ExportedObject[]) {
      log.info('Data received', data, exportedObjects);
      const parsedData = parseData(data, exportedObjects);
      jsonClient?.receiveAndSend(parsedData);
    }

    const cleanup = widget.addEventListener(
      dh.Widget.EVENT_MESSAGE,
      async (event: WidgetMessageEvent) => {
        receiveData(
          event.detail.getDataAsString(),
          event.detail.exportedObjects
        );
      }
    );

    log.info('Receiving initial data');
    // We need to get the initial data and process it. It should be a documentUpdated command.
    receiveData(widget.getDataAsString(), widget.exportedObjects);

    return () => {
      log.info('Cleaning up listener');
      cleanup();
    };
  }, [dh, jsonClient, parseData, widget]);

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

ElementPanel.displayName = '@deephaven/js-plugin-ui/ElementPanel';

export default ElementPanel;
