import { resolveColor, resolveColorsDeep } from '../TradingViewColors';

describe('resolveColor', () => {
  it('passes through hex colors unchanged', () => {
    expect(resolveColor('#1f8a70')).toBe('#1f8a70');
  });

  it('passes through rgb/rgba unchanged', () => {
    expect(resolveColor('rgba(255, 0, 0, 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('passes through "transparent" unchanged', () => {
    expect(resolveColor('transparent')).toBe('transparent');
  });

  it('passes through named CSS colors unchanged', () => {
    expect(resolveColor('crimson')).toBe('crimson');
  });

  it('transforms a DH theme color name out of its bare form', () => {
    // jsdom has no real theme stylesheet, so we only assert the bare name was
    // recognized as a DH token (the function tried to resolve it). Full
    // resolution to a hex/rgba value happens against the real DOM at runtime.
    expect(resolveColor('seafoam-500')).not.toBe('seafoam-500');
  });

  it('returns undefined / empty strings unchanged', () => {
    expect(resolveColor(undefined)).toBeUndefined();
    expect(resolveColor('')).toBe('');
  });
});

describe('resolveColorsDeep', () => {
  it('resolves a single nested color key', () => {
    const opts = { layout: { textColor: '#abc' } };
    resolveColorsDeep(opts);
    expect(opts.layout.textColor).toBe('#abc');
  });

  it('walks nested objects and arrays', () => {
    const opts = {
      layout: { textColor: 'seafoam-500' },
      lines: [{ color: '#fff' }, { color: 'accent-300' }],
    };
    resolveColorsDeep(opts);
    expect(opts.layout.textColor).not.toBe('seafoam-500');
    expect(opts.lines[0].color).toBe('#fff');
    expect(opts.lines[1].color).not.toBe('accent-300');
  });

  it('treats every entry in a string[] as a color (e.g. colorway)', () => {
    const palette: string[] = ['#1f77b4', 'seafoam-500', 'transparent'];
    resolveColorsDeep(palette);
    expect(palette[0]).toBe('#1f77b4');
    expect(palette[1]).not.toBe('seafoam-500');
    expect(palette[2]).toBe('transparent');
  });

  it('leaves non-color keys alone', () => {
    const opts = { title: 'seafoam-500', count: 5 } as Record<string, unknown>;
    resolveColorsDeep(opts);
    expect(opts.title).toBe('seafoam-500');
    expect(opts.count).toBe(5);
  });
});
