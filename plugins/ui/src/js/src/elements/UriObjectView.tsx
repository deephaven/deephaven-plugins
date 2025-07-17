import React, { useCallback, useMemo } from 'react';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { isWidgetPlugin, usePlugins } from '@deephaven/plugin';
import {
  ApiContext,
  useDeferredApi,
  useWidget,
} from '@deephaven/jsapi-bootstrap';
import type UriExportedObject from '../widget/UriExportedObject';
import WidgetErrorView from '../widget/WidgetErrorView';

const log = Log.module('@deephaven/js-plugin-ui/UriObjectView');

export type UriObjectViewProps = {
  object: UriExportedObject;
  __dhId?: string;
};

function UriObjectView(props: UriObjectViewProps): JSX.Element {
  const { object, __dhId } = props;
  log.debug(`Fetching object for URI: ${object.uri}`);

  const [dh, apiError] = useDeferredApi(object.uri);
  const { widget, error: widgetError } = useWidget(object.uri);

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

  log.warn(`Unknown object type ${widgetType} for URI ${object.uri}`);
  return (
    <div>
      Unknown object type {widgetType} from URI {object.uri}
    </div>
  );
}

UriObjectView.displayName = 'UriObjectView';

export default UriObjectView;
