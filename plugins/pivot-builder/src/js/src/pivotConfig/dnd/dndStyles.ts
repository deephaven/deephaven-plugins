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
 * Style for a sortable single-line row (a rollup/pivot column or an aggregate
 * column). Collapses to {@link COLLAPSING_SOURCE_STYLE} when the row is the
 * source of a cross-group move; otherwise applies the live drag transform, a
 * fade while dragging (its overlay clone follows the cursor), and the capped
 * `max-height` so a collapse can animate. `draggingTransition` is the
 * transition applied once dnd-kit assigns one — it differs between the flat
 * column list and the nested aggregate-column list, so callers pass their own.
 */
export function sortableRowStyle({
  collapsed,
  transform,
  transition,
  isDragging,
  draggingTransition,
}: {
  collapsed: boolean;
  transform: Parameters<typeof CSS.Transform.toString>[0];
  transition: string | undefined;
  isDragging: boolean;
  draggingTransition: string;
}): React.CSSProperties {
  if (collapsed) {
    return COLLAPSING_SOURCE_STYLE;
  }
  return {
    transform: CSS.Transform.toString(transform),
    transition:
      transition == null ? 'max-height 150ms ease' : draggingTransition,
    opacity: isDragging ? 0.5 : 1,
    maxHeight: ROW_MAX_HEIGHT,
  };
}
