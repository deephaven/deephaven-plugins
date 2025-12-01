import { TestUtils } from '@deephaven/test-utils';
import { Grid, GridPoint } from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import PivotSortMouseHandler from './PivotSortMouseHandler';

const { createMockProxy } = TestUtils;

describe('PivotSortMouseHandler', () => {
  let handler: PivotSortMouseHandler;
  let mockIrisGrid: IrisGrid;
  let mockGrid: Grid;
  let toggleSortSpy: jest.SpyInstance;

  beforeEach(() => {
    const mockMetrics = createMockProxy({
      columnHeaderMaxDepth: 3,
    });

    mockIrisGrid = createMockProxy<IrisGrid>({
      state: {
        metrics: mockMetrics,
      } as unknown as IrisGrid['state'],
      props: {} as unknown as IrisGrid['props'],
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
  });

  it('should call toggleSort when clicking on a column group', () => {
    // TODO should call toggleSort only for column sources, not regular columns
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 2,
      row: null,
      columnHeaderDepth: 2,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    const result = handler.onDown(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).toHaveBeenCalledWith(-1, false);
    expect(result).toBe(false);
  });

  it('should call toggleSort with addToExisting=true when modifier key is pressed', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 15,
      column: 2,
      row: null,
      columnHeaderDepth: 2,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: true,
      metaKey: false,
    });

    const result = handler.onDown(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).toHaveBeenCalledWith(-2, true);
    expect(result).toBe(false);
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

  it('should not call toggleSort when y is beyond column header max depth', () => {
    const gridPoint: GridPoint = {
      x: 50,
      y: 100, // columnHeaderHeight (30) * columnHeaderMaxDepth (3) = 90
      column: 2,
      row: null,
      columnHeaderDepth: 1,
    };

    const mouseEvent = createMockProxy<MouseEvent>({
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    handler.onDown(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).not.toHaveBeenCalled();
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

    const result = handler.onDown(gridPoint, mockGrid, mouseEvent);

    expect(toggleSortSpy).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
