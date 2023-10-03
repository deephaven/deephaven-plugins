/**
 * Handles document events for one widget.
 */
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
  isObjectNode,
} from './ElementUtils';
import { JsWidget, WidgetMessageEvent } from './WidgetTypes';
import DocumentHandler from './DocumentHandler';

const log = Log.module('@deephaven/js-plugin-ui/WidgetHandler');

export interface WidgetHandlerProps {
  /** Fetch a widget thats an Element type */
  fetch(): Promise<JsWidget>;

  /** Layout this widget is attached to */
  layout: DashboardPluginComponentProps['layout'];
}

function WidgetHandler(props: WidgetHandlerProps) {
  const { fetch, layout } = props;
  const dh = useApi();

  const [widget, setWidget] = useState<JsWidget>();
  const [element, setElement] = useState<ElementNode>();

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
  const parseData = useCallback(
    /**
     * Parse the data from the server, replacing any callable nodes with functions that call the server.
     * Replaces all Callables with an async callback that will automatically call the server use JSON-RPC.
     * Replaces all Objects with the exported object from the server.
     * Element nodes are not replaced. Those are handled in `ElementHandler`.
     *
     * @param data The data to parse
     * @param exportedObjects The exported objects to use for re-hydrating objects
     * @returns The parsed data
     */
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
          return exportedObjects[value[OBJECT_KEY]];
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
        async (newDocument: ElementNode) => {
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

  return element ? <DocumentHandler element={element} layout={layout} /> : null;
}

WidgetHandler.displayName = '@deephaven/js-plugin-ui/WidgetHandler';

export default WidgetHandler;
