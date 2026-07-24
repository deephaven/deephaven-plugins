import { useEffect, useMemo, useRef } from 'react';
import type {
  PlotData,
  PlotMouseEvent,
  PlotSelectionEvent,
  ClickAnnotationEvent,
  LegendClickEvent,
  SunburstClickEvent,
  PlotlyHTMLElement,
  Data,
} from 'plotly.js';
import Plotly from 'plotly.js-dist-min';
import type PlotlyExpressChartModel from './PlotlyExpressChartModel';

/**
 * The Plotly graph div element. Plotly's `PlotlyHTMLElement` type already models
 * `.on` (with per-event payload types) and `.data`; we add an overload for the
 * treemap/icicle click events, which share the sunburst click event shape but
 * aren't in the type despite existing at runtime.
 */
type PlotlyGraphDiv = PlotlyHTMLElement & {
  on: (
    event:
      | 'plotly_sunburstclick'
      | 'plotly_treemapclick'
      | 'plotly_icicleclick',
    callback: (event: SunburstClickEvent) => void
  ) => void;
};

/** Keyboard modifier keys held during a user interaction. */
type EventModifiers = {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
};

/**
 * Data-space field names that Plotly may include on point data at runtime,
 * depending on the chart type.
 */
const POINT_DATA_FIELDS = [
  'x',
  'y',
  'z',
  'lat',
  'lon',
  'location',
  'r',
  'theta',
  'open',
  'high',
  'low',
  'close',
  'label',
  'parent',
  'value',
  'id',
  'text',
] as const;

/** Hierarchical trace types that route clicks through the imperative handler. */
const HIERARCHICAL_TYPES = new Set(['sunburst', 'treemap', 'icicle']);

/** Plotly's default doubleClickDelay for legend click discrimination. */
const LEGEND_DBL_CLICK_DELAY = 300;

/** Debounce window for coalescing rapid relayout (pan/zoom) events. */
const RELAYOUT_DEBOUNCE = 150;

/**
 * Serialize a Plotly point datum into the payload sent to Python.
 * Includes all data-space fields that are present on the point,
 * plus `trace_name`, `trace_type`, and `curve_number`.
 */
function serializePoint(
  p: Record<string, unknown> & { data: Partial<PlotData>; curveNumber: number }
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  POINT_DATA_FIELDS.forEach(field => {
    if (field in p && p[field] !== undefined) {
      result[field] = p[field];
    }
  });
  result.trace_name = p.data.name;
  result.trace_type = p.data.type;
  result.curve_number = p.curveNumber;
  return result;
}

/**
 * Perform the default legend double-click behavior: toggle between
 * isolating the clicked trace and showing all.
 */
function performLegendDoubleClick(
  gd: PlotlyGraphDiv,
  curveNumber: number
): void {
  const traces = gd.data ?? [];
  const isAlreadyIsolated = traces.every(
    (trace, i) =>
      i === curveNumber ||
      (trace as Partial<PlotData>).visible === false ||
      (trace as Partial<PlotData>).visible === 'legendonly'
  );

  if (isAlreadyIsolated) {
    // Show all
    Plotly.restyle(gd, { visible: true });
  } else {
    // Isolate — hide all others
    const visibilities = traces.map((trace, i) => {
      if ((trace as Partial<PlotData>).visible === false) return false; // false is sticky
      return i === curveNumber ? true : 'legendonly';
    });
    Plotly.restyle(gd, { visible: visibilities } as unknown as Data);
  }
}

/**
 * Plotly event handler props forwarded to the `Chart` component. These mirror
 * the optional `onPlotly*` props on `Chart`. Each is only defined when the
 * corresponding Python callback is registered so Plotly's native behavior runs
 * with zero overhead otherwise.
 */
export interface PlotlyEventHandlers {
  onPlotlyRelayout?: (changes: Record<string, unknown>) => void;
  onPlotlyClick?: (data: Readonly<PlotMouseEvent>) => void;
  onPlotlyDoubleClick?: () => void;
  onPlotlySelected?: (data: Readonly<PlotSelectionEvent> | undefined) => void;
  onPlotlyDeselect?: () => void;
  onPlotlyClickAnnotation?: (data: Readonly<ClickAnnotationEvent>) => void;
  onPlotlyLegendClick?: (data: Readonly<LegendClickEvent>) => boolean;
  onPlotlyLegendDoubleClick?: (data: Readonly<LegendClickEvent>) => boolean;
  onPlotlyWebGlContextLost?: () => void;
  onPlotElementChange?: (element: HTMLElement | null) => void;
}

