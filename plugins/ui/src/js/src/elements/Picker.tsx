import React, { ReactElement } from 'react';
import {
  Picker as DHPicker,
  PickerProps as DHPickerProps,
} from '@deephaven/components';
import {
  Picker as DHPickerJSApi,
  PickerProps as DHPickerJSApiProps,
  useTableClose,
} from '@deephaven/jsapi-components';
import { isElementOfType, usePromiseFactory } from '@deephaven/react-hooks';
import { SerializedPickerEventProps, usePickerProps } from './usePickerProps';
import ObjectView, { ObjectViewProps } from './ObjectView';
import { fetchReexportedTable } from './ElementUtils';

type WrappedDHPickerJSApiProps = Omit<DHPickerJSApiProps, 'table'> & {
  children: ReactElement<ObjectViewProps>;
};

export type PickerProps = (DHPickerProps | WrappedDHPickerJSApiProps) &
  SerializedPickerEventProps;

function Picker({ children, ...props }: PickerProps) {
  const pickerProps = usePickerProps(props);

  const isObjectView = isElementOfType(children, ObjectView);

  const maybeExportedTable =
    isObjectView && children.props.object.type === 'Table'
      ? children.props.object
      : null;

  const { data: table } = usePromiseFactory(fetchReexportedTable, [
    maybeExportedTable,
  ]);

  useTableClose(table);

  if (isObjectView) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return table && <DHPickerJSApi {...pickerProps} table={table} />;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHPicker {...pickerProps}>{children}</DHPicker>;
}

export default Picker;
