import { type AggregationSettings } from '@deephaven/iris-grid';
import {
  AGGREGATIONS_DROPPABLE,
  parseAggregationId,
  resolveContainerOfId,
} from './dndIds';
import { moveItem } from './arrayUtils';

export interface ReorderAggregationGroupsParams {
  activeId: string;
  overId: string;
  aggregationSettings: AggregationSettings;
  onAggregationSettingsChange: (next: AggregationSettings) => void;
}

/**
 * Pure reducer for dropping a whole aggregate-function row onto another:
 * reorders the aggregation entries so the dragged function lands at the hovered
 * one's slot (or the end when the card background is hovered). No-ops for any
 * other drop. Single-column moves — within a function or reassigned to another
 * — are handled live via `aggColPreview` in `usePivotDnd`, and rollup/pivot
 * column moves via its `columnPreview`; this only covers whole-function rows.
 */
export function reorderAggregationGroups({
  activeId,
  overId,
  aggregationSettings,
  onAggregationSettingsChange,
}: ReorderAggregationGroupsParams): void {
  if (resolveContainerOfId(activeId) !== AGGREGATIONS_DROPPABLE) return;
  if (resolveContainerOfId(overId) !== AGGREGATIONS_DROPPABLE) return;

  const activeParsed = parseAggregationId(activeId);
  // Only whole-function rows (which carry no column) reorder here.
  if (activeParsed == null || activeParsed.column != null) return;

  const { aggregations } = aggregationSettings;
  const fromIdx = aggregations.findIndex(
    entry => entry.operation === activeParsed.operation
  );
  if (fromIdx < 0) return;

  // Tolerate an `over` that resolves to a column row by mapping it back to its
  // function; hovering the card background drops at the end.
  const overParsed =
    overId === AGGREGATIONS_DROPPABLE ? null : parseAggregationId(overId);
  const toIdx =
    overParsed == null
      ? aggregations.length - 1
      : aggregations.findIndex(
          entry => entry.operation === overParsed.operation
        );
  if (toIdx < 0 || fromIdx === toIdx) return;

  onAggregationSettingsChange({
    ...aggregationSettings,
    aggregations: moveItem(aggregations, fromIdx, toIdx),
  });
}
