import React, { useCallback, useEffect, useState } from 'react';
import { type ChartPanelProps } from '@deephaven/dashboard-core-plugins';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Figure, Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import ComponentObject from './ComponentObject';

const log = Log.module('@deephaven/js-plugin-ui/UiPanel');

export interface ComponentWidget {
  addEventListener: (
    type: string,
    listener: (event: unknown) => void
  ) => () => void;
  getDataAsBase64(): string;
  exportedObjects: { fetch(): Promise<Table> }[];
  sendMessage: (message: string, args: unknown[]) => void;
}

export interface ComponentPanelProps extends ChartPanelProps {
  fetch(): Promise<ComponentWidget>;
}

function ComponentPanel(props: ComponentPanelProps) {
  const { fetch } = props;
  const dh = useApi();

  const [widget, setWidget] = useState<ComponentWidget>();
  const [objects, setObjects] = useState<(Table | Figure)[]>([]);

  const reloadObjects = useCallback(async () => {
    if (widget == null) {
      return;
    }

    const childObjects = await Promise.all(
      widget.exportedObjects.map(o => o.fetch())
    );
    log.info('new objects', childObjects);
    setObjects(childObjects);
  }, [widget]);

  const reloadWidget = useCallback(async () => {
    const widgetInfo = await fetch();
    log.info('widgetInfo', widgetInfo);
    setWidget(widgetInfo);
  }, [fetch]);

  useEffect(() => {
    if (widget == null) {
      return;
    }
    reloadObjects();
    return widget.addEventListener(dh.Widget.EVENT_MESSAGE, async event => {
      const { exportedObjects } = (event as any).detail;
      log.info('event is', event);

      const childObjects = await Promise.all(
        exportedObjects.map(o => (o as any).fetch())
      );
      log.info('child objects are', childObjects);
      setObjects(childObjects as any);
    });
  }, [dh, reloadObjects, reloadWidget, widget]);

  useEffect(() => {
    reloadWidget();
  }, [reloadWidget]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {objects.map((o, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <ComponentObject object={o} key={`${i}`} />
        // <ComponentObject object={o} key={shortid()} />
      ))}
    </div>
  );
}

ComponentPanel.displayName = '@deephaven/js-plugin-ui/ComponentPanel';

export default ComponentPanel;
