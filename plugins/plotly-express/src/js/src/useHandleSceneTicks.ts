import { useEffect } from 'react';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';

export function useHandleSceneTicks(
  model: PlotlyExpressChartModel | undefined,
  container: HTMLDivElement | null
) {
  useEffect(() => {
    // Plotly scenes and geo views reset when our data ticks
    // Pause rendering data updates when the user is manipulating a scene
    if (!model || !container || !model.shouldPauseOnUserInteraction()) {
      return;
    }

    function handleMouseDown() {
      model?.pauseUpdates();
      // The once option removes the listener after it is called
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    }

    function handleMouseUp() {
      model?.resumeUpdates();
    }

    let wheelTimeout = 0;

    function handleWheel() {
      model?.pauseUpdates();
      window.clearTimeout(wheelTimeout);
      wheelTimeout = window.setTimeout(() => {
        model?.resumeUpdates();
      }, 300);
    }

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('wheel', handleWheel);

    return () => {
      window.clearTimeout(wheelTimeout);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [model, container]);
}

export default useHandleSceneTicks;
