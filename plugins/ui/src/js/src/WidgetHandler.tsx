/**
 * Handles document events for one widget.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

  // When we fetch a widget, the client is then responsible for the exported objects.
  // These objects could stay alive even after the widget is closed if we wanted to,
  // but for our use case we want to close them when the widget is closed, so we close them all on unmount.
  const exportedObjectMap = useRef<Map<number, WidgetExportedObject>>(
    new Map()
  );
  const exportedObjectCount = useRef(0);

  useEffect(
    () =>
      function closeWidget() {
        exportedObjectMap.current.forEach(exportedObject => {
          exportedObject.close();
        });
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
     * @param newExportedObjects New exported objects to add to the map
     * @returns The parsed data
     */
    (data: string, newExportedObjects: WidgetExportedObject[]) => {
      // Keep track of exported objects that are no longer in use after this render.
      // We close those objects that are no longer referenced, as they will never be referenced again.
      const deadObjectMap = new Map(exportedObjectMap.current);
      const newExportedObjectMap = new Map(exportedObjectMap.current);

      for (let i = 0; i < newExportedObjects.length; i += 1) {
        const exportedObject = newExportedObjects[i];
        const exportedObjectKey = exportedObjectCount.current;
        exportedObjectCount.current += 1;

        if (exportedObject.type === 'Table') {
          // Table has some special handling compared to other widgets
          // We want to return a copy of the table, and only release the table object when the widget is actually closed
        }
        // Some elements may fetch the object, then be hidden and close the object temporarily, and then shown again.
        // We can only fetch each exported object once, so just fetch it once and cache it, then subscribe/unsubscribe as needed.
        const cachedObject: [Promise<unknown> | undefined] = [undefined];
        const proxyObject = new Proxy(exportedObject, {
          get: (target, prop, ...rest) => {
            if (prop === 'fetch') {
              return () => {
                if (cachedObject[0] === undefined) {
                  cachedObject[0] = target.fetch();
                }
                return cachedObject[0];
              };
            }
            // if (prop === 'close') {
            //   return () => {
            //     // We only want to unsubscribe from the object here, not close it. We will close it when the widget is closed, but until then the object may be needed again.
            //     (cachedObject[0] as any).unsubscribe();
            //   };
            // }
            return Reflect.get(target, prop, ...rest);
          },
        });

        newExportedObjectMap.set(exportedObjectKey, proxyObject);
      }

      const parsedData = JSON.parse(data, (key, value) => {
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
          const objectKey = value[OBJECT_KEY];
          const exportedObject = newExportedObjectMap.get(objectKey);
          if (exportedObject === undefined) {
            // The map should always have the exported object for a key, otherwise the protocol is broken
            throw new Error(`Invalid exported object key ${objectKey}`);
          }
          deadObjectMap.delete(objectKey);
          return exportedObject;
        }

        return value;
      });

      // Close any objects that are no longer referenced
      deadObjectMap.forEach((deadObject, objectKey) => {
        log.debug('Closing dead object', objectKey);
        deadObject.close();
        newExportedObjectMap.delete(objectKey);
      });

      exportedObjectMap.current = newExportedObjectMap;
      return parsedData;
    },
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
      newExportedObjects: WidgetExportedObject[]
    ) {
      log.debug2('Data received', data, newExportedObjects);
      const parsedData = parseData(data, newExportedObjects);
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
