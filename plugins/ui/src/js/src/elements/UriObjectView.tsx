import React, { useCallback, useMemo } from 'react';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { isWidgetPlugin, usePlugins } from '@deephaven/plugin';
import {
  ApiContext,
  useDeferredApi,
  useWidget,
} from '@deephaven/jsapi-bootstrap';
import WidgetErrorView from '../widget/WidgetErrorView';
import UriExportedObject from '../widget/UriExportedObject';

const log = Log.module('@deephaven/js-plugin-ui/UriObjectView');

export type UriObjectViewProps = {
  uri: string;
  object: UriExportedObject;
  __dhId?: string;
};

function UriObjectView(props: UriObjectViewProps): JSX.Element {
  const { uri, __dhId } = props;
  log.debug(`Fetching object for URI: ${uri}`);

  const [dh, apiError] = useDeferredApi(uri);
  const { widget, error: widgetError } = useWidget(uri);

  const widgetType = useMemo(() => {
    if (widget == null || dh == null) {
      return null;
    }

    if (widget.type != null) {
      return widget.type;
    }

    if ('charts' in widget) {
      return dh.VariableType.FIGURE;
    }

    if ('columns' in widget) {
      // We do further checking to handle the different table tyeps in GridWidgetPlugin
      // The only thing we can't tell is if the table was created from a pandas DataFrame
      return dh.VariableType.TABLE;
    }

    return null;
  }, [dh, widget]);

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

  const error = widgetError || apiError;

  if (error != null) {
    return <WidgetErrorView error={error} />;
  }

  if (widget == null || dh == null) {
    return <LoadingOverlay isLoading />;
  }

  if (plugin != null) {
    const Component = plugin.component;
    return (
      <ApiContext.Provider value={dh}>
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
