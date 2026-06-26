import {
  chartThemeToOptions,
  getOhlcColors,
  getColorway,
} from '../TradingViewTheme';
import type { TvlChartTheme } from '../TradingViewTheme';

const mockTheme: TvlChartTheme = {
  paperBgColor: '#1a171a',
  plotBgColor: '#2d2a2e',
  textColor: '#f0f0ee',
  gridColor: '#3d3a3e',
  lineColor: '#5b5a5c',
  zeroLineColor: '#7b797e',
  fontFamily: '"Fira Sans", sans-serif',
  ohlcIncreasing: '#26a69a',
  ohlcDecreasing: '#ef5350',
  colorway: ['#4878d0', '#6acc64', '#d5bb67'],
};

describe('chartThemeToOptions', () => {
  it('should map paperBgColor to layout background', () => {
    const options = chartThemeToOptions(mockTheme);
    expect(options.layout?.background).toEqual({
      type: expect.anything(),
      color: '#1a171a',
    });
  });

  it('should map textColor to layout textColor', () => {
    const options = chartThemeToOptions(mockTheme);
    expect((options.layout as Record<string, unknown>)?.textColor).toBe(
      '#f0f0ee'
    );
  });

  it('should map fontFamily to layout fontFamily', () => {
    const options = chartThemeToOptions(mockTheme);
    expect((options.layout as Record<string, unknown>)?.fontFamily).toBe(
      '"Fira Sans", sans-serif'
    );
  });

  it('should map gridColor to grid lines', () => {
    const options = chartThemeToOptions(mockTheme);
    expect(options.grid?.vertLines).toEqual({ color: '#3d3a3e' });
    expect(options.grid?.horzLines).toEqual({ color: '#3d3a3e' });
  });

  it('should map lineColor to scale borders', () => {
    const options = chartThemeToOptions(mockTheme);
    expect(options.rightPriceScale).toEqual({ borderColor: '#5b5a5c' });
    expect(options.timeScale).toEqual({ borderColor: '#5b5a5c' });
  });

  it('should map gridColor to crosshair', () => {
    const options = chartThemeToOptions(mockTheme);
    expect(options.crosshair?.vertLine).toEqual({ color: '#3d3a3e' });
    expect(options.crosshair?.horzLine).toEqual({ color: '#3d3a3e' });
  });
});

describe('getOhlcColors', () => {
  it('should return ohlc increasing and decreasing colors', () => {
    const colors = getOhlcColors(mockTheme);
    expect(colors.upColor).toBe('#26a69a');
    expect(colors.downColor).toBe('#ef5350');
  });
});

describe('getColorway', () => {
  it('should return the colorway array', () => {
    expect(getColorway(mockTheme)).toEqual(['#4878d0', '#6acc64', '#d5bb67']);
  });
});
