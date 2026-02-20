import { TestUtils } from '@deephaven/test-utils';
import { Grid, GridPoint } from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import PivotFilterMouseHandler from './PivotFilterMouseHandler';
import type IrisGridPivotModel from './IrisGridPivotModel';
import * as IrisGridPivotTypesModule from './IrisGridPivotTypes';
import * as PivotMouseHandlerUtilsModule from './PivotMouseHandlerUtils';

const { createMockProxy } = TestUtils;

describe('PivotFilterMouseHandler', () => {
  let handler: PivotFilterMouseHandler;
  let mockIrisGrid: IrisGrid;
  let mockGrid: Grid;
  let mockModel: Partial<IrisGridPivotModel>;
  let isPivotGridMetricsSpy: jest.SpyInstance;
  let getColumnSourceHeaderFromGridPointSpy: jest.SpyInstance;
  let isGridPointInColumnSourceFilterBoxSpy: jest.SpyInstance;
  let setStateSpy: jest.SpyInstance;

  const mockMetrics = {
    gridY: 100,
    columnSourceHeaderWidths: [150, 150],
    columnSourceHeaderXs: [0, 150],
  };

  const mockTheme = {
    columnHeaderHeight: 30,
    filterBarHeight: 20,
  };

  beforeEach(() => {
    mockModel = createMockProxy({});

    isPivotGridMetricsSpy = jest
      .spyOn(IrisGridPivotTypesModule, 'isPivotGridMetrics')
      .mockReturnValue(true);

    getColumnSourceHeaderFromGridPointSpy = jest
      .spyOn(PivotMouseHandlerUtilsModule, 'getColumnSourceHeaderFromGridPoint')
      .mockReturnValue(-1);

    isGridPointInColumnSourceFilterBoxSpy = jest
      .spyOn(PivotMouseHandlerUtilsModule, 'isGridPointInColumnSourceFilterBox')
      .mockReturnValue(true);

    mockIrisGrid = createMockProxy<IrisGrid>({
      state: {
        isFilterBarShown: true,
        metrics: mockMetrics,
        hoverAdvancedFilter: null,
      } as unknown as IrisGrid['state'],
      props: {
        model: mockModel,
      } as unknown as IrisGrid['props'],
      getTheme: jest.fn().mockReturnValue(mockTheme),
      focusFilterBar: jest.fn(),
      setState: jest.fn(),
    });

    setStateSpy = jest.spyOn(mockIrisGrid, 'setState');
    mockGrid = createMockProxy<Grid>();

    handler = new PivotFilterMouseHandler(mockIrisGrid);
  });

  afterEach(() => {
    jest.clearAllMocks();
    isPivotGridMetricsSpy.mockRestore();
    getColumnSourceHeaderFromGridPointSpy.mockRestore();
    isGridPointInColumnSourceFilterBoxSpy.mockRestore();
  });

  describe('onMove', () => {
    const mockEvent = createMockProxy<MouseEvent>();

    it('should return false when filter bar is not shown', () => {
      mockIrisGrid.state.isFilterBarShown = false;

      const gridPoint: GridPoint = { x: 50, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should return false when metrics is null', () => {
      mockIrisGrid.state.metrics = null;

      const gridPoint: GridPoint = { x: 50, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should return false when not in column header area', () => {
      // gridY is 100, filterBarHeight is 20, so column header area is y < 80
      const gridPoint: GridPoint = { x: 50, y: 85, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should set hoverAdvancedFilter when hovering over a filter box', () => {
      getColumnSourceHeaderFromGridPointSpy.mockReturnValue(-1);
      isGridPointInColumnSourceFilterBoxSpy.mockReturnValue(true);

      // y < gridY - filterBarHeight (100 - 20 = 80)
      const gridPoint: GridPoint = { x: 50, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(true);
      expect(setStateSpy).toHaveBeenCalledWith({ hoverAdvancedFilter: -1 });
    });

    it('should not update state if already hovering the same filter box', () => {
      mockIrisGrid.state.hoverAdvancedFilter = -1;
      getColumnSourceHeaderFromGridPointSpy.mockReturnValue(-1);
      isGridPointInColumnSourceFilterBoxSpy.mockReturnValue(true);

      const gridPoint: GridPoint = { x: 50, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(true);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should update hoverAdvancedFilter when moving to a different filter box', () => {
      mockIrisGrid.state.hoverAdvancedFilter = -1;
      getColumnSourceHeaderFromGridPointSpy.mockReturnValue(-2);
      isGridPointInColumnSourceFilterBoxSpy.mockReturnValue(true);

      const gridPoint: GridPoint = { x: 200, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(true);
      expect(setStateSpy).toHaveBeenCalledWith({ hoverAdvancedFilter: -2 });
    });

    it('should keep hover stable when over same column source header but not in filter box', () => {
      mockIrisGrid.state.hoverAdvancedFilter = -1;
      getColumnSourceHeaderFromGridPointSpy.mockReturnValue(-1);
      isGridPointInColumnSourceFilterBoxSpy.mockReturnValue(false);

      const gridPoint: GridPoint = { x: 50, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(true);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should clear hover when mouse moves to a different column source header', () => {
      mockIrisGrid.state.hoverAdvancedFilter = -1;
      getColumnSourceHeaderFromGridPointSpy.mockReturnValue(-2);
      isGridPointInColumnSourceFilterBoxSpy.mockReturnValue(false);

      const gridPoint: GridPoint = { x: 200, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should clear hover when sourceIndex is null', () => {
      mockIrisGrid.state.hoverAdvancedFilter = -1;
      getColumnSourceHeaderFromGridPointSpy.mockReturnValue(null);
      isGridPointInColumnSourceFilterBoxSpy.mockReturnValue(false);

      const gridPoint: GridPoint = { x: 300, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should return false when hoverAdvancedFilter is a regular column (non-negative)', () => {
      mockIrisGrid.state.hoverAdvancedFilter = 5;
      getColumnSourceHeaderFromGridPointSpy.mockReturnValue(null);
      isGridPointInColumnSourceFilterBoxSpy.mockReturnValue(false);

      const gridPoint: GridPoint = { x: 300, y: 50, column: null, row: null };
      const result = handler.onMove(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
    });
  });

  describe('onLeave', () => {
    const mockEvent = createMockProxy<MouseEvent>();
    const gridPoint: GridPoint = { x: 0, y: 0, column: null, row: null };

    it('should clear hoverAdvancedFilter for a negative index', () => {
      mockIrisGrid.state.hoverAdvancedFilter = -3;

      const result = handler.onLeave(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).toHaveBeenCalledWith({ hoverAdvancedFilter: null });
    });

    it('should not clear hoverAdvancedFilter when it is null', () => {
      mockIrisGrid.state.hoverAdvancedFilter = null;

      const result = handler.onLeave(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).not.toHaveBeenCalled();
    });

    it('should not clear hoverAdvancedFilter when it is a regular column (non-negative)', () => {
      mockIrisGrid.state.hoverAdvancedFilter = 5;

      const result = handler.onLeave(gridPoint, mockGrid, mockEvent);

      expect(result).toBe(false);
      expect(setStateSpy).not.toHaveBeenCalled();
    });
  });
});
