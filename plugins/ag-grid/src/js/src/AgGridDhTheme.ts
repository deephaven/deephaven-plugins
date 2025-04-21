import {
  CheckboxStyleParams,
  InputStyleParams,
  TabStyleParams,
} from '@ag-grid-community/theming';
import { CoreParams } from '@ag-grid-community/theming/dist/types/src/styles/core/core-css';

type GridDensity = 'compact' | 'regular' | 'spacious';

export default class AgGridDhTheme {
  static getThemeParams(
    gridDensity: GridDensity = 'regular'
  ): Partial<
    CoreParams & CheckboxStyleParams & TabStyleParams & InputStyleParams
  > {
    return {
      /* Header */
      headerBackgroundColor: 'var(--dh-color-grid-header-bg)',
      headerTextColor: 'var(--dh-color-grid-header-text)',
      headerColumnResizeHandleColor: 'var(--dh-color-grid-header-separator)',
      headerFontFamily: 'Fira Sans, sans-serif',
      headerFontSize: '12px',
      headerFontWeight: 600,
      headerHeight: 30,

      /* Row */
      backgroundColor: 'var(--dh-color-grid-row-0-bg)',
      oddRowBackgroundColor: 'var(--dh-color-grid-row-1-bg)',
      rowHoverColor: 'var(--dh-color-grid-row-hover-bg)',

      /* Selection */
      selectedRowBackgroundColor: 'var(--dh-color-grid-row-hover-bg-selected)',

      /* Text */
      textColor: 'var(--dh-color-grid-text)',
      fontFamily: 'Fira Sans, sans-serif',

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
          fontSize: 11,
        };
      case 'regular':
        return {
          rowHeight: 19,
          spacing: 5,
          fontSize: 11,
        };
      case 'spacious':
        return {
          rowHeight: 28,
          spacing: 7,
          fontSize: 12,
        };
    }
  }
}
