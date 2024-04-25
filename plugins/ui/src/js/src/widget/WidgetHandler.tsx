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
import { WidgetDescriptor } from '@deephaven/dashboard';
import type { dh } from '@deephaven/jsapi-types';
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
  ReadonlyWidgetData,
  WidgetDataUpdate,
  WidgetMessageEvent,
  WidgetError,
  METHOD_DOCUMENT_ERROR,
  METHOD_DOCUMENT_UPDATED,
} from './WidgetTypes';
import DocumentHandler from './DocumentHandler';
import { getComponentForElement } from './WidgetUtils';
import ReactPanel from '../layout/ReactPanel';
import WidgetErrorView from './WidgetErrorView';

const log = Log.module('@deephaven/js-plugin-ui/WidgetHandler');

export interface WidgetHandlerProps {
  /** Widget for this to handle */
  widget: WidgetDescriptor;

  /** Fetch the widget instance */
  fetch: () => Promise<dh.Widget>;

  /** Widget data to display */
  initialData?: ReadonlyWidgetData;

  /** Triggered when all panels opened from this widget have closed */
  onClose?: () => void;

  /** Triggered when the data in the widget changes. Only the changed data is provided. */
  onDataChange?: (data: WidgetDataUpdate) => void;
}

function WidgetHandler({
  onClose,
  onDataChange = EMPTY_FUNCTION,
  fetch,
  widget: descriptor,
  initialData: initialDataProp,
}: WidgetHandlerProps): JSX.Element | null {
  const [widget, setWidget] = useState<dh.Widget>();
  const [document, setDocument] = useState<ReactNode>();
  const [initialData] = useState(initialDataProp);

  // When we fetch a widget, the client is then responsible for the exported objects.
  // These objects could stay alive even after the widget is closed if we wanted to,
  // but for our use case we want to close them when the widget is closed, so we close them all on unmount.
  const exportedObjectMap = useRef<Map<number, dh.WidgetExportedObject>>(
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

  const sendSetState = useCallback(
    (newState: Record<string, unknown> = {}) => {
      if (jsonClient == null) {
        return;
      }
      jsonClient.request('setState', [newState]).then(
        result => {
          log.debug('Set state result', result);
        },
        e => {
          log.error('Error setting state: ', e);
        }
      );
    },
    [jsonClient]
  );

  const setDocumentError = useCallback(
    (error: WidgetError) => {
      // When we get an error for the server, we want to display it to the user.
      // Display the error in a panel that the user can see.
      setDocument(
        <ReactPanel>
          <WidgetErrorView error={error} onReload={() => sendSetState()} />
        </ReactPanel>
      );
    },
    [sendSetState]
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
    (newExportedObjects: dh.WidgetExportedObject[]) => {
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
      jsonClient.addMethod(
        METHOD_DOCUMENT_UPDATED,
        async (params: [string, string]) => {
          log.debug2(METHOD_DOCUMENT_UPDATED, params);
          const [documentParam, stateParam] = params;
          const newDocument = parseDocument(documentParam);
          setDocument(newDocument);
          if (stateParam != null) {
            try {
              const newState = JSON.parse(stateParam);
              onDataChange({ state: newState });
            } catch (e) {
              log.warn(
                'Error parsing state, widget state may not be persisted.',
                e
              );
            }
          }
        }
      );

      jsonClient.addMethod(METHOD_DOCUMENT_ERROR, (params: [string]) => {
        log.error('Document error', params);
        const error: WidgetError = JSON.parse(params[0]);
        setDocumentError(error);
      });

      return () => {
        jsonClient.rejectAllPendingRequests('Widget was changed');
      };
    },
    [jsonClient, onDataChange, parseDocument, setDocumentError]
  );

  /**
   * Triggered when the widget object is loaded. Initializes the state of the widget and/or receives initial data.
   */
  useEffect(
    function initializeWidget() {
      if (widget == null || jsonClient == null) {
        return;
      }
      // Need to reset the exported object map and count
      const widgetExportedObjectMap = new Map<
        number,
        dh.WidgetExportedObject
      >();
      exportedObjectMap.current = widgetExportedObjectMap;
      exportedObjectCount.current = 0;

      // Set a var to the client that we know will not be null in the closure below
      const activeClient = jsonClient;
      async function receiveData(
        data: string,
        newExportedObjects: dh.WidgetExportedObject[]
      ) {
        log.debug2('Data received', data, newExportedObjects);
        updateExportedObjects(newExportedObjects);
        if (data.length > 0) {
          try {
            await activeClient.receiveAndSend(JSON.parse(data));
          } catch (e) {
            // We already have an `errorListener` registered when declaring the JSONRPCServerAndClient,
            // and that contains more information than this error does, so just use that.
            log.debug('Error receiving data', e);
          }
        }
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
      // We need to get the initial data and process it. If it's an old version of the plugin, it could be a documentUpdated command.
      receiveData(widget.getDataAsString(), widget.exportedObjects);

      // We set the initial state of the widget. We'll then get a documentUpdated as a response.
      sendSetState(initialData?.state);

      return () => {
        log.debug('Cleaning up widget', widget);
        cleanup();
        widget.close();

        // Clean up any exported objects that haven't been closed yet
        Array.from(widgetExportedObjectMap.values()).forEach(exportedObject => {
          exportedObject.close();
        });
      };
    },
    [jsonClient, initialData, sendSetState, updateExportedObjects, widget]
  );

  useEffect(
    function loadWidget() {
      log.debug('loadWidget', descriptor);
      let isCancelled = false;
      async function loadWidgetInternal() {
        const newWidget = await fetch();
        if (isCancelled) {
          log.debug2('loadWidgetInternal cancelled', descriptor, newWidget);
          newWidget.close();
          newWidget.exportedObjects.forEach(
            (exportedObject: dh.WidgetExportedObject) => {
              exportedObject.close();
            }
          );
          return;
        }
        log.debug('loadWidgetInternal done', descriptor, newWidget);
        setWidget(newWidget);
      }
      loadWidgetInternal();
      return () => {
        isCancelled = true;
      };
    },
    [fetch, descriptor]
  );

  return useMemo(
    () =>
      document != null ? (
        <DocumentHandler
          widget={descriptor}
          initialData={initialData}
          onDataChange={onDataChange}
          onClose={onClose}
        >
          {document}
        </DocumentHandler>
      ) : null,
    [document, descriptor, initialData, onClose, onDataChange]
  );
}

WidgetHandler.displayName = '@deephaven/js-plugin-ui/WidgetHandler';

export default WidgetHandler;
