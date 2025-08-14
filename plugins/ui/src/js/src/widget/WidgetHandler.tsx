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
// eslint-disable-next-line camelcase
import { unstable_batchedUpdates } from 'react-dom';
import { applyPatch, type Operation } from 'fast-json-patch';
import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from 'json-rpc-2.0';
import { useLayoutManager, WidgetDescriptor } from '@deephaven/dashboard';
import { useWidget } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { usePluginsElementMap } from '@deephaven/plugin';
import { EMPTY_FUNCTION } from '@deephaven/utils';

import {
  CALLABLE_KEY,
  OBJECT_KEY,
  isCallableNode,
  isElementNode,
  isObjectNode,
  isUriNode,
} from '../elements/utils/ElementUtils';
import {
  ReadonlyWidgetData,
  WidgetDataUpdate,
  WidgetMessageEvent,
  WidgetError,
  METHOD_DOCUMENT_ERROR,
  METHOD_DOCUMENT_PATCHED,
  METHOD_EVENT,
} from './WidgetTypes';
import DocumentHandler from './DocumentHandler';
import {
  transformNode,
  getComponentForElement,
  WIDGET_ELEMENT,
  wrapCallable,
  DASHBOARD_ELEMENT,
} from './WidgetUtils';
import WidgetStatusContext, {
  WidgetStatus,
} from '../layout/WidgetStatusContext';
import WidgetErrorView from './WidgetErrorView';
import ReactPanel from '../layout/ReactPanel';
import Toast, { TOAST_EVENT } from '../events/Toast';
import UriExportedObject from './UriExportedObject';

const log = Log.module('@deephaven/js-plugin-ui/WidgetHandler');

export interface WidgetHandlerProps {
  /** Widget for this to handle */
  widgetDescriptor: WidgetDescriptor;

