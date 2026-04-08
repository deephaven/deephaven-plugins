// TODO: GridColorUtils should be exported from @deephaven/grid (temporary workaround for now)
import GridColorUtils from '@deephaven/grid/dist/GridColorUtils';

/**
 * Interpolate a color from a gradient at a given normalized position.
 * Colors are interpolated in Oklab space.
 *
 * @param hexColors Array of hex color strings
 * @param t Normalized position [0, 1]
 * @param positions Optional explicit positions for each color stop
 * @returns Hex color string
 */
export function interpolateColor(
  hexColors: string[],
  t: number,
  positions?: number[]
): string {
  const n = hexColors.length;

  const stops = hexColors.map((hex, i) => ({
    position: positions != null ? positions[i] : i / (n - 1),
    oklab: GridColorUtils.linearSRGBToOklab(GridColorUtils.hexToRgb(hex)),
  }));

  const position = Math.max(
    stops[0].position,
    Math.min(t, stops[n - 1].position)
  );

  let i = 0;
  while (i < n - 2 && stops[i + 1].position < position) {
    i += 1;
  }

  const s0 = stops[i];
  const s1 = stops[i + 1];
  const range = s1.position - s0.position;
  const localT = range === 0 ? 0 : (position - s0.position) / range;
  return GridColorUtils.rgbToHex(
    GridColorUtils.OklabToLinearSRGB(
      GridColorUtils.lerpColor(s0.oklab, s1.oklab, localT)
    )
  );
}

/**
 * Normalize a data value to [0, 1] range.
 *
 * Without mid: sequential normalization.
 * With mid: diverging normalization (symmetric around mid).
 *
 * @param value The data value
 * @param min The minimum value
 * @param max The maximum value
 * @param mid Optional midpoint for diverging scales
 * @returns Normalized value clamped to [0, 1]
 */
export function normalizeValue(
  value: number,
  min: number,
  max: number,
  mid?: number | null
): number {
  let lo = min;
  let hi = max;
  if (mid != null) {
    const extent = Math.max(mid - min, max - mid);
    lo = mid - extent;
    hi = mid + extent;
  }
  if (hi === lo) return 0.5;
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}
