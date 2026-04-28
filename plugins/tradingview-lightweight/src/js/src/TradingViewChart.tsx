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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Vite ?inline import returns CSS as string
import tvlStyles from './TradingViewChart.css?inline';

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

/** Props for TradingViewChart when used inside a panel wrapper. */
export interface TradingViewChartProps
  extends WidgetComponentProps<DhType.Widget> {
  /** Called when loading state changes (for panel-level LoadingOverlay). */
  onLoadingChange?: (loading: boolean) => void;
  /** Called when an error occurs (for panel-level error display). */
  onError?: (error: string | null) => void;
}

function TradingViewChart(props: TradingViewChartProps): JSX.Element | null {
  const dh = useApi();
  const { fetch, onLoadingChange, onError } = props;
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const chartTheme = useDHChartTheme();
  const chartThemeRef = useRef(chartTheme);
  chartThemeRef.current = chartTheme;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<TradingViewChartRenderer | null>(null);
  const modelRef = useRef<TradingViewChartModel | null>(null);
  const [error, setErrorState] = useState<string | null>(null);
  const [debugInfo, setDebugInfoRaw] = useState<string>('loading...');
  const [isLoading, setIsLoadingState] = useState(true);

  const setIsLoading = useCallback(
    (loading: boolean) => {
      setIsLoadingState(loading);
      onLoadingChange?.(loading);
    },
    [onLoadingChange]
  );

  const setError = useCallback(
    (err: string | null) => {
      setErrorState(err);
      onError?.(err);
    },
    [onError]
  );
  const [pendingDs, setPendingDs] = useState(false);
  const [showScrim, setShowScrim] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  // Progressive reveal: scrim after 200ms, status bar after 500ms
  useEffect(() => {
    if (!pendingDs) {
      setShowScrim(false);
      setShowStatus(false);
      return undefined;
    }
    const scrimTimer = setTimeout(() => setShowScrim(true), 200);
    const statusTimer = setTimeout(() => setShowStatus(true), 500);
    return () => {
      clearTimeout(scrimTimer);
      clearTimeout(statusTimer);
    };
  }, [pendingDs]);

  const userOptionsRef = useRef<Record<string, unknown>>({});
  const chartTypeRef = useRef<TvlChartType>('standard');

  // ---- Downsample interaction state ----

  /**
   * True while we are programmatically calling setData / setVisibleRange.
   * Range-change events during this window are ignored.
   */
  const suppressRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * The visible range to restore after new downsample data arrives.
   * Set just before calling performDownsample (zoom/pan), read in
   * handleDataUpdate. Null means "fitContent" (initial / reset).
   */
  const restoreRangeRef = useRef<{ from: number; to: number } | null>(null);

  /**
   * The downsample range we last requested [from, to] in TZ-shifted seconds.
   * Null means full range. Used to compute scaffold density ratio.
   */
  const lastDsRangeRef = useRef<[number, number] | null>(null);

  /** True while the user is actively dragging (pointer down on chart). */
  const draggingRef = useRef(false);

  /** Cleanup for downsample subscriptions. */
  const dsCleanupRef = useRef<(() => void) | null>(null);

  // ---- Debug helpers ----

  function buildStateJson(
    model: TradingViewChartModel | null,
    renderer: TradingViewChartRenderer | null
  ): string {
    if (!model) return '{}';
    let tableSize = 0;
    let colDataRows = 0;
    model.getDownsampledTableIds().forEach(tid => {
      const t = model.getTable(tid);
      if (t) tableSize = t.size;
      const cd = model.getColumnData(tid);
      if (cd) {
        const first = cd.keys().next().value;
        if (first != null) colDataRows = cd.get(first)?.length ?? 0;
      }
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
      jsDs: model.isDownsampled(),
      tableSize,
      colDataRows,
      pendingDs: (model as any).pendingDownsample as boolean,
      visRange,
    });
  }

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
    lines.push(`jsDs: ${model.isDownsampled()}`);
    model.getDownsampledTableIds().forEach(tid => {
      const t = model.getTable(tid);
      lines.push(`table[${tid}]: size=${t?.size ?? '?'}`);
    });
    lines.push(`pendingDs: ${(model as any).pendingDownsample}`);
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

  // ---- Scaffold ----

  /**
   * Update the scaffold with the correct density.
   *
   * runChartDownsample with a range returns:
   *   ~5 sparse HEAD rows | dense BODY rows | ~5 sparse TAIL rows
   *
   * The scaffold must cover the FULL extent (head-to-tail) at a density
   * that matches the BODY region. This ensures the sparse head/tail
   * points get placed at correct time-proportional positions.
   *
   * Density calculation:
   *   bodyDensity ≈ width * 2 points per bodyDuration
   *   scaffoldCount = bodyDensity * totalDuration
   *                 = width * 2 * (totalDuration / bodyDuration)
   *   capped at 30K
   *
   * For full range (no head/tail), just use width * 2.
   */
  function updateScaffold(
    renderer: TradingViewChartRenderer,
    model: TradingViewChartModel
  ): void {
    if (!renderer.isScaffoldEnabled()) return;

    const figure = model.getFigureData();
    if (!figure) return;

    // Find time extent across all data (includes head + body + tail)
    let dataMin = Infinity;
    let dataMax = -Infinity;
    figure.series.forEach(series => {
      const colData = model.getColumnData(series.dataMapping.tableId);
      if (!colData) return;
      const timeCol = colData.get(series.dataMapping.columns.time);
      if (!timeCol || timeCol.length === 0) return;
      const first = timeCol[0] as number;
      const last = timeCol[timeCol.length - 1] as number;
      if (first < dataMin) dataMin = first;
      if (last > dataMax) dataMax = last;
    });

    if (dataMin >= dataMax) return;

    const totalDuration = dataMax - dataMin;
    const width = renderer.getTimeScaleWidth();
    const dsRange = lastDsRangeRef.current;

    let count: number;
    if (dsRange != null) {
      // Zoomed: scale density so body region gets ~width*2 points,
      // and the full extent (including head/tail) is proportionally dense
      const bodyDuration = Math.max(1, dsRange[1] - dsRange[0]);
      const ratio = totalDuration / bodyDuration;
      count = Math.min(30000, Math.max(1000, Math.ceil(width * 2 * ratio)));
    } else {
      // Full range: no head/tail, just need body density
      count = Math.min(30000, Math.max(1000, width * 2));
    }

    renderer.setScaffoldData(dataMin, dataMax, count);
  }

  // ---- Series data helpers ----

  function renderAllSeriesData(
    renderer: TradingViewChartRenderer,
    model: TradingViewChartModel,
    figure: TvlFigureData
  ): void {
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
  }

  const replayAllData = useCallback(
    (renderer: TradingViewChartRenderer, model: TradingViewChartModel) => {
      const figure = model.getFigureData();
      if (!figure) return;

      renderer.configureSeries(
        figure.series,
        getColorway(chartTheme),
        getOhlcColors(chartTheme),
        model.isDownsampled()
      );
      if (figure.paneStretchFactors) {
        renderer.applyPaneStretchFactors(figure.paneStretchFactors);
      }
      renderAllSeriesData(renderer, model, figure);
      if (model.isDownsampled()) {
        updateScaffold(renderer, model);
      }
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
        getOhlcColors(chartThemeRef.current),
        model.isDownsampled()
      );
      if (figure.paneStretchFactors) {
        renderer.applyPaneStretchFactors(figure.paneStretchFactors);
      }
      renderAllSeriesData(renderer, model, figure);
      renderer.fitContent();
    }

    /**
     * Handle DATA_UPDATED from the model.
     *
     * For downsampled tables after a zoom/pan/reset:
     * 1. Suppress range-change events
     * 2. Update scaffold (correct density for head/body/tail)
     * 3. setData for all affected series
     * 4. Restore the saved visible range (zoom/pan) or fitContent (reset/init)
     * 5. Un-suppress after a delay
     *
     * For non-downsampled or ticking updates: normal incremental path.
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
        isDownsampleSwap,
        addedCount,
        removedCount,
        modifiedCount,
      } = event;
      const figure = model.getFigureData();
      if (!figure) return;

      const colData = model.getColumnData(tableId);
      if (!colData) return;

      const ct = renderer.getChartType();
      const chart = renderer.getChart();

      // isDownsampleSwap = first data from a fresh runChartDownsample call.
      // Only suppress range events for actual data swaps, NOT for ticks.
      if (isDownsampleSwap) {
        suppressRef.current = true;
      }

      // --- Update series data ---
      figure.series.forEach(series => {
        if (series.dataMapping.tableId !== tableId) return;

        const isAppendOnly =
          addedCount > 0 &&
          removedCount === 0 &&
          !isInitialLoad &&
          modifiedCount === 0;

        // Data swap or initial load: full setData (data shape changed).
        // Ticks on downsampled tables: incremental (just appending new rows).
        if (isDownsampleSwap || removedCount > 0 || isInitialLoad) {
          const data = transformTableData(series, colData, ct);
          const deduped = deduplicateByTime(data as Record<string, unknown>[]);
          renderer.setSeriesData(series.id, deduped as never[]);
        } else if (isAppendOnly) {
          const timeColName = series.dataMapping.columns.time;
          const timeCol = colData.get(timeColName);
          const totalRows = timeCol?.length ?? 0;
          const start = Math.max(0, totalRows - addedCount);
          const data = transformTableData(series, colData, ct, start);
          for (let i = 0; i < data.length; i += 1) {
            renderer.updateSeriesPoint(series.id, data[i]);
          }
        } else if (modifiedCount > 0) {
          const data = transformTableData(series, colData, ct);
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

      // --- Update scaffold on data swap ---
      if (isDownsampleSwap) {
        updateScaffold(renderer, model);
      }

      // --- Viewport control ---
      if (isResetView === true || isInitialLoad === true) {
        // Reset or initial load: show everything, clear any saved range
        restoreRangeRef.current = null;
        renderer.fitContent();
      } else if (isDownsampleSwap && restoreRangeRef.current) {
        // Zoom/pan data swap: restore the exact visible range the user had
        try {
          chart.timeScale().setVisibleRange({
            from: restoreRangeRef.current.from,
            to: restoreRangeRef.current.to,
          } as never);
        } catch {
          // chart may not be ready
        }
      } else if (addedCount > 0 && !isInitialLoad && !draggingRef.current) {
        // Ticking: snap-to-live if right edge is near latest data
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vr = chart.timeScale().getVisibleRange() as any;
          if (vr != null) {
            const visFrom = vr.from as number;
            const visTo = vr.to as number;
            const visDur = visTo - visFrom;
            const timeColName = figure.series[0]?.dataMapping.columns.time;
            const timeArr = timeColName ? colData.get(timeColName) : undefined;
            if (timeArr && timeArr.length > 0 && visDur > 0) {
              const lastTime = timeArr[timeArr.length - 1] as number;
              const gap = lastTime - visTo;
              if (gap > 0 && gap < visDur * 0.01) {
                chart.timeScale().setVisibleRange({
                  from: visFrom + gap,
                  to: lastTime,
                } as never);
              }
            }
          }
        } catch {
          // chart may not be ready
        }
      }

      // --- Un-suppress after delay (only for data swaps) ---
      if (isDownsampleSwap) {
        if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
        suppressTimerRef.current = setTimeout(() => {
          suppressRef.current = false;
        }, 300);
      }
    }

    /**
     * Create or reconnect the model. Reuses the existing renderer.
     */
    async function connectModel(
      renderer: TradingViewChartRenderer
    ): Promise<void> {
      if (modelRef.current) {
        dsCleanupRef.current?.();
        dsCleanupRef.current = null;
        modelRef.current.close();
        modelRef.current = null;
      }

      const widget = await fetch();
      const exported = widget.exportedObjects;
      const dataString = widget.getDataAsString();
      if (cancelled) return;

      const model = new TradingViewChartModel(dh, widget);
      modelRef.current = model;

      const message = JSON.parse(dataString);
      const userOptions = message.figure?.chartOptions ?? {};
      userOptionsRef.current = userOptions;
      const ct = message.figure?.chartType ?? 'standard';
      chartTypeRef.current = ct;

      if (Object.keys(userOptions).length > 0) {
        const themeOptions = chartThemeToOptions(chartThemeRef.current);
        const mergedOptions = deepMerge(
          themeOptions as Record<string, unknown>,
          userOptions
        );
        renderer.applyOptions(mergedOptions);
      }

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
            if (event.isInitialLoad) setIsLoading(false);
            if (!event.isInitialLoad) setPendingDs(false);
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
          case 'DOWNSAMPLE_PENDING':
            if (event.pending) {
              setPendingDs(true);
            }
            break;
          case 'DISCONNECTED':
            if (!event.connected) {
              setError('Chart disconnected');
            } else {
              log.info('Table reconnected, re-initializing model');
              setError(null);
              setIsLoading(true);
              connectModel(renderer).catch(e => {
                log.error('Reconnection failed', e);
                setIsLoading(false);
                setError(`Reconnection failed: ${String(e)}`);
              });
            }
            break;
          case 'ERROR':
            setIsLoading(false);
            setError(event.message);
            break;
          default:
            break;
        }
      });

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

      // Initial downsample is full range (null) — no sparse ends
      lastDsRangeRef.current = null;
      restoreRangeRef.current = null;

      await model.init(exported, dataString);
      updateDebugState(
        gatherDebug('INIT', model, renderer),
        model,
        renderer
      );

      if (!cancelled && model.isDownsampled()) {
        setupDownsampleSubscriptions(renderer, model);
      }
    }

    async function init() {
      if (!containerRef.current) return;

      const themeOptions = chartThemeToOptions(chartThemeRef.current);
      const ct = chartTypeRef.current;
      const renderer = new TradingViewChartRenderer(
        containerRef.current,
        themeOptions as Record<string, unknown>,
        ct
      );
      rendererRef.current = renderer;

      try {
        await connectModel(renderer);
      } catch (e) {
        if (!cancelled) {
          log.error('Failed to initialize TradingView chart', e);
          setIsLoading(false);
          setError(String(e));
        }
      }
    }

    // ================================================================
    // Zoom / Pan / Reset detection — rewritten from scratch
    // ================================================================

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

      // Baseline: the range we last sent a downsample request for.
      // Used to detect whether the user has zoomed/panned enough to
      // warrant a new downsample. Starts null — captured after settle.
      let baselineFrom: number | null = null;
      let baselineTo: number | null = null;

      // Let the chart settle for 1s after init (fitContent, resize, etc.)
      // before we start listening to range changes.
      setTimeout(() => {
        settled = true;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vr = timeScale.getVisibleRange() as any;
          if (vr != null) {
            baselineFrom = vr.from as number;
            baselineTo = vr.to as number;
          }
        } catch {
          // chart may not be ready
        }
      }, 1000);

      // --- Pointer tracking ---
      // During a drag (pan), range changes fire continuously.
      // We defer processing until pointerup to avoid firing many
      // downsample requests mid-drag.
      let needsProcessAfterDrag = false;
      const onDown = () => {
        draggingRef.current = true;
      };
      const onUp = () => {
        draggingRef.current = false;
        if (needsProcessAfterDrag) {
          needsProcessAfterDrag = false;
          processRangeChange();
        }
      };
      container.addEventListener('pointerdown', onDown, true);
      window.addEventListener('pointerup', onUp, true);

      /**
       * Core logic: compare current visible range against baseline.
       * If zoomed (>10% duration change) or panned (>20% center shift),
       * request a new downsample with the visible range + 50% buffer.
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

        // Capture baseline on first event
        if (baselineFrom == null || baselineTo == null) {
          baselineFrom = visFrom;
          baselineTo = visTo;
          return;
        }

        const baseDur = baselineTo - baselineFrom;
        const durChange =
          baseDur > 0
            ? Math.abs(visDur - baseDur) / Math.max(visDur, baseDur)
            : 1;
        const centerShift =
          visDur > 0
            ? Math.abs(
                (visFrom + visTo) / 2 - (baselineFrom + baselineTo) / 2
              ) / visDur
            : 0;

        if (durChange > 0.1 || centerShift > 0.2) {
          // Update baseline to current visible range
          baselineFrom = visFrom;
          baselineTo = visTo;

          // Add 50% buffer so the user can pan a bit before needing
          // another downsample
          const buf = visDur * 0.5;
          const dsFrom = visFrom - buf;
          const dsTo = visTo + buf;

          // Save visible range to restore after data swap
          restoreRangeRef.current = { from: visFrom, to: visTo };
          lastDsRangeRef.current = [dsFrom, dsTo];

          updateDebugState(
            gatherDebug('ZOOM/PAN', model, renderer),
            model,
            renderer
          );
          model.performDownsample([dsFrom, dsTo], timeScale.width());
        }

        // Refresh state attribute for tests
        if (containerRef.current) {
          containerRef.current.setAttribute(
            'data-tvl-state',
            buildStateJson(model, renderer)
          );
        }
      }

      // Subscribe to visible range changes (fires on zoom, pan, fitContent).
      const unsubRange = renderer.subscribeVisibleLogicalRangeChange(() => {
        if (!settled || suppressRef.current) return;
        if (draggingRef.current) {
          needsProcessAfterDrag = true;
          return;
        }
        // Debounce for wheel zoom (fires many events quickly)
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processRangeChange, 200);
      });

      // Disable LWC's native axis double-click reset (we handle it).
      // Fix edges so panning can't scroll past data extent.
      chart.applyOptions({
        handleScale: { axisDoubleClickReset: { time: false, price: false } },
        timeScale: { fixLeftEdge: true, fixRightEdge: true },
      } as never);

      // --- Double-click reset ---
      // Full range downsample (null range) + fitContent + reset price scales.
      const onDblClick = () => {
        if (!settled) return;
        baselineFrom = null;
        baselineTo = null;
        restoreRangeRef.current = null; // fitContent, not restore
        lastDsRangeRef.current = null; // full range
        renderer.resetPriceScales();
        updateDebugState(
          gatherDebug('DBLCLICK → RESET', model, renderer),
          model,
          renderer
        );
        model.performDownsample(null, timeScale.width());
      };
      container.addEventListener('dblclick', onDblClick);

      // --- Resize ---
      // Re-downsample at new width with current range.
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
          restoreRangeRef.current = { from, to };
          const buf = (to - from) * 0.5;
          lastDsRangeRef.current = [from - buf, to + buf];
          model.performDownsample([from - buf, to + buf], newWidth);
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
        if (modelRef.current?.isDownsampled() !== true) {
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
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: tvlStyles }} />
      {pendingDs && (
        <>
          <div className={`tvl-pending-scrim${showScrim ? ' show' : ''}`} />
          <div className={`tvl-pending-status${showStatus ? ' show' : ''}`}>
            <div className="tvl-pending-status-bar">
              Downsampling data&hellip;
            </div>
          </div>
        </>
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
