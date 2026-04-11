import type { WidgetPlugin } from '@deephaven/plugin';
import { PluginType } from '@deephaven/plugin';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { vsGraph } from '@deephaven/icons';
import TradingViewChart from './TradingViewChart';

// eslint-disable-next-line import/prefer-default-export
export const TradingViewPlugin: WidgetPlugin<DhType.Widget> = {
  name: '@deephaven/tradingview-lightweight',
  title: 'TradingView Chart',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.plot.tradingview_lightweight.TvlChart',
  component: TradingViewChart,
  icon: vsGraph,
};
