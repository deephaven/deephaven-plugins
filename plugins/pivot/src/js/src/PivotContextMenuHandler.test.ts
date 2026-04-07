import {
  ContextActions,
  ContextActionUtils,
  type ContextAction,
} from '@deephaven/components';
import { TableUtils } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/test-utils';
import { Grid, type GridMouseEvent, GridPoint } from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import PivotContextMenuHandler from './PivotContextMenuHandler';
import type IrisGridPivotModel from './IrisGridPivotModel';
import * as IrisGridPivotModelModule from './IrisGridPivotModel';
import PivotColumnHeaderGroup from './PivotColumnHeaderGroup';

const { createMockProxy } = TestUtils;

function makeKeyColumnGroup(depth = 1): PivotColumnHeaderGroup {
  return new PivotColumnHeaderGroup({
    name: 'group1',
    children: [],
    childIndexes: [],
    isKeyColumnGroup: true,
    depth,
    isExpandable: false,
  });
}

function makeNonKeyColumnGroup(depth = 1): PivotColumnHeaderGroup {
  return new PivotColumnHeaderGroup({
    name: 'regularGroup',
    children: [],
    childIndexes: [],
    isKeyColumnGroup: false,
    depth,
    isExpandable: false,
  });
}

function makeColumnSourceGridPoint(
  columnHeaderDepth = 2,
  column: number | null = 1
): GridPoint {
  return {
    x: 50,
    y: 15,
    column,
    row: null,
    columnHeaderDepth,
  };
}

function makeCellGridPoint(): GridPoint {
  return {
    x: 50,
    y: 100,
    column: 1,
    row: 5,
    columnHeaderDepth: 0,
  };
}

