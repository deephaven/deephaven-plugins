import {
  ContextActions,
  ContextActionUtils,
  type ContextAction,
  type ResolvableContextAction,
} from '@deephaven/components';
import {
  GridMouseHandler,
  type GridMouseEvent,
  type GridPoint,
  type EventHandlerResult,
  type Grid,
} from '@deephaven/grid';
import {
  IrisGridContextMenuHandler,
  type IrisGridType as IrisGrid,
  SHORTCUTS,
} from '@deephaven/iris-grid';
import {
  TableUtils,
  type SortDirection,
  type SortDescriptor,
} from '@deephaven/jsapi-utils';
import { vsRemove } from '@deephaven/icons';
import { assertNotNull, copyToClipboard } from '@deephaven/utils';
import { getColumnSourceHeaderFromGridPoint } from './PivotMouseHandlerUtils';
import { isPivotColumnHeaderGroup } from './PivotColumnHeaderGroup';

/**
 * Handle context menu (right-click) on pivot column source headers.
 * Column sources are represented as negative column indexes.
 */
class PivotContextMenuHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();
    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onContextMenu(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const { irisGrid } = this;
    const { model } = irisGrid.props;
    assertNotNull(model);

    const sourceIndex = getColumnSourceHeaderFromGridPoint(model, gridPoint);
    if (sourceIndex == null) {
      // Suppress context menu for non-source header groups (depth > 0)
      // but let regular column headers (depth 0) pass through
      const { row, columnHeaderDepth } = gridPoint;
      if (row === null && columnHeaderDepth != null && columnHeaderDepth > 0) {
        return true;
      }
      return false;
    }

    const { column, columnHeaderDepth } = gridPoint;
    const group =
      column != null && columnHeaderDepth != null
        ? model.getColumnHeaderGroup(column, columnHeaderDepth)
        : undefined;
    const sourceName =
      group != null && isPivotColumnHeaderGroup(group)
        ? group.displayName ?? group.name
        : undefined;

    const actions: ResolvableContextAction[] = [];

    actions.push(...this.getSortActions(sourceIndex, sourceName));
    actions.push(...this.getFilterActions(sourceIndex));

    actions.push({
      title: 'Copy Column Name',
      group: IrisGridContextMenuHandler.GROUP_COPY,
      shortcutText: ContextActionUtils.isMacPlatform() ? '⌥Click' : 'Alt+Click',
      action: () => {
        copyToClipboard(sourceName ?? '').catch(() => undefined);
      },
    });

    if (actions.length === 0) {
      return false;
    }

    assertNotNull(irisGrid.gridWrapper);

    ContextActions.triggerMenu(
      irisGrid.gridWrapper,
      event.clientX,
      event.clientY,
      actions
    );
    return true;
  }

  /**
   * Sort a column source by constructing the sort descriptor directly.
   * Cannot use irisGrid.sortColumn() because TableUtils.sortColumn rejects negative indexes.
   */
  private sortColumnSource(
    sourceIndex: number,
    direction: SortDirection,
    isAbs = false,
    addToExisting = false
  ): void {
    const { irisGrid } = this;
    const { model } = irisGrid.props;
    const { columns } = model;

    const newSort = TableUtils.makeColumnSort(
      columns,
      sourceIndex,
      direction,
      isAbs
    );

    const column = columns[sourceIndex];
    if (column == null) {
      return;
    }

    const sorts = TableUtils.setSortForColumn(
      irisGrid.state.sorts,
      column.name,
      newSort,
      addToExisting
    );

    irisGrid.updateSorts(sorts);
  }

  private static checkColumnSort(
    columnSort: SortDescriptor | null,
    direction: SortDirection,
    isAbs = false
  ): boolean {
    return (
      columnSort != null &&
      columnSort.direction === direction &&
      columnSort.isAbs === isAbs
    );
  }

  private getSortActions(
    sourceIndex: number,
    sourceName?: string
  ): ContextAction[] {
    const { irisGrid } = this;
    const { model } = irisGrid.props;
    const isColumnSortable = model.isColumnSortable(sourceIndex);
    const modelSort = model.sort;
    const column = model.columns[sourceIndex];
    const columnSort =
      column != null
        ? TableUtils.getSortForColumn(modelSort, column.name)
        : null;

    const { reverse } = irisGrid.state;
    const theme = irisGrid.getTheme();
    const { contextMenuSortIconColor } = theme;

    const actions: ContextAction[] = [];

    const sortBySubActions: ContextAction[] = [
      {
        title: `${sourceName ?? ''} Ascending`.trim(),
        order: 10,
        action: () => {
          this.sortColumnSource(
            sourceIndex,
            TableUtils.sortDirection.ascending
          );
        },
        icon: PivotContextMenuHandler.checkColumnSort(
          columnSort,
          TableUtils.sortDirection.ascending
        )
          ? vsRemove
          : undefined,
        iconColor: contextMenuSortIconColor,
      },
      {
        title: `${sourceName ?? ''} Descending`.trim(),
        order: 20,
        action: () => {
          this.sortColumnSource(
            sourceIndex,
            TableUtils.sortDirection.descending
          );
        },
        icon: PivotContextMenuHandler.checkColumnSort(
          columnSort,
          TableUtils.sortDirection.descending
        )
          ? vsRemove
          : undefined,
        iconColor: contextMenuSortIconColor,
      },
    ];

    const additionalSortSubActions: ContextAction[] = [
      {
        title: `${sourceName ?? ''} Ascending`.trim(),
        order: 10,
        action: () => {
          this.sortColumnSource(
            sourceIndex,
            TableUtils.sortDirection.ascending,
            false,
            true
          );
        },
      },
      {
        title: `${sourceName ?? ''} Descending`.trim(),
        order: 20,
        action: () => {
          this.sortColumnSource(
            sourceIndex,
            TableUtils.sortDirection.descending,
            false,
            true
          );
        },
      },
    ];

    if (column != null && TableUtils.isNumberType(column.type)) {
      sortBySubActions.push(
        {
          title: `ABS(${sourceName ?? ''}) Ascending`.trim(),
          order: 30,
          action: () => {
            this.sortColumnSource(
              sourceIndex,
              TableUtils.sortDirection.ascending,
              true
            );
          },
          icon: PivotContextMenuHandler.checkColumnSort(
            columnSort,
            TableUtils.sortDirection.ascending,
            true
          )
            ? vsRemove
            : undefined,
          iconColor: contextMenuSortIconColor,
        },
        {
          title: `ABS(${sourceName ?? ''}) Descending`.trim(),
          order: 40,
          action: () => {
            this.sortColumnSource(
              sourceIndex,
              TableUtils.sortDirection.descending,
              true
            );
          },
          icon: PivotContextMenuHandler.checkColumnSort(
            columnSort,
            TableUtils.sortDirection.descending,
            true
          )
            ? vsRemove
            : undefined,
          iconColor: contextMenuSortIconColor,
        }
      );

      additionalSortSubActions.push(
        {
          title: `ABS(${sourceName ?? ''}) Ascending`.trim(),
          order: 30,
          action: () => {
            this.sortColumnSource(
              sourceIndex,
              TableUtils.sortDirection.ascending,
              true,
              true
            );
          },
        },
        {
          title: `ABS(${sourceName ?? ''}) Descending`.trim(),
          order: 40,
          action: () => {
            this.sortColumnSource(
              sourceIndex,
              TableUtils.sortDirection.descending,
              true,
              true
            );
          },
        }
      );
    }

    sortBySubActions.push({
      title: 'Remove Sort',
      order: 50,
      action: () => {
        this.sortColumnSource(
          sourceIndex,
          TableUtils.sortDirection.none,
          false,
          true
        );
      },
      disabled: !columnSort,
    });

    actions.push({
      title: 'Sort by',
      icon: vsRemove,
      iconColor: contextMenuSortIconColor,
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 10,
      disabled: !isColumnSortable,
      actions: sortBySubActions,
    });

    actions.push({
      title: 'Add Additional Sort',
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 20,
      disabled:
        (columnSort != null && modelSort.length === 1) ||
        (reverse && modelSort.length === 1) ||
        (columnSort != null && reverse && modelSort.length === 2) ||
        modelSort.length === 0 ||
        !isColumnSortable,
      actions: additionalSortSubActions,
    });

    actions.push({
      title: 'Clear Table Sorting',
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 30,
      disabled: modelSort.length === 0 || (reverse && modelSort.length === 1),
      action: () => {
        this.sortColumnSource(sourceIndex, TableUtils.sortDirection.none);
      },
    });

    return actions;
  }

  private getFilterActions(sourceIndex: number): ContextAction[] {
    const { irisGrid } = this;
    const { model } = irisGrid.props;
    const { quickFilters, advancedFilters, searchFilter } = irisGrid.state;

    const actions: ContextAction[] = [];

    const theme = irisGrid.getTheme();
    const { filterBarActiveColor } = theme;

    actions.push({
      title: 'Quick Filters',
      icon: vsRemove,
      iconColor: filterBarActiveColor,
      group: IrisGridContextMenuHandler.GROUP_FILTER,
      order: 10,
      shortcut: SHORTCUTS.TABLE.TOGGLE_QUICK_FILTER,
      action: () => {
        irisGrid.toggleFilterBar(sourceIndex);
      },
      disabled: !model.isFilterable(sourceIndex),
    });

    const clearFilterRange = model.getClearFilterRange(sourceIndex);
    if (clearFilterRange != null && clearFilterRange.length > 0) {
      actions.push({
        title:
          clearFilterRange[1] - clearFilterRange[0] > 0
            ? 'Clear Group Filter'
            : 'Clear Column Filter',
        group: IrisGridContextMenuHandler.GROUP_FILTER,
        order: 30,
        action: () => {
          irisGrid.removeColumnFilter(clearFilterRange);
        },
        disabled:
          !Array.from(quickFilters.keys()).some(
            col => col >= clearFilterRange[0] && col <= clearFilterRange[1]
          ) &&
          !Array.from(advancedFilters.keys()).some(
            col => col >= clearFilterRange[0] && col <= clearFilterRange[1]
          ),
      });
    }

    actions.push({
      title: 'Clear Table Filters',
      group: IrisGridContextMenuHandler.GROUP_FILTER,
      order: 40,
      shortcut: SHORTCUTS.TABLE.CLEAR_FILTERS,
      action: () => {
        irisGrid.clearAllFilters();
      },
      disabled: !(
        quickFilters.size > 0 ||
        advancedFilters.size > 0 ||
        searchFilter != null
      ),
    });

    return actions;
  }
}

export default PivotContextMenuHandler;
