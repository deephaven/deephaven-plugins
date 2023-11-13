/**
 * Handles document events for one widget.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from 'json-rpc-2.0';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Widget, WidgetExportedObject } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  CALLABLE_KEY,
  ElementNode,
  OBJECT_KEY,
  isCallableNode,
  isObjectNode,
} from './ElementUtils';
import { WidgetMessageEvent, WidgetWrapper } from './WidgetTypes';
import DocumentHandler from './DocumentHandler';

const log = Log.module('@deephaven/js-plugin-ui/WidgetHandler');

export interface WidgetHandlerProps {
  /** Widget for this to handle */
  widget: WidgetWrapper;

  /** Triggered when all panels opened from this widget have closed */
  onClose?: (widgetId: string) => void;
}

function WidgetHandler({ onClose, widget: wrapper }: WidgetHandlerProps) {
  const dh = useApi();

  const [widget, setWidget] = useState<Widget>();
  const [element, setElement] = useState<ElementNode>();

  useEffect(
    () => () => {
      widget?.close();
    },
    [widget]
  );

  // Bi-directional communication as defined in https://www.npmjs.com/package/json-rpc-2.0
  const jsonClient = useMemo(
    () =>
      widget != null
        ? new JSONRPCServerAndClient(
            new JSONRPCServer(),
            new JSONRPCClient(request => {
              log.debug('Sending request', request);
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
     * Element nodes are not replaced. Those are handled in `DocumentHandler`.
     *
     * @param data The data to parse
     * @param exportedObjects The exported objects to use for re-hydrating objects
     * @returns The parsed data
     */
    (data: string, exportedObjects: WidgetExportedObject[]) =>
      JSON.parse(data, (key, value) => {
        // Need to re-hydrate any objects that are defined
        if (isCallableNode(value)) {
          const callableId = value[CALLABLE_KEY];
          log.debug2('Registering callableId', callableId);
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

      log.debug('Adding methods to jsonClient');
      jsonClient.addMethod('documentUpdated', async (params: [ElementNode]) => {
        log.debug2('documentUpdated', params[0]);
        setElement(params[0]);
      });

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
    function receiveData(
      data: string,
      exportedObjects: WidgetExportedObject[]
    ) {
      log.debug2('Data received', data, exportedObjects);
      const parsedData = parseData(data, exportedObjects);
      jsonClient?.receiveAndSend(parsedData);
    }

    const cleanup = widget.addEventListener(
      dh.Widget.EVENT_MESSAGE,
      (event: WidgetMessageEvent) => {
        receiveData(
          event.detail.getDataAsString(),
          event.detail.exportedObjects
        );
      }
    );

    log.debug('Receiving initial data');
    // We need to get the initial data and process it. It should be a documentUpdated command.
    receiveData(widget.getDataAsString(), widget.exportedObjects);

    return () => {
      log.debug('Cleaning up listener');
      cleanup();
    };
  }, [dh, jsonClient, parseData, widget]);

  useEffect(
    function loadWidget() {
      log.debug('loadWidget', wrapper.id, wrapper.definition);
      let isCancelled = false;
      async function loadWidgetInternal() {
        const newWidget = await wrapper.fetch();
        if (isCancelled) {
          newWidget.close();
          return;
        }
        log.debug('newWidget', wrapper.id, wrapper.definition, newWidget);
        setWidget(newWidget);
      }
      loadWidgetInternal();
      return () => {
        isCancelled = true;
      };
    },
    [wrapper]
  );

  const handleDocumentClose = useCallback(() => {
    log.debug('Widget document closed', wrapper.id);
    onClose?.(wrapper.id);
  }, [onClose, wrapper.id]);

  return useMemo(
    () =>
      element ? (
        <DocumentHandler
          definition={wrapper.definition}
          element={element}
          onClose={handleDocumentClose}
        />
      ) : null,
    [element, handleDocumentClose, wrapper]
  );
}

WidgetHandler.displayName = '@deephaven/js-plugin-ui/WidgetHandler';

export default WidgetHandler;
