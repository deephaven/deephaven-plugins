import { useMemo } from 'react';
import {
  useApi,
  useWidget,
  type WidgetTypes,
} from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { useWidgetClose } from '@deephaven/jsapi-components';
import { usePromiseFactory } from '@deephaven/react-hooks';
import {
  fetchReexportedObject,
  isExportedObject,
  isUriExportedObject,
} from '../utils';
import type UriExportedObject from '../../widget/UriExportedObject';

export interface ResolvedExportedObject<T extends WidgetTypes = dh.Widget> {
  widget: T | null;
  api: typeof dh | null;
  error: NonNullable<unknown> | null;
  isLoading: boolean;
}

/**
 * Get the type of a widget.
 * @param widget The widget to check.
 * @param api The JS API instance to use.
 * @returns The widget type. Throws if the type cannot be determined.
 */
export function getWidgetType(
  widget: dh.Widget,
  api: typeof dh
): string | null {
  if (widget.type != null) {
    return widget.type;
  }

  if ('charts' in widget) {
    return api.VariableType.FIGURE;
  }

  if ('columns' in widget) {
    if (TableUtils.isTreeTable(widget)) {
      return api.VariableType.TREETABLE;
    }

    if (TableUtils.isPartitionedTable(widget)) {
      return api.VariableType.PARTITIONEDTABLE;
    }

    return api.VariableType.TABLE;
  }

  throw new Error(`Unknown widget type for widget: ${JSON.stringify(widget)}`);
}

export function useExportedObject<T extends WidgetTypes = dh.Widget>(
  descriptor:
    | dh.WidgetExportedObject
    | dh.ide.VariableDescriptor
    | UriExportedObject
): ResolvedExportedObject<T> {
  const {
    widget: descriptorWidget,
    api: descriptorApi,
    error: descriptorError,
  } = useWidget<T>(
    isUriExportedObject(descriptor)
      ? descriptor.uri
      : (descriptor as dh.ide.VariableDescriptor)
  );

  useWidgetClose(descriptorWidget);

  const defaultApi = useApi();

  const {
    data: exportedWidget,
    error: exportedWidgetError,
    isLoading,
  } = usePromiseFactory(fetchReexportedObject<T>, [
    isExportedObject(descriptor) && !isUriExportedObject(descriptor)
      ? descriptor
      : null,
  ]);

  useWidgetClose(exportedWidget);

  // If this was exported as part of the dh.ui widget
  const isExportedWidget =
    isExportedObject(descriptor) && !isUriExportedObject(descriptor);

  const exportedObject = useMemo(
    () =>
      isExportedWidget
        ? {
            widget: exportedWidget,
            api: defaultApi,
            error: exportedWidgetError,
            isLoading,
          }
        : {
            widget: descriptorWidget,
            api: descriptorApi ?? defaultApi,
            error: descriptorError,
            isLoading: descriptorWidget == null && descriptorError == null,
          },
    [
      defaultApi,
      descriptorApi,
      descriptorError,
      descriptorWidget,
      exportedWidget,
      exportedWidgetError,
      isExportedWidget,
      isLoading,
    ]
  );

  return exportedObject;
}

export default useExportedObject;
