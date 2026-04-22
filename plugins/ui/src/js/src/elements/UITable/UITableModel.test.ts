import {
  IrisGridThemeType,
  type IrisGridTableModel,
} from '@deephaven/iris-grid';
import { GridRenderer } from '@deephaven/grid';
import { type dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import UITableModel from './UITableModel';

const MOCK_DH = TestUtils.createMockProxy<typeof dh>();

const MOCK_BASE_MODEL = TestUtils.createMockProxy<IrisGridTableModel>({
  columns: [
    {
      name: 'column0',
      type: 'string',
    },
    {
      name: 'column1',
      type: 'int',
    },
  ] as dh.Column[],
});

describe('Formatting', () => {
  describe('getFormatOptionForCell', () => {
    test('applies last rule for an option', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ color: 'red' }, { color: 'blue' }],
        displayNameMap: {},
      });
      expect(model.getFormatOptionForCell(0, 0, 'color')).toBe('blue');
      expect(model.getFormatOptionForCell(1, 1, 'color')).toBe('blue');
    });

    test('only applies rules matching the column', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [
          { cols: 'column0', color: 'red' },
          { cols: 'column1', color: 'blue' },
        ],
        displayNameMap: {},
      });
      expect(model.getFormatOptionForCell(0, 0, 'color')).toBe('red');
      expect(model.getFormatOptionForCell(1, 1, 'color')).toBe('blue');
    });

    test('only applies rules matching the condition', () => {
      (MOCK_BASE_MODEL.row as jest.Mock).mockImplementation(r => ({
        data: {
          get: () => ({
            value: r % 2 === 0, // Even rows are true
          }),
        },
      }));

      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [
          { color: 'red', if_: 'even' },
          { cols: 'column1', color: 'blue', if_: 'even' },
        ],
        displayNameMap: {},
      });
      expect(model.getFormatOptionForCell(0, 0, 'color')).toBe('red');
      expect(model.getFormatOptionForCell(0, 1, 'color')).toBeUndefined();
      expect(model.getFormatOptionForCell(1, 0, 'color')).toBe('blue');
      expect(model.getFormatOptionForCell(1, 1, 'color')).toBeUndefined();
      (MOCK_BASE_MODEL.row as jest.Mock).mockClear();
    });

    test('returns undefined if no matching rule', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ cols: 'column0', color: 'red' }],
        displayNameMap: {},
      });
      expect(model.getFormatOptionForCell(1, 1, 'color')).toBeUndefined();
      expect(
        model.getFormatOptionForCell(1, 1, 'background_color')
      ).toBeUndefined();
    });

    test('returns undefined if condition data has not been fetched', () => {
      (MOCK_BASE_MODEL.row as jest.Mock).mockImplementation(r => ({
        data: null,
      }));

      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ color: 'red', if_: 'even' }],
        displayNameMap: {},
      });
      expect(model.getFormatOptionForCell(0, 0, 'color')).toBeUndefined();
      expect(model.getFormatOptionForCell(0, 1, 'color')).toBeUndefined();
      (MOCK_BASE_MODEL.row as jest.Mock).mockClear();
    });
  });

  describe('colorForCell', () => {
    test('returns the color for a cell', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ color: 'red' }],
        displayNameMap: {},
      });
      expect(model.colorForCell(0, 0, {} as IrisGridThemeType)).toBe('red');
    });

    test('returns undefined if no color for a cell', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [],
        displayNameMap: {},
      });
      expect(model.colorForCell(0, 0, {} as IrisGridThemeType)).toBeUndefined();
      expect(MOCK_BASE_MODEL.colorForCell).toHaveBeenCalledTimes(1);
    });

    test('returns grid theme white if no color and background color dark', () => {
      jest
        .spyOn(GridRenderer, 'getCachedColorIsDark')
        .mockImplementation(() => true);
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ background_color: 'black' }],
        displayNameMap: {},
      });
      expect(
        model.colorForCell(0, 0, { white: 'white' } as IrisGridThemeType)
      ).toBe('white');
      jest.restoreAllMocks();
    });

    test('returns grid theme black if no color and background color light', () => {
      jest
        .spyOn(GridRenderer, 'getCachedColorIsDark')
        .mockImplementation(() => false);
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ background_color: 'white' }],
        displayNameMap: {},
      });
      expect(
        model.colorForCell(0, 0, { black: 'black' } as IrisGridThemeType)
      ).toBe('black');
      jest.restoreAllMocks();
    });

    test('returns theme colors from color map', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ color: 'foo' }],
        displayNameMap: {},
      });
      model.setColorMap(new Map([['foo', 'bar']]));
      expect(model.colorForCell(0, 0, {} as IrisGridThemeType)).toBe('bar');
    });
  });

  describe('backgroundColorForCell', () => {
    test('returns undefined if no background_color for a cell', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [],
        displayNameMap: {},
      });
      expect(
        model.backgroundColorForCell(0, 0, {} as IrisGridThemeType)
      ).toBeUndefined();
      expect(MOCK_BASE_MODEL.backgroundColorForCell).toHaveBeenCalledTimes(1);
    });

    test('returns theme colors from color map', () => {
      const model = new UITableModel({
        dh: MOCK_DH,
        model: MOCK_BASE_MODEL,

        format: [{ background_color: 'foo' }],
        displayNameMap: {},
      });
      model.setColorMap(new Map([['foo', 'bar']]));
      expect(model.backgroundColorForCell(0, 0, {} as IrisGridThemeType)).toBe(
        'bar'
      );
    });
  });
});
