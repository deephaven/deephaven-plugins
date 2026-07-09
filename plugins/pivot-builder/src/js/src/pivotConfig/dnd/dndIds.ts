/**
 * Droppable ids used by the drag-and-drop context. Columns may be
 * dragged between `rollup-rows` and `pivot-columns`; aggregations are
 * a separate scope and only reorder within themselves.
 */
export const ROLLUP_ROWS_DROPPABLE = 'rollup-rows';
export const PIVOT_COLUMNS_DROPPABLE = 'pivot-columns';
export const AGGREGATIONS_DROPPABLE = 'aggregations';

/** Stable sortable id for a rollup/pivot column row. */
export function columnRowId(droppableId: string, name: string): string {
  return `${droppableId}:${name}`;
}

/**
 * Extract the column name from a rollup/pivot column row id
 * (`${container}:${name}`). Returns null for ids without a `:` separator
 * (e.g. a bare container id). Inverse of {@link columnRowId}.
 */
export function columnNameFromId(id: string): string | null {
  const colonIdx = id.indexOf(':');
  return colonIdx === -1 ? null : id.slice(colonIdx + 1);
}

/**
 * Stable sortable id for a grouped aggregate row (one row per operation).
 * Keyed by the operation rather than its index so a reorder moves the DOM
 * node (and animates) instead of mutating content in place — positional ids
 * stay at the same slot after a reorder, which makes dnd-kit's drop animation
 * snap the dragged row back to where it started.
 */
export function aggregationRowId(operation: string): string {
  return `${AGGREGATIONS_DROPPABLE}:${operation}`;
}

/**
 * Stable sortable id for a single column inside an aggregate function group.
 * Shares the `aggregations:` prefix with {@link aggregationRowId} so
 * `resolveContainerOfId` still resolves both to the aggregations container
 * (it splits on the first `:`). The operation and column are joined with a
 * NUL so the column name can contain any printable character.
 */
export function aggregationColumnId(operation: string, column: string): string {
  return `${AGGREGATIONS_DROPPABLE}:${operation}\u0000${column}`;
}

/**
 * Decompose an aggregation row or column id back into its operation and
 * (for column ids) column. Returns null for ids that aren't in the
 * aggregations container. Row ids yield `column: null`.
 */
export function parseAggregationId(
  id: string
): { operation: string; column: string | null } | null {
  const prefix = `${AGGREGATIONS_DROPPABLE}:`;
  if (!id.startsWith(prefix)) {
    return null;
  }
  const rest = id.slice(prefix.length);
  const nul = rest.indexOf('\u0000');
  return nul === -1
    ? { operation: rest, column: null }
    : { operation: rest.slice(0, nul), column: rest.slice(nul + 1) };
}

/**
 * Resolve the droppable container id from any draggable/droppable id.
 * Container ids are exact matches; item ids are namespaced as
 * `${container}:...` (split on the first `:`).
 */
export function resolveContainerOfId(id: string): string | null {
  if (
    id === ROLLUP_ROWS_DROPPABLE ||
    id === PIVOT_COLUMNS_DROPPABLE ||
    id === AGGREGATIONS_DROPPABLE
  ) {
    return id;
  }
  const colonIdx = id.indexOf(':');
  return colonIdx === -1 ? null : id.slice(0, colonIdx);
}
