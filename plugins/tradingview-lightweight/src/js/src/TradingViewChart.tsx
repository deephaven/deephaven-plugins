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
  // Use browser timezone — matches DH's default. The DH Redux store
  // isn't available in the WidgetPlugin context, so we can't use
  // useSelector(getTimeZone). If the user changes their timezone in
  // DH settings, they'll need to refresh for charts to pick it up.
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const chartTheme = useDHChartTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<TradingViewChartRenderer | null>(null);
  const modelRef = useRef<TradingViewChartModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Store the user chart options (from the Python figure) so theme updates
  // can re-merge without re-fetching the widget.
  const userOptionsRef = useRef<Record<string, unknown>>({});
  const chartTypeRef = useRef<TvlChartType>('standard');

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
          // Table-driven markers take precedence over static
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
  // Does NOT depend on chartTheme — theme changes are handled separately.
  useEffect(() => {
    let cancelled = false;

    function handleFigureUpdate(
      renderer: TradingViewChartRenderer,
      model: TradingViewChartModel,
      figure: TvlFigureData
    ) {
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
          // Table-driven markers take precedence over static
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

    function handleDataUpdate(
      renderer: TradingViewChartRenderer,
      model: TradingViewChartModel,
      tableId: number,
      isInitialLoad: boolean,
      addedCount: number,
      removedCount: number,
      modifiedCount: number,
      preserveVisibleRange: boolean
    ) {
      // Save visible range before data replace to prevent setSeriesData
      // from shifting the view (which would trigger spurious re-downsample).
      const chart = renderer.getChart();
      const savedRange = preserveVisibleRange
        ? chart.timeScale().getVisibleRange()
        : null;

      const figure = model.getFigureData();
      if (!figure) return;

      const colData = model.getColumnData(tableId);
      if (!colData) return;

      const ct = renderer.getChartType();
      figure.series.forEach(series => {
        if (series.dataMapping.tableId !== tableId) return;

        // For append-only ticking updates, only transform the newly added
        // rows — the model's timeTranslator already converted them via
        // ChartData's cached delta processing.
        const isAppendOnly =
          addedCount > 0 && removedCount === 0 && !isInitialLoad && modifiedCount === 0;
        const timeColName = series.dataMapping.columns.time;
        const timeCol = colData.get(timeColName);
        const totalRows = timeCol?.length ?? 0;
        const transformStart = isAppendOnly
          ? Math.max(0, totalRows - addedCount)
          : 0;

        const data = transformTableData(series, colData, ct, transformStart);

        if (removedCount > 0) {
          // Full replace needed (rows removed or re-downsampled)
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
        } else if (isInitialLoad) {
          // Fix D: Use setData() for bulk initial load (1 call vs N update() calls)
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
        } else if (isAppendOnly) {
          // Append-only: data contains only the new points (from transformStart)
          for (let i = 0; i < data.length; i += 1) {
            renderer.updateSeriesPoint(series.id, data[i]);
          }
        } else if (modifiedCount > 0) {
          // Fix E: Modified-only updates need full replace since
          // series.update() only operates on the last bar
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
        }

        // Static markers (only if no table-driven markerSpec)
        if (!series.markerSpec && series.markers) {
          renderer.setSeriesMarkers(series.id, series.markers);
        }

        // Update dynamic price lines with latest column values
        renderer.updateDynamicPriceLines(series.id, colData);
      });

      // Rebuild table-driven markers when the marker table updates
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

      // Restore the visible range after re-downsample data replace.
      // This prevents setSeriesData from shifting the view.
      if (savedRange) {
        chart.timeScale().setVisibleRange(savedRange);
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
                handleDataUpdate(
                  renderer,
                  model,
                  event.tableId,
                  event.isInitialLoad,
                  event.addedCount,
                  event.removedCount,
                  event.modifiedCount,
                  event.preserveVisibleRange
                );
                break;
              case 'ERROR':
                setError(event.message);
                break;
              default:
                break;
            }
          });

          // Configure model before init so translators use the right
          // timezone and chart type for time column conversion.
          model.setTimeZone(timeZone);
          model.setChartType(ct);

          // Tell model the initial chart width before init so
          // downsampling can use the right pixel count.
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0) {
            model.setChartWidth(Math.round(rect.width));
          }

          await model.init(exported, dataString);
        }
      } catch (e) {
        if (!cancelled) {
          log.error('Failed to initialize TradingView chart', e);
          setError(String(e));
        }
      }
    }

    init();

    return () => {
      cancelled = true;
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

    // Re-color series with new theme colorway / OHLC colors
    replayAllData(renderer, model);
  }, [chartTheme, replayAllData]);

  // Handle container resize.
  // Skip zero-size updates (panel hidden / display:none) and
  // trigger fitContent when panel becomes visible.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        rendererRef.current?.resize(width, height);
        rendererRef.current?.fitContent();
        // Update model's chart width for downsampling re-calculation
        modelRef.current?.setChartWidth(Math.round(width));
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Track user interactions (mouse drag, wheel, touch) to only trigger
  // re-downsampling AFTER the user finishes their gesture — never during.
  // This prevents the viewport from jumping mid-pan/zoom when new
  // downsampled data arrives and replaces the series.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let isInteracting = false;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;

    function readRangeAndForward() {
      const renderer = rendererRef.current;
      const model = modelRef.current;
      if (!renderer || !model) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const range = renderer.getChart().timeScale().getVisibleRange() as any;
      if (range == null) {
        model.setVisibleRange(null);
      } else {
        // range.from / range.to are Time values (UTC seconds)
        const fromMs = (range.from as number) * 1000;
        const toMs = (range.to as number) * 1000;
        model.setVisibleRange([
          new Date(fromMs).toISOString(),
          new Date(toMs).toISOString(),
        ]);
      }
    }

    function onInteractionEnd() {
      if (!isInteracting) return;
      isInteracting = false;
      // Small delay to let the chart finish processing the gesture
      setTimeout(readRangeAndForward, 0);
    }

    function handleMouseDown() {
      isInteracting = true;
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    }

    function handleMouseUp() {
      onInteractionEnd();
    }

    function handleWheel() {
      isInteracting = true;
      if (wheelTimer != null) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(onInteractionEnd, 300);
    }

    function handleTouchStart() {
      isInteracting = true;
    }

    function handleTouchEnd() {
      onInteractionEnd();
    }

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      if (wheelTimer != null) clearTimeout(wheelTimer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="dh-tvl-chart"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        // min-height/width 0 allows shrinking inside flex containers.
        // Without this, lightweight-charts' internal elements dictate
        // a natural height that overflows the panel.
        minHeight: 0,
        minWidth: 0,
        // flex-grow fills available space; flex-basis 0 means "start
        // from zero height and grow" instead of "start from content
        // height and maybe overflow".
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
