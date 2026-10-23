import { renderHook } from '@testing-library/react';
import { useDHChartTheme } from '../TradingViewTheme';

jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  useTheme: () => ({ activeThemes: [] }),
}));

describe('useDHChartTheme fontFamily', () => {
  const { style } = document.documentElement;

  afterEach(() => {
    style.removeProperty('--dh-font-family-sans');
    style.removeProperty('--font-family-sans-serif');
  });

  it('uses --dh-font-family-sans', () => {
    style.setProperty('--dh-font-family-sans', 'Fira Sans, sans-serif');
    style.setProperty('--font-family-sans-serif', 'serif');
    const { result } = renderHook(() => useDHChartTheme());
    expect(result.current.fontFamily).toBe('Fira Sans, sans-serif');
  });

  it("falls back to Bootstrap's variable on older hosts", () => {
    style.setProperty('--font-family-sans-serif', 'Fira Sans, sans-serif');
    const { result } = renderHook(() => useDHChartTheme());
    expect(result.current.fontFamily).toBe('Fira Sans, sans-serif');
  });
});
