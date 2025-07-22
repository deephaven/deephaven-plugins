import { useMemo } from 'react';
import {
  useApi,
  useWidget,
  type WidgetTypes,
} from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { useTableClose } from '@deephaven/jsapi-components';
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

export function getWidgetType(
  widget: dh.Widget | null,
  api: typeof dh | null
): string | null {
  if (widget == null || api == null) {
    return null;
  }

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

  return null;
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

  useTableClose(descriptorWidget);

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

  useTableClose(exportedWidget);

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