describe('PivotContextMenuHandler', () => {
  let handler: PivotContextMenuHandler;
  let mockIrisGrid: IrisGrid;
  let mockGrid: Grid;
  let mockModel: Partial<IrisGridPivotModel>;
  let isIrisGridPivotModelSpy: jest.SpyInstance;
  let triggerMenuSpy: jest.SpyInstance;

  beforeEach(() => {
    const keyColumnGroup = makeKeyColumnGroup();

    // Build a columns array with a column source at index -2
    // (matching getColumnSourceHeaderFromGridPoint returning -columnHeaderDepth)
    const columnsArray: Record<number, { name: string; type: string }> = [];
    columnsArray[-2] = { name: 'FishingGround', type: 'java.lang.String' };

    mockModel = createMockProxy({
      columnHeaderGroupMap: new Map([[keyColumnGroup.name, keyColumnGroup]]),
      columns: columnsArray as unknown as IrisGridPivotModel['columns'],
      isColumnSortable: jest.fn().mockReturnValue(true),
      isFilterable: jest.fn().mockReturnValue(true),
      getColumnHeaderGroup: jest.fn().mockReturnValue(keyColumnGroup),
      getClearFilterRange: jest.fn().mockReturnValue(null),
      sort: [],
    });

    isIrisGridPivotModelSpy = jest
      .spyOn(IrisGridPivotModelModule, 'isIrisGridPivotModel')
      .mockReturnValue(true);

    mockIrisGrid = createMockProxy<IrisGrid>({
      state: {
        metrics: createMockProxy({ columnHeaderMaxDepth: 3 }),
        sorts: [],
        quickFilters: new Map(),
        advancedFilters: new Map(),
        searchFilter: null,
        reverse: false,
      } as unknown as IrisGrid['state'],
      props: {
        model: mockModel,
      } as unknown as IrisGrid['props'],
      gridWrapper: document.createElement('div'),
      getTheme: jest.fn().mockReturnValue({
        contextMenuSortIconColor: null,
        contextMenuReverseIconColor: null,
        filterBarActiveColor: null,
      }),
      updateSorts: jest.fn(),
      reverse: jest.fn(),
      toggleFilterBar: jest.fn(),
      removeColumnFilter: jest.fn(),
      clearAllFilters: jest.fn(),
    });

    mockGrid = createMockProxy<Grid>();
    handler = new PivotContextMenuHandler(mockIrisGrid);

    triggerMenuSpy = jest
      .spyOn(ContextActions, 'triggerMenu')
      .mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
    isIrisGridPivotModelSpy.mockRestore();
    triggerMenuSpy.mockRestore();
  });

  describe('onContextMenu', () => {
    it('should trigger context menu on column source header', () => {
      const gridPoint = makeColumnSourceGridPoint();
      const mouseEvent = createMockProxy<GridMouseEvent>({
        clientX: 100,
        clientY: 200,
      });

      const result = handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      expect(result).toBe(true);
      expect(triggerMenuSpy).toHaveBeenCalledWith(
        mockIrisGrid.gridWrapper,
        100,
        200,
        expect.any(Array)
      );
    });

    it('should not trigger context menu on regular column header (row null, depth 0)', () => {
      const gridPoint: GridPoint = {
        x: 50,
        y: 15,
        column: 1,
        row: null,
        columnHeaderDepth: 0,
      };
      const mouseEvent = createMockProxy<GridMouseEvent>();

      const result = handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      expect(result).toBe(false);
      expect(triggerMenuSpy).not.toHaveBeenCalled();
    });

    it('should not trigger context menu on cell (row is not null)', () => {
      const gridPoint = makeCellGridPoint();
      const mouseEvent = createMockProxy<GridMouseEvent>();

      const result = handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      expect(result).toBe(false);
      expect(triggerMenuSpy).not.toHaveBeenCalled();
    });

    it('should suppress context menu on non-key column group (depth > 0)', () => {
      (mockModel.getColumnHeaderGroup as jest.Mock).mockReturnValue(
        makeNonKeyColumnGroup()
      );
      const gridPoint = makeColumnSourceGridPoint();
      const mouseEvent = createMockProxy<GridMouseEvent>();

      const result = handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      expect(result).toBe(true);
      expect(triggerMenuSpy).not.toHaveBeenCalled();
    });

    it('should suppress context menu when column is null at depth > 0', () => {
      const gridPoint = makeColumnSourceGridPoint(2, null);
      const mouseEvent = createMockProxy<GridMouseEvent>();

      const result = handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      expect(result).toBe(true);
      expect(triggerMenuSpy).not.toHaveBeenCalled();
    });
  });

  describe('sort actions', () => {
    function getActions(): ContextAction[] {
      const gridPoint = makeColumnSourceGridPoint();
      const mouseEvent = createMockProxy<GridMouseEvent>({
        clientX: 100,
        clientY: 200,
      });

      handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      return ContextActionUtils.getMenuItems(
        triggerMenuSpy.mock.calls[0][3],
        false
      );
    }

    it('should include Sort by with ascending, descending, and remove sub-actions (string type)', () => {
      const actions = getActions();
      const sortBy = actions.find(a => a.title === 'Sort by');

      expect(sortBy).toBeDefined();
      expect(sortBy?.disabled).toBe(false);
      // String type: Ascending, Descending, Remove Sort (no ABS)
      expect(sortBy?.actions).toHaveLength(3);
      expect(sortBy?.actions?.[0]).toMatchObject({
        title: 'group1 Ascending',
      });
      expect(sortBy?.actions?.[1]).toMatchObject({
        title: 'group1 Descending',
      });
      expect(sortBy?.actions?.[2]).toMatchObject({
        title: 'Remove Sort',
        disabled: true,
      });
    });

    it('should include ABS sort sub-actions for numeric column types', () => {
      const numericColumns: Record<number, { name: string; type: string }> = [];
      numericColumns[-2] = { name: 'Revenue', type: 'int' };
      const numericModel = createMockProxy({
        ...mockModel,
        columns: numericColumns as unknown as IrisGridPivotModel['columns'],
      });
      (mockIrisGrid.props as Record<string, unknown>).model = numericModel;

      const actions = getActions();
      const sortBy = actions.find(a => a.title === 'Sort by');

      // Numeric type: Ascending, Descending, ABS Ascending, ABS Descending, Remove Sort
      expect(sortBy?.actions).toHaveLength(5);
      const subItems = ContextActionUtils.getMenuItems(
        sortBy?.actions ?? [],
        false
      );
      expect(
        subItems.find(a => a.title === 'ABS(group1) Ascending')
      ).toBeDefined();
      expect(
        subItems.find(a => a.title === 'ABS(group1) Descending')
      ).toBeDefined();
    });

    it('should include ABS sort sub-actions in Add Additional Sort for numeric types', () => {
      const numericColumns: Record<number, { name: string; type: string }> = [];
      numericColumns[-2] = { name: 'Revenue', type: 'int' };
      const existingSort = {
        column: { name: 'OtherColumn', type: 'int' },
        direction: TableUtils.sortDirection.ascending,
        isAbs: false,
      };
      const numericModel = createMockProxy({
        ...mockModel,
        columns: numericColumns as unknown as IrisGridPivotModel['columns'],
        sort: [
          existingSort,
          {
            column: { name: 'Another', type: 'int' },
            direction: 'DESC',
            isAbs: false,
          },
        ],
      });
      (mockIrisGrid.props as Record<string, unknown>).model = numericModel;

      const actions = getActions();
      const addSort = actions.find(a => a.title === 'Add Additional Sort');

      // Numeric type: Ascending, Descending, ABS Ascending, ABS Descending
      expect(addSort?.actions).toHaveLength(4);
      const subItems = ContextActionUtils.getMenuItems(
        addSort?.actions ?? [],
        false
      );
      expect(
        subItems.find(a => a.title === 'ABS(group1) Ascending')
      ).toBeDefined();
      expect(
        subItems.find(a => a.title === 'ABS(group1) Descending')
      ).toBeDefined();
    });

    it('should show icon on active ABS ascending sort', () => {
      const numericColumns: Record<number, { name: string; type: string }> = [];
      numericColumns[-2] = { name: 'Revenue', type: 'int' };
      const absSort = {
        column: { name: 'Revenue', type: 'int' },
        direction: TableUtils.sortDirection.ascending,
        isAbs: true,
      };
      const numericModel = createMockProxy({
        ...mockModel,
        columns: numericColumns as unknown as IrisGridPivotModel['columns'],
        sort: [absSort],
      });
      (mockIrisGrid.props as Record<string, unknown>).model = numericModel;
      const state = mockIrisGrid.state as Record<string, unknown>;
      state.sorts = [absSort];

      const actions = getActions();
      const sortBy = actions.find(a => a.title === 'Sort by');
      const subItems = ContextActionUtils.getMenuItems(
        sortBy?.actions ?? [],
        false
      );
      const absAsc = subItems.find(a => a.title === 'ABS(group1) Ascending');
      const regularAsc = subItems.find(a => a.title === 'group1 Ascending');

      expect(absAsc?.icon).toBeDefined();
      expect(regularAsc?.icon).toBeUndefined();
    });

    it('should show icon on active ascending sort and enable Remove Sort', () => {
      const ascSort = {
        column: { name: 'FishingGround', type: 'java.lang.String' },
        direction: TableUtils.sortDirection.ascending,
        isAbs: false,
      };
      const sortedModel = createMockProxy({
        ...mockModel,
        sort: [ascSort],
      });
      (mockIrisGrid.props as Record<string, unknown>).model = sortedModel;
      const state = mockIrisGrid.state as Record<string, unknown>;
      state.sorts = [ascSort];

      const actions = getActions();
      const sortBy = actions.find(a => a.title === 'Sort by');
      const subItems = ContextActionUtils.getMenuItems(
        sortBy?.actions ?? [],
        false
      );
      const sortAsc = subItems.find(a => a.title === 'group1 Ascending');
      const sortDesc = subItems.find(a => a.title === 'group1 Descending');
      const removeSort = subItems.find(a => a.title === 'Remove Sort');

      expect(sortAsc?.icon).toBeDefined();
      expect(sortDesc?.icon).toBeUndefined();
      expect(removeSort?.disabled).toBe(false);
    });

    it('should disable Sort by when column is not sortable', () => {
      (mockModel.isColumnSortable as jest.Mock).mockReturnValue(false);

      const actions = getActions();
      const sortBy = actions.find(a => a.title === 'Sort by');

      expect(sortBy?.disabled).toBe(true);
    });

    it('should include Add Additional Sort', () => {
      const actions = getActions();
      const addSort = actions.find(a => a.title === 'Add Additional Sort');

      expect(addSort).toBeDefined();
      // String type: Ascending, Descending (no ABS)
      expect(addSort?.actions).toHaveLength(2);
    });

    it('should disable Add Additional Sort when no existing sorts', () => {
      const actions = getActions();
      const addSort = actions.find(a => a.title === 'Add Additional Sort');

      expect(addSort?.disabled).toBe(true);
    });

    it('should enable Add Additional Sort when other column sorts exist', () => {
      const otherSort = {
        column: { name: 'OtherColumn', type: 'int' },
        direction: TableUtils.sortDirection.ascending,
        isAbs: false,
      };
      const sortedModel = createMockProxy({
        ...mockModel,
        sort: [
          otherSort,
          {
            column: { name: 'Another', type: 'int' },
            direction: 'DESC',
            isAbs: false,
          },
        ],
      });
      (mockIrisGrid.props as Record<string, unknown>).model = sortedModel;

      const actions = getActions();
      const addSort = actions.find(a => a.title === 'Add Additional Sort');

      expect(addSort?.disabled).toBe(false);
    });

    it('should disable Add Additional Sort when only this column is sorted', () => {
      const thisSort = {
        column: { name: 'FishingGround', type: 'java.lang.String' },
        direction: TableUtils.sortDirection.ascending,
        isAbs: false,
      };
      const sortedModel = createMockProxy({
        ...mockModel,
        sort: [thisSort],
      });
      (mockIrisGrid.props as Record<string, unknown>).model = sortedModel;

      const actions = getActions();
      const addSort = actions.find(a => a.title === 'Add Additional Sort');

      expect(addSort?.disabled).toBe(true);
    });

    it('should include Clear Table Sorting', () => {
      const actions = getActions();
      const clearSort = actions.find(a => a.title === 'Clear Table Sorting');

      expect(clearSort).toBeDefined();
    });

    it('should disable Clear Table Sorting when no sorts', () => {
      const actions = getActions();
      const clearSort = actions.find(a => a.title === 'Clear Table Sorting');

      expect(clearSort?.disabled).toBe(true);
    });

    it('should call updateSorts with ascending sort when Sort Ascending is clicked', () => {
      const actions = getActions();
      const sortBy = actions.find(a => a.title === 'Sort by');
      const subItems = ContextActionUtils.getMenuItems(
        sortBy?.actions ?? [],
        false
      );
      const sortAsc = subItems.find(a => a.title === 'group1 Ascending');

      sortAsc?.action?.(new Event('click'));

      expect(mockIrisGrid.updateSorts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            column: expect.objectContaining({ name: 'FishingGround' }),
            direction: TableUtils.sortDirection.ascending,
          }),
        ])
      );
    });

    it('should call updateSorts with descending sort when Sort Descending is clicked', () => {
      const actions = getActions();
      const sortBy = actions.find(a => a.title === 'Sort by');
      const subItems = ContextActionUtils.getMenuItems(
        sortBy?.actions ?? [],
        false
      );
      const sortDesc = subItems.find(a => a.title === 'group1 Descending');

      sortDesc?.action?.(new Event('click'));

      expect(mockIrisGrid.updateSorts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            column: expect.objectContaining({ name: 'FishingGround' }),
            direction: TableUtils.sortDirection.descending,
          }),
        ])
      );
    });

    it('should call updateSorts with addToExisting when Add Additional Sort ascending is clicked', () => {
      const existingSort = {
        column: { name: 'OtherColumn', type: 'int' },
        direction: TableUtils.sortDirection.ascending,
        isAbs: false,
      };
      const sortedModel = createMockProxy({
        ...mockModel,
        sort: [existingSort],
      });
      (mockIrisGrid.props as Record<string, unknown>).model = sortedModel;
      const state = mockIrisGrid.state as Record<string, unknown>;
      state.sorts = [existingSort];

      const actions = getActions();
      const addSort = actions.find(a => a.title === 'Add Additional Sort');
      const subItems = ContextActionUtils.getMenuItems(
        addSort?.actions ?? [],
        false
      );
      const addSortAsc = subItems.find(a => a.title === 'group1 Ascending');

      addSortAsc?.action?.(new Event('click'));

      expect(mockIrisGrid.updateSorts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            column: expect.objectContaining({ name: 'OtherColumn' }),
          }),
          expect.objectContaining({
            column: expect.objectContaining({ name: 'FishingGround' }),
            direction: TableUtils.sortDirection.ascending,
          }),
        ])
      );
    });
  });

  describe('filter actions', () => {
    function getActions(): ContextAction[] {
      const gridPoint = makeColumnSourceGridPoint();
      const mouseEvent = createMockProxy<GridMouseEvent>({
        clientX: 100,
        clientY: 200,
      });

      handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      return ContextActionUtils.getMenuItems(
        triggerMenuSpy.mock.calls[0][3],
        false
      );
    }

    it('should include Quick Filters action', () => {
      const actions = getActions();
      const quickFilters = actions.find(a => a.title === 'Quick Filters');

      expect(quickFilters).toBeDefined();
      expect(quickFilters?.disabled).toBe(false);
    });

    it('should disable Quick Filters when column is not filterable', () => {
      (mockModel.isFilterable as jest.Mock).mockReturnValue(false);

      const actions = getActions();
      const quickFilters = actions.find(a => a.title === 'Quick Filters');

      expect(quickFilters?.disabled).toBe(true);
    });

    it('should call toggleFilterBar when Quick Filters is clicked', () => {
      const actions = getActions();
      const quickFiltersAction = actions.find(a => a.title === 'Quick Filters');

      quickFiltersAction?.action?.(new Event('click'));

      expect(mockIrisGrid.toggleFilterBar).toHaveBeenCalledWith(-2);
    });

    it('should include Clear Table Filters action', () => {
      const actions = getActions();
      const clearFilters = actions.find(a => a.title === 'Clear Table Filters');

      expect(clearFilters).toBeDefined();
    });

    it('should disable Clear Table Filters when no filters exist', () => {
      const actions = getActions();
      const clearFilters = actions.find(a => a.title === 'Clear Table Filters');

      expect(clearFilters?.disabled).toBe(true);
    });

    it('should enable Clear Table Filters when quick filters exist', () => {
      const state = mockIrisGrid.state as Record<string, unknown>;
      state.quickFilters = new Map([[0, 'filter']]);

      const actions = getActions();
      const clearFilters = actions.find(a => a.title === 'Clear Table Filters');

      expect(clearFilters?.disabled).toBe(false);
    });

    it('should call clearAllFilters when Clear Table Filters is clicked', () => {
      const state = mockIrisGrid.state as Record<string, unknown>;
      state.quickFilters = new Map([[0, 'filter']]);

      const actions = getActions();
      const clearFilters = actions.find(a => a.title === 'Clear Table Filters');

      clearFilters?.action?.(new Event('click'));

      expect(mockIrisGrid.clearAllFilters).toHaveBeenCalled();
    });

    it('should include Clear Column Filter when getClearFilterRange returns a range', () => {
      (mockModel.getClearFilterRange as jest.Mock).mockReturnValue([-2, -2]);

      const actions = getActions();
      const clearColumnFilter = actions.find(
        a =>
          a.title === 'Clear Column Filter' || a.title === 'Clear Group Filter'
      );

      expect(clearColumnFilter).toBeDefined();
    });

    it('should not include Clear Column Filter when getClearFilterRange returns null', () => {
      const actions = getActions();
      const isClearColumnFilter = (a: ContextAction): boolean =>
        a.title === 'Clear Column Filter' || a.title === 'Clear Group Filter';

      expect(actions.some(isClearColumnFilter)).toBe(false);
    });
  });

  describe('copy actions', () => {
    it('should include Copy Column Name action', () => {
      const gridPoint = makeColumnSourceGridPoint();
      const mouseEvent = createMockProxy<GridMouseEvent>({
        clientX: 100,
        clientY: 200,
      });

      handler.onContextMenu(gridPoint, mockGrid, mouseEvent);

      const actions = ContextActionUtils.getMenuItems(
        triggerMenuSpy.mock.calls[0][3],
        false
      );
      const copyAction = actions.find(a => a.title === 'Copy Column Name');

      expect(copyAction).toBeDefined();
    });
  });
});
