export class MixedPanelsError extends Error {
  name = 'MixedPanelsError';

  isMixedPanelsError = true;
}

export function isMixedPanelsError(error: unknown): error is MixedPanelsError {
  return error instanceof MixedPanelsError;
}

export default MixedPanelsError;
