export class MixedPanelsError extends Error {
  isMixedPanelsError = true;
}

export function isMixedPanelsError(error: unknown): error is MixedPanelsError {
  return (
    error != null &&
    typeof error === 'object' &&
    (error as MixedPanelsError).isMixedPanelsError === true
  );
}

export default MixedPanelsError;
