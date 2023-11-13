import React, { useMemo } from 'react';
import Log from '@deephaven/log';
import { isWidgetPlugin, usePlugins } from '@deephaven/plugin';
import { ExportedObject } from './ElementUtils';

const log = Log.module('@deephaven/js-plugin-ui/ObjectView');

export interface ObjectViewProps {
  object: ExportedObject;
}

function ObjectView(props: ObjectViewProps) {
  const { object } = props;
  log.info('Object is', object);

  const fetch = useMemo(() => object.fetch.bind(object), [object]);

  const plugins = usePlugins();

  const plugin = useMemo(
    () =>
      [...plugins.values()]
        .filter(isWidgetPlugin)
        .find(p => [p.supportedTypes].flat().includes(object.type)),
    [plugins, object.type]
  );

  if (object == null) {
    // Still loading
    return null;
  }

  if (plugin != null) {
    const Component = plugin.component;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...props} fetch={fetch} />;
  }

  log.warn('Unknown object type', object.type);
  return <div>Unknown object type: {object.type}</div>;
}

ObjectView.displayName = 'ObjectView';

export default ObjectView;
