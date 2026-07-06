import { useEffect, useState } from 'react';
import { DndKitCore, DndKitUtilities } from '@deephaven/iris-grid';

const { defaultDropAnimation } = DndKitCore;
const { CSS } = DndKitUtilities;

// Disable pointer events on the drag overlay so the wheel can still scroll the
// list while dragging (matches iris-grid's Organize Columns overlay).
export const DRAG_OVERLAY_STYLE = { pointerEvents: 'none' } as const;

// Drop animation matching Organize Columns: fade the overlay out while the
// original row fades back in. Used for column drags; aggregation drags keep
// dnd-kit's default animation so a cross-operation snap-back stays visible.
export const COLUMN_DROP_ANIMATION: DndKitCore.DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      { opacity: 0, transform: CSS.Transform.toString(transform.final) },
    ];
  },
  easing: 'ease-out',
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

// Resting `max-height` for collapsible single-line rows. `max-height` (not
// `height`) is used so the collapse can animate — a transition can't
// interpolate from `height: auto`, but it can from an explicit `max-height`.
// Rows are single-line (~28px); the cap is generous to avoid clipping.
export const ROW_MAX_HEIGHT = 40;

// Style for a source column row that is leaving its list because it is being
// dragged into a different group/card. The row collapses shut (max-height +
// opacity animate to 0) so it reads as "moving" — a single ghost then lives in
// the target. Reused by ColumnRow and AggregateColumnRow.
export const COLLAPSING_SOURCE_STYLE: React.CSSProperties = {
  maxHeight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: 0,
  marginBottom: 0,
  opacity: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  transition:
    'max-height 150ms ease, opacity 150ms ease, padding 150ms ease, margin 150ms ease',
};

/**
 * Style for a ghost/preview row that should grow in (max-height 0 → full) when
 * it mounts, so it slides open instead of popping. `targetOpacity` is the
 * resting opacity once expanded.
 */
export function useGrowInStyle(targetOpacity: number): React.CSSProperties {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return {
    maxHeight: entered ? ROW_MAX_HEIGHT : 0,
    opacity: entered ? targetOpacity : 0,
    overflow: 'hidden',
    transition: 'max-height 150ms ease, opacity 150ms ease',
  };
}
