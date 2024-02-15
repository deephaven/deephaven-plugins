/**
 * Handles document events for one widget.
 */
import React, {
  ReactNode,
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
import type { Widget, WidgetExportedObject } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  CALLABLE_KEY,
  OBJECT_KEY,
  isCallableNode,
  isElementNode,
  isObjectNode,
} from '../elements/ElementUtils';
import {
  WidgetData,
  WidgetId,
  WidgetMessageEvent,
  WidgetWrapper,
} from './WidgetTypes';
import DocumentHandler from './DocumentHandler';
import { getComponentForElement } from './WidgetUtils';

const log = Log.module('@deephaven/js-plugin-ui/WidgetHandler');

export interface WidgetHandlerProps {
  /** Widget for this to handle */
  widget: WidgetWrapper;

  /** Triggered when all panels opened from this widget have closed */
  onClose?: (widgetId: WidgetId) => void;

  /** Triggered when the data in the widget changes */
  onDataChange?: (widgetId: WidgetId, data: WidgetData) => void;
}

function WidgetHandler({
  onClose,
  onDataChange = EMPTY_FUNCTION,
  widget: wrapper,
}: WidgetHandlerProps) {
  const [widget, setWidget] = useState<Widget>();
  const [document, setDocument] = useState<ReactNode>();

  // When we fetch a widget, the client is then responsible for the exported objects.
  // These objects could stay alive even after the widget is closed if we wanted to,
  // but for our use case we want to close them when the widget is closed, so we close them all on unmount.
  const exportedObjectMap = useRef<Map<number, WidgetExportedObject>>(
    new Map()
  );
  const exportedObjectCount = useRef(0);

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
  const parseDocument = useCallback(
    /**
     * Parse the data from the server, replacing some of the nodes on the way.
     * Replaces all Callables with an async callback that will automatically call the server use JSON-RPC.
     * Replaces all Objects with the exported object from the server.
     * Replaces all Element nodes with the ReactNode derived from that Element.
     *
     * @param data The data to parse
     * @returns The parsed data
     */
    (data: string) => {
      // Keep track of exported objects that are no longer in use after this render.
      // We close those objects that are no longer referenced, as they will never be referenced again.
      const deadObjectMap = new Map(exportedObjectMap.current);

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
          const exportedObject = exportedObjectMap.current.get(objectKey);
          if (exportedObject === undefined) {
            // The map should always have the exported object for a key, otherwise the protocol is broken
            throw new Error(`Invalid exported object key ${objectKey}`);
          }
          deadObjectMap.delete(objectKey);
          return exportedObject;
        }

        if (isElementNode(value)) {
          // Replace the elements node with the Component it maps to
          try {
            return getComponentForElement(value);
          } catch (e) {
            log.warn('Error getting component for element', e);
            return value;
          }
        }

        return value;
      });

      // Close any objects that are no longer referenced
      deadObjectMap.forEach((deadObject, objectKey) => {
        log.debug('Closing dead object', objectKey);
        deadObject.close();
        exportedObjectMap.current.delete(objectKey);
      });

      log.debug2(
        'Parsed data',
        parsedData,
        'exportedObjectMap',
        exportedObjectMap.current,
        'deadObjectMap',
        deadObjectMap
      );
      return parsedData;
    },
    [jsonClient]
  );

  const updateExportedObjects = useCallback(
    (newExportedObjects: WidgetExportedObject[]) => {
      for (let i = 0; i < newExportedObjects.length; i += 1) {
        const exportedObject = newExportedObjects[i];
        const exportedObjectKey = exportedObjectCount.current;
        exportedObjectCount.current += 1;
        exportedObjectMap.current.set(exportedObjectKey, exportedObject);
      }
    },
    []
  );

  useEffect(
    function initMethods() {
      if (jsonClient == null) {
        return;
      }

      log.debug('Adding methods to jsonClient');
      jsonClient.addMethod('documentUpdated', async (params: [string]) => {
        log.debug2('documentUpdated', params[0]);
        const newDocument = parseDocument(params[0]);
        setDocument(newDocument);
      });

      return () => {
        jsonClient.rejectAllPendingRequests('Widget was changed');
      };
    },
    [jsonClient, parseDocument]
  );

  useEffect(() => {
    if (widget == null) {
      return;
    }
    // Need to reset the exported object map and count
    const widgetExportedObjectMap = new Map<number, WidgetExportedObject>();
    exportedObjectMap.current = widgetExportedObjectMap;
    exportedObjectCount.current = 0;
    function receiveData(
      data: string,
      newExportedObjects: WidgetExportedObject[]
    ) {
      log.debug2('Data received', data, newExportedObjects);
      updateExportedObjects(newExportedObjects);
      jsonClient?.receiveAndSend(JSON.parse(data));
    }

    const cleanup = widget.addEventListener(
      // This is defined as dh.Widget.EVENT_MESSAGE in Core, but that constant doesn't exist on the Enterprise API
      // Dashboard plugins in Enterprise are loaded with the Enterprise API in the context of the dashboard, so trying to fetch the constant fails
      // Just use the constant value here instead. Another option would be to add the Widget constants to Enterprise, but we don't want to port over all that functionality.
      'message',
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
      log.debug('Cleaning up widget', widget);
      cleanup();
      widget.close();

      // Clean up any exported objects that haven't been closed yet
      Array.from(widgetExportedObjectMap.values()).forEach(exportedObject => {
        exportedObject.close();
      });
    };
  }, [jsonClient, parseDocument, updateExportedObjects, widget]);

  useEffect(
    function loadWidget() {
      log.debug('loadWidget', wrapper.id, wrapper.widget);
      let isCancelled = false;
      async function loadWidgetInternal() {
        const newWidget = await wrapper.fetch();
        if (isCancelled) {
          newWidget.close();
          newWidget.exportedObjects.forEach(exportedObject => {
            exportedObject.close();
          });
          return;
        }
        log.debug('newWidget', wrapper.id, wrapper.widget, newWidget);
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

  const handleDataChange = useCallback(
    (data: WidgetData) => {
      log.debug('handleDataChange', wrapper.id, data);
      onDataChange?.(wrapper.id, data);
    },
    [wrapper.id, onDataChange]
  );

  return useMemo(
    () =>
      document != null ? (
        <DocumentHandler
          widget={wrapper.widget}
          data={wrapper.data}
          onDataChange={handleDataChange}
          onClose={handleDocumentClose}
        >
          {document}
        </DocumentHandler>
      ) : null,
    [document, handleDataChange, handleDocumentClose, wrapper]
  );
}

WidgetHandler.displayName = '@deephaven/js-plugin-ui/WidgetHandler';

export default WidgetHandler;
