import { CellClassParams } from 'ag-grid-community';
import AgGridFormatter from './AgGridFormatter';
import { AgGridCellColors } from './AgGridColors';

describe('AgGridFormatter', () => {
  describe('styleForNumberCell', () => {
    it.each([[42], [-42], [0]])('should be right aligned', value => {
      const params = { value } as CellClassParams;
      const style = AgGridFormatter.styleForNumberCell(params);
      expect(style.textAlign).toEqual('right');
    });

    it.each([
      [42, AgGridCellColors.numberPositive],
      [-42, AgGridCellColors.numberNegative],
      [0, AgGridCellColors.numberZero],
    ])(
      'should return the correct color depending on sign: %s -> %s',
      (value, expectedColor) => {
        const params = { value } as CellClassParams;
        const style = AgGridFormatter.styleForNumberCell(params);
        expect(style.color).toBe(expectedColor);
      }
    );
  });

  describe('styleForDateCell', () => {
    it('should be center aligned', () => {
      // There is no conditional formatting for dates so value doesn't matter
      const params = { value: '' } as CellClassParams;
      const style = AgGridFormatter.styleForDateCell(params);
      expect(style.textAlign).toEqual('center');
    });

    it('should return correct color for dates', () => {
      const params = { value: '' } as CellClassParams;
      const style = AgGridFormatter.styleForDateCell(params);
      expect(style.color).toBe(AgGridCellColors.date);
    });
  });
});
