import { TestUtils } from '@deephaven/test-utils';
import { Grid, GridPoint } from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import PivotSortMouseHandler from './PivotSortMouseHandler';
import type IrisGridPivotModel from './IrisGridPivotModel';
import * as IrisGridPivotModelModule from './IrisGridPivotModel';
import PivotColumnHeaderGroup from './PivotColumnHeaderGroup';

const { createMockProxy } = TestUtils;

describe('PivotSortMouseHandler', () => {
  let handler: PivotSortMouseHandler;
  let mockIrisGrid: IrisGrid;
  let mockGrid: Grid;
  let toggleSortSpy: jest.SpyInstance;
  let mockModel: Partial<IrisGridPivotModel>;
  let isIrisGridPivotModelSpy: jest.SpyInstance;

  beforeEach(() => {
    const mockMetrics = createMockProxy({
      columnHeaderMaxDepth: 3,
    });

    const keyColumnGroup = new PivotColumnHeaderGroup({
      name: 'group1',
      children: [],
      childIndexes: [],
      isKeyColumnGroup: true,
      depth: 1,
      isExpandable: false,
    });

    mockModel = createMockProxy({
      columnHeaderGroupMap: new Map([['group1', keyColumnGroup]]),
      isColumnSortable: jest.fn().mockReturnValue(true),
    });

    // Mock the isIrisGridPivotModel function to return true
    isIrisGridPivotModelSpy = jest
      .spyOn(IrisGridPivotModelModule, 'isIrisGridPivotModel')
      .mockReturnValue(true);

    mockIrisGrid = createMockProxy<IrisGrid>({
      state: {
        metrics: mockMetrics,
      } as unknown as IrisGrid['state'],
      props: {
        model: mockModel,
      } as unknown as IrisGrid['props'],
      getTheme: jest.fn().mockReturnValue({
        columnHeaderHeight: 30,
      }),
      toggleSort: jest.fn(),
    });

    mockGrid = createMockProxy<Grid>();

    handler = new PivotSortMouseHandler(mockIrisGrid);
    toggleSortSpy = jest.spyOn(mockIrisGrid, 'toggleSort');
  });

  afterEach(() => {
    jest.clearAllMocks();
    isIrisGridPivotModelSpy.mockRestore();
  });

  it('should call toggleSort when clicking on a column group', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 1,
      row: null,
      columnHeaderDepth: 2,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    const downResult = handler.onDown(gridPoint, mockGrid, mouseEvent);
    const clickResult = handler.onClick(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).toHaveBeenCalledWith(-2, false);
    expect(downResult).toBe(false);
    expect(clickResult).toBe(true);
  });

  it('should call toggleSort with addToExisting=true when modifier key is pressed', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 1,
      row: null,
      columnHeaderDepth: 2,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: true,
      metaKey: false,
    });

    const downResult = handler.onDown(gridPoint, mockGrid, mouseEvent);
    const clickResult = handler.onClick(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).toHaveBeenCalledWith(-2, true);
    expect(downResult).toBe(false);
    expect(clickResult).toBe(true);
  });

  it('should call toggleSort with correct sourceIndex based on columnHeaderDepth', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 1,
      row: null,
      columnHeaderDepth: 3,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    handler.onDown(gridPoint, mockGrid, mouseEvent);
    handler.onClick(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).toHaveBeenCalledWith(-3, false);
  });

  it('should not call toggleSort when row is not null', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 2,
      row: 5,
      columnHeaderDepth: 1,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    const result = handler.onDown(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should not call toggleSort when column is null', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: null,
      row: null,
      columnHeaderDepth: 1,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    const result = handler.onDown(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should not call toggleSort when clicked on a regular column', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 2,
      row: null,
      columnHeaderDepth: 1,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    const downResult = handler.onDown(gridPoint, mockGrid, mouseEvent);
    const clickResult = handler.onClick(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).not.toHaveBeenCalled();
    expect(downResult).toBe(false);
    expect(clickResult).toBe(false);
  });

  it('should not call toggleSort when onClick is called on different gridPoint than onDown', () => {
    const downGridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 1,
      row: null,
      columnHeaderDepth: 2,
    };

    const clickGridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 1,
      row: null,
      columnHeaderDepth: 3,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    handler.onDown(downGridPoint, mockGrid, mouseEvent);
    const clickResult = handler.onClick(clickGridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).not.toHaveBeenCalled();
    expect(clickResult).toBe(false);
  });
});
