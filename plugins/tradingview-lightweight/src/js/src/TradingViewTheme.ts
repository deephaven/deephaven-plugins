import { useMemo } from 'react';
import { useTheme } from '@deephaven/components';
import { ColorType } from 'lightweight-charts';
import type { DeepPartial, ChartOptions } from 'lightweight-charts';

/**
 * Resolved chart theme values from DH CSS variables.
 */
export interface TvlChartTheme {
  paperBgColor: string;
  plotBgColor: string;
  textColor: string;
  gridColor: string;
  lineColor: string;
  zeroLineColor: string;
  crosshairLabelBgColor: string;
  fontFamily: string;
  ohlcIncreasing: string;
  ohlcDecreasing: string;
  colorway: string[];
}

/**
 * Map of DH chart CSS variable names to TvlChartTheme keys.
 * These are the --dh-color-chart-* variables defined by the DH theme system.
 */
const CSS_VAR_MAP: Record<
  keyof Omit<TvlChartTheme, 'colorway' | 'fontFamily'>,
  string
> = {
  paperBgColor: '--dh-color-chart-bg',
  plotBgColor: '--dh-color-chart-plot-bg',
  textColor: '--dh-color-chart-title',
  gridColor: '--dh-color-chart-grid',
  lineColor: '--dh-color-chart-axis-line',
  zeroLineColor: '--dh-color-chart-axis-line-zero',
  crosshairLabelBgColor: '--dh-color-gray-600',
  ohlcIncreasing: '--dh-color-chart-ohlc-increase',
  ohlcDecreasing: '--dh-color-chart-ohlc-decrease',
};

const COLORWAY_VAR = '--dh-color-chart-colorway';

/**
 * Resolve all chart CSS variables from the computed styles.
 */
function resolveChartTheme(): TvlChartTheme {
  const style = getComputedStyle(document.documentElement);

  const get = (varName: string): string =>
    style.getPropertyValue(varName).trim();

  const theme: Record<string, string> = {};
  Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
    theme[key] = get(cssVar);
  });

  const fontFamily = get('--font-family-sans-serif');

  const colorwayRaw = get(COLORWAY_VAR);
  const colorway = colorwayRaw
    ? colorwayRaw.split(/[\s,]+/).filter(Boolean)
    : [];

  return {
    ...(theme as Omit<TvlChartTheme, 'colorway' | 'fontFamily'>),
    fontFamily,
    colorway,
  };
}

/**
 * Hook that resolves DH chart CSS variables and re-resolves when the
 * theme changes. Uses the DH ThemeContext (via `useTheme`) to detect
 * theme switches reliably — the context updates whenever the active
 * theme changes, which triggers a re-resolve of CSS variables.
 */
export function useDHChartTheme(): TvlChartTheme {
  const { activeThemes } = useTheme();

  return useMemo(() => resolveChartTheme(), [activeThemes]);
}

/**
 * Convert a TvlChartTheme to lightweight-charts ChartOptions.
 */
export function chartThemeToOptions(
  theme: TvlChartTheme
): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: {
        type: ColorType.Solid,
        color: theme.paperBgColor || theme.plotBgColor,
      },
      textColor: theme.textColor,
      fontFamily: theme.fontFamily || undefined,
      panes: {
        separatorColor: theme.gridColor,
        separatorHoverColor: theme.lineColor,
      },
    },
    grid: {
      vertLines: { color: theme.gridColor },
      horzLines: { color: theme.gridColor },
    },
    rightPriceScale: {
      borderColor: theme.lineColor,
    },
    leftPriceScale: {
      borderColor: theme.lineColor,
    },
    timeScale: {
      borderColor: theme.lineColor,
    },
    crosshair: {
      vertLine: {
        color: theme.gridColor,
        labelBackgroundColor: theme.crosshairLabelBgColor,
      },
      horzLine: {
        color: theme.gridColor,
        labelBackgroundColor: theme.crosshairLabelBgColor,
      },
    },
  };
}

/**
 * Get the OHLC colors from the chart theme.
 */
export function getOhlcColors(theme: TvlChartTheme): {
  upColor: string;
  downColor: string;
} {
  return {
    upColor: theme.ohlcIncreasing,
    downColor: theme.ohlcDecreasing,
  };
}

/**
 * Get the colorway palette from the chart theme.
 */
export function getColorway(theme: TvlChartTheme): string[] {
  return theme.colorway;
}
