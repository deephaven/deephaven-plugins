import React, { ReactElement } from 'react';
import {
  Picker as DHPicker,
  PickerProps as DHPickerProps,
} from '@deephaven/components';
import {
  Picker as DHPickerJSApi,
  PickerProps as DHPickerJSApiProps,
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

  const maybeExportedObject = isElementOfType(children, ObjectView)
    ? children.props.object
    : null;

  const { data: table } = usePromiseFactory(fetchReexportedTable, [
    maybeExportedObject,
  ]);

  if (isElementOfType(children, ObjectView)) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return table && <DHPickerJSApi {...pickerProps} table={table} />;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHPicker {...pickerProps}>{children}</DHPicker>;
}

export default Picker;
