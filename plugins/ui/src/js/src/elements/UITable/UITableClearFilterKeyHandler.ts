import { type EventHandlerResult, KeyHandler } from '@deephaven/grid';
import { SHORTCUTS } from '@deephaven/iris-grid';

/**
 * Blocks the clear all filters shortcut when quick filters are read only.
 * IrisGrid's built-in ClearFilterKeyHandler clears filters without consulting the model,
 * so it must be intercepted before it runs.
 */
class UITableClearFilterKeyHandler extends KeyHandler {
  constructor() {
    // Lower than the default order of 5000 so this runs before ClearFilterKeyHandler
    super(1500);
  }

  // eslint-disable-next-line class-methods-use-this
  onDown(event: KeyboardEvent): EventHandlerResult {
    return SHORTCUTS.TABLE.CLEAR_FILTERS.matchesEvent(event);
  }
}

export default UITableClearFilterKeyHandler;
