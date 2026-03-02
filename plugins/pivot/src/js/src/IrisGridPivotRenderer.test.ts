import { TestUtils } from '@deephaven/test-utils';
import { IrisGridPivotRenderer } from './IrisGridPivotRenderer';
import type { IrisGridPivotRenderState } from './IrisGridPivotTypes';

const { createMockProxy } = TestUtils;

describe('IrisGridPivotRenderer', () => {
  describe('drawColumnHeader - label positioning with filters during scroll', () => {
    let renderer: IrisGridPivotRenderer;
    let mockContext: CanvasRenderingContext2D;
    let fillTextSpy: jest.SpyInstance;

    beforeEach(() => {
      // Create renderer instance using Object.create to avoid property conflicts
      renderer = Object.create(IrisGridPivotRenderer.prototype);

      // Mock the text width calculation method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer.getCachedHeaderWidth = jest.fn().mockReturnValue(150) as any;

      // Mock textCellRenderer (protected property)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (renderer as any).textCellRenderer = {
        getCachedTruncatedString: jest.fn((ctx, text) => text),
      };

      // Create mock canvas context
      const mockCanvas = document.createElement('canvas');
      mockContext = mockCanvas.getContext('2d') as CanvasRenderingContext2D;

      // Spy on fillText to capture label positions
      fillTextSpy = jest
        .spyOn(mockContext, 'fillText')
        .mockImplementation(() => {
          // no-op
        });

      // Mock other canvas methods
      jest.spyOn(mockContext, 'save').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'restore').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'rect').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'clip').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'fillRect').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'beginPath').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'stroke').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'moveTo').mockImplementation(() => {
        // no-op
      });
      jest.spyOn(mockContext, 'lineTo').mockImplementation(() => {
        // no-op
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function createMockState(): IrisGridPivotRenderState {
      return createMockProxy<IrisGridPivotRenderState>({
        metrics: createMockProxy({
          fontWidthsLower: new Map([[mockContext.font, 6]]),
          fontWidthsUpper: new Map([[mockContext.font, 8]]),
          columnHeaderHeight: 40,
          width: 1000,
        }) as unknown as IrisGridPivotRenderState['metrics'],
        theme: createMockProxy({
          headerHorizontalPadding: 8,
          iconSize: 16,
          headerBackgroundColor: '#ffffff',
          headerColor: '#000000',
          headerSeparatorColor: '#cccccc',
          black: '#000000',
          white: '#ffffff',
          columnHeaderHeight: 40,
        }) as unknown as IrisGridPivotRenderState['theme'],
      });
    }

    function getLabelX(): number {
      const { calls } = fillTextSpy.mock;
      expect(calls.length).toBeGreaterThan(0);
      // The label text is drawn with fillText(text, x, y)
      const lastCall = calls[calls.length - 1];
      return lastCall[1]; // x coordinate
    }

    it('draws label at natural position when no filter adjustment', () => {
      const state = createMockState();
      const columnX = 100;
      const columnWidth = 300;

      renderer.drawColumnHeader(
        mockContext,
        state,
        'TestLabel',
        columnX,
        columnWidth,
        undefined,
        { minX: 0, maxX: 1000 }
      );

      const labelX = getLabelX();
      // Should be at columnX + padding
      expect(labelX).toBe(108); // 100 + 8
    });

    it('draws label at natural position when content fits with filter', () => {
      const state = createMockState();
      const columnX = 100;
      const columnWidth = 300;
      const columnWidthAdjust = 50;

      renderer.drawColumnHeader(
        mockContext,
        state,
        'TestLabel',
        columnX,
        columnWidth,
        undefined,
        { minX: 0, maxX: 1000 },
        false,
        false,
        null,
        columnWidthAdjust
      );

      const labelX = getLabelX();
      // Content fits, so should be at natural position
      expect(labelX).toBe(108); // 100 + 8
    });

    it('adjusts label position when scrolled and content beyond left edge', () => {
      const state = createMockState();
      const columnX = 0;
      const columnWidth = 400;
      const columnWidthAdjust = 50;

      renderer.drawColumnHeader(
        mockContext,
        state,
        'TestLabel',
        columnX,
        columnWidth,
        undefined,
        { minX: 50, maxX: 450 },
        false,
        false,
        null,
        columnWidthAdjust
      );

      const labelX = getLabelX();
      // Label should be at viewport left (minX + padding)
      expect(labelX).toBeGreaterThanOrEqual(58); // 50 + 8
    });

    it('positions label correctly when content does not fit in viewport', () => {
      const state = createMockState();
      const columnX = 0;
      const columnWidth = 300;
      const columnWidthAdjust = 50;

      // Content width (150) + tree marker (16) = 166
      // Available width after filter: 300 - 50 = 250
      // Content fits, but position needs adjustment

      renderer.drawColumnHeader(
        mockContext,
        state,
        'LongTestLabel',
        columnX,
        columnWidth,
        undefined,
        { minX: -50, maxX: 250 },
        false,
        false,
        null,
        columnWidthAdjust
      );

      const labelX = getLabelX();
      // Should be positioned to fit within available space
      expect(labelX).toBeGreaterThanOrEqual(-42); // -50 + 8
    });

    it('respects filter width when positioning label', () => {
      const state = createMockState();
      const columnX = 100;
      const columnWidth = 200;
      const columnWidthAdjust = 60;

      renderer.drawColumnHeader(
        mockContext,
        state,
        'Test',
        columnX,
        columnWidth,
        undefined,
        { minX: 0, maxX: 400 },
        false,
        false,
        null,
        columnWidthAdjust
      );

      const labelX = getLabelX();
      // Label drawn with reduced available width
      expect(labelX).toBe(108); // 100 + 8

      // The text is truncated with the filter width taken into account
      // maxWidth should be columnWidth - 2*padding - columnWidthAdjust = 200 - 16 - 60 = 124
    });

    it('positions label correctly when viewport width is smaller than column group width', () => {
      const state = createMockState();
      // Column group is 600px wide (spanning from 0 to 600)
      const columnX = 0;
      const columnWidth = 600;
      const columnWidthAdjust = 50; // Filter width

      // Viewport is only 400px wide (0 to 400)
      renderer.drawColumnHeader(
        mockContext,
        state,
        'TestLabel',
        columnX,
        columnWidth,
        undefined,
        { minX: 0, maxX: 400 },
        false,
        false,
        null,
        columnWidthAdjust
      );

      const labelX = getLabelX();
      // When column group (600) > viewport width (400), label should be at natural position initially
      // contentLeft = columnX + padding = 0 + 8 = 8
      expect(labelX).toBe(8);
    });

    it('adjusts label position when wide column group scrolls left', () => {
      const state = createMockState();
      // Column group is 600px wide, but positioned so it extends beyond viewport
      const columnX = -100; // Scrolled left by 100px
      const columnWidth = 600;
      const columnWidthAdjust = 50;

      // Viewport is 400px wide (0 to 400)
      // Column group now spans from -100 to 500
      renderer.drawColumnHeader(
        mockContext,
        state,
        'TestLabel',
        columnX,
        columnWidth,
        undefined,
        { minX: 0, maxX: 400 },
        false,
        false,
        null,
        columnWidthAdjust
      );

      const labelX = getLabelX();
      // contentLeft = -100 + 8 = -92, which is < minX (0)
      // Label should stick to viewport left edge
      expect(labelX).toBe(8); // minX + padding = 0 + 8
    });

    it('keeps label visible with filter when column group scrolls past right edge', () => {
      const state = createMockState();
      // Column group is wide (600px) and positioned so right edge is beyond viewport
      const columnX = 100;
      const columnWidth = 600;
      const columnWidthAdjust = 50;

      // Viewport is 400px (0 to 400)
      // Column group spans from 100 to 700 (well beyond viewport right edge)
      renderer.drawColumnHeader(
        mockContext,
        state,
        'TestLabel',
        columnX,
        columnWidth,
        undefined,
        { minX: 0, maxX: 400 },
        false,
        false,
        null,
        columnWidthAdjust
      );

      const labelX = getLabelX();
      // contentLeft = 100 + 8 = 108
      // contentLeft (108) >= minX (0), so label at natural position
      expect(labelX).toBe(108);
    });
  });
});
