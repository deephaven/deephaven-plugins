import React, { useCallback, useMemo } from 'react';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { isWidgetPlugin, usePlugins } from '@deephaven/plugin';
import { ApiContext, useWidget } from '@deephaven/jsapi-bootstrap';
import WidgetErrorView from '../widget/WidgetErrorView';
import { getWidgetType } from './hooks';

const log = Log.module('@deephaven/js-plugin-ui/UriObjectView');

export type UriObjectViewProps = {
  uri: string;
  __dhId?: string;
};

function UriObjectView(props: UriObjectViewProps): JSX.Element {
  const { uri, __dhId } = props;
  log.debug(`Fetching object for URI: ${uri}`);

  const { widget, api, error } = useWidget(uri);

  const widgetType = useMemo(() => getWidgetType(widget, api), [api, widget]);

  const fetch = useCallback(async () => widget, [widget]);

  const plugins = usePlugins();

  const plugin = useMemo(
    () =>
      widgetType == null
        ? null
        : [...plugins.values()]
            .filter(isWidgetPlugin)
            .find(p => [p.supportedTypes].flat().includes(widgetType)),
    [plugins, widgetType]
  );

  if (error != null) {
    return <WidgetErrorView error={error} />;
  }

  if (widget == null || api == null) {
    return <LoadingOverlay isLoading />;
  }

  if (plugin != null) {
    const Component = plugin.component;
    return (
      <ApiContext.Provider value={api}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} fetch={fetch} __dhId={__dhId} />
      </ApiContext.Provider>
    );
  }

  log.warn(`Unknown object type ${widgetType} for URI ${uri}`);
  return (
    <div>
      Unknown object type {widgetType} from URI {uri}
    </div>
  );
}

UriObjectView.displayName = 'UriObjectView';

export default UriObjectView;
