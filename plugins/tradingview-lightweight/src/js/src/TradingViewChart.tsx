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
  const [debugInfo, setDebugInfoRaw] = useState<string>('loading...');

  const userOptionsRef = useRef<Record<string, unknown>>({});
  const chartTypeRef = useRef<TvlChartType>('standard');

  /**
   * Suppress flag: set to true while we programmatically update chart data
   * via setData/setVisibleRange so that zoom detection doesn't trigger a
   * spurious re-downsample.
   */
  const suppressRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Last ZOOM request range — used by handleDataUpdate to lock viewport. */
  const lastZoomRangeRef = useRef<{ from: number; to: number } | null>(null);

  /** Cleanup for downsample subscriptions (set up inside init, cleaned in return). */
  const dsCleanupRef = useRef<(() => void) | null>(null);

  /**
   * Build structured debug state as JSON for the data-tvl-state attribute.
   * Always set on the container so Playwright tests can read it.
   */
  function buildStateJson(
    model: TradingViewChartModel | null,
    renderer: TradingViewChartRenderer | null
  ): string {
    if (!model) return '{}';
    const fullRange = model.getFullTimeRange();
    let tableSize = 0;
    let colDataRows = 0;
    let viewport: [number, number] | null = null;
    model.getDownsampledTableIds().forEach(tid => {
      const t = model.getTable(tid);
      if (t) tableSize = t.size;
      const cd = model.getColumnData(tid);
      if (cd) {
        const first = cd.keys().next().value;
        if (first != null) colDataRows = cd.get(first)?.length ?? 0;
      }
      if (t) viewport = [0, Math.max(0, t.size - 1)];
    });
    let visRange: [number, number] | null = null;
    if (renderer) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vr = renderer.getChart().timeScale().getVisibleRange() as any;
        if (vr != null) visRange = [vr.from as number, vr.to as number];
      } catch {
        // chart may not be ready
      }
    }
    return JSON.stringify({
      pythonDs: model.isPythonDownsampled(),
      fullRange,
      tableSize,
      colDataRows,
      pendingDs: (model as any).pendingDownsample as boolean,
      viewport,
      visRange,
    });
  }

  /**
   * Update debug info text AND the structured data-tvl-state attribute.
   * Wraps setDebugInfoRaw so all call sites get both updates.
   */
  function updateDebugState(
    text: string | ((prev: string) => string),
    model: TradingViewChartModel | null,
    renderer: TradingViewChartRenderer | null
  ): void {
    setDebugInfoRaw(text);
    if (containerRef.current) {
      containerRef.current.setAttribute(
        'data-tvl-state',
        buildStateJson(model, renderer)
      );
    }
  }

  /** Gather debug state from model + renderer + chart into a string. */
  function gatherDebug(
    label: string,
    model: TradingViewChartModel | null,
    renderer: TradingViewChartRenderer | null
  ): string {
    const lines: string[] = [`--- ${label} ---`];
    if (!model) {
      lines.push('model: null');
      return lines.join('\n');
    }
    lines.push(`pythonDs: ${model.isPythonDownsampled()}`);
    const fullRange = model.getFullTimeRange();
    if (fullRange) {
      lines.push(
        `fullRange: ${new Date(fullRange[0] * 1000)
          .toISOString()
          .slice(0, 10)}` +
          ` → ${new Date(fullRange[1] * 1000).toISOString().slice(0, 10)}`
      );
    } else {
      lines.push('fullRange: null');
    }
    const dsIds = model.getDownsampledTableIds();
    dsIds.forEach(tid => {
      const t = model.getTable(tid);
      lines.push(`table[${tid}]: size=${t?.size ?? '?'}`);
      const colData = model.getColumnData(tid);
      if (colData) {
        const firstCol = colData.keys().next().value;
        if (firstCol != null) {
          const arr = colData.get(firstCol);
          lines.push(`  colData[${firstCol}]: ${arr?.length ?? 0} rows`);
        }
      }
    });
    lines.push(`pendingDs: ${(model as any).pendingDownsample}`);
    // Viewport ranges
    const vpMap = (model as any).viewportRangeMap as Map<
      number,
      [number, number]
    >;
    if (vpMap != null) {
      vpMap.forEach((vp, tid) => {
        lines.push(`viewport[${tid}]: [${vp[0]}, ${vp[1]}]`);
      });
    }
    // Visible range from chart
    if (renderer) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vr = renderer.getChart().timeScale().getVisibleRange() as any;
        if (vr != null) {
          const fromD = new Date((vr.from as number) * 1000)
            .toISOString()
            .slice(0, 10);
          const toD = new Date((vr.to as number) * 1000)
            .toISOString()
            .slice(0, 10);
          const dur = ((vr.to as number) - (vr.from as number)) / 86400;
          lines.push(`visRange: ${fromD} → ${toD} (${dur.toFixed(0)}d)`);
        }
      } catch {
        // chart may not be ready
      }
    }
    return lines.join('\n');
  }

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
     * Handle DATA_UPDATED from the model.
     * Unified path for both downsampled and non-downsampled tables.
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
        addedCount,
        removedCount,
        modifiedCount,
      } = event;
      const figure = model.getFigureData();
      if (!figure) return;

      const colData = model.getColumnData(tableId);
      if (!colData) return;

      const ct = renderer.getChartType();

      const isPythonDs = model.isPythonDownsampled();
      const chart = renderer.getChart();

      if (isPythonDs && !isInitialLoad) {
        suppressRef.current = true;
      }

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

        if (isPythonDs || removedCount > 0 || isInitialLoad) {
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

      if (isResetView === true || isInitialLoad === true) {
        renderer.fitContent();
      } else if (isPythonDs && lastZoomRangeRef.current) {
        // Lock the visible range after data replacement to prevent
        // visual jumping when bar density changes (hybrid merge).
        try {
          chart.timeScale().setVisibleRange({
            from: lastZoomRangeRef.current.from,
            to: lastZoomRangeRef.current.to,
          } as never);
        } catch {
          // chart may not be ready
        }
      }

      if (isPythonDs && !isInitialLoad) {
        // Keep suppress active long enough for async LWC range-change
        // events + debounce (150ms) to settle before re-enabling.
        if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
        suppressTimerRef.current = setTimeout(() => {
          suppressRef.current = false;
        }, 300);
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
                updateDebugState(
                  gatherDebug('FIGURE_UPDATED', model, renderer),
                  model,
                  renderer
                );
                break;
              case 'DATA_UPDATED':
                handleDataUpdate(renderer, model, event);
                updateDebugState(
                  gatherDebug(
                    `DATA tid=${event.tableId} init=${event.isInitialLoad} reset=${event.isResetView} add=${event.addedCount}`,
                    model,
                    renderer
                  ),
                  model,
                  renderer
                );
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
          model.setDebugFn(msg => {
            updateDebugState(
              prev => {
                const lines = prev.split('\n');
                lines.push(msg);
                return lines.slice(-15).join('\n');
              },
              model,
              renderer
            );
          });

          await model.init(exported, dataString);
          updateDebugState(
            gatherDebug('INIT', model, renderer),
            model,
            renderer
          );

          // Set up downsample event detection AFTER init completes
          if (!cancelled && model.isPythonDownsampled()) {
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
     * Wire up zoom/pan detection for Python-side downsampling.
     *
     * Hybrid architecture: the merged table always covers the full
     * time range (low-fi background + high-fi foreground).  All
     * interactions (zoom, pan, resize) send ZOOM with the visible
     * time range.  No viewport sliding, no logicalToTime conversion.
     */
    function setupDownsampleSubscriptions(
      renderer: TradingViewChartRenderer,
      model: TradingViewChartModel
    ) {
      const chart = renderer.getChart();
      const timeScale = chart.timeScale();
      const container = containerRef.current;
      if (!container) return;

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let settled = false;

      // Track the last zoom request to detect meaningful changes
      let lastZoomFrom: number | null = null;
      let lastZoomTo: number | null = null;

      // After init, the chart settles (fitContent, resize). Ignore
      // events for 1s to let it stabilize, then capture baseline.
      setTimeout(() => {
        settled = true;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vr = timeScale.getVisibleRange() as any;
          if (vr != null) {
            lastZoomFrom = vr.from as number;
            lastZoomTo = vr.to as number;
          }
        } catch {
          // chart may not be ready
        }
      }, 1000);

      // --- Pointer tracking: block requests until mouseup ---
      let dragging = false;
      let pendingAction = false;
      const onDown = () => {
        dragging = true;
      };
      const onUp = () => {
        dragging = false;
        if (!pendingAction) return;
        pendingAction = false;
        if (suppressRef.current) {
          const check = setInterval(() => {
            if (!suppressRef.current) {
              clearInterval(check);
              processRangeChange();
            }
          }, 50);
          setTimeout(() => clearInterval(check), 3000);
        } else {
          processRangeChange();
        }
      };
      container.addEventListener('pointerdown', onDown, true);
      window.addEventListener('pointerup', onUp, true);

      /**
       * Core logic: read the visible TIME range and send ZOOM if it
       * has changed enough (zoom level or center shift).
       */
      function processRangeChange(): void {
        if (suppressRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vr = timeScale.getVisibleRange() as any;
        if (vr == null) return;
        const visFrom = vr.from as number;
        const visTo = vr.to as number;
        const visDur = visTo - visFrom;
        if (visDur < 1) return;

        // Initialize baseline on first event
        if (lastZoomFrom == null || lastZoomTo == null) {
          lastZoomFrom = visFrom;
          lastZoomTo = visTo;
          return;
        }

        const lastDur = lastZoomTo - lastZoomFrom;
        const durChange =
          lastDur > 0
            ? Math.abs(visDur - lastDur) / Math.max(visDur, lastDur)
            : 1;
        const centerShift =
          visDur > 0
            ? Math.abs(
                (visFrom + visTo) / 2 - (lastZoomFrom + lastZoomTo) / 2
              ) / visDur
            : 0;

        // Re-downsample if zoom level changed (>10%) or panned (>20%)
        if (durChange > 0.1 || centerShift > 0.2) {
          lastZoomFrom = visFrom;
          lastZoomTo = visTo;

          const fullRange = model.getFullTimeRange();
          if (!fullRange) return;

          const buf = visDur * 0.5;
          const from = Math.max(fullRange[0], visFrom - buf);
          const to = Math.min(fullRange[1], visTo + buf);

          // Save the visible range for setVisibleRange after data arrives
          lastZoomRangeRef.current = { from: visFrom, to: visTo };

          updateDebugState(
            gatherDebug('ZOOM', model, renderer),
            model,
            renderer
          );
          model.sendZoom(from, to);
        }

        // Refresh state attribute for tests
        if (containerRef.current) {
          containerRef.current.setAttribute(
            'data-tvl-state',
            buildStateJson(model, renderer)
          );
        }
      }

      // Visible range change handler.
      const unsubRange = renderer.subscribeVisibleLogicalRangeChange(() => {
        if (!settled) return;
        if (dragging) {
          pendingAction = true;
          return;
        }
        if (suppressRef.current) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processRangeChange, 150);
      });

      // Disable LWC's native axis double-click reset so we handle it ourselves.
      // Fix edges so panning can't scroll past the data extent.
      chart.applyOptions({
        handleScale: { axisDoubleClickReset: { time: false, price: false } },
        timeScale: { fixLeftEdge: true, fixRightEdge: true },
      } as never);

      // Double-click reset: listen on the CONTAINER so both chart body
      // and time axis double-clicks trigger a full reset.
      const onDblClick = () => {
        if (!settled) return;
        lastZoomFrom = null;
        lastZoomTo = null;
        lastZoomRangeRef.current = null;
        updateDebugState(
          gatherDebug('DBLCLICK → RESET', model, renderer),
          model,
          renderer
        );
        model.sendReset();
      };
      container.addEventListener('dblclick', onDblClick);

      // Size change: re-zoom at new width
      let lastWidth = timeScale.width();
      const unsubSize = renderer.subscribeSizeChange(() => {
        if (!settled || suppressRef.current) return;
        const newWidth = timeScale.width();
        if (newWidth <= 0 || newWidth === lastWidth) return;
        lastWidth = newWidth;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const visRange = timeScale.getVisibleRange() as any;
        const from = visRange?.from as number | undefined;
        const to = visRange?.to as number | undefined;
        if (from != null && to != null) {
          lastZoomRangeRef.current = { from, to };
          model.sendZoom(from, to);
        }
      });

      dsCleanupRef.current = () => {
        unsubRange();
        container.removeEventListener('dblclick', onDblClick);
        unsubSize();
        if (debounceTimer) clearTimeout(debounceTimer);
        container.removeEventListener('pointerdown', onDown, true);
        window.removeEventListener('pointerup', onUp, true);
      };
    }

    init();

    return () => {
      cancelled = true;
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
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

  // Handle container resize (CSS layout).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        rendererRef.current?.resize(width, height);
        if (modelRef.current?.isPythonDownsampled() !== true) {
          rendererRef.current?.fitContent();
        }
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
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
      <div
        data-testid="tvl-debug"
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          color: '#0f0',
          fontFamily: 'monospace',
          fontSize: 11,
          padding: '4px 8px',
          whiteSpace: 'pre',
          pointerEvents: 'none',
          maxWidth: '50%',
          overflow: 'hidden',
          display: 'none',
        }}
      >
        {debugInfo}
      </div>
    </div>
  );
}

export default TradingViewChart;
