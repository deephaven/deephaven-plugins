import type PlotlyExpressChartModel from './PlotlyExpressChartModel';
import { useHandleSceneTicks } from './useHandleSceneTicks.js';
import {
  usePlotlyEventCallbacks,
  type PlotlyEventHandlers,
} from './usePlotlyEventCallbacks.js';

/**
 * Compose the model-specific hooks needed by both PlotlyExpressChart and
 * PlotlyExpressChartPanel
 *
 * @param model The chart model, or undefined before it has loaded
 * @param container The chart container element, or null before mount
 * @returns The event handler props to spread onto Chart / ChartPanel
 */
export function usePlotlyExpressModel(
  model: PlotlyExpressChartModel | undefined,
  container: HTMLDivElement | null
): PlotlyEventHandlers {
  useHandleSceneTicks(model, container);
  return usePlotlyEventCallbacks(model ?? null);
}

export default usePlotlyExpressModel;
