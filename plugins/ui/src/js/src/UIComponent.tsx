import React, { useCallback, useMemo } from 'react';
import { UriVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';
import {
  usePersistentState,
  type WidgetComponentProps,
} from '@deephaven/plugin';
import { WidgetDescriptor } from '@deephaven/dashboard';
import { nanoid } from 'nanoid';
import { WidgetData, WidgetDataUpdate } from './widget/WidgetTypes';
import WidgetHandler from './widget/WidgetHandler';

type UIComponentProps = WidgetComponentProps<dh.Widget> & {
  // TODO: We shouldn't need this, should be added to the WidgetComponentProps type
  metadata?: WidgetDescriptor;

  // Might be loading a URI resolved widget...
  uri?: UriVariableDescriptor;
};

export function UIComponent(props: UIComponentProps): JSX.Element | null {
  const { metadata: widgetDescriptor, uri, __dhId } = props;

  const [widgetData, setWidgetData] = usePersistentState<
    WidgetData | undefined
  >(undefined, { type: 'UIComponentWidgetData', version: 1 });

  const id = useMemo(
    () => __dhId ?? widgetDescriptor?.id ?? nanoid(),
    [__dhId, widgetDescriptor]
  );

  const handleDataChange = useCallback(
    (data: WidgetDataUpdate) => {
      setWidgetData(oldData => ({ ...oldData, ...data }));
    },
    [setWidgetData]
  );

  const descriptor = uri ?? widgetDescriptor;
  if (descriptor == null) {
    throw new Error('No widget descriptor');
  }
  return (
    <WidgetHandler
      widgetDescriptor={descriptor}
      initialData={widgetData}
      onDataChange={handleDataChange}
      id={id}
    />
  );
}

export default UIComponent;
