import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { WidgetComponentProps } from '@deephaven/plugin';
import Log from '@deephaven/log';
import TradingViewChartModel from './TradingViewChartModel';
import TradingViewChartRenderer from './TradingViewChartRenderer';
import {
  useDHChartTheme,
  chartThemeToOptions,
  getColorway,
  getOhlcColors,
} from './TradingViewTheme';
import {
  transformTableData,
  deduplicateByTime,
  buildMarkersFromTableData,
} from './TradingViewUtils';
import type {
  TvlChartType,
  TvlFigureData,
  ModelEvent,
} from './TradingViewTypes';

const log = Log.module('TradingViewChart');

/**
 * Recursively deep-merge two plain objects. Nested objects are merged
 * so that e.g. crosshair.vertLine from theme and from user options combine.
 * Arrays are replaced, not merged.
 */
function deepMerge(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  Object.entries(overrides).forEach(([key, val]) => {
    if (
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        val as Record<string, unknown>
      );
    } else {
      result[key] = val;
    }
  });
  return result;
}

function TradingViewChart(
  props: WidgetComponentProps<DhType.Widget>
): JSX.Element | null {
  const dh = useApi();
  const { fetch } = props;
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const chartTheme = useDHChartTheme();
  const chartThemeRef = useRef(chartTheme);
  chartThemeRef.current = chartTheme;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<TradingViewChartRenderer | null>(null);
  const modelRef = useRef<TradingViewChartModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userOptionsRef = useRef<Record<string, unknown>>({});
  const chartTypeRef = useRef<TvlChartType>('standard');

  /**
   * Suppress flag: set to true while we programmatically update chart data
   * via setData/setVisibleRange so that subscribeVisibleLogicalRangeChange
   * doesn't trigger a spurious re-downsample.
   */
  const suppressRef = useRef(false);

  /** Cleanup for downsample subscriptions (set up inside init, cleaned in return). */
  const dsCleanupRef = useRef<(() => void) | null>(null);

  const replayAllData = useCallback(
    (renderer: TradingViewChartRenderer, model: TradingViewChartModel) => {
      const figure = model.getFigureData();
      if (!figure) return;

      renderer.configureSeries(
        figure.series,
        getColorway(chartTheme),
        getOhlcColors(chartTheme)
      );
      if (figure.paneStretchFactors) {
        renderer.applyPaneStretchFactors(figure.paneStretchFactors);
      }

      const ct = renderer.getChartType();
      figure.series.forEach(series => {
        const colData = model.getColumnData(series.dataMapping.tableId);
        if (colData) {
          const data = transformTableData(series, colData, ct);
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
          if (series.markerSpec) {
            const markerColData = model.getColumnData(
              series.markerSpec.tableId
            );
            if (markerColData) {
              const tableMarkers = buildMarkersFromTableData(
                series.markerSpec,
                markerColData,
                ct,
                renderer.getTextColor()
              );
              renderer.setSeriesMarkers(series.id, tableMarkers);
            }
          } else if (series.markers) {
            renderer.setSeriesMarkers(series.id, series.markers);
          }
          renderer.updateDynamicPriceLines(series.id, colData);
        }
      });
      renderer.fitContent();
    },
    [chartTheme]
  );

  // Initialize model and renderer once.
  useEffect(() => {
    let cancelled = false;

    function handleFigureUpdate(
      renderer: TradingViewChartRenderer,
      model: TradingViewChartModel,
      figure: TvlFigureData
    ) {
      renderer.configureSeries(
        figure.series,
        getColorway(chartThemeRef.current),
        getOhlcColors(chartThemeRef.current)
      );
      if (figure.paneStretchFactors) {
        renderer.applyPaneStretchFactors(figure.paneStretchFactors);
      }

      const ct = renderer.getChartType();
      figure.series.forEach(series => {
        const colData = model.getColumnData(series.dataMapping.tableId);
        if (colData) {
          const data = transformTableData(series, colData, ct);
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
          if (series.markerSpec) {
            const markerColData = model.getColumnData(
              series.markerSpec.tableId
            );
            if (markerColData) {
              const tableMarkers = buildMarkersFromTableData(
                series.markerSpec,
                markerColData,
                ct,
                renderer.getTextColor()
              );
              renderer.setSeriesMarkers(series.id, tableMarkers);
            }
          } else if (series.markers) {
            renderer.setSeriesMarkers(series.id, series.markers);
          }
          renderer.updateDynamicPriceLines(series.id, colData);
        }
      });
      renderer.fitContent();
    }

    /**
     * Handle DATA_UPDATED from the model. Two paths:
     * - downsampledData present → use pre-built whitespace grid + data with gaps
     * - no downsampledData → non-downsampled table, use incremental delta logic
     */
    function handleDataUpdate(
      renderer: TradingViewChartRenderer,
      model: TradingViewChartModel,
      event: Extract<ModelEvent, { type: 'DATA_UPDATED' }>
    ) {
      const {
        tableId,
        isInitialLoad,
        isResetView,
        downsampledData,
        addedCount,
        removedCount,
        modifiedCount,
      } = event;
      const chart = renderer.getChart();
      const figure = model.getFigureData();
      if (!figure) return;

      if (downsampledData) {
        // ---- Downsampled path: whitespace grid + data with gaps ----
        suppressRef.current = true;
        const savedRange = isInitialLoad
          ? null
          : chart.timeScale().getVisibleRange();

        // Set whitespace grid (establishes time axis for body)
        if (downsampledData.whitespaceGrid.length > 0) {
          renderer.setWhitespaceData(downsampledData.whitespaceGrid);
        } else {
          renderer.clearWhitespaceData();
        }

        // Set data with gap markers on each series for this table
        figure.series.forEach(series => {
          if (series.dataMapping.tableId !== tableId) return;
          renderer.setSeriesData(
            series.id,
            downsampledData.dataWithGaps as never[]
          );
        });

        if (isResetView || isInitialLoad) {
          renderer.fitContent();
        } else if (savedRange) {
          chart.timeScale().setVisibleRange(savedRange);
        }

        suppressRef.current = false;
        return;
      }

      // ---- Non-downsampled path: incremental delta processing ----
      const colData = model.getColumnData(tableId);
      if (!colData) return;

      const ct = renderer.getChartType();
      figure.series.forEach(series => {
        if (series.dataMapping.tableId !== tableId) return;

        const isAppendOnly =
          addedCount > 0 &&
          removedCount === 0 &&
          !isInitialLoad &&
          modifiedCount === 0;
        const timeColName = series.dataMapping.columns.time;
        const timeCol = colData.get(timeColName);
        const totalRows = timeCol?.length ?? 0;
        const transformStart = isAppendOnly
          ? Math.max(0, totalRows - addedCount)
          : 0;

        const data = transformTableData(series, colData, ct, transformStart);

        if (removedCount > 0) {
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
        } else if (isInitialLoad) {
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
        } else if (isAppendOnly) {
          for (let i = 0; i < data.length; i += 1) {
            renderer.updateSeriesPoint(series.id, data[i]);
          }
        } else if (modifiedCount > 0) {
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
        }

        if (!series.markerSpec && series.markers) {
          renderer.setSeriesMarkers(series.id, series.markers);
        }
        renderer.updateDynamicPriceLines(series.id, colData);
      });

      // Table-driven markers
      figure.series.forEach(series => {
        if (series.markerSpec?.tableId !== tableId) return;
        const markerColData = model.getColumnData(tableId);
        if (!markerColData) return;
        const tableMarkers = buildMarkersFromTableData(
          series.markerSpec,
          markerColData,
          ct,
          renderer.getTextColor()
        );
        renderer.setSeriesMarkers(series.id, tableMarkers);
      });

      if (isInitialLoad) {
        renderer.fitContent();
      }
    }

    async function init() {
      try {
        const widget = await fetch();
        const exported = widget.exportedObjects;
        const dataString = widget.getDataAsString();

        if (cancelled) return;

        const model = new TradingViewChartModel(dh, widget);
        modelRef.current = model;

        if (containerRef.current) {
          const themeOptions = chartThemeToOptions(chartTheme);
          const message = JSON.parse(dataString);
          const userOptions = message.figure?.chartOptions ?? {};
          userOptionsRef.current = userOptions;
          const ct = message.figure?.chartType ?? 'standard';
          chartTypeRef.current = ct;
          const mergedOptions = deepMerge(
            themeOptions as Record<string, unknown>,
            userOptions
          );

          const renderer = new TradingViewChartRenderer(
            containerRef.current,
            mergedOptions,
            ct
          );
          rendererRef.current = renderer;

          model.subscribe((event: ModelEvent) => {
            if (cancelled) return;

            switch (event.type) {
              case 'FIGURE_UPDATED':
                handleFigureUpdate(renderer, model, event.figure);
                break;
              case 'DATA_UPDATED':
                handleDataUpdate(renderer, model, event);
                break;
              case 'ERROR':
                setError(event.message);
                break;
              default:
                break;
            }
          });

          // Configure model before init
          model.setTimeZone(timeZone);
          model.setChartType(ct);

          // Initial chart width — use timeScale if available, else container rect
          const tsWidth = renderer.getTimeScaleWidth();
          if (tsWidth > 0) {
            model.setChartWidth(tsWidth);
          } else {
            const rect = containerRef.current.getBoundingClientRect();
            if (rect.width > 0) {
              model.setChartWidth(Math.round(rect.width));
            }
          }

          await model.init(exported, dataString);

          // Set up downsampling event detection AFTER init completes,
          // so model.isDownsampled() reflects the actual state.
          if (!cancelled && model.isDownsampled()) {
            setupDownsampleSubscriptions(renderer, model);
          }
        }
      } catch (e) {
        if (!cancelled) {
          log.error('Failed to initialize TradingView chart', e);
          setError(String(e));
        }
      }
    }

    /**
     * Wire up event detection for downsample re-requests. Uses a
     * two-layer approach:
     *
     * 1. LWC subscription (subscribeVisibleLogicalRangeChange) captures
     *    the latest visible range continuously — but does NOT act on it.
     *
     * 2. DOM gesture-end events (mouseup, touchend, wheel-settle) trigger
     *    the actual zoom check using the latest captured range. This
     *    ensures we never re-downsample mid-gesture (which would replace
     *    data while the user is still dragging, causing jank).
     *
     * Must be called AFTER model.init() so isDownsampled() is accurate.
     */
    function setupDownsampleSubscriptions(
      renderer: TradingViewChartRenderer,
      model: TradingViewChartModel
    ) {
      const chart = renderer.getChart();
      const timeScale = chart.timeScale();
      const container = containerRef.current;
      if (!container) return;

      let lastDuration: number | null = null;
      let isInteracting = false;
      let wheelTimer: ReturnType<typeof setTimeout> | null = null;

      // After init, the chart settles (fitContent, resize). Ignore
      // events for 1s to let it stabilize, then capture baseline.
      let settled = false;
      setTimeout(() => {
        settled = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vr = timeScale.getVisibleRange() as any;
        if (vr) lastDuration = (vr.to as number) - (vr.from as number);
        log.debug(
          `Downsample settled, baseline duration=${lastDuration?.toFixed(0)}s`
        );
      }, 1000);

      /**
       * Check the current visible range against last known duration.
       * If duration changed (zoom), request a re-downsample.
       * Called ONLY when a user gesture ends.
       */
      function checkAndMaybeDownsample() {
        if (!settled || suppressRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const visRange = timeScale.getVisibleRange() as any;
        const from = visRange?.from as number | undefined;
        const to = visRange?.to as number | undefined;
        if (from == null || to == null) return;

        const duration = to - from;
        const TOLERANCE = 0.02;
        const isZoom =
          lastDuration != null &&
          Math.abs(duration - lastDuration) /
            Math.max(duration, lastDuration) >
            TOLERANCE;

        lastDuration = duration;

        if (isZoom) {
          log.debug(
            `Zoom detected: ${duration.toFixed(0)}s → re-downsample`
          );
          model.requestDownsample(
            timeScale.width(),
            [from, to],
            false
          );
        }
        // Pan: no re-downsample. Head+body+tail spans full source.
      }

      // --- Gesture tracking via DOM events ---
      function onGestureEnd() {
        isInteracting = false;
        // Small delay to let the chart finalize the range
        setTimeout(checkAndMaybeDownsample, 50);
      }

      function handleMouseDown() {
        isInteracting = true;
        window.addEventListener('mouseup', handleMouseUp, { once: true });
      }
      function handleMouseUp() {
        onGestureEnd();
      }
      function handleWheel() {
        isInteracting = true;
        if (wheelTimer != null) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(onGestureEnd, 300);
      }
      function handleTouchStart() {
        isInteracting = true;
      }
      function handleTouchEnd() {
        onGestureEnd();
      }

      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('wheel', handleWheel, { passive: true });
      container.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      container.addEventListener('touchend', handleTouchEnd);

      // --- Size change: re-downsample at new width ---
      // Guard against spurious fires from setData (chart layout changes
      // trigger size events). Also skip if width hasn't actually changed.
      let lastWidth = timeScale.width();
      const unsubSize = renderer.subscribeSizeChange(() => {
        if (!settled || isInteracting || suppressRef.current) return;
        const newWidth = timeScale.width();
        if (newWidth <= 0 || newWidth === lastWidth) return;
        lastWidth = newWidth;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const visRange = timeScale.getVisibleRange() as any;
        const from = visRange?.from as number | undefined;
        const to = visRange?.to as number | undefined;
        const range =
          from != null && to != null
            ? ([from, to] as [number, number])
            : null;
        model.requestDownsample(newWidth, range, false);
      });

      // Store cleanup
      dsCleanupRef.current = () => {
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
        unsubSize();
        if (wheelTimer != null) clearTimeout(wheelTimer);
      };
    }

    init();

    return () => {
      cancelled = true;
      dsCleanupRef.current?.();
      dsCleanupRef.current = null;
      modelRef.current?.close();
      modelRef.current = null;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dh, fetch, timeZone]);

  // Apply theme changes without tearing down the model/renderer.
  useEffect(() => {
    const renderer = rendererRef.current;
    const model = modelRef.current;
    if (!renderer || !model) return;

    const themeOptions = chartThemeToOptions(chartTheme);
    const mergedOptions = deepMerge(
      themeOptions as Record<string, unknown>,
      userOptionsRef.current
    );

    renderer.applyOptions(mergedOptions);
    replayAllData(renderer, model);
  }, [chartTheme, replayAllData]);

  // Handle container resize (CSS layout). For non-downsampled charts, fitContent.
  // For downsampled charts, subscribeSizeChange handles re-downsample.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        rendererRef.current?.resize(width, height);
        if (!modelRef.current?.isDownsampled()) {
          rendererRef.current?.fitContent();
        }
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Downsampling subscriptions are now set up inside the init effect
  // (setupDownsampleSubscriptions) after model.init() completes, since
  // model.isDownsampled() isn't known until then.

  return (
    <div
      ref={containerRef}
      className="dh-tvl-chart"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
        minWidth: 0,
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
      }}
    >
      {error != null && (
        <div style={{ padding: 16, color: 'red' }}>
          Error loading chart: {error}
        </div>
      )}
    </div>
  );
}

export default TradingViewChart;
