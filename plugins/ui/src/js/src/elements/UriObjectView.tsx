import React, { useCallback, useMemo } from 'react';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { isWidgetPlugin, usePlugins } from '@deephaven/plugin';
import { useApi, useWidget } from '@deephaven/jsapi-bootstrap';
import type UriExportedObject from '../widget/UriExportedObject';
import WidgetErrorView from '../widget/WidgetErrorView';

const log = Log.module('@deephaven/js-plugin-ui/UriObjectView');

export type UriObjectViewProps = {
  object: UriExportedObject;
  __dhId?: string;
};

function UriObjectView(props: UriObjectViewProps): JSX.Element {
  const { object, __dhId } = props;
  const dh = useApi();
  log.debug(`Fetching object for URI: ${object.uri}`);

  const { error, widget } = useWidget(object.uri);

  const widgetType = useMemo(() => {
    if (widget == null) {
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

  if (error != null) {
    return <WidgetErrorView error={error} />;
  }

  if (widget == null) {
    return <LoadingOverlay isLoading />;
  }

  if (plugin != null) {
    const Component = plugin.component;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...props} fetch={fetch} __dhId={__dhId} />;
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
