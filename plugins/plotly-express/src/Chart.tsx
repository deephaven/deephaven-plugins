import React, { Component, ReactElement, RefObject } from 'react';
import memoize from 'memoize-one';
import { IconDefinition } from '@deephaven/icons';
import Log from '@deephaven/log';
import type { Layout, Icon, Data } from 'plotly.js';
import Plotly from './plotly/Plotly';
import Plot from './plotly/Plot';
import PlotlyExpressChartModel from './PlotlyExpressChartModel';

const log = Log.module('@deephaven/js-plugin-plotly-express.Chart');

interface ChartProps {
  model: PlotlyExpressChartModel;
  isActive: boolean;
  onDisconnect: () => void;
  onReconnect: () => void;
  onUpdate: (obj: { isLoading: boolean }) => void;
  onError: (error: Error) => void;
}

interface ChartState {
  data: Partial<Data>[] | null;
  layout: Partial<Layout>;
  revision: number;
}

export class Chart extends Component<ChartProps, ChartState> {
  static defaultProps = {
    isActive: true,
    onDisconnect: (): void => undefined,
    onReconnect: (): void => undefined,
    onUpdate: (): void => undefined,
    onError: (): void => undefined,
  };

  /**
   * Convert a font awesome icon definition to a plotly icon definition
   * @param faIcon The icon to convert
   */
  static convertIcon(faIcon: IconDefinition): Icon {
    const [width, , , , path] = faIcon.icon;
    // By default the icons are flipped upside down, so we need to add our own transform
    // https://github.com/plotly/plotly.js/issues/1335
    const stringPath = `${path}`;
    return {
      width,
      path: stringPath,
      ascent: width,
      descent: 0,
      transform: `matrix(1, 0, 0, 1, 0, 0)`,
    };
  }

  constructor(props: ChartProps) {
    super(props);

    this.handleModelEvent = this.handleModelEvent.bind(this);

    this.plot = React.createRef();
    this.plotWrapper = React.createRef();
    this.isSubscribed = false;
    this.isLoadedFired = false;

    this.state = {
      data: null,
      layout: {
        datarevision: 0,
      },
      revision: 0,
    };
  }

  componentDidMount(): void {
    // Need to make sure the model dimensions are up to date before initializing the data
    this.updateDimensions();

    this.initData();

    const { isActive } = this.props;
    if (isActive) {
      this.subscribe();
    }
  }

  componentDidUpdate(prevProps: ChartProps): void {
    const { isActive } = this.props;

    if (isActive !== prevProps.isActive) {
      if (isActive) {
        this.subscribe();
      } else {
        this.unsubscribe();
      }
    }
  }

  componentWillUnmount(): void {
    this.unsubscribe();
  }

  plot: RefObject<typeof Plot>;
  plotWrapper: RefObject<HTMLDivElement>;
  rect?: DOMRect;
  isSubscribed: boolean;
  isLoadedFired: boolean;

  getCachedConfig = memoize((is3d: boolean) => {
    return {
      displaylogo: false,
      displayModeBar: 'hover',

      // Each array gets grouped together in the mode bar
      modeBarButtons: [
        ['toImage'],
        is3d ? ['zoom3d', 'pan3d'] : ['zoom2d', 'pan2d'],
        is3d
          ? ['orbitRotation', 'tableRotation', 'resetCameraDefault3d']
          : ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
      ],
    };
  });

  getPlotRect(): DOMRect | null {
    return this.plotWrapper.current?.getBoundingClientRect() ?? null;
  }

  initData(): void {
    const { model } = this.props;
    const { layout } = this.state;
    this.setState({
      data: model.getData(),
      layout: {
        ...layout,
        ...model.getLayout(),
      },
    });
  }

  subscribe(): void {
    if (this.isSubscribed || !this.props.isActive) {
      return;
    }

    const { model } = this.props;
    const rect = this.getPlotRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      log.debug2('Delaying subscription until model dimensions are set');
      return;
    }
    model.subscribe(this.handleModelEvent);
    this.isSubscribed = true;
  }

  unsubscribe(): void {
    if (!this.isSubscribed) {
      return;
    }

    const { model } = this.props;
    model.unsubscribe(this.handleModelEvent);
    this.isSubscribed = false;
  }

  handleModelEvent(event: CustomEvent): void {
    const { type, detail } = event;
    log.debug2('Received data update', type, detail);

    switch (type) {
      case PlotlyExpressChartModel.EVENT_UPDATED: {
        this.setState(state => {
          const { layout, revision } = state;
          if (typeof layout.datarevision === 'number') {
            layout.datarevision += 1;
          }
          return {
            data: detail,
            layout,
            revision: revision + 1,
          };
        });

        const { onUpdate } = this.props;
        onUpdate({ isLoading: !this.isLoadedFired });
        break;
      }
      case PlotlyExpressChartModel.EVENT_LOADFINISHED: {
        const { onUpdate } = this.props;
        this.isLoadedFired = true;
        onUpdate({ isLoading: false });
        break;
      }
      case PlotlyExpressChartModel.EVENT_DISCONNECT: {
        const { onDisconnect } = this.props;
        onDisconnect();
        break;
      }
      case PlotlyExpressChartModel.EVENT_RECONNECT: {
        const { onReconnect } = this.props;
        onReconnect();
        break;
      }
      default:
        log.debug('Unknown event type', type, event);
    }
  }

  updateDimensions(): void {
    const rect = this.getPlotRect();
    if (
      this.plot.current != null &&
      rect != null &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      this.subscribe(); // May need to subscribe if plot was too small before
      // Call relayout to resize avoiding the debouncing plotly does
      // https://github.com/plotly/plotly.js/issues/2769#issuecomment-402099552
      Plotly.relayout(this.plot.current.el, { autosize: true }).catch(
        (e: unknown) => {
          log.debug('Unable to resize, promise rejected', e);
        }
      );
    }
  }

  render(): ReactElement {
    const { data, layout, revision } = this.state;
    const config = this.getCachedConfig(
      data?.[0].type?.includes('3d') ?? false
    );
    const isPlotShown = data != null;
    return (
      <div className="h-100 w-100 chart-wrapper" ref={this.plotWrapper}>
        {isPlotShown && (
          <Plot
            ref={this.plot}
            data={data}
            layout={layout}
            revision={revision}
            config={config}
            onError={log.error}
            useResizeHandler
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </div>
    );
  }
}

export default Chart;
