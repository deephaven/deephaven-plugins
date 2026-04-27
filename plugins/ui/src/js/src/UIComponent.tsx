import React, { useCallback, useMemo } from 'react';
import { type UriVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';
import {
  usePersistentState,
  type WidgetComponentProps,
} from '@deephaven/plugin';
import { nanoid } from 'nanoid';
import { type WidgetData, type WidgetDataUpdate } from './widget/WidgetTypes';
import WidgetHandler from './widget/WidgetHandler';

type UIComponentProps = WidgetComponentProps<dh.Widget> & {
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

  const renderEmptyDocument = useCallback(
    () => (
      // Single-panel or first-time-load case. Returning a fragment causes
      // `getRootChildren` to wrap it in a `DefaultPanelContent`, which renders
      // a `LoadingOverlay` while the widget status is `loading`.
      // eslint-disable-next-line react/jsx-no-useless-fragment
      <></>
    ),
    // We only want to update this callback when the descriptor changes, not
    // every time the widgetData (panelIds) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [descriptor]
  );

  return (
    <WidgetHandler
      widgetDescriptor={descriptor}
      initialData={widgetData}
      onDataChange={handleDataChange}
      renderEmptyDocument={renderEmptyDocument}
      id={id}
    />
  );
}

export default UIComponent;