  /** Widget ID maintained by the DashboardPlugin */
  id: string;

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
  widgetDescriptor,
  initialData: initialDataProp,
  id,
}: WidgetHandlerProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const { widget, error: widgetError } = useWidget(widgetDescriptor);
  const [isLoading, setIsLoading] = useState(true);
  const [prevWidget, setPrevWidget] = useState<dh.Widget | null>(widget);
  const [prevWidgetDescriptor, setPrevWidgetDescriptor] =
    useState(widgetDescriptor);
  // Cannot use usePrevious to change setIsLoading
  // Since usePrevious runs in an effect, the value never gets updated if setIsLoading is called during render
  // Use the widgetDescriptor because useWidget is async so the widget doesn't immediately change
  if (widgetDescriptor !== prevWidgetDescriptor) {
    setPrevWidgetDescriptor(widgetDescriptor);
    setIsLoading(true);
  }

  if (widget !== prevWidget) {
    setPrevWidget(widget);
    if (widget != null && widget.type === DASHBOARD_ELEMENT) {
      log.info(
        'Dashboard widget has changed, removing previous elements from layout'
      );
      layoutManager.root.contentItems.forEach(item => item.remove());
    }
  }

  if (widgetError != null && isLoading) {
    setIsLoading(false);
  }

  // We want to update the initial data if the widget changes, as we'll need to re-fetch the widget and want to start with a fresh state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialData = useMemo(() => initialDataProp, [widget]);
  const [internalError, setInternalError] = useState<WidgetError>();

  // The document. Matches what was sent over the wire, before being rendered/conversion to React elements/nodes.
  const [document, setDocument] = useState<object>();

  const error = useMemo(
    () => internalError ?? widgetError ?? undefined,
    [internalError, widgetError]
  );

  // When we fetch a widget, the client is then responsible for the exported objects.
  // These objects could stay alive even after the widget is closed if we wanted to,
  // but for our use case we want to close them when the widget is closed, so we close them all on unmount.
  const exportedObjectMap = useRef<Map<number, dh.WidgetExportedObject>>(
    new Map()
  );
  const exportedObjectCount = useRef(0);

  // Keep track of callables that are currently rendered/in use
  // We want to retain the same callable between renders, so we use a map that persists between renders
  const renderedCallableMap = useRef(
    new Map<string, (...args: unknown[]) => void>()
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
          setInternalError(e);
        }
      );
    },
    [jsonClient]
  );

  const callableFinalizationRegistry = useMemo(
    () =>
      new FinalizationRegistry(callableId => {
        log.debug2('Closing callable', callableId);
        jsonClient?.request('closeCallable', [callableId]);
      }),
    [jsonClient]
  );

  const pluginsElementMap = usePluginsElementMap();

  const renderEmptyDocument = useCallback(
    /**
     * Renders an empty document. This is used when the widget is loading or has an error.
     */
    () => {
      // Document hasn't been initialized yet. Display a loading spinner if applicable.
      if (widgetDescriptor.type === WIDGET_ELEMENT) {
        // Rehydration. Mount ReactPanels for each panelId in the initial data
        // so loading spinners or widget errors are shown
        if (initialData?.panelIds != null && initialData.panelIds.length > 0) {
          // Do not add a key here
          // When the real document mounts, it doesn't use keys and will cause a remount
          // which triggers the DocumentHandler to think the panels were closed and messes up the layout
          // eslint-disable-next-line react/jsx-key
          return initialData.panelIds.map(() => <ReactPanel />);
        }
        // Default to a single panel so we can immediately show a loading spinner
        return <ReactPanel />;
      }
      if (error != null) {
        // If there's an error and the document hasn't rendered yet (mostly applies to dashboards), explicitly show an error view
        return <WidgetErrorView error={error} />;
      }

      // Dashboards should not have a default document. It breaks its render flow
      return null;
    },
    [error, initialData, widgetDescriptor]
  );

  const [uriObjectMap] = useState<Map<string, UriExportedObject>>(new Map());

  const renderDocument = useCallback(
    /**
     * Iterates through a document and renders it with the appropriate components. Returns the original object/arrays if there are no changes.
     * Replaces all Callables with an async callback that will automatically call the server use JSON-RPC.
     * Replaces all Objects with the exported object from the server.
     * Replaces all Element nodes with the ReactNode derived from that Element.
     *
     * @param doc The document to render
     * @returns The rendered document
     */
    (doc: object | undefined) => {
      if (document === undefined || jsonClient == null) {
        return renderEmptyDocument();
      }

      // Keep track of exported objects and callables that are no longer in use after this render.
      // We close those objects that are no longer referenced, as they will never be referenced again.
      const deadObjectMap = new Map(exportedObjectMap.current);
      const deadUriMap = new Map(uriObjectMap);
      const deadCallableMap = new Map(renderedCallableMap.current);
      const hydratedDocument = transformNode(
        doc,
        (key, value) => {
          // Need to re-hydrate any objects that are defined
          if (isCallableNode(value)) {
            const callableId = value[CALLABLE_KEY];
            deadCallableMap.delete(callableId);
            if (renderedCallableMap.current.has(callableId)) {
              log.debug2('Reusing callableId', callableId);
              return renderedCallableMap.current.get(callableId);
            }
            log.debug2('Registering callableId', callableId);
            const callable = wrapCallable(
              jsonClient,
              callableId,
              callableFinalizationRegistry,
              false
            );
            renderedCallableMap.current.set(callableId, callable);
            return callable;
          }
          if (isObjectNode(value)) {
            // Replace this node with the exported object
            const objectKey = value[OBJECT_KEY];
            const exportedObject = exportedObjectMap.current.get(objectKey);
            if (exportedObject === undefined) {
              // The map should always have the exported object for a key, otherwise the protocol is broken.
              // However, we could be rendering the document for its panels after receiving a document error.
              // In this case, we should not throw an error because we may not have the exported objects.
              // This is possible in a PQ which saves some state that it can't properly hydrate when the PQ restarts
              if (!error) {
                throw new Error(`Invalid exported object key ${objectKey}`);
              }
            }
            deadObjectMap.delete(objectKey);
            return exportedObject;
          }

          // If this is the root element, we want to return the element version instead
          if (isUriNode(value) && key !== '') {
            const { uri } = value.props;
            let uriExportedObject = uriObjectMap.get(uri);
            if (uriExportedObject == null) {
              uriExportedObject = new UriExportedObject(uri);
              uriObjectMap.set(uri, uriExportedObject);
            }
            deadUriMap.delete(uri);
            return uriExportedObject;
          }

          if (isElementNode(value)) {
            // Replace the elements node with the Component it maps to
            try {
              return getComponentForElement(value, pluginsElementMap);
            } catch (e) {
              log.warn('Error getting component for element', e);
              return value;
            }
          }

          return value;
        },
        id
      );

      // Close any objects that are no longer referenced
      deadObjectMap.forEach((deadObject, objectKey) => {
        log.debug('Closing dead object', objectKey);
        deadObject.close();
        exportedObjectMap.current.delete(objectKey);
      });

      // Cleanup any URI objects that are no longer referenced
      deadUriMap.forEach((deadUriObject, uri) => {
        log.debug('Cleaning up dead URI object', uri);
        uriObjectMap.delete(uri);
      });

      // Close any callables that are no longer referenced
      deadCallableMap.forEach((deadCallable, callableId) => {
        log.debug2('Callable no longer rendered:', callableId);
        renderedCallableMap.current.delete(callableId);
      });

      log.debug2(
        'Hydrated document',
        hydratedDocument,
        'exportedObjectMap',
        exportedObjectMap.current,
        'deadObjectMap',
        deadObjectMap
      );
      return hydratedDocument;
    },
    [
      document,
      jsonClient,
      id,
      renderEmptyDocument,
      callableFinalizationRegistry,
      uriObjectMap,
      pluginsElementMap,
      error,
    ]
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
        METHOD_DOCUMENT_PATCHED,
        async (params: [Operation[], string]) => {
          log.debug2(METHOD_DOCUMENT_PATCHED, params);
          const [patch, stateParam] = params;

          // TODO: Remove unstable_batchedUpdates wrapper when upgrading to React 18
          unstable_batchedUpdates(() => {
            setInternalError(undefined);
            setDocument(
              oldDocument =>
                applyPatch(oldDocument ?? {}, patch, undefined, false)
                  .newDocument
            );
            setIsLoading(false);
          });
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
        const newError: WidgetError = JSON.parse(params[0]);
        newError.action = {
          title: 'Reload',
          action: () => {
            setInternalError(undefined);
            setIsLoading(true);
            sendSetState();
          },
        };
        unstable_batchedUpdates(() => {
          setIsLoading(false);
          setInternalError(newError);
        });
      });

      jsonClient.addMethod(METHOD_EVENT, (params: [string, string]) => {
        log.debug2(METHOD_EVENT, params);
        const [name, payload] = params;
        try {
          const eventParams = JSON.parse(payload, (_, value) => {
            // Need to re-hydrate any callables that are defined
            if (isCallableNode(value)) {
              const callableId = value[CALLABLE_KEY];
              log.debug2('Registering callableId', callableId);
              return wrapCallable(
                jsonClient,
                callableId,
                callableFinalizationRegistry
              );
            }
            return value;
          });
          switch (name) {
            case TOAST_EVENT:
              Toast(eventParams);
              break;
            default:
              throw new Error(`Unknown event ${name}`);
          }
        } catch (e) {
          throw new Error(
            `Error parsing event ${name} with payload ${payload}: ${e}`
          );
        }
      });

      return () => {
        jsonClient.rejectAllPendingRequests('Widget was changed');
      };
    },
    [jsonClient, onDataChange, sendSetState, callableFinalizationRegistry]
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
      setIsLoading(true);
      exportedObjectMap.current = widgetExportedObjectMap;
      exportedObjectCount.current = 0;
      renderedCallableMap.current.clear();

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
            log.error('Error receiving data', e);
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

  const renderedDocument = useMemo(
    () => renderDocument(document),
    [document, renderDocument]
  );

  const widgetStatus: WidgetStatus = useMemo(() => {
    if (isLoading) {
      return { status: 'loading', descriptor: widgetDescriptor };
    }
    if (error != null) {
      return { status: 'error', descriptor: widgetDescriptor, error };
    }
    return { status: 'ready', descriptor: widgetDescriptor };
  }, [error, widgetDescriptor, isLoading]);

  return renderedDocument != null ? (
    <WidgetStatusContext.Provider value={widgetStatus}>
      <DocumentHandler
        widget={widgetDescriptor}
        initialData={initialData}
        onDataChange={onDataChange}
        onClose={onClose}
      >
        {renderedDocument}
      </DocumentHandler>
    </WidgetStatusContext.Provider>
  ) : null;
}

WidgetHandler.displayName = '@deephaven/js-plugin-ui/WidgetHandler';

export default WidgetHandler;
