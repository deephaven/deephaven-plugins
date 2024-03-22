import React, { useEffect } from 'react';
import { Picker as DHPicker } from '@deephaven/components';
import {
  Picker as DHPickerJSApi,
  PickerProps as DHPickerJSApiProps,
} from '@deephaven/jsapi-components';
import type { Table } from '@deephaven/jsapi-types';
import { SerializedPickerEventProps, usePickerProps } from './usePickerProps';

function Picker({
  children,
  ...props
}: DHPickerJSApiProps & SerializedPickerEventProps) {
  const pickerProps = usePickerProps(props);
  const [table, setTable] = React.useState<Table | null>(null);

  const maybeExportedObject = children?.props?.object;

  useEffect(() => {
    if (maybeExportedObject == null) {
      return;
    }

    let isMounted = true;
    async function load() {
      console.log('[TESTING] exportedTable:', maybeExportedObject);
      const reexportedTable = await maybeExportedObject.reexport();
      const newTable = await reexportedTable.fetch<Table>();

      if (!isMounted) {
        return;
      }

      setTable(newTable);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [maybeExportedObject]);

  if (maybeExportedObject == null) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <DHPicker {...pickerProps}>{children}</DHPicker>;
  }

  const { children: _throwAway, ...restProps } = pickerProps;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return table && <DHPickerJSApi {...restProps} table={table} />;
}

export default Picker;
