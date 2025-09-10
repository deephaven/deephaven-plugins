import React, { useCallback, useMemo } from 'react';
import Log from '@deephaven/log';
import { isWidgetPlugin, usePlugins } from '@deephaven/plugin';
import type { dh } from '@deephaven/jsapi-types';

const log = Log.module('@deephaven/js-plugin-ui/ObjectView');

export type ObjectViewProps = {
  object: dh.WidgetExportedObject;
  __dhId?: string;
};

function ObjectView(props: ObjectViewProps): JSX.Element {
  const { object, __dhId } = props;
  log.debug('Object is', object);
  const { type } = object;

  const fetch = useCallback(async () => {
    // We re-export the object in case this object is used in multiple places or closed/opened multiple times
    const reexportedObject = await object.reexport();
    return reexportedObject.fetch() as Promise<dh.Widget>;
  }, [object]);

  const plugins = usePlugins();

  const plugin = useMemo(
    () =>
      type == null
        ? null
        : [...plugins.values()]
            .filter(isWidgetPlugin)
            .find(p => [p.supportedTypes].flat().includes(type)),
    [plugins, type]
  );

  if (plugin != null) {
    const Component = plugin.component;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...props} fetch={fetch} __dhId={__dhId} />;
  }

  log.warn('Unknown object type', object.type);
  return <div>Unknown object type: {object.type}</div>;
}

ObjectView.displayName = 'ObjectView';

export default ObjectView;
