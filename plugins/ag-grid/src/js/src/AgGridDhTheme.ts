import {
  CheckboxStyleParams,
  InputStyleParams,
  TabStyleParams,
} from '@ag-grid-community/theming';
import { type CoreParams } from '@ag-grid-community/theming/dist/types/src/styles/core/core-css';
import { AgGridThemeColors } from './utils/AgGridColors';

type GridDensity = 'compact' | 'regular' | 'spacious';

export default class AgGridDhTheme {
  static getThemeParams(
    gridDensity: GridDensity = 'regular'
  ): Partial<
    CoreParams & CheckboxStyleParams & TabStyleParams & InputStyleParams
  > {
    return {
      /* Header */
      headerBackgroundColor: AgGridThemeColors.headerBackgroundColor,
      headerTextColor: AgGridThemeColors.headerTextColor,
      headerColumnResizeHandleColor:
        AgGridThemeColors.headerColumnResizeHandleColor,
      headerFontFamily: 'var(--font-family-sans-serif)',
      headerFontSize: '12px',
      headerFontWeight: 600,
      headerHeight: 30,

      /* Row */
      backgroundColor: AgGridThemeColors.backgroundColor,
      oddRowBackgroundColor: AgGridThemeColors.oddRowBackgroundColor,
      rowHoverColor: AgGridThemeColors.rowHoverColor,
      rowBorder: false,

      /* Selection */
      selectedRowBackgroundColor: AgGridThemeColors.selectedRowBackgroundColor,

      /* Text */
      textColor: AgGridThemeColors.textColor,
      fontFamily: 'var(--font-family-sans-serif)',
      fontSize: 14,

      /* Menu */
      menuBackgroundColor: AgGridThemeColors.menuBackgroundColor,
      menuTextColor: AgGridThemeColors.menuTextColor,

      /* Misc */
      accentColor: AgGridThemeColors.accentColor,

      ...this.getDensityDependentParams(gridDensity),
    };
  }

  private static getDensityDependentParams(
    gridDensity: GridDensity
  ): Partial<
    CoreParams & CheckboxStyleParams & TabStyleParams & InputStyleParams
  > {
    switch (gridDensity) {
      case 'compact':
        return {
          rowHeight: 16,
          spacing: 5,
          dataFontSize: 11,
        };
      case 'regular':
        return {
          rowHeight: 19,
          spacing: 5,
          dataFontSize: 12,
        };
      case 'spacious':
        return {
          rowHeight: 28,
          spacing: 7,
          dataFontSize: 12,
        };
    }
  }
}
