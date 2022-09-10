import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { GLPropTypes } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { Pending, PromiseUtils } from '@deephaven/utils';
import { LoadingOverlay } from '@deephaven/components';
import Plot from './plotly/Plot';
import Plotly from './plotly/Plotly';

const log = Log.module('PlotlyChartPanel');

const config = {
  displaylogo: false,
  // Each array gets grouped together in the mode bar
  modeBarButtons: [
    ['toImage'],
    ['zoom2d', 'pan2d'],
    ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
  ],
};

export class PlotlyChartPanel extends Component {
  static COMPONENT = 'PlotlyChartPanel';

  static parseWidget(widget) {
    const dataBase64 = widget.getDataAsBase64();
    try {
      return JSON.parse(atob(dataBase64));
    } catch (e) {
      log.error(e);
      throw new Error('Unable to parse plot JSON');
    }
  }

  constructor(props) {
    super(props);

    this.handleLoadError = this.handleLoadError.bind(this);
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleShow = this.handleShow.bind(this);

    this.plot = React.createRef();
    this.plotWrapper = React.createRef();
    this.pending = new Pending();

    this.state = {
      error: null,
      isLoading: false,
      isLoaded: false,
      data: undefined,
      layout: undefined,
      frames: undefined,
      revision: 0,
    };
  }

  componentDidMount() {
    const { glContainer } = this.props;
    glContainer.on('resize', this.handleResize);
    glContainer.on('shown', this.handleShow);
    this.initModel();
  }

  componentWillUnmount() {
    const { glContainer } = this.props;
    glContainer.off('resize', this.handleResize);
    glContainer.off('shown', this.handleShow);
    this.pending.cancel();
  }

  initModel() {
    this.setState({ isLoading: true, isLoaded: false, error: null });
    const { fetch } = this.props;
    this.pending
      .add(fetch())
      .then(PlotlyChartPanel.parseWidget)
      .then(this.handleLoadSuccess, this.handleLoadError);
  }

  handleLoadSuccess({ layout: prevLayout, data, frames }) {
    log.debug('handleLoadSuccess');
    const layout = prevLayout;
    // Fixed size charts not supported
    ['width', 'height'].forEach(prop => {
      delete layout[prop];
    });
    layout.autosize = true;
    this.setState({
      layout,
      data,
      frames,
      isLoaded: true,
      isLoading: false,
    });
  }

  handleLoadError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error('handleLoadError', error);
    this.setState({ error, isLoading: false });
  }

  handleShow() {
    this.updateDimensions();
  }

  handleResize() {
    this.updateDimensions();
  }

  getPlotRect() {
    return this.plotWrapper.current?.getBoundingClientRect() ?? null;
  }

  updateDimensions() {
    const rect = this.getPlotRect();
    if (
      this.plot.current != null &&
      rect != null &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      // Call relayout to resize avoiding the debouncing plotly does
      // https://github.com/plotly/plotly.js/issues/2769#issuecomment-402099552
      Plotly.relayout(this.plot.current.el, { autosize: true }).catch(e => {
        log.debug('Unable to resize, promise rejected', e);
      });
    }
  }

  render() {
    const { data, error, layout, frames, revision, isLoaded, isLoading } =
      this.state;
    const errorMessage = error ? `${error}` : null;
    return (
      <div
        className="plotly-chart-panel-container h-100 w-100 overflow-hidden"
        ref={this.plotWrapper}
      >
        {isLoaded && (
          <Plot
            ref={this.plot}
            data={data}
            layout={layout}
            frames={frames}
            revision={revision}
            config={config}
            onError={log.error}
            useResizeHandler
            style={{ height: '100%', width: '100%' }}
          />
        )}
        <LoadingOverlay
          errorMessage={errorMessage}
          isLoaded={isLoaded}
          isLoading={isLoading}
        />
      </div>
    );
  }
}

PlotlyChartPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  fetch: PropTypes.func.isRequired,
};

PlotlyChartPanel.displayName = 'PlotlyChartPanel';

export default PlotlyChartPanel;
