import { type RefObject } from 'react';
import type PlotlyExpressChartModel from './PlotlyExpressChartModel';

/**
 * Placeholder hook for Plotly event callbacks.
 * Event wiring is handled directly in PlotlyExpressChartModel.wireEventCallbacks()
 * which runs after the model subscribes and polls for the Plotly div.
 */
export function usePlotlyEventCallbacks(
  _containerRef: RefObject<HTMLElement | null>,
  _model: PlotlyExpressChartModel | null
): void {
  // Event wiring is handled in the model's wireEventCallbacks method
}

export default usePlotlyEventCallbacks;