/**
 * Build the Plotly event handler props for a chart model.
 *
 * All event serialization and default-behavior logic lives here; the model is
 * only used as the transport layer (callback map, preventable set, and the
 * `sendEventCallback` / `sendEventCallbackWithResponse` messaging methods).
 * The returned object is spread onto the `Chart` component so events are passed
 * in directly rather than by overriding methods on the model.
 *
 * @param model The chart model, or null before it has loaded
 * @returns The event handler props to pass to `Chart`
 */
export function usePlotlyEventCallbacks(
  model: PlotlyExpressChartModel | null
): PlotlyEventHandlers {
  // Keyboard modifier keys captured from the raw DOM pointer event. We read
  // these from the DOM directly rather than from Plotly's event objects, which
  // don't expose modifier state for every event type (selection, relayout...).
  const modifiersRef = useRef<EventModifiers>({
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
  });

  // The Plotly graph div, provided via onPlotElementChange once Plotly inits.
  const plotElementRef = useRef<PlotlyGraphDiv | null>(null);

  // Timer for debouncing legend single-click vs double-click.
  const legendClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Debounce state for relayout (pan/zoom) events.
  const relayoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relayoutMergedRef = useRef<Record<string, unknown>>({});

  // Track modifier keys from the raw DOM pointer event. Capture phase so it
  // runs before Plotly dispatches its own handlers.
  useEffect(() => {
    const handlePointerModifiers = (event: PointerEvent): void => {
      modifiersRef.current = {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        meta: event.metaKey,
      };
    };
    document.addEventListener('pointerdown', handlePointerModifiers, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerModifiers, true);
    };
  }, []);

  return useMemo<PlotlyEventHandlers>(() => {
    if (model == null) {
      return {};
    }

    const getModifiers = (): EventModifiers => ({ ...modifiersRef.current });

    // Handlers read the callback IDs live from the model at invocation time
    // rather than capturing them here. The model replaces its callbackMap when
    // widget data updates (during subscribe, after this memo has run), so a
    // captured snapshot would be stale. Reading live keeps them in sync.
    return {
      // Called by the Chart component with the Plotly graph div on init/purge.
      // On init we imperatively wire the hierarchical drill-down clicks, which
      // can't be passed as props to react-plotly.js because:
      //   - Plotly only honors a handler's `return false` (to prevent the
      //     default drill-down) when that handler is the last one registered,
      //   - react-plotly.js registers a `plotly_sunburstclick` "update"
      //     listener of its own after onInitialized, shadowing ours, and
      //   - react-plotly.js exposes no treemap/icicle click props at all.
      onPlotElementChange: (element: HTMLElement | null): void => {
        const gd = element as PlotlyGraphDiv | null;
        plotElementRef.current = gd;
        if (gd == null || typeof gd.on !== 'function') {
          return;
        }
        const hierClickId = model.getCallbackMap().get('on_click');
        if (hierClickId == null || !model.isPreventable(hierClickId)) {
          return;
        }
        // Defer wiring to a microtask so our listener registers after
        // react-plotly.js attaches its own, which clobbers our sunburst handler.
        queueMicrotask(() => {
          if (plotElementRef.current !== gd) {
            // The element was swapped out or removed before the microtask ran.
            return;
          }
          const hierEvents = [
            'plotly_sunburstclick',
            'plotly_treemapclick',
            'plotly_icicleclick',
          ] as const;
          hierEvents.forEach(eventName => {
            gd.on(eventName, (data: SunburstClickEvent) => {
              const args = {
                points: data.points.map(p => ({
                  label: p.label,
                  parent: p.parent,
                  value: p.value,
                  id: p.id,
                  trace_name: (p.data as Partial<PlotData>).name,
                  trace_type: (p.data as Partial<PlotData>).type,
                  curve_number: p.curveNumber,
                })),
                next_level: data.nextLevel ?? null,
                modifiers: getModifiers(),
              };
              model
                .sendEventCallbackWithResponse(hierClickId, args)
                .then(allowed => {
                  if (allowed && data.nextLevel != null) {
                    const traceIdx = data.points?.[0]?.curveNumber ?? 0;
                    Plotly.animate(
                      gd,
                      { data: [{ level: data.nextLevel }], traces: [traceIdx] },
                      {
                        frame: { redraw: false, duration: 300 },
                        transition: { duration: 300, easing: 'cubic-in-out' },
                        mode: 'immediate',
                        fromcurrent: true,
                      }
                    );
                  }
                });
              return false; // Always prevent default drill-down
            });
          });
        });
      },

      // on_click — non-hierarchical point clicks. Hierarchical clicks are
      // preventable and handled imperatively above. Non-hierarchical traces in
      // a layered/subplot figure that also contains hierarchical traces still
      // arrive here, so we only skip when every clicked point is hierarchical.
      // When the figure enables `clickanywhere`, clicking empty plot area fires
      // with an empty `points` array plus `xvals`/`yvals` holding the cursor
      // position in data space (one entry per axis).
      onPlotlyClick: (event: Readonly<PlotMouseEvent>): void => {
        const clickId = model.getCallbackMap().get('on_click');
        if (clickId == null) {
          return;
        }
        if (model.isPreventable(clickId)) {
          const allHierarchical =
            event.points.length > 0 &&
            event.points.every(p => HIERARCHICAL_TYPES.has(p.data.type ?? ''));
          if (allHierarchical) {
            return; // Handled by the imperative hierarchical handler
          }
        }
        const args: Record<string, unknown> = {
          points: event.points.map(p =>
            serializePoint(
              p as unknown as Record<string, unknown> & {
                data: Partial<PlotData>;
                curveNumber: number;
              }
            )
          ),
          modifiers: getModifiers(),
        };
        // clickanywhere data-space cursor coordinates (plotly.js >= 3.5.0).
        const clickEvent = event as unknown as {
          xvals?: unknown[];
          yvals?: unknown[];
        };
        if (clickEvent.xvals != null) {
          args.xvals = clickEvent.xvals;
        }
        if (clickEvent.yvals != null) {
          args.yvals = clickEvent.yvals;
        }
        model.sendEventCallback(clickId, args);
      },

      // on_double_click
      onPlotlyDoubleClick: (): void => {
        const doubleClickId = model.getCallbackMap().get('on_double_click');
        if (doubleClickId == null) {
          return;
        }
        model.sendEventCallback(doubleClickId, { modifiers: getModifiers() });
      },

      // on_selected — box/lasso selection
      onPlotlySelected: (
        event: Readonly<PlotSelectionEvent> | undefined
      ): void => {
        const selectedId = model.getCallbackMap().get('on_selected');
        if (selectedId == null || event == null) {
          return;
        }
        const args: Record<string, unknown> = {
          points: event.points.map(p =>
            serializePoint(
              p as unknown as Record<string, unknown> & {
                data: Partial<PlotData>;
                curveNumber: number;
              }
            )
          ),
          modifiers: getModifiers(),
        };
        if (event.range != null) {
          args.range = event.range;
        }
        if (event.lassoPoints != null) {
          args.lasso_points = event.lassoPoints;
        }
        model.sendEventCallback(selectedId, args);
      },

      // on_deselect — selection cleared
      onPlotlyDeselect: (): void => {
        const deselectId = model.getCallbackMap().get('on_deselect');
        if (deselectId == null) {
          return;
        }
        model.sendEventCallback(deselectId, { modifiers: getModifiers() });
      },

      // on_click_annotation
      onPlotlyClickAnnotation: (
        event: Readonly<ClickAnnotationEvent>
      ): void => {
        const annotationId = model.getCallbackMap().get('on_click_annotation');
        if (annotationId == null) {
          return;
        }
        model.sendEventCallback(annotationId, {
          index: event.index,
          annotation: {
            text: event.annotation.text,
            x: event.annotation.x,
            y: event.annotation.y,
          },
          modifiers: getModifiers(),
        });
      },

      // on_legend_click — debounced to discriminate from double-clicks. Plotly
      // fires plotly_legendclick for BOTH clicks of a double-click, so we hold
      // the single click for LEGEND_DBL_CLICK_DELAY ms; a double-click cancels
      // it. Returns true when unregistered to let Plotly perform its default.
      onPlotlyLegendClick: (event: Readonly<LegendClickEvent>): boolean => {
        const legendClickId = model.getCallbackMap().get('on_legend_click');
        if (legendClickId == null) {
          return true;
        }
        const gd = plotElementRef.current;
        const args = {
          trace_name:
            (event.data?.[event.curveNumber] as Partial<PlotData>)?.name ?? '',
          curve_number: event.curveNumber,
          modifiers: getModifiers(),
        };

        if (legendClickTimerRef.current != null) {
          clearTimeout(legendClickTimerRef.current);
          legendClickTimerRef.current = null;
        }

        legendClickTimerRef.current = setTimeout(() => {
          legendClickTimerRef.current = null;
          model
            .sendEventCallbackWithResponse(legendClickId, args)
            .then(allowed => {
              if (allowed && gd != null) {
                const currentVis = (
                  gd.data?.[event.curveNumber] as Partial<PlotData>
                )?.visible;
                const nextVis =
                  currentVis === 'legendonly' ? true : 'legendonly';
                Plotly.restyle(gd, { visible: nextVis }, [event.curveNumber]);
              }
            });
        }, LEGEND_DBL_CLICK_DELAY);

        return false; // Always prevent; re-applied above if allowed.
      },

      // on_legend_double_click — cancels any pending single-click so only the
      // double-click fires. When only on_legend_click is registered, its false
      // return blocks Plotly's native double-click, so we reimplement default.
      // Returns true when nothing is registered to let Plotly do its default.
      onPlotlyLegendDoubleClick: (
        event: Readonly<LegendClickEvent>
      ): boolean => {
        const callbackMap = model.getCallbackMap();
        const legendClickId = callbackMap.get('on_legend_click');
        const legendDblClickId = callbackMap.get('on_legend_double_click');
        if (legendClickId == null && legendDblClickId == null) {
          return true;
        }

        if (legendClickTimerRef.current != null) {
          clearTimeout(legendClickTimerRef.current);
          legendClickTimerRef.current = null;
        }

        const gd = plotElementRef.current;
        const { curveNumber } = event;
        if (legendDblClickId != null) {
          const args = {
            trace_name:
              (event.data?.[curveNumber] as Partial<PlotData>)?.name ?? '',
            curve_number: curveNumber,
            modifiers: getModifiers(),
          };
          model
            .sendEventCallbackWithResponse(legendDblClickId, args)
            .then(allowed => {
              if (allowed && gd != null) {
                performLegendDoubleClick(gd, curveNumber);
              }
            });
        } else if (gd != null) {
          // Only on_legend_click is registered; perform the default directly.
          performLegendDoubleClick(gd, curveNumber);
        }
        return false; // Always prevent; re-applied above if allowed.
      },

      // on_relayout — debounced. During a pan/zoom drag Plotly fires
      // plotly_relayout on every frame; merge keys and send once after a pause.
      onPlotlyRelayout: (changes: Record<string, unknown>): void => {
        const relayoutId = model.getCallbackMap().get('on_relayout');
        if (relayoutId == null) {
          return;
        }
        Object.assign(relayoutMergedRef.current, changes);
        if (relayoutTimerRef.current != null) {
          clearTimeout(relayoutTimerRef.current);
        }
        relayoutTimerRef.current = setTimeout(() => {
          model.sendEventCallback(relayoutId, {
            ...relayoutMergedRef.current,
            modifiers: getModifiers(),
          });
          relayoutMergedRef.current = {};
          relayoutTimerRef.current = null;
        }, RELAYOUT_DEBOUNCE);
      },

      // on_web_gl_context_lost
      onPlotlyWebGlContextLost: (): void => {
        const webGlLostId = model
          .getCallbackMap()
          .get('on_web_gl_context_lost');
        if (webGlLostId == null) {
          return;
        }
        model.sendEventCallback(webGlLostId, { modifiers: getModifiers() });
      },
    };
  }, [model]);
}

export default usePlotlyEventCallbacks;
