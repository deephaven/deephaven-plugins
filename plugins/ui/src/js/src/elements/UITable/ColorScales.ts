export type NamedScale = {
  colors: string[];
};

function reversed(scale: NamedScale): NamedScale {
  return {
    colors: [...scale.colors].reverse(),
  };
}

const SEQUENTIAL: NamedScale = {
  colors: ['negative', 'positive'],
};

const DIVERGING: NamedScale = {
  colors: ['positive', 'gray-400', 'negative'],
};

const VIRIDIS: NamedScale = {
  colors: [
    '#440154',
    '#443983',
    '#31688e',
    '#21918c',
    '#35b779',
    '#90d743',
    '#fde725',
  ],
};

const PLASMA: NamedScale = {
  colors: [
    '#0d0887',
    '#5c01a6',
    '#9c179e',
    '#cc4778',
    '#ed7953',
    '#fdb42f',
    '#f0f921',
  ],
};

const INFERNO: NamedScale = {
  colors: [
    '#000004',
    '#320a5e',
    '#781c6d',
    '#bc3754',
    '#ed6925',
    '#fbb61a',
    '#fcffa4',
  ],
};

const MAGMA: NamedScale = {
  colors: [
    '#000004',
    '#2c115f',
    '#721f81',
    '#b73779',
    '#f1605d',
    '#feb078',
    '#fcfdbf',
  ],
};

const CIVIDIS: NamedScale = {
  colors: [
    '#00224e',
    '#2a3f6d',
    '#575d6d',
    '#7d7c78',
    '#a59c74',
    '#d2c060',
    '#fee838',
  ],
};

const NAMED_SCALES: Record<string, NamedScale> = {
  sequential: SEQUENTIAL,
  sequential_r: reversed(SEQUENTIAL),
  diverging: DIVERGING,
  diverging_r: reversed(DIVERGING),
  viridis: VIRIDIS,
  viridis_r: reversed(VIRIDIS),
  plasma: PLASMA,
  plasma_r: reversed(PLASMA),
  inferno: INFERNO,
  inferno_r: reversed(INFERNO),
  magma: MAGMA,
  magma_r: reversed(MAGMA),
  cividis: CIVIDIS,
  cividis_r: reversed(CIVIDIS),
};

/**
 * Resolve a named color scale string to its associated color array.
 *
 * @param name The scale name
 * @returns The NamedScale
 */
export function resolveNamedScale(name: string): NamedScale {
  const scale = NAMED_SCALES[name];
  if (scale == null) {
    throw new Error(`Unknown heatmap color scale "${name}"`);
  }
  return scale;
}

export default NAMED_SCALES;
