import { resolveCssVariablesInRecord } from '@deephaven/components';

export type IrisGridPivotThemeType = {
  columnSourceHeaderBackground: string;
  totalsHeaderBackground: string;
  columnSourceFilterMinWidth: number;
};

export const IrisGridPivotThemeColors = Object.freeze({
  columnSourceHeaderBackground: 'var(--dh-color-grid-bg)',
  totalsHeaderBackground: 'var(--dh-color-grid-bg)',
});

export function getIrisGridPivotTheme(): IrisGridPivotThemeType {
  return Object.freeze({
    ...resolveCssVariablesInRecord(IrisGridPivotThemeColors),
    columnSourceFilterMinWidth: 120,
  });
}
