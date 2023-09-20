import React, { useCallback, useEffect, useState } from 'react';
import { type ChartPanelProps } from '@deephaven/dashboard-core-plugins';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import UIElement, { ExportedObject } from './ElementUtils';
import ElementView from './ElementView';

const log = Log.module('@deephaven/js-plugin-ui/ElementPanel');

export interface WidgetMessageDetails {
  getDataAsBase64(): string;
  getDataAsString(): string;
  exportedObjects: ExportedObject[];
}

export interface JsWidget extends WidgetMessageDetails {
  addEventListener: (
    type: string,
    listener: (event: unknown) => void
  ) => () => void;
  sendMessage: (message: string, args: unknown[]) => void;
}

export interface ElementPanelProps extends ChartPanelProps {
  fetch(): Promise<JsWidget>;
}

function ElementPanel(props: ElementPanelProps) {
  const { fetch } = props;
  const dh = useApi();

  const [widget, setWidget] = useState<JsWidget>();
  const [element, setElement] = useState<UIElement>();

  const makeElement = useCallback(
    (details: WidgetMessageDetails): UIElement => {
      const root = JSON.parse(details.getDataAsString());
      return {
        root,
        objects: details.exportedObjects,
      };
    },
    []
  );

  const reloadObjects = useCallback(async () => {
    if (widget == null) {
      return;
    }

    const newElement = makeElement(widget);
    log.info('Loaded Element', newElement);
    setElement(newElement);
  }, [makeElement, widget]);

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
      log.info('event is', event);

      const newElement = makeElement(
        (event as any).detail as WidgetMessageDetails
      );
      log.info('Updated Element', newElement);
      setElement(newElement);
    });
  }, [dh, makeElement, reloadObjects, reloadWidget, widget]);

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
      {element != null && <ElementView element={element} />}
    </div>
  );
}

ElementPanel.displayName = '@deephaven/js-plugin-ui/ElementPanel';

export default ElementPanel;
