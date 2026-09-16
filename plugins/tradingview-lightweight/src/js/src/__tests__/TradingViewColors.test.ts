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
    const resolved = resolveColorsDeep(opts);
    expect(resolved.layout.textColor).not.toBe('seafoam-500');
    expect(resolved.lines[0].color).toBe('#fff');
    expect(resolved.lines[1].color).not.toBe('accent-300');
  });

  it('treats every entry in a string[] as a color (e.g. colorway)', () => {
    const palette: string[] = ['#1f77b4', 'seafoam-500', 'transparent'];
    const resolved = resolveColorsDeep(palette);
    expect(resolved[0]).toBe('#1f77b4');
    expect(resolved[1]).not.toBe('seafoam-500');
    expect(resolved[2]).toBe('transparent');
  });

  it('leaves the input untouched so tokens survive a theme change', () => {
    // The caller's object is the model's source of truth. Overwriting a token
    // with the color it resolved to leaves nothing to re-resolve when the
    // theme switches.
    const opts = {
      layout: { textColor: 'seafoam-500' },
      lines: [{ color: 'accent-300' }],
      colorway: ['seafoam-500'],
    };
    const resolved = resolveColorsDeep(opts);

    expect(opts.layout.textColor).toBe('seafoam-500');
    expect(opts.lines[0].color).toBe('accent-300');
    expect(opts.colorway[0]).toBe('seafoam-500');
    expect(resolved).not.toBe(opts);
  });

  it('leaves non-color keys alone', () => {
    const opts = { title: 'seafoam-500', count: 5 } as Record<string, unknown>;
    resolveColorsDeep(opts);
    expect(opts.title).toBe('seafoam-500');
    expect(opts.count).toBe(5);
  });
});

describe('theme change re-resolution', () => {
  it('still sees the token on a second pass', () => {
    // configureSeries() used to resolve in place, so a theme change re-read
    // the old theme's concrete color and had no token left to re-resolve.
    const cfgOptions = { color: 'seafoam-500' };

    const first = resolveColorsDeep(cfgOptions);
    const second = resolveColorsDeep(cfgOptions);

    expect(cfgOptions.color).toBe('seafoam-500');
    expect(second.color).toBe(first.color);
    expect(second).not.toBe(first);
  });
});
